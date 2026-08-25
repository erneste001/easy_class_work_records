// teacher.js — teacher-facing dashboard API.
// Mount in easy.js at: app.use("/api/teacher", teacherRoutes.router);
//
// FLOW THIS FILE SUPPORTS (class + subject are chosen by the teacher,
// never by the school admin):
//   1. Teacher signs up with Google -> POST /api/users/register-google
//      (in easy.js) creates a users row with status='pending_approval'.
//   2. School admin approves from School_Admin.jsx -> only flips status
//      to 'approved'. Never writes a class/subject for a teacher.
//   3. Teacher signs in with Google -> POST /api/users/login-google (in
//      easy.js) issues a bearer session token AND returns `assignments`.
//   4. Teacher dashboard calls:
//        GET  /api/teacher/me
//        GET  /api/teacher/classes
//        GET  /api/teacher/assignments
//        POST /api/teacher/assignments
//        DELETE /api/teacher/assignments/:id
//        GET  /api/teacher/students?assignmentId=
//        GET    /api/teacher/notes
//        POST   /api/teacher/notes
//        PATCH  /api/teacher/notes/:id
//        DELETE /api/teacher/notes/:id
//        GET    /api/teacher/quizzes
//        POST   /api/teacher/quizzes
//        PATCH  /api/teacher/quizzes/:id
//        DELETE /api/teacher/quizzes/:id
//
// SCHEMA NOTES:
//   - teacher_assignments has NO `period` column and never has:
//       id, teacher_id, class_combination_id, subject, created_at
//     unique constraint: (teacher_id, class_combination_id, subject).
//   - notes.class_id and quizzes.class_id must already be repointed at
//     class_combinations(id) (uuid) — run the migration email that shipped
//     alongside this file before using the routes below.
//   - notes also has file_url, file_type ('image'|'video'|'pdf'|'file'), file_name.
//   - quizzes also has starts_at, ends_at (both timestamptz, both optional).
//   - quiz_options only supports multiple-choice grading (is_correct
//     boolean) — there is no "written / manually graded" question type in
//     this schema.
//   - quiz_attempts / quiz_attempt_answers (used by student.js) must have
//     every column listed in migration_fix_quiz_attempts.sql — if you ever
//     see "column a.status does not exist" (or any other missing-column
//     error touching quiz_attempts), run that migration file against your
//     database. It's safe to run more than once.
//
// Every note/quiz create is checked against teacher_assignments so a
// teacher can only save into a class+subject they actually teach — never
// trusted from the request body alone.
//
// Every save/update/delete route below returns a human-readable `message`
// field so the frontend can show a real confirmation instead of guessing.
//
// SESSIONS — this file OWNS the shared user-session store (userSessions /
// createUserSession / requireUserSession, all exported below). easy.js's
// POST /api/users/login-google calls THIS file's createUserSession().
//
// SESSION LIFETIME (updated): sessions used to hard-expire exactly
// USER_SESSION_TTL_MS after login, which logged people out mid-use even
// while they were actively working. requireUserSession() now REFRESHES
// expiresAt on every authenticated request ("sliding window"), so in
// practice a session lasts as long as the teacher/student keeps using the
// app, and only truly expires after USER_SESSION_TTL_MS of total
// inactivity. The only other way a session ends is the frontend's explicit
// Sign Out button, which just clears the token from localStorage.
//
// CAVEAT: userSessions is an in-memory Map. Restarting the Node process
// (e.g. `node easy.js` again after a crash or a deploy) wipes every active
// session — everyone has to sign in again. If you need sessions to survive
// server restarts, move this Map into Postgres or Redis; that's a bigger
// change and out of scope here, but worth doing before this goes to real
// production traffic.

const express = require("express");
const crypto = require("crypto");
const pool = require("./db");

const router = express.Router();

// How long a session can sit COMPLETELY IDLE before it's forced to log in
// again. Because requireUserSession() below refreshes this on every call,
// an active user effectively never hits this — it only matters if they
// close the tab and don't come back for this long.
const USER_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours of inactivity

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

  // Sliding expiry: every authenticated request pushes the expiry back out,
  // so a session only dies from real inactivity, not a fixed clock from
  // login time. This is what makes the session last "until sign out" for
  // anyone actively using the dashboard.
  session.expiresAt = Date.now() + USER_SESSION_TTL_MS;

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
// POST /api/teacher/logout — explicit sign-out. Not required (the
// frontend already clears its localStorage token), but calling this lets
// the SERVER drop the session immediately too, instead of waiting out the
// idle TTL. Wire it up from the Sign Out button if you want that.
// ------------------------------------------------------------------
router.post("/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) userSessions.delete(token);
  res.json({ success: true, message: "Signed out." });
});

// ------------------------------------------------------------------
// Shared helper: confirms the signed-in teacher actually teaches this
// exact class+subject before letting them create/edit/delete a note or
// quiz for it.
// ------------------------------------------------------------------
async function assertTeachesClassSubject(teacherId, classCombinationId, subject) {
  const result = await pool.query(
    `SELECT id FROM teacher_assignments
     WHERE teacher_id = $1 AND class_combination_id = $2 AND subject = $3`,
    [teacherId, classCombinationId, subject]
  );
  return result.rows.length > 0;
}

const VALID_FILE_TYPES = ["image", "video", "pdf", "file"];

// ------------------------------------------------------------------
// GET /api/teacher/me
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
// GET /api/teacher/classes
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
// GET /api/teacher/assignments — the teacher's REAL classes + subjects.
// This is the only source of truth the dashboard should use for "which
// classes can I save this to" — never a hardcoded list.
// ------------------------------------------------------------------
router.get("/assignments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ta.id, ta.subject, ta.class_combination_id AS "classCombinationId",
              cc.display_name AS "className"
       FROM teacher_assignments ta
       JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE ta.teacher_id = $1
       ORDER BY cc.display_name ASC, ta.subject ASC`,
      [req.user.userId]
    );
    res.json({ success: true, assignments: result.rows });
  } catch (error) {
    console.log("Error in GET /api/teacher/assignments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// POST /api/teacher/assignments
// ------------------------------------------------------------------
router.post("/assignments", async (req, res) => {
  const { assignments } = req.body;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ success: false, message: "Pick at least one class and subject." });
  }

  const cleaned = assignments
    .map((a) => ({
      classCombinationId: a && a.classCombinationId,
      subject: a && typeof a.subject === "string" ? a.subject.trim() : "",
    }))
    .filter((a) => a.classCombinationId && a.subject);

  if (cleaned.length === 0) {
    return res.status(400).json({ success: false, message: "Pick at least one class and subject." });
  }

  try {
    const classIds = [...new Set(cleaned.map((a) => a.classCombinationId))];
    const owned = await pool.query(
      `SELECT id, display_name FROM class_combinations WHERE id = ANY($1) AND school_id = $2`,
      [classIds, req.user.schoolId]
    );
    const ownedMap = new Map(owned.rows.map((r) => [r.id, r.display_name]));

    const invalid = classIds.find((id) => !ownedMap.has(id));
    if (invalid) {
      return res.status(404).json({ success: false, message: "One of those classes doesn't belong to your school." });
    }

    for (const { classCombinationId, subject } of cleaned) {
      await pool.query(
        `INSERT INTO teacher_assignments (teacher_id, class_combination_id, subject)
         VALUES ($1, $2, $3)
         ON CONFLICT (teacher_id, class_combination_id, subject) DO NOTHING`,
        [req.user.userId, classCombinationId, subject]
      );
    }

    const all = await pool.query(
      `SELECT ta.id, ta.subject, ta.class_combination_id AS "classCombinationId",
              cc.display_name AS "className"
       FROM teacher_assignments ta
       JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE ta.teacher_id = $1
       ORDER BY cc.display_name ASC, ta.subject ASC`,
      [req.user.userId]
    );

    res.json({ success: true, message: "Classes saved.", assignments: all.rows });
  } catch (error) {
    console.log("Error in POST /api/teacher/assignments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// DELETE /api/teacher/assignments/:id
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
    res.json({ success: true, message: "Removed." });
  } catch (error) {
    console.log("Error in DELETE /api/teacher/assignments/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// GET /api/teacher/students?assignmentId=123
// Returns only the approved students who belong to the SAME class as the
// given assignment — this is the route TeacherDashboard.jsx now calls
// from its Students tab (previously that tab was a static placeholder and
// never called this at all).
// ------------------------------------------------------------------
router.get("/students", async (req, res) => {
  const { assignmentId } = req.query;
  if (!assignmentId) {
    return res.status(400).json({ success: false, message: "assignmentId is required." });
  }
  try {
    const assignment = await pool.query(
      `SELECT ta.id, ta.class_combination_id, ta.subject, cc.display_name AS class_name
       FROM teacher_assignments ta
       JOIN class_combinations cc ON cc.id = ta.class_combination_id
       WHERE ta.id = $1 AND ta.teacher_id = $2`,
      [assignmentId, req.user.userId]
    );
    if (assignment.rows.length === 0) {
      return res.status(404).json({ success: false, message: "That class isn't assigned to you." });
    }
    const { class_combination_id, class_name, subject } = assignment.rows[0];

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
      class: { id: class_combination_id, name: class_name, subject },
      students: students.rows,
    });
  } catch (error) {
    console.log("Error in GET /api/teacher/students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// NOTES
// ==================================================================

router.get("/notes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.id, n.class_id AS "classCombinationId", cc.display_name AS "className",
              n.subject, n.title, n.content, n.status,
              n.file_url AS "fileUrl", n.file_type AS "fileType", n.file_name AS "fileName",
              n.created_at AS "createdAt", n.updated_at AS "updatedAt"
       FROM notes n
       JOIN class_combinations cc ON cc.id = n.class_id
       WHERE n.teacher_id = $1
       ORDER BY n.updated_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, notes: result.rows });
  } catch (error) {
    console.log("Error in GET /api/teacher/notes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/notes", async (req, res) => {
  const {
    classCombinationId,
    subject,
    title,
    content,
    status,
    fileUrl,
    fileType,
    fileName,
  } = req.body;

  if (!classCombinationId || !subject || !subject.trim() || !title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Class, subject, title and content are all required." });
  }
  const noteStatus = status === "published" ? "published" : "draft";
  if (fileType && !VALID_FILE_TYPES.includes(fileType)) {
    return res.status(400).json({ success: false, message: "Invalid file type." });
  }

  try {
    const allowed = await assertTeachesClassSubject(req.user.userId, classCombinationId, subject.trim());
    if (!allowed) {
      return res.status(403).json({ success: false, message: "You're not assigned to that class and subject." });
    }

    const result = await pool.query(
      `INSERT INTO notes
        (teacher_id, class_id, subject, title, content, status, file_url, file_type, file_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, class_id AS "classCombinationId", subject, title, content, status,
                 file_url AS "fileUrl", file_type AS "fileType", file_name AS "fileName",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        req.user.userId,
        classCombinationId,
        subject.trim(),
        title.trim(),
        content.trim(),
        noteStatus,
        fileUrl || null,
        fileType || null,
        fileName || null,
      ]
    );

    res.json({
      success: true,
      message: noteStatus === "published" ? "Note saved and published to the class." : "Note saved as draft.",
      note: result.rows[0],
    });
  } catch (error) {
    console.log("Error in POST /api/teacher/notes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/notes/:id", async (req, res) => {
  const { title, content, status, fileUrl, fileType, fileName } = req.body;

  if (status && !["draft", "published"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }
  if (fileType && !VALID_FILE_TYPES.includes(fileType)) {
    return res.status(400).json({ success: false, message: "Invalid file type." });
  }

  try {
    const owns = await pool.query(`SELECT id FROM notes WHERE id = $1 AND teacher_id = $2`, [req.params.id, req.user.userId]);
    if (owns.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    const result = await pool.query(
      `UPDATE notes SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        status = COALESCE($3, status),
        file_url = COALESCE($4, file_url),
        file_type = COALESCE($5, file_type),
        file_name = COALESCE($6, file_name)
       WHERE id = $7 AND teacher_id = $8
       RETURNING id, class_id AS "classCombinationId", subject, title, content, status,
                 file_url AS "fileUrl", file_type AS "fileType", file_name AS "fileName",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        title ? title.trim() : null,
        content ? content.trim() : null,
        status || null,
        fileUrl || null,
        fileType || null,
        fileName || null,
        req.params.id,
        req.user.userId,
      ]
    );

    const updated = result.rows[0];
    let message = "Note updated.";
    if (status === "published") message = "Note published to the class.";
    else if (status === "draft") message = "Note moved back to drafts.";

    res.json({ success: true, message, note: updated });
  } catch (error) {
    console.log("Error in PATCH /api/teacher/notes/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/notes/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notes WHERE id = $1 AND teacher_id = $2 RETURNING id`,
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }
    res.json({ success: true, message: "Note deleted." });
  } catch (error) {
    console.log("Error in DELETE /api/teacher/notes/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// QUIZZES
// ==================================================================

router.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await pool.query(
      `SELECT q.id, q.class_id AS "classCombinationId", cc.display_name AS "className",
              q.subject, q.title, q.time_limit_minutes AS "timeLimitMinutes", q.status,
              q.starts_at AS "startsAt", q.ends_at AS "endsAt", q.created_at AS "createdAt"
       FROM quizzes q
       JOIN class_combinations cc ON cc.id = q.class_id
       WHERE q.teacher_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.userId]
    );

    if (quizzes.rows.length === 0) {
      return res.json({ success: true, quizzes: [] });
    }

    const quizIds = quizzes.rows.map((q) => q.id);
    const questions = await pool.query(
      `SELECT qq.id, qq.quiz_id AS "quizId", qq.order_index AS "orderIndex", qq.question,
              qo.id AS "optionId", qo.option_text AS "optionText", qo.is_correct AS "isCorrect"
       FROM quiz_questions qq
       LEFT JOIN quiz_options qo ON qo.question_id = qq.id
       WHERE qq.quiz_id = ANY($1)
       ORDER BY qq.quiz_id, qq.order_index ASC, qo.id ASC`,
      [quizIds]
    );

    const questionsByQuiz = new Map();
    for (const row of questions.rows) {
      if (!questionsByQuiz.has(row.quizId)) questionsByQuiz.set(row.quizId, new Map());
      const qMap = questionsByQuiz.get(row.quizId);
      if (!qMap.has(row.id)) {
        qMap.set(row.id, { id: row.id, orderIndex: row.orderIndex, question: row.question, options: [] });
      }
      if (row.optionId) {
        qMap.get(row.id).options.push({ id: row.optionId, optionText: row.optionText, isCorrect: row.isCorrect });
      }
    }

    const result = quizzes.rows.map((q) => ({
      ...q,
      questions: [...(questionsByQuiz.get(q.id) || new Map()).values()],
    }));

    res.json({ success: true, quizzes: result });
  } catch (error) {
    console.log("Error in GET /api/teacher/quizzes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/quizzes", async (req, res) => {
  const {
    classCombinationId,
    subject,
    title,
    timeLimitMinutes,
    status,
    startsAt,
    endsAt,
    questions,
  } = req.body;

  if (!classCombinationId || !subject || !subject.trim() || !title || !title.trim()) {
    return res.status(400).json({ success: false, message: "Class, subject and title are required." });
  }
  const quizStatus = ["draft", "published", "closed"].includes(status) ? status : "draft";

  const client = await pool.connect();
  try {
    const allowed = await assertTeachesClassSubject(req.user.userId, classCombinationId, subject.trim());
    if (!allowed) {
      client.release();
      return res.status(403).json({ success: false, message: "You're not assigned to that class and subject." });
    }

    await client.query("BEGIN");

    const quizResult = await client.query(
      `INSERT INTO quizzes
        (teacher_id, class_id, subject, title, time_limit_minutes, status, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, class_id AS "classCombinationId", subject, title,
                 time_limit_minutes AS "timeLimitMinutes", status,
                 starts_at AS "startsAt", ends_at AS "endsAt", created_at AS "createdAt"`,
      [
        req.user.userId,
        classCombinationId,
        subject.trim(),
        title.trim(),
        timeLimitMinutes || null,
        quizStatus,
        startsAt || null,
        endsAt || null,
      ]
    );
    const quiz = quizResult.rows[0];
    const builtQuestions = [];

    if (Array.isArray(questions)) {
      let orderIndex = 0;
      for (const q of questions) {
        if (!q || !q.question || !q.question.trim()) continue;
        const questionResult = await client.query(
          `INSERT INTO quiz_questions (quiz_id, order_index, question)
           VALUES ($1, $2, $3)
           RETURNING id, order_index AS "orderIndex", question`,
          [quiz.id, orderIndex, q.question.trim()]
        );
        const savedQuestion = questionResult.rows[0];
        const savedOptions = [];

        if (Array.isArray(q.options)) {
          for (const o of q.options) {
            if (!o || !o.optionText || !o.optionText.trim()) continue;
            const optionResult = await client.query(
              `INSERT INTO quiz_options (question_id, option_text, is_correct)
               VALUES ($1, $2, $3)
               RETURNING id, option_text AS "optionText", is_correct AS "isCorrect"`,
              [savedQuestion.id, o.optionText.trim(), Boolean(o.isCorrect)]
            );
            savedOptions.push(optionResult.rows[0]);
          }
        }

        builtQuestions.push({ ...savedQuestion, options: savedOptions });
        orderIndex += 1;
      }
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      message: quizStatus === "published" ? "Quiz saved and published to the class." : "Quiz saved as draft.",
      quiz: { ...quiz, questions: builtQuestions },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log("Error in POST /api/teacher/quizzes:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

router.patch("/quizzes/:id", async (req, res) => {
  const { title, timeLimitMinutes, status, startsAt, endsAt } = req.body;

  if (status && !["draft", "published", "closed"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status." });
  }

  try {
    const owns = await pool.query(`SELECT id FROM quizzes WHERE id = $1 AND teacher_id = $2`, [req.params.id, req.user.userId]);
    if (owns.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    const result = await pool.query(
      `UPDATE quizzes SET
        title = COALESCE($1, title),
        time_limit_minutes = COALESCE($2, time_limit_minutes),
        status = COALESCE($3, status),
        starts_at = COALESCE($4, starts_at),
        ends_at = COALESCE($5, ends_at)
       WHERE id = $6 AND teacher_id = $7
       RETURNING id, class_id AS "classCombinationId", subject, title,
                 time_limit_minutes AS "timeLimitMinutes", status,
                 starts_at AS "startsAt", ends_at AS "endsAt", created_at AS "createdAt"`,
      [
        title ? title.trim() : null,
        timeLimitMinutes || null,
        status || null,
        startsAt || null,
        endsAt || null,
        req.params.id,
        req.user.userId,
      ]
    );

    let message = "Quiz updated.";
    if (status === "published") message = "Quiz published to the class.";
    else if (status === "draft") message = "Quiz moved back to drafts.";
    else if (status === "closed") message = "Quiz closed.";

    res.json({ success: true, message, quiz: result.rows[0] });
  } catch (error) {
    console.log("Error in PATCH /api/teacher/quizzes/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/quizzes/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM quizzes WHERE id = $1 AND teacher_id = $2 RETURNING id`,
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }
    res.json({ success: true, message: "Quiz deleted." });
  } catch (error) {
    console.log("Error in DELETE /api/teacher/quizzes/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router, userSessions, createUserSession, requireUserSession };