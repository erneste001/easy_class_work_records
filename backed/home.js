// home.js
// ------------------------------------------------------------------
// School-admin auth routes for the Home page.
//
// Home.jsx already calls these endpoints when a school admin signs in:
//   POST /api/auth/school-admin/request-code   (email + schoolCode -> emails a 6-digit code)
//   POST /api/auth/school-admin/verify-code    (email + code       -> confirms and signs in)
//
// This file was the missing piece — index.js had the school *registration*
// flow (request-verification / verify-email) but nothing for admins logging
// back in afterwards. This adds that, plus two small extras Admin.jsx needs:
//   GET  /api/auth/school-admin/me      (token -> who is this, which school)
//   POST /api/auth/school-admin/logout  (token -> invalidate it)
//
// Mount it from index.js:
//   const schoolAdminAuth = require("./home");
//   app.use("/api/auth/school-admin", schoolAdminAuth.router);
// ------------------------------------------------------------------

const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("./db");

const router = express.Router();

// ------------------------------------------------------------------
// EMAIL (same pattern as index.js — reuses the same Gmail app-password setup)
// ------------------------------------------------------------------
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
    },
});

async function sendAdminLoginCode(toEmail, otp, schoolName) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("Admin login code not sent — GMAIL_USER / GMAIL_APP_PASSWORD not set in .env");
        return;
    }
    await transporter.sendMail({
        from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: "Your sign-in code — Easy Class Records",
        html: `
            <p>Hello,</p>
            <p>Use the code below to sign in to the <strong>${schoolName}</strong> admin dashboard:</p>
            <h2 style="letter-spacing:6px;">${otp}</h2>
            <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        `,
    });
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// ------------------------------------------------------------------
// SESSIONS
// A super lightweight in-memory session store — no new dependency
// (like jsonwebtoken) required. Good enough for a single-instance
// deployment; swap for Redis / a `sessions` table if you scale to
// more than one server process.
// ------------------------------------------------------------------
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const sessions = new Map(); // token -> { schoolId, schoolName, schoolCode, email, expiresAt }

function createSession({ schoolId, schoolName, schoolCode, email }) {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
        schoolId,
        schoolName,
        schoolCode,
        email,
        expiresAt: Date.now() + SESSION_TTL_MS,
    });
    return token;
}

function getSession(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    return session;
}

// Periodically sweep expired sessions so the Map doesn't grow forever.
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (now > session.expiresAt) sessions.delete(token);
    }
}, 30 * 60 * 1000).unref();

function requireSession(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const session = token ? getSession(token) : null;
    if (!session) {
        return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
    }
    req.session = session;
    req.sessionToken = token;
    next();
}

// ------------------------------------------------------------------
// STEP 1 — POST /request-code
// Checks the school code is real, and that the email typed in matches
// the email the school registered with — otherwise anyone who knows a
// school's code could send themselves a code for someone else's inbox.
// ------------------------------------------------------------------
router.post("/request-code", async (req, res) => {
    const { email, schoolCode } = req.body;

    if (!email || !schoolCode) {
        return res.status(400).json({ success: false, message: "Email and school code are required." });
    }

    try {
        const schoolLookup = await pool.query(
            `SELECT s.school_id, s.school_name, s.school_code, d.email
             FROM schools s
             JOIN school_details d ON d.school_id = s.school_id
             WHERE UPPER(s.school_code) = UPPER($1)`,
            [schoolCode]
        );

        if (schoolLookup.rows.length === 0) {
            return res.status(400).json({ success: false, message: "We couldn't find a school with that code." });
        }

        const school = schoolLookup.rows[0];

        if (school.email.toLowerCase() !== String(email).toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: "That email doesn't match the address this school registered with.",
            });
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            "DELETE FROM school_admin_otp WHERE email = $1 AND verified = FALSE",
            [email]
        );
        await pool.query(
            `INSERT INTO school_admin_otp (email, school_id, otp_code, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [email, school.school_id, otp, expiresAt]
        );

        await sendAdminLoginCode(email, otp, school.school_name);

        res.json({ success: true, message: "Confirmation code sent to email." });
    } catch (error) {
        console.log("Error in /request-code:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ------------------------------------------------------------------
// STEP 2 — POST /verify-code
// Only a correct, unexpired code flips this into a real session. This
// is the single gate that actually signs an admin in.
// ------------------------------------------------------------------
router.post("/verify-code", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ success: false, message: "Email and code are required." });
    }

    try {
        const lookup = await pool.query(
            `SELECT * FROM school_admin_otp
             WHERE email = $1 AND otp_code = $2 AND verified = FALSE
             ORDER BY created_at DESC LIMIT 1`,
            [email, code]
        );

        if (lookup.rows.length === 0) {
            return res.status(400).json({ success: false, message: "That code is not correct." });
        }

        const record = lookup.rows[0];
        if (new Date() > new Date(record.expires_at)) {
            return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
        }

        const schoolResult = await pool.query(
            `SELECT school_id, school_name, school_code FROM schools WHERE school_id = $1`,
            [record.school_id]
        );
        if (schoolResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: "That school no longer exists." });
        }
        const school = schoolResult.rows[0];

        await pool.query("UPDATE school_admin_otp SET verified = TRUE WHERE id = $1", [record.id]);

        const token = createSession({
            schoolId: school.school_id,
            schoolName: school.school_name,
            schoolCode: school.school_code,
            email,
        });

        res.json({
            success: true,
            token,
            school: {
                schoolId: school.school_id,
                schoolName: school.school_name,
                schoolCode: school.school_code,
                email,
            },
        });
    } catch (error) {
        console.log("Error in /verify-code:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ------------------------------------------------------------------
// GET /me — Admin.jsx calls this on load to fetch who's signed in and
// which school they belong to, using the token from verify-code.
// ------------------------------------------------------------------
router.get("/me", requireSession, (req, res) => {
    const { schoolId, schoolName, schoolCode, email } = req.session;
    res.json({ success: true, school: { schoolId, schoolName, schoolCode, email } });
});

// ------------------------------------------------------------------
// POST /logout — drops the session so the token can't be reused.
// ------------------------------------------------------------------
router.post("/logout", requireSession, (req, res) => {
    sessions.delete(req.sessionToken);
    res.json({ success: true });
});

module.exports = { router, requireSession };