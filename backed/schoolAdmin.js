// schoolAdmin.js — routes the School_Admin.jsx dashboard actually calls:
// classes, approvals, teachers, students, promotion, notifications, CSV
// export. Mounted in easy.js at app.use("/api/school-admin", ...).
//
// This file previously contained React/JSX (School_Admin.jsx got saved
// over it by mistake), which is why `node easy.js` crashed with
// "SyntaxError: Unexpected token '<'" on the `<style>{...}</style>` line,
// and why every fetch from the dashboard failed with "Could not reach the
// server" — the server process never finished starting.
//
// Auth: reuses requireSchoolAdminSession from home.js so it validates the
// exact same Bearer token issued by /api/auth/school-admin/verify-code.
// req.schoolAdmin.schoolId scopes every query below to the signed-in
// school — no cross-school data can leak through these routes.
//
// IMPORTANT — run this migration first (see 001_allow_suspended_status.sql):
// the users.status CHECK constraint doesn't currently allow 'suspended',
// which the dashboard needs for the Suspend/Reactivate buttons.

const express = require("express");
const pool = require("./db");
const { requireSchoolAdminSession } = require("./home");

const router = express.Router();
router.use(requireSchoolAdminSession);

// ------------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------------

// Mirrors School_Admin.jsx's PATHWAY_SHORT, so display names generated
// here match what the UI would have shown in the preview.
const PATHWAY_SHORT = {
  tvet_l3: "TVET L3",
  tvet_l4: "TVET L4",
  tvet_l5: "TVET L5",
  arts_humanities: "Arts & Humanities",
  math_science_1: "MPG",
  math_science_2: "PCB",
  university: "University",
};

const VALID_EDUCATION_LEVELS = ["nursery", "primary", "senior_lower", "senior_upper"];
const VALID_PATHWAYS = Object.keys(PATHWAY_SHORT);

function buildDisplayName({ levelCode, educationLevel, pathway, stream }) {
  if (educationLevel === "senior_upper") {
    const pathwayShort = PATHWAY_SHORT[pathway] || pathway;
    return stream ? `${levelCode} ${pathwayShort} ${stream}` : `${levelCode} ${pathwayShort}`;
  }
  return `${levelCode} ${stream}`;
}

async function pushNotification(schoolId, type, message, meta) {
  try {
    await pool.query(
      `INSERT INTO notifications (school_id, type, message, meta) VALUES ($1, $2, $3, $4)`,
      [schoolId, type, message, meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    // Notifications are best-effort — never let a logging failure fail the
    // actual action (approving a user, deleting a class, etc).
    console.log("Failed to push notification:", err.message);
  }
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(columns, rows) {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => csvEscape(row[c.key])).join(","));
  return [header, ...lines].join("\n");
}

// ==================================================================
// CLASSES
// ==================================================================

router.get("/classes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, academic_year, education_level, level_code, pathway, stream, capacity, display_name, created_at
       FROM class_combinations
       WHERE school_id = $1
       ORDER BY academic_year DESC, level_code ASC, display_name ASC`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true, classes: result.rows });
  } catch (error) {
    console.log("Error in GET /classes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/classes", async (req, res) => {
  const { academicYear, educationLevel, levelCode, pathway, stream, capacity } = req.body;

  if (!academicYear || !levelCode || !VALID_EDUCATION_LEVELS.includes(educationLevel)) {
    return res.status(400).json({ success: false, message: "Missing or invalid class details." });
  }
  if (educationLevel === "senior_upper" && !VALID_PATHWAYS.includes(pathway)) {
    return res.status(400).json({ success: false, message: "S4–S6 classes need a valid pathway." });
  }

  const displayName = buildDisplayName({ levelCode, educationLevel, pathway, stream });
  const capacityValue = capacity ? parseInt(capacity, 10) : null;

  try {
    const result = await pool.query(
      `INSERT INTO class_combinations
        (school_id, academic_year, education_level, level_code, pathway, stream, capacity, display_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, academic_year, education_level, level_code, pathway, stream, capacity, display_name, created_at`,
      [
        req.schoolAdmin.schoolId,
        academicYear,
        educationLevel,
        levelCode,
        educationLevel === "senior_upper" ? pathway : null,
        stream || null,
        capacityValue,
        displayName,
      ]
    );
    res.json({ success: true, class: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "That exact class already exists for this academic year." });
    }
    console.log("Error in POST /classes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/classes/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM class_combinations WHERE id = $1 AND school_id = $2 RETURNING id`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found." });
    }
    // Students/teachers linked to it: users.class_combination_id is
    // ON DELETE SET NULL, teacher_assignments is ON DELETE CASCADE — both
    // match the confirmation text shown in School_Admin.jsx.
    res.json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /classes/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// APPROVALS
// ==================================================================

router.get("/approvals", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.role, u.full_name, u.email, u.created_at,
              u.requested_class_id, u.requested_subject,
              rc.display_name AS requested_class_name
       FROM users u
       LEFT JOIN class_combinations rc ON rc.id = u.requested_class_id
       WHERE u.school_id = $1 AND u.status = 'pending_approval'
       ORDER BY u.created_at ASC`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true, approvals: result.rows });
  } catch (error) {
    console.log("Error in GET /approvals:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/approvals/:id/approve", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT id, role, full_name, email FROM users
       WHERE id = $1 AND school_id = $2 AND status = 'pending_approval'`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Request not found or already handled." });
    }
    const person = userResult.rows[0];

    if (person.role === "student") {
      const { classCombinationId } = req.body;
      if (!classCombinationId) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Choose a class first." });
      }
      await client.query(
        `UPDATE users SET status = 'approved', approved_at = now(), class_combination_id = $1
         WHERE id = $2`,
        [classCombinationId, person.id]
      );
    } else if (person.role === "teacher") {
      // Approving a teacher no longer asks for or writes a class/subject
      // here. That choice now belongs to the teacher: after they sign in
      // with Google, their own dashboard (teacher.js) shows every class
      // this school's admin has created, and they pick which one(s) and
      // subject(s) they teach — POST /api/teacher/assignments is what
      // actually writes to teacher_assignments.
      await client.query(`UPDATE users SET status = 'approved', approved_at = now() WHERE id = $1`, [person.id]);
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Unsupported role for approval." });
    }

    await client.query("COMMIT");
    pushNotification(req.schoolAdmin.schoolId, "user_approved", `${person.full_name} was approved as ${person.role}.`, { userId: person.id });
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Error in POST /approvals/:id/approve:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

router.post("/approvals/:id/reject", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET status = 'rejected'
       WHERE id = $1 AND school_id = $2 AND status = 'pending_approval'
       RETURNING id, role, full_name`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found or already handled." });
    }
    const person = result.rows[0];
    pushNotification(req.schoolAdmin.schoolId, "user_rejected", `${person.full_name}'s ${person.role} request was rejected.`, { userId: person.id });
    res.json({ success: true });
  } catch (error) {
    console.log("Error in POST /approvals/:id/reject:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// TEACHERS
// ==================================================================

router.get("/teachers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.status,
              COALESCE(
                json_agg(json_build_object('className', cc.display_name, 'subject', ta.subject))
                FILTER (WHERE ta.id IS NOT NULL),
                '[]'
              ) AS assignments
       FROM users u
       LEFT JOIN teacher_assignments ta ON ta.teacher_id = u.id
       LEFT JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE u.school_id = $1 AND u.role = 'teacher' AND u.status IN ('approved', 'suspended')
       GROUP BY u.id
       ORDER BY u.full_name ASC`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true, teachers: result.rows });
  } catch (error) {
    console.log("Error in GET /teachers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/teachers/:id", async (req, res) => {
  try {
    const owns = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher'`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (owns.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    if (req.body.status) {
      if (!["approved", "suspended"].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }
      await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [req.body.status, req.params.id]);
    }

    // Optional manual override — teachers now normally pick their own
    // classes/subjects from their dashboard (see teacher.js), but the
    // admin can still add one directly here if needed.
    if (req.body.addAssignment) {
      const { classCombinationId, subject } = req.body.addAssignment;
      if (!classCombinationId || !subject) {
        return res.status(400).json({ success: false, message: "Class and subject are required." });
      }
      await pool.query(
        `INSERT INTO teacher_assignments (teacher_id, class_combination_id, subject)
         VALUES ($1, $2, $3)
         ON CONFLICT (teacher_id, class_combination_id, subject) DO NOTHING`,
        [req.params.id, classCombinationId, subject]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.log("Error in PATCH /teachers/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/teachers/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND school_id = $2 AND role = 'teacher' RETURNING full_name`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }
    pushNotification(req.schoolAdmin.schoolId, "user_removed", `${result.rows[0].full_name} was removed.`, {});
    res.json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /teachers/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// STUDENTS
// ==================================================================

router.get("/students", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.student_number, u.status,
              u.class_combination_id, cc.display_name AS class_name
       FROM users u
       LEFT JOIN class_combinations cc ON cc.id = u.class_combination_id
       WHERE u.school_id = $1 AND u.role = 'student' AND u.status IN ('approved', 'suspended')
       ORDER BY u.full_name ASC`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true, students: result.rows });
  } catch (error) {
    console.log("Error in GET /students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/students/:id", async (req, res) => {
  try {
    const owns = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND school_id = $2 AND role = 'student'`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (owns.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    if (req.body.status) {
      if (!["approved", "suspended"].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }
      await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [req.body.status, req.params.id]);
    }

    if (req.body.classCombinationId !== undefined) {
      await pool.query(`UPDATE users SET class_combination_id = $1 WHERE id = $2`, [
        req.body.classCombinationId || null,
        req.params.id,
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.log("Error in PATCH /students/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/students/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND school_id = $2 AND role = 'student' RETURNING full_name`,
      [req.params.id, req.schoolAdmin.schoolId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    pushNotification(req.schoolAdmin.schoolId, "user_removed", `${result.rows[0].full_name} was removed.`, {});
    res.json({ success: true });
  } catch (error) {
    console.log("Error in DELETE /students/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// PROMOTE STUDENTS
// ==================================================================

router.post("/promote-students", async (req, res) => {
  const { studentIds, toClassId } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0 || !toClassId) {
    return res.status(400).json({ success: false, message: "Select students and a destination class." });
  }

  try {
    const classResult = await pool.query(
      `SELECT id, display_name FROM class_combinations WHERE id = $1 AND school_id = $2`,
      [toClassId, req.schoolAdmin.schoolId]
    );
    if (classResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Destination class not found." });
    }

    const result = await pool.query(
      `UPDATE users SET class_combination_id = $1
       WHERE id = ANY($2::bigint[]) AND school_id = $3 AND role = 'student'
       RETURNING id`,
      [toClassId, studentIds, req.schoolAdmin.schoolId]
    );

    pushNotification(
      req.schoolAdmin.schoolId,
      "class_promoted",
      `${result.rows.length} student${result.rows.length === 1 ? "" : "s"} promoted to ${classResult.rows[0].display_name}.`,
      { toClassId }
    );
    res.json({ success: true, promoted: result.rows.length });
  } catch (error) {
    console.log("Error in POST /promote-students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// NOTIFICATIONS
// ==================================================================

router.get("/notifications", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, message, meta, read_at, created_at
       FROM notifications
       WHERE school_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.log("Error in GET /notifications:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/notifications/read-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = now() WHERE school_id = $1 AND read_at IS NULL`,
      [req.schoolAdmin.schoolId]
    );
    res.json({ success: true });
  } catch (error) {
    console.log("Error in POST /notifications/read-all:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// CSV EXPORT
// ==================================================================

router.get("/export/:type", async (req, res) => {
  const { type } = req.params;
  const schoolId = req.schoolAdmin.schoolId;

  try {
    let csv;

    if (type === "classes") {
      const result = await pool.query(
        `SELECT display_name, academic_year, education_level, pathway, stream, capacity
         FROM class_combinations WHERE school_id = $1 ORDER BY display_name`,
        [schoolId]
      );
      csv = toCsv(
        [
          { key: "display_name", label: "Class" },
          { key: "academic_year", label: "Academic Year" },
          { key: "education_level", label: "Education Level" },
          { key: "pathway", label: "Pathway" },
          { key: "stream", label: "Stream" },
          { key: "capacity", label: "Capacity" },
        ],
        result.rows
      );
    } else if (type === "teachers") {
      const result = await pool.query(
        `SELECT full_name, email, status FROM users
         WHERE school_id = $1 AND role = 'teacher' AND status IN ('approved','suspended')
         ORDER BY full_name`,
        [schoolId]
      );
      csv = toCsv(
        [
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
        ],
        result.rows
      );
    } else if (type === "students") {
      const result = await pool.query(
        `SELECT u.full_name, u.email, u.student_number, u.status, cc.display_name AS class_name
         FROM users u LEFT JOIN class_combinations cc ON cc.id = u.class_combination_id
         WHERE u.school_id = $1 AND u.role = 'student' AND u.status IN ('approved','suspended')
         ORDER BY u.full_name`,
        [schoolId]
      );
      csv = toCsv(
        [
          { key: "full_name", label: "Name" },
          { key: "student_number", label: "Student ID" },
          { key: "email", label: "Email" },
          { key: "class_name", label: "Class" },
          { key: "status", label: "Status" },
        ],
        result.rows
      );
    } else {
      return res.status(400).json({ success: false, message: "Unknown export type." });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${type}.csv`);
    res.send(csv);
  } catch (error) {
    console.log("Error in GET /export/:type:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router };