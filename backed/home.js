// home.js
// ------------------------------------------------------------------
// School-admin auth routes for the Home page.
// ------------------------------------------------------------------

const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const pool = require("./db");

const router = express.Router();

// ------------------------------------------------------------------
// EMAIL SETUP
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

/**
 * Sends a professionally styled login code email with the embedded logo.
 */
async function sendAdminLoginCode(toEmail, otp, schoolName) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.log("Admin login code not sent — GMAIL_USER / GMAIL_APP_PASSWORD not set in .env");
        return;
    }

    // Resolve path to local logo image relative to this file
    const logoPath = path.join(__dirname, "assets", "logo.jpg");

    await transporter.sendMail({
        from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: `${otp} is your sign-in code — Easy Class Records`,
        attachments: [
            {
                filename: "logo.jpg",
                path: logoPath,
                cid: "logo_cid", // Content-ID referenced in HTML src
            },
        ],
        html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 10px;">
                <tr>
                  <td align="center">
                    
                    <!-- Outer Card -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                      
                      <!-- Header Accent Line -->
                      <tr>
                        <td height="4" style="background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa);"></td>
                      </tr>

                      <!-- Brand Header -->
                      <tr>
                        <td align="center" style="background-color: #0f172a; padding: 32px 20px;">
                          <img src="cid:logo_cid" alt="Easy Class Records Logo" width="80" height="auto" style="display: block; max-width: 80px; height: auto; border: 0; margin-bottom: 12px; border-radius: 6px;" />
                          <h1 style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 600; letter-spacing: -0.3px;">Easy Class Records</h1>
                        </td>
                      </tr>

                      <!-- Body Content -->
                      <tr>
                        <td style="padding: 32px 28px; text-align: center;">
                          <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Admin Sign-In Request</h2>
                          <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                            Use the verification code below to sign in to the dashboard for<br>
                            <strong style="color: #0f172a;">${schoolName}</strong>.
                          </p>

                          <!-- Styled Code Display Box -->
                          <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px 15px; margin: 0 auto 24px auto; max-width: 320px;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #2563eb; display: block; margin-left: 10px;">
                              ${otp}
                            </span>
                          </div>

                          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                            This code is valid for <strong>10 minutes</strong>.
                          </p>
                          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                            If you did not request this sign-in attempt, please ignore this email.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 20px; text-align: center;">
                          <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                            &copy; Easy Class Records &bull; Automated System Security Notification
                          </p>
                        </td>
                      </tr>

                    </table>
                    
                  </td>
                </tr>
              </table>
            </body>
            </html>
        `,
    });
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// ------------------------------------------------------------------
// SESSIONS
// ------------------------------------------------------------------
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const sessions = new Map();

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
// ROUTES
// ------------------------------------------------------------------

// STEP 1 — POST /request-code
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

// STEP 2 — POST /verify-code
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

// GET /me
router.get("/me", requireSession, (req, res) => {
    const { schoolId, schoolName, schoolCode, email } = req.session;
    res.json({ success: true, school: { schoolId, schoolName, schoolCode, email } });
});

// POST /logout
router.post("/logout", requireSession, (req, res) => {
    sessions.delete(req.sessionToken);
    res.json({ success: true });
});

module.exports = { router, requireSession };