require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const pool = require("./db");

// Import school-admin auth routes
const schoolAdminAuth = require("./home");

const app = express();

app.use(cors());
app.use(express.json());

// Everything under /api/auth/school-admin/* is handled by home.js
app.use("/api/auth/school-admin", schoolAdminAuth.router);

// ------------------------------------------------------------------
// EMAIL SETUP (nodemailer + Gmail app password)
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
 * Sends OTP email with an inline embedded logo image.
 */
async function sendVerificationEmail(toEmail, otp) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("Verification email not sent — GMAIL_USER / GMAIL_APP_PASSWORD not set in .env");
    return;
  }

  // Resolve absolute path to your local image relative to this file
  const logoPath = path.join(__dirname, "assets", "logo.jpg");

  await transporter.sendMail({
    from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your email — Easy Class Records",
    attachments: [
      {
        filename: "logo.jpg",
        path: logoPath,
        cid: "logo_cid", // Content-ID referenced in HTML below
      },
    ],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 30px 20px; text-align: center;">
          <!-- Embedded CID image reference -->
          <img src="cid:logo_cid" alt="Easy Class Records Logo" style="max-width: 120px; height: auto; display: block; margin: 0 auto; border: 0;" />
          <h1 style="color: #ffffff; font-size: 20px; margin: 15px 0 0 0; font-weight: 600; letter-spacing: -0.5px;">Easy Class Records</h1>
        </div>
        <div style="padding: 30px 20px; text-align: center; color: #334155;">
          <h2 style="font-size: 18px; margin-bottom: 10px;">Verification Code</h2>
          <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">Use the code below to complete your registration:</p>
          <div style="background-color: #f1f5f9; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 15px; border-radius: 6px; display: inline-block; color: #0f172a;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">This code expires in 10 minutes.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Optional email sent upon successful registration.
 */
async function sendRegistrationEmail(toEmail, schoolName, schoolCode) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;

  const logoPath = path.join(__dirname, "assets", "logo.jpg");

  await transporter.sendMail({
    from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Registration Successful — Easy Class Records",
    attachments: [
      {
        filename: "logo.jpg",
        path: logoPath,
        cid: "logo_cid",
      },
    ],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center;">
          <img src="cid:logo_cid" alt="Logo" style="max-width: 100px; height: auto;" />
          <h2 style="color: #0f172a;">Welcome, ${schoolName}!</h2>
        </div>
        <p>Your registration is complete. Your official school code is:</p>
        <h3 style="background-color: #f1f5f9; padding: 10px; text-align: center; color: #2563eb;">${schoolCode}</h3>
      </div>
    `,
  });
}

// ------------------------------------------------------------------
// SMS SETUP (Africa's Talking)
// ------------------------------------------------------------------
let sms = null;
if (process.env.AT_USERNAME && process.env.AT_API_KEY) {
  const africastalking = require("africastalking")({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  sms = africastalking.SMS;
}

function toRwandaFormat(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return `+${digits}`;
  if (digits.startsWith("0")) return `+250${digits.slice(1)}`;
  return `+250${digits}`;
}

async function sendConfirmationSms(phoneNumber, schoolCode) {
  if (!sms) {
    console.log("SMS not sent — AT_USERNAME / AT_API_KEY not set in .env");
    return;
  }
  await sms.send({
    to: [toRwandaFormat(phoneNumber)],
    message: `Your school has been registered successfully. School code: ${schoolCode}`,
  });
}

// ------------------------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------------------------
function generateSchoolCode(district) {
  const prefix = district.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "SCH";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function validateRegistrationBody(body) {
  const {
    province, district, sector, cell, village,
    schoolName, schoolEmail, phone, levels, ownership, residence
  } = body;

  if (!schoolName || !schoolEmail || !phone || !province || !district || !sector || !cell || !village) {
    return "Missing required fields.";
  }
  if (!Array.isArray(levels) || levels.length === 0) {
    return "At least one level is required.";
  }
  if (!["public", "private"].includes(ownership)) {
    return "Invalid ownership type.";
  }
  if (!["day", "boarding", "both"].includes(residence)) {
    return "Invalid residence type.";
  }
  return null;
}

// ------------------------------------------------------------------
// ROUTES
// ------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("successfully connected to the backend");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// STEP 1 — Request Verification Code
app.post("/api/schools/request-verification", async (req, res) => {
  const validationError = validateRegistrationBody(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const { schoolEmail } = req.body;

  try {
    const existingEmail = await pool.query(
      "SELECT 1 FROM school_details WHERE LOWER(email) = LOWER($1)",
      [schoolEmail]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A school with this email address is already registered.",
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query("DELETE FROM email_verifications WHERE email = $1 AND verified = FALSE", [schoolEmail]);

    await pool.query(
      `INSERT INTO email_verifications (email, otp_code, registration_data, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [schoolEmail, otp, JSON.stringify(req.body), expiresAt]
    );

    await sendVerificationEmail(schoolEmail, otp);

    res.json({ success: true, message: "Verification code sent to email." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// STEP 2 — Verify Email and Complete Registration
app.post("/api/schools/verify-email", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and code are required." });
  }

  const client = await pool.connect();
  try {
    const lookup = await client.query(
      `SELECT * FROM email_verifications
       WHERE email = $1 AND otp_code = $2 AND verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (lookup.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid verification code." });
    }

    const record = lookup.rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ success: false, message: "Code expired. Please request a new one." });
    }

    const data = record.registration_data;
    const {
      registeringAs, province, district, sector, cell, village,
      schoolName, schoolEmail, phone, levels, ownership, residence
    } = data;

    await client.query("BEGIN");

    const checkEmail = await client.query(
      "SELECT 1 FROM school_details WHERE LOWER(email) = LOWER($1)",
      [schoolEmail]
    );

    if (checkEmail.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "A school with this email address is already registered.",
      });
    }

    let schoolId;
    let schoolCode;
    let inserted = false;

    while (!inserted) {
      schoolCode = generateSchoolCode(district);
      try {
        const schoolResult = await client.query(
          `INSERT INTO schools (school_name, school_code) VALUES ($1, $2) RETURNING school_id`,
          [schoolName, schoolCode]
        );
        schoolId = schoolResult.rows[0].school_id;
        inserted = true;
      } catch (err) {
        if (err.code === "23505" && err.constraint === "schools_school_code_key") {
          continue;
        }
        throw err;
      }
    }

    const registerAsValue = registeringAs === "other" ? "institution" : "school";

    await client.query(
      `INSERT INTO school_details (school_id, register_as, email, phone, ownership_type, residence_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [schoolId, registerAsValue, schoolEmail, phone, ownership, residence]
    );

    await client.query(
      `INSERT INTO school_locations (school_id, province, district, sector, cell, village)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [schoolId, province, district, sector, cell, village]
    );

    for (const levelKey of levels) {
      const levelResult = await client.query(
        `SELECT level_id FROM levels WHERE LOWER(level_name) = LOWER($1)`,
        [levelKey]
      );
      if (levelResult.rows.length === 0) continue;
      await client.query(
        `INSERT INTO school_levels_map (school_id, level_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [schoolId, levelResult.rows[0].level_id]
      );
    }

    await client.query(
      `UPDATE email_verifications SET verified = TRUE WHERE id = $1`,
      [record.id]
    );

    await client.query("COMMIT");

    sendRegistrationEmail(schoolEmail, schoolName, schoolCode).catch((err) =>
      console.log("Registration email failed:", err.message)
    );

    res.json({ success: true, schoolId, schoolCode });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Error in verify-email:", error);

    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Email or record already exists." });
    }

    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// STEP 3 — Initiate Payment
const DEFAULT_RECIPIENT_ACCOUNT = "0788000000";

app.post("/api/payments/initiate", async (req, res) => {
  const { schoolId, provider, payerPhone, amount } = req.body;

  if (!schoolId || !provider || !payerPhone || !amount) {
    return res.status(400).json({ success: false, message: "Missing payment fields." });
  }
  if (!["mtn", "airtel", "paypal"].includes(provider)) {
    return res.status(400).json({ success: false, message: "Invalid payment provider." });
  }

  const transactionRef = `PAY-REF-${Date.now()}`;

  try {
    await pool.query(
      `INSERT INTO payments (school_id, provider, payer_phone, recipient_account, amount, transaction_ref, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'processing')`,
      [schoolId, provider, payerPhone, DEFAULT_RECIPIENT_ACCOUNT, amount, transactionRef]
    );

    setTimeout(async () => {
      try {
        await pool.query(`UPDATE payments SET status = 'success' WHERE transaction_ref = $1`, [transactionRef]);

        const schoolRes = await pool.query(
          `SELECT school_code FROM schools WHERE school_id = $1`,
          [schoolId]
        );
        if (schoolRes.rows.length > 0) {
          const { school_code } = schoolRes.rows[0];
          sendConfirmationSms(payerPhone, school_code).catch((err) =>
            console.log("Confirmation SMS failed:", err.message)
          );
        }
      } catch (err) {
        console.log("Failed to auto-update payment status:", err.message);
      }
    }, 3000);

    res.json({ success: true, transactionId: transactionRef });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// STEP 4 — Check Payment Status
app.get("/api/payments/status/:transactionRef", async (req, res) => {
  const { transactionRef } = req.params;
  try {
    const result = await pool.query(`SELECT status FROM payments WHERE transaction_ref = $1`, [transactionRef]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: "not_found" });
    }
    res.json({ status: result.rows[0].status });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failed", reason: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});