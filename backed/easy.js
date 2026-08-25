require("dotenv").config();

// ------------------------------------------------------------
// GMAIL ENVIRONMENT CHECK
// ------------------------------------------------------------
console.log("========================================");
console.log("GMAIL CONFIGURATION CHECK");
console.log("========================================");
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log(
  "APP PASSWORD LENGTH:",
  process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.length
    : "NOT FOUND"
);
console.log("========================================");

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");
const pool = require("./db");

// Import school-admin AUTH routes (email/school-code confirmation, sign-in).
const schoolAdminAuth = require("./home");

// Import school-admin ACTION routes (classes, approvals, teachers, students,
// notifications, CSV export).
const schoolAdminRoutes = require("./schoolAdmin");

// Import teacher-facing routes (classes, assignments, students) AND the
// shared user-session store. See the big comment in teacher.js: this file
// used to keep its OWN separate `userSessions` Map for
// /api/users/login-google, which meant tokens issued there were invisible
// to every /api/teacher/* route (they live in two different Maps). That's
// fixed below by importing createUserSession from here instead of
// declaring a local one.
const teacherRoutes = require("./teacher");
const { createUserSession } = teacherRoutes;

// FIX (root cause of "No route for GET /api/student/me"): student.js
// defines a fully working router (GET /me, /notes, /quizzes, quiz
// start/answer/away/submit/result) but it was never require()'d or
// app.use()'d anywhere in this file, so every /api/student/* request
// fell straight through to the 404 JSON handler at the bottom of this
// file. student.js itself needed no changes — it already imports
// requireUserSession from teacher.js and reuses the same session store,
// so a token issued at POST /api/users/login-google works immediately
// once the router is actually mounted below.
const studentRoutes = require("./student");

const app = express();

// ------------------------------------------------------------------
// CORS
// ------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

if (allowedOrigins.length === 0) {
  console.log(
    "\n⚠️ ALLOWED_ORIGINS not set in .env — CORS is currently open.\n"
  );
}

app.use(cors(corsOptions));
app.use(express.json());

// Everything under /api/auth/school-admin/* is the sign-in flow (request
// code / verify code) — handled by home.js.
app.use("/api/auth/school-admin", schoolAdminAuth.router);

// Everything under /api/school-admin/* is what the signed-in dashboard
// (School_Admin.jsx) calls: classes, approvals, teachers, students,
// notifications, CSV export — handled by schoolAdmin.js.
app.use("/api/school-admin", schoolAdminRoutes.router);

// Everything under /api/teacher/* is what the signed-in teacher dashboard
// calls: their own classes, their own class+subject assignments (multiple
// classes, multiple subjects — no "period" concept anymore, see teacher.js),
// and the approved students inside whichever class they've selected —
// handled by teacher.js.
app.use("/api/teacher", teacherRoutes.router);

// Everything under /api/student/* is what the signed-in student dashboard
// (Students.jsx) calls: their profile, their class's published notes,
// their quizzes (list, start, autosave answers, tab-away penalty,
// submit, review) — handled by student.js. THIS LINE WAS MISSING, which
// is why every /api/student/* call (starting with GET /api/student/me on
// page load) 404'd with "No route for GET /api/student/me".
app.use("/api/student", studentRoutes.router);

// ------------------------------------------------------------------
// EMAIL SETUP — NODEMAILER + GMAIL APP PASSWORD
// ------------------------------------------------------------------

if (!process.env.GMAIL_USER) {
  console.log("⚠️ GMAIL_USER is missing from .env");
}

if (!process.env.GMAIL_APP_PASSWORD) {
  console.log("⚠️ GMAIL_APP_PASSWORD is missing from .env");
}

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

// Test Gmail connection when the server starts
transporter.verify((error, success) => {
  if (error) {
    console.log("\n❌ GMAIL CONNECTION FAILED");
    console.log("Error:", error.message);
    console.log("\nCheck these:");
    console.log("1. GMAIL_USER is correct");
    console.log("2. GMAIL_APP_PASSWORD is the new 16-character App Password");
    console.log("3. The App Password belongs to the same Gmail account");
    console.log("4. 2-Step Verification is enabled");
  } else {
    console.log("\n✅ GMAIL SMTP CONNECTION SUCCESSFUL");
    console.log("Email account:", process.env.GMAIL_USER);
  }
});

// ------------------------------------------------------------------
// SCHOOL REGISTRATION EMAIL
// ------------------------------------------------------------------

async function sendRegistrationEmail(toEmail, schoolName, schoolCode) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("❌ Email not sent: Gmail credentials are missing.");
    return;
  }

  const logoPath = path.join(__dirname, "assets", "logo.jpg");

  await transporter.sendMail({
    from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Registration received — Easy Class Records",

    attachments: [
      {
        filename: "logo.jpg",
        path: logoPath,
        cid: "logo_cid",
      },
    ],

    html: `
      <div style="
        font-family: Arial;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      ">

        <div style="text-align: center;">

          <img
            src="cid:logo_cid"
            alt="Logo"
            style="max-width: 100px; height: auto;"
          />

          <h2 style="color: #0f172a;">
            Welcome, ${schoolName}!
          </h2>

        </div>

        <p>
          We've confirmed your email through Google.
          Your school code is:
        </p>

        <h3 style="
          background-color: #f1f5f9;
          padding: 10px;
          text-align: center;
          color: #1E9E5A;
        ">
          ${schoolCode}
        </h3>

        <p>
          Next: pay the registration fee, then our team reviews
          and approves your school before your admin account can sign in.
        </p>

      </div>
    `,
  });
}

// ------------------------------------------------------------------
// TEACHER / STUDENT REGISTRATION EMAIL
// ------------------------------------------------------------------

async function sendUserRegistrationEmail(
  toEmail,
  fullName,
  schoolName,
  role
) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("❌ Email not sent: Gmail credentials are missing.");
    return;
  }

  const logoPath = path.join(__dirname, "assets", "logo.jpg");

  await transporter.sendMail({
    from: `"Easy Class Records" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Registration received — Easy Class Records",

    attachments: [
      {
        filename: "logo.jpg",
        path: logoPath,
        cid: "logo_cid",
      },
    ],

    html: `
      <div style="
        font-family: Arial;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      ">

        <div style="text-align: center;">

          <img
            src="cid:logo_cid"
            alt="Logo"
            style="max-width: 100px; height: auto;"
          />

          <h2 style="color: #0f172a;">
            Hi ${fullName},
          </h2>

        </div>

        <p>
          We've confirmed your email through Google and submitted
          your ${role} request to <strong>${schoolName}</strong>.
        </p>

        <p>
          Their admin will review it — you'll be able to sign in
          with the same Google account as soon as it's approved.
        </p>

      </div>
    `,
  });
}

// ------------------------------------------------------------------
// SMS SETUP — AFRICA'S TALKING
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

  if (digits.startsWith("250")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+250${digits.slice(1)}`;
  }

  return `+250${digits}`;
}

async function sendConfirmationSms(phoneNumber, schoolCode) {
  if (!sms) {
    console.log(
      "SMS not sent — AT_USERNAME / AT_API_KEY not set in .env"
    );
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
  const prefix =
    district
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3) || "SCH";

  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${suffix}`;
}

function validateRegistrationBody(body) {
  const {
    province,
    district,
    sector,
    cell,
    village,
    schoolName,
    schoolEmail,
    phone,
    levels,
    ownership,
    residence,
  } = body;

  if (
    !schoolName ||
    !schoolEmail ||
    !phone ||
    !province ||
    !district ||
    !sector ||
    !cell ||
    !village
  ) {
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
// BASIC ROUTE
// ------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("successfully connected to the backend");
});

// ------------------------------------------------------------------
// TEST DATABASE
// ------------------------------------------------------------------

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// ------------------------------------------------------------------
// PUBLIC SCHOOLS
// ------------------------------------------------------------------

app.get("/api/schools/public", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, school_code
       FROM schools
       WHERE status = 'active'
       ORDER BY name ASC`
    );

    res.json({
      success: true,
      schools: result.rows,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ------------------------------------------------------------------
// SCHOOL REGISTRATION
// ------------------------------------------------------------------

app.post("/api/schools/register-with-google", async (req, res) => {
  const validationError = validateRegistrationBody(req.body);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
    });
  }

  const {
    registeringAs,
    province,
    district,
    sector,
    cell,
    village,
    schoolName,
    schoolEmail,
    phone,
    levels,
    ownership,
    residence,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingEmail = await client.query(
      "SELECT 1 FROM schools WHERE LOWER(email) = LOWER($1)",
      [schoolEmail]
    );

    if (existingEmail.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "A school with this Google account's email is already registered.",
      });
    }

    const registerAsValue =
      registeringAs === "other" ? "other" : "school";

    let schoolId;
    let schoolCode;
    let inserted = false;

    while (!inserted) {
      schoolCode = generateSchoolCode(district);

      try {
        const schoolResult = await client.query(
          `INSERT INTO schools
            (
              registering_as,
              name,
              email,
              phone,
              province,
              district,
              sector,
              cell,
              village,
              ownership,
              residence_type,
              email_verified_at,
              school_code,
              status
            )
           VALUES
            (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
              now(),$12,'pending_payment'
            )
           RETURNING id`,
          [
            registerAsValue,
            schoolName,
            schoolEmail,
            phone,
            province,
            district,
            sector,
            cell,
            village,
            ownership,
            residence,
            schoolCode,
          ]
        );

        schoolId = schoolResult.rows[0].id;
        inserted = true;
      } catch (err) {
        if (
          err.code === "23505" &&
          err.constraint === "schools_school_code_key"
        ) {
          continue;
        }

        throw err;
      }
    }

    for (const levelKey of levels) {
      await client.query(
        `INSERT INTO school_levels (school_id, level)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [schoolId, String(levelKey).toLowerCase()]
      );
    }

    await client.query("COMMIT");

    sendRegistrationEmail(
      schoolEmail,
      schoolName,
      schoolCode
    ).catch((err) =>
      console.log(
        "Registration email failed:",
        err.message
      )
    );

    res.json({
      success: true,
      schoolId,
      schoolCode,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.log(
      "Error in register-with-google:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message: "That email is already registered.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    client.release();
  }
});

// ------------------------------------------------------------------
// PAYMENT
// ------------------------------------------------------------------

app.post("/api/payments/initiate", async (req, res) => {
  const {
    schoolId,
    provider,
    payerPhone,
    amount,
  } = req.body;

  if (!schoolId || !provider || !payerPhone || !amount) {
    return res.status(400).json({
      success: false,
      message: "Missing payment fields.",
    });
  }

  if (!["mtn", "airtel", "paypal"].includes(provider)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment provider.",
    });
  }

  const transactionRef = `PAY-REF-${Date.now()}`;

  try {
    await pool.query(
      `INSERT INTO payments
       (
         school_id,
         provider,
         payer_phone,
         amount,
         transaction_ref,
         status
       )
       VALUES
       ($1, $2, $3, $4, $5, 'processing')`,
      [
        schoolId,
        provider,
        payerPhone,
        amount,
        transactionRef,
      ]
    );

    // Simulated provider callback
    setTimeout(async () => {
      try {
        await pool.query(
          `UPDATE payments
           SET status = 'success'
           WHERE transaction_ref = $1`,
          [transactionRef]
        );

        const schoolRes = await pool.query(
          `UPDATE schools
           SET status = 'pending_review'
           WHERE id = $1
           AND status = 'pending_payment'
           RETURNING school_code`,
          [schoolId]
        );

        if (schoolRes.rows.length > 0) {
          const { school_code } = schoolRes.rows[0];

          sendConfirmationSms(
            payerPhone,
            school_code
          ).catch((err) =>
            console.log(
              "Confirmation SMS failed:",
              err.message
            )
          );
        }
      } catch (err) {
        console.log(
          "Failed to auto-update payment status:",
          err.message
        );
      }
    }, 3000);

    res.json({
      success: true,
      transactionId: transactionRef,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ------------------------------------------------------------------
// PAYMENT STATUS
// ------------------------------------------------------------------

app.get(
  "/api/payments/status/:transactionRef",
  async (req, res) => {
    const { transactionRef } = req.params;

    try {
      const result = await pool.query(
        `SELECT status
         FROM payments
         WHERE transaction_ref = $1`,
        [transactionRef]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "not_found",
        });
      }

      res.json({
        status: result.rows[0].status,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        status: "failed",
        reason: error.message,
      });
    }
  }
);

// ------------------------------------------------------------------
// TEACHER / STUDENT REGISTRATION
// ------------------------------------------------------------------

app.post("/api/users/register-google", async (req, res) => {
  const {
    role,
    fullName,
    email,
    googleSub,
    schoolId,
    schoolCode,
  } = req.body;

  if (!["student", "teacher"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role.",
    });
  }

  if (
    !fullName ||
    !email ||
    !googleSub ||
    !schoolId ||
    !schoolCode
  ) {
    return res.status(400).json({
      success: false,
      message: "Please fill in every field.",
    });
  }

  try {
    const schoolResult = await pool.query(
      `SELECT id, name, school_code, status
       FROM schools
       WHERE id = $1`,
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "That school could not be found.",
      });
    }

    const school = schoolResult.rows[0];

    if (
      school.school_code.toUpperCase() !==
      String(schoolCode).toUpperCase()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "That school code doesn't match the school you selected.",
      });
    }

    if (school.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "This school hasn't been verified by our team yet.",
      });
    }

    const existing = await pool.query(
      `SELECT 1
       FROM users
       WHERE LOWER(email) = LOWER($1)
       OR google_sub = $2`,
      [email, googleSub]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "An account with this Google email already exists.",
      });
    }

    // NOTE: teachers are inserted exactly like students — 'pending_approval'
    // status, no class/subject attached yet. Approving a teacher
    // (schoolAdmin.js) MAY attach one or more classes/subjects right there
    // if the admin picked any, or it may attach none — either way, the
    // teacher can always pick more themself at sign-in time (see teacher.js
    // and Home.jsx's TeacherClassStepModal).
    await pool.query(
      `INSERT INTO users
       (
         role,
         full_name,
         email,
         google_sub,
         school_id,
         status
       )
       VALUES
       ($1, $2, $3, $4, $5, 'pending_approval')`,
      [
        role,
        fullName,
        email,
        googleSub,
        schoolId,
      ]
    );

    sendUserRegistrationEmail(
      email,
      fullName,
      school.name,
      role
    ).catch((err) =>
      console.log(
        "User registration email failed:",
        err.message
      )
    );

    res.json({
      success: true,
      message:
        "Registration submitted for school approval.",
    });
  } catch (error) {
    console.log(
      "Error in register-google:",
      error
    );

    if (error.code === "23505") {
      return res.status(400).json({
        success: false,
        message:
          "An account with this Google email already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ------------------------------------------------------------------
// TEACHER / STUDENT LOGIN
// ------------------------------------------------------------------
// Session creation now comes from teacher.js's shared createUserSession
// (imported at the top of this file) so a token minted here is valid on
// every /api/teacher/* route AND every /api/student/* route — see the
// big comment at the top of teacher.js for why that matters.

app.post("/api/users/login-google", async (req, res) => {
  const {
    role,
    email,
    googleSub,
  } = req.body;

  if (
    !["student", "teacher"].includes(role) ||
    !email ||
    !googleSub
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing sign-in details.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
        id,
        role,
        full_name,
        email,
        school_id,
        status
       FROM users
       WHERE google_sub = $1
       AND role = $2`,
      [googleSub, role]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No account found for this Google sign-in. Please register first.",
      });
    }

    const user = result.rows[0];

    // users are inserted with status = 'pending_approval', approved into
    // 'approved', rejected into 'rejected', and toggled 'approved' <->
    // 'suspended' by the school-admin routes — compare against 'approved'.
    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          user.status === "rejected"
            ? "Your account was not approved by your school admin."
            : user.status === "suspended"
            ? "Your account has been suspended by your school admin."
            : "Your account is still waiting for approval from your school admin.",
      });
    }

    const token = createUserSession({
      userId: user.id,
      role: user.role,
      fullName: user.full_name,
      email: user.email,
      schoolId: user.school_id,
    });

    // Teachers can end up with ZERO, ONE, or MANY class+subject pairs —
    // whatever the school admin attached at approval time, plus whatever
    // the teacher has picked themself on previous sign-ins (see
    // teacher.js's POST /api/teacher/assignments). NOTE: there is no
    // "period" column on teacher_assignments — selecting ta.period here
    // was the exact bug that crashed every teacher login with a Postgres
    // "column ta.period does not exist" error. Hand back every
    // classCombinationId/subject pair so Home.jsx's TeacherClassStepModal
    // knows whether to ask for more, or let the teacher straight in.
    let assignments;

    if (role === "teacher") {
      const assignmentsResult = await pool.query(
        `SELECT ta.id, ta.subject, ta.class_combination_id AS "classCombinationId",
                cc.display_name AS "className"
         FROM teacher_assignments ta
         JOIN class_combinations cc ON cc.id = ta.class_combination_id
         WHERE ta.teacher_id = $1
         ORDER BY cc.display_name ASC, ta.subject ASC`,
        [user.id]
      );

      assignments = assignmentsResult.rows;
    }

    res.json({
      success: true,
      token,
      user: {
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
      ...(assignments ? { assignments } : {}),
    });
  } catch (error) {
    console.log(
      "Error in login-google:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ------------------------------------------------------------------
// SUPER ADMIN
// ------------------------------------------------------------------

const DEFAULT_SUPERADMIN_EMAIL =
  "admin@easyclass.rw";

const DEFAULT_SUPERADMIN_PASSWORD =
  "EasyClass@2026";

const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL ||
  DEFAULT_SUPERADMIN_EMAIL;

const SUPERADMIN_PASSWORD =
  process.env.SUPERADMIN_PASSWORD ||
  DEFAULT_SUPERADMIN_PASSWORD;

if (
  !process.env.SUPERADMIN_EMAIL ||
  !process.env.SUPERADMIN_PASSWORD
) {
  console.log(
    "\n⚠️ SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set in .env."
  );
}

const SUPERADMIN_SESSION_TTL_MS =
  12 * 60 * 60 * 1000;

const superAdminSessions = new Map();

function requireSuperAdminSession(
  req,
  res,
  next
) {
  const header =
    req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  const session = token
    ? superAdminSessions.get(token)
    : null;

  if (
    !session ||
    Date.now() > session.expiresAt
  ) {
    if (token) {
      superAdminSessions.delete(token);
    }

    return res.status(401).json({
      success: false,
      message:
        "Session expired. Please sign in again.",
    });
  }

  next();
}

// ------------------------------------------------------------------
// SUPER ADMIN LOGIN
// ------------------------------------------------------------------

app.post(
  "/api/auth/super-admin/login",
  (req, res) => {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    if (
      email.toLowerCase() !==
        SUPERADMIN_EMAIL.toLowerCase() ||
      password !== SUPERADMIN_PASSWORD
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Incorrect email or password.",
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    superAdminSessions.set(token, {
      email: SUPERADMIN_EMAIL,
      expiresAt:
        Date.now() +
        SUPERADMIN_SESSION_TTL_MS,
    });

    res.json({
      success: true,
      token,
      email: SUPERADMIN_EMAIL,
    });
  }
);

// ------------------------------------------------------------------
// SUPER ADMIN — GET SCHOOLS
// ------------------------------------------------------------------

app.get(
  "/api/superadmin/schools",
  requireSuperAdminSession,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
          id,
          name,
          email,
          phone,
          school_code,
          status,
          created_at
         FROM schools
         ORDER BY created_at DESC`
      );

      res.json({
        success: true,
        schools: result.rows,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ------------------------------------------------------------------
// SUPER ADMIN — APPROVE SCHOOL
// ------------------------------------------------------------------

app.post(
  "/api/superadmin/schools/:id/approve",
  requireSuperAdminSession,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE schools
         SET status = 'active'
         WHERE id = $1
         AND status != 'active'
         RETURNING id, name, status`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "School not found or already active.",
        });
      }

      res.json({
        success: true,
        school: result.rows[0],
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ------------------------------------------------------------------
// SUPER ADMIN — REJECT SCHOOL
// ------------------------------------------------------------------

app.post(
  "/api/superadmin/schools/:id/reject",
  requireSuperAdminSession,
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE schools
         SET status = 'suspended'
         WHERE id = $1
         RETURNING id, name, status`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "School not found.",
        });
      }

      res.json({
        success: true,
        school: result.rows[0],
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ------------------------------------------------------------------
// 404 FALLBACK — always JSON
// ------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `No route for ${req.method} ${req.originalUrl}`,
  });
});

// ------------------------------------------------------------------
// START SERVER
// ------------------------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});