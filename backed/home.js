// home.js — school admin authentication.
// index.js already mounts this at /api/auth/school-admin.
//
// There's no separate "admins" table in the schema you shared — the school
// admin IS whoever verified with Google during registration (schools.email).
//
// FIX: Home.jsx's school-admin login screen (AuthModal + AdminOtpModal)
// asks for email + school code, then calls:
//   POST /api/auth/school-admin/request-code
//   POST /api/auth/school-admin/verify-code
// Neither of those existed here before — only /login-google did, which the
// frontend never calls for this role. That meant school-admin sign-in
// always failed with a fetch/404 error. This file now implements the
// email + school-code + emailed-OTP flow the UI is actually built for,
// and keeps /login-google around as an alternative (unused by the current
// frontend, harmless to leave in).

const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("./db");

const router = express.Router();

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const sessions = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends
// email (lowercased) -> { code, schoolId, expiresAt, lastSentAt, attempts }
const pendingOtps = new Map();

function createSession(school) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    schoolId: school.id,
    schoolCode: school.school_code,
    email: school.email,
    name: school.name,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function requireSchoolAdminSession(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token ? sessions.get(token) : null;
  if (!session || Date.now() > session.expiresAt) {
    if (token) sessions.delete(token);
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
  }
  req.schoolAdmin = session;
  next();
}

// ------------------------------------------------------------------
// EMAIL SETUP — same Gmail app-password pattern as index.js. This module
// is required standalone (before index.js's transporter exists), so it
// needs its own small transporter rather than importing index.js's.
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

async function sendAdminOtpEmail(toEmail, schoolName, code) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[dev] School admin OTP for ${toEmail}: ${code}`);
    return;
  }
  await transporter.sendMail({
    from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your sign-in code — Easy Class Records",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Sign in to ${schoolName}</h2>
        <p>Use this code to finish signing in as school admin. It expires in 10 minutes.</p>
        <h3 style="background-color: #f1f5f9; padding: 10px; text-align: center; letter-spacing: 6px; color: #1E9E5A;">${code}</h3>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// ------------------------------------------------------------------
// STEP 1 — email + school code -> emailed one-time code.
// Only ever issues a code for a school that is 'active' (i.e. already
// approved by a super admin and past payment), so an unapproved or
// made-up school can never reach this far.
// ------------------------------------------------------------------
router.post("/request-code", async (req, res) => {
  const { email, schoolCode } = req.body;
  if (!email || !schoolCode) {
    return res.status(400).json({ success: false, message: "Please enter your email and school code." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT id, name, email, school_code, status FROM schools WHERE LOWER(email) = LOWER($1)`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "We couldn't find a school registered with that email." });
    }

    const school = result.rows[0];

    if (school.school_code.toUpperCase() !== String(schoolCode).trim().toUpperCase()) {
      return res.status(400).json({ success: false, message: "That school code doesn't match this email address." });
    }
    if (school.status === "pending_payment") {
      return res.status(403).json({ success: false, message: "Please complete the registration fee payment first." });
    }
    if (school.status === "pending_review") {
      return res.status(403).json({ success: false, message: "Your school is still awaiting approval from our team." });
    }
    if (school.status === "suspended") {
      return res.status(403).json({ success: false, message: "This school's account has been suspended." });
    }
    if (school.status !== "active") {
      return res.status(403).json({ success: false, message: "This school is not active yet." });
    }

    const existing = pendingOtps.get(normalizedEmail);
    if (existing && Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: "Please wait a moment before requesting another code." });
    }

    const code = generateOtp();
    pendingOtps.set(normalizedEmail, {
      code,
      schoolId: school.id,
      expiresAt: Date.now() + OTP_TTL_MS,
      lastSentAt: Date.now(),
      attempts: 0,
    });

    await sendAdminOtpEmail(school.email, school.name, code);

    res.json({ success: true, message: "Confirmation code sent." });
  } catch (error) {
    console.log("Error in request-code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// STEP 2 — the code entered back in AdminOtpModal. Only a correct,
// unexpired code creates a session; everything else (including the
// dashboard navigation) waits on this succeeding.
// ------------------------------------------------------------------
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: "Missing confirmation code." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const pending = pendingOtps.get(normalizedEmail);

  if (!pending) {
    return res.status(400).json({ success: false, message: "Please request a new code first." });
  }
  if (Date.now() > pending.expiresAt) {
    pendingOtps.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: "That code has expired. Please request a new one." });
  }
  if (pending.attempts >= 5) {
    pendingOtps.delete(normalizedEmail);
    return res.status(429).json({ success: false, message: "Too many attempts. Please request a new code." });
  }
  if (String(code).trim() !== pending.code) {
    pending.attempts += 1;
    return res.status(400).json({ success: false, message: "That code is not correct. Please try again." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, school_code, status FROM schools WHERE id = $1`,
      [pending.schoolId]
    );
    if (result.rows.length === 0 || result.rows[0].status !== "active") {
      pendingOtps.delete(normalizedEmail);
      return res.status(403).json({ success: false, message: "This school is no longer active." });
    }

    const school = result.rows[0];
    pendingOtps.delete(normalizedEmail);

    const token = createSession(school);
    res.json({
      success: true,
      token,
      school: { id: school.id, name: school.name, email: school.email, schoolCode: school.school_code },
    });
  } catch (error) {
    console.log("Error in verify-code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// Alternative Google-based login. Not currently called by the frontend
// (Home.jsx uses the email + school-code + OTP flow above instead), kept
// here in case you want to switch school-admin sign-in to Google later —
// the school admin IS whoever verified the school's email with Google at
// registration, so this would Just Work if wired up.
//
// SECURITY NOTE: this trusts req.body.email as-is. Before production,
// verify the Google idToken server-side with firebase-admin instead:
//   const decoded = await admin.auth().verifyIdToken(idToken);
//   // decoded.email is now guaranteed real — use that, not req.body.email
// ------------------------------------------------------------------
router.post("/login-google", async (req, res) => {
  const { email, googleSub } = req.body;
  if (!email || !googleSub) {
    return res.status(400).json({ success: false, message: "Missing sign-in details." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, school_code, status FROM schools WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No school is registered with this Google account. Please register first.",
      });
    }

    const school = result.rows[0];

    if (school.status === "pending_payment") {
      return res.status(403).json({ success: false, message: "Please complete the registration fee payment first." });
    }
    if (school.status === "pending_review") {
      return res.status(403).json({ success: false, message: "Your school is still awaiting approval from our team." });
    }
    if (school.status === "suspended") {
      return res.status(403).json({ success: false, message: "This school's account has been suspended." });
    }
    if (school.status !== "active") {
      return res.status(403).json({ success: false, message: "This school is not active yet." });
    }

    const token = createSession(school);
    res.json({
      success: true,
      token,
      school: { id: school.id, name: school.name, email: school.email, schoolCode: school.school_code },
    });
  } catch (error) {
    console.log("Error in school admin login-google:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/me", requireSchoolAdminSession, (req, res) => {
  res.json({ success: true, school: req.schoolAdmin });
});

router.post("/logout", requireSchoolAdminSession, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.slice(7);
  sessions.delete(token);
  res.json({ success: true });
});

module.exports = { router, requireSchoolAdminSession };