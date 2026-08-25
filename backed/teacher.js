// teacher.js — teacher-facing dashboard API.
// Mount in easy.js at: app.use("/api/teacher", teacherRoutes.router);
//
// FLOW THIS FILE SUPPORTS (class + period are chosen by the teacher, never
// by the school admin):
//   1. Teacher signs up with Google -> POST /api/users/register-google
//      (in easy.js) creates a users row with status='pending_approval'.
//      No class is attached at this point.
//   2. School admin approves from School_Admin.jsx -> schoolAdmin.js's
//      POST /approvals/:id/approve ONLY flips status to 'approved'. It
//      never asks for or writes a class/subject/period for a teacher —
//      that stays entirely the teacher's own choice. Nothing to fix there.
//   3. Teacher signs in with Google -> POST /api/users/login-google (in
//      easy.js) issues a bearer session token AND now also returns
//      `assignments`: every class + subject + period this teacher has
//      already picked (an empty array for a brand-new approved teacher).
//        - 0 assignments  -> Home.jsx makes the teacher choose a class,
//          subject and period right there in the login flow (GET
//          /api/teacher/classes below, then POST /api/teacher/assignments
//          below) before it will navigate to the dashboard.
//        - 1 assignment   -> Home.jsx signs them straight into it.
//        - 2+ assignments -> Home.jsx lets them pick which one they're
//          signing in for right now (or add a new one), then navigates
//          with that specific assignment attached to router state.
//   4. Teacher dashboard calls:
//        GET  /api/teacher/me          -> their own name/email/school
//        GET  /api/teacher/classes     -> every class their school's
//                                          admin has created, to choose from
//        GET  /api/teacher/assignments -> classes+subjects+periods they've
//                                          already picked
//        POST /api/teacher/assignments -> pick a new class + subject + period
//        DELETE /api/teacher/assignments/:id -> drop one they no longer teach
//        GET  /api/teacher/students?assignmentId= -> ONLY the approved
//          students sitting in the exact class tied to that assignment.
//          The assignment must belong to the signed-in teacher — a
//          class/assignment id can never be borrowed from someone else.
//
// REQUIRED MIGRATION — teacher_assignments needs a `period` column (a
// lesson slot, e.g. "Period 3" or "Mon 08:00–08:40"). Run before deploying
// this file:
//
//   ALTER TABLE teacher_assignments ADD COLUMN period TEXT;
//   -- Drop whatever your existing teacher_id+class_combination_id+subject
//   -- unique constraint is actually called, then recreate it including
//   -- period so the same class+subject can be taught in different periods:
//   ALTER TABLE teacher_assignments
//     DROP CONSTRAINT IF EXISTS teacher_assignments_teacher_id_class_combination_id_subject_key;
//   ALTER TABLE teacher_assignments
//     ADD CONSTRAINT teacher_assignments_unique_slot
//     UNIQUE (teacher_id, class_combination_id, subject, period);
//
// SESSIONS — this file OWNS the shared user-session store (userSessions /
// createUserSession / requireUserSession, all exported below). easy.js's
// POST /api/users/login-google calls THIS file's createUserSession() —
// it must never keep its own separate Map, or tokens minted there won't
// be recognized by any route below. That fix is applied in easy.js.

const express = require("express");
const crypto = require("crypto");
const pool = require("./db");

const router = express.Router();

const USER_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// token -> { userId, role, fullName, email, schoolId, expiresAt }
// Shared by easy.js's /api/users/login-google (writes) and every route
// below (reads via requireUserSession).
const userSessions = new Map();

function createUserSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  userSessions.set(token, { ...user, expiresAt: Date.now() + USER_SESSION_TTL_MS });
  return token;
}

function requireUserSession(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const session = token ? userSessions.get(token) : null;
  if (!session || Date.now() > session.expiresAt) {
    if (token) userSessions.delete(token);
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again." });
  }
  req.user = session;
  next();
}

function requireTeacher(req, res, next) {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ success: false, message: "Teacher account required." });
  }
  next();
}

router.use(requireUserSession, requireTeacher);

// ------------------------------------------------------------------
// GET /api/teacher/me — name, email, status, school name for the
// dashboard header. Pulled fresh from the DB (not just the session) so a
// suspension by the admin shows up immediately.
// ------------------------------------------------------------------
router.get("/me", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.status, s.id AS school_id, s.name AS school_name
       FROM users u
       JOIN schools s ON s.id = u.school_id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }
    if (result.rows[0].status === "suspended") {
      return res.status(403).json({ success: false, message: "Your account has been suspended by your school admin." });
    }
    res.json({ success: true, teacher: result.rows[0] });
  } catch (error) {
    console.log("Error in GET /api/teacher/me:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// GET /api/teacher/classes — every class the teacher's OWN school admin
// has created (school scoped from the session, never from the client),
// so the teacher can choose which one(s) to teach.
// ------------------------------------------------------------------
router.get("/classes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, display_name, education_level, academic_year, capacity
       FROM class_combinations
       WHERE school_id = $1
       ORDER BY academic_year DESC, display_name ASC`,
      [req.user.schoolId]
    );
    res.json({ success: true, classes: result.rows });
  } catch (error) {
    console.log("Error in GET /api/teacher/classes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// GET /api/teacher/assignments — classes + subjects + periods this
// teacher has already picked for themself.
// ------------------------------------------------------------------
router.get("/assignments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ta.id, ta.subject, ta.period, ta.class_combination_id AS "classCombinationId",
              cc.display_name AS "className"
       FROM teacher_assignments ta
       JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE ta.teacher_id = $1
       ORDER BY cc.display_name ASC, ta.period ASC`,
      [req.user.userId]
    );
    res.json({ success: true, assignments: result.rows });
  } catch (error) {
    console.log("Error in GET /api/teacher/assignments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// POST /api/teacher/assignments — teacher picks a class + subject +
// period for themself. The class must belong to their own school —
// checked server-side, never trusted from the request body — so a
// teacher can never assign themself into another school's class.
// ------------------------------------------------------------------
router.post("/assignments", async (req, res) => {
  const { classCombinationId, subject, period } = req.body;
  if (!classCombinationId || !subject || !subject.trim() || !period || !period.trim()) {
    return res.status(400).json({ success: false, message: "Choose a class, and enter a subject and period." });
  }
  try {
    const owns = await pool.query(
      `SELECT id, display_name FROM class_combinations WHERE id = $1 AND school_id = $2`,
      [classCombinationId, req.user.schoolId]
    );
    if (owns.rows.length === 0) {
      return res.status(404).json({ success: false, message: "That class doesn't belong to your school." });
    }
    const result = await pool.query(
      `INSERT INTO teacher_assignments (teacher_id, class_combination_id, subject, period)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (teacher_id, class_combination_id, subject, period) DO NOTHING
       RETURNING id`,
      [req.user.userId, classCombinationId, subject.trim(), period.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "You're already assigned to that class, subject and period." });
    }
    res.json({
      success: true,
      assignment: {
        id: result.rows[0].id,
        classCombinationId,
        className: owns.rows[0].display_name,
        subject: subject.trim(),
        period: period.trim(),
      },
    });
  } catch (error) {
    console.log("Error in POST /api/teacher/assignments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// DELETE /api/teacher/assignments/:id — drop a class/subject/period the
// teacher no longer wants. Scoped to teacher_id so one teacher can never
// delete another teacher's assignment by guessing an id.
// ------------------------------------------------------------------
router.delete("/assignments/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM teacher_assignments WHERE id = $1 AND teacher_id = $2 RETURNING id`,
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /api/teacher/assignments/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// GET /api/teacher/students?assignmentId=123 — the whole point of this
// file's update. Returns ONLY approved students sitting in the exact
// class tied to that assignment. The assignment id is always resolved
// against ta.teacher_id = the signed-in teacher first — a class can
// never be read by handing in someone else's assignment id, and a
// student is never returned unless status = 'approved'.
// ------------------------------------------------------------------
router.get("/students", async (req, res) => {
  const { assignmentId } = req.query;
  if (!assignmentId) {
    return res.status(400).json({ success: false, message: "assignmentId is required." });
  }
  try {
    const assignment = await pool.query(
      `SELECT ta.id, ta.class_combination_id, ta.subject, ta.period, cc.display_name AS class_name
       FROM teacher_assignments ta
       JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE ta.id = $1 AND ta.teacher_id = $2`,
      [assignmentId, req.user.userId]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "That class/period isn't assigned to you." });
    }
    const { class_combination_id, class_name, subject, period } = assignment.rows[0];

    const students = await pool.query(
      `SELECT id, full_name, email, student_number, status
       FROM users
       WHERE class_combination_id = $1
       AND role = 'student'
       AND status = 'approved'
       ORDER BY full_name ASC`,
      [class_combination_id]
    );

    res.json({
      success: true,
      class: { id: class_combination_id, name: class_name, subject, period },
      students: students.rows,
    });
  } catch (error) {
    console.log("Error in GET /api/teacher/students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, userSessions, createUserSession, requireUserSession };