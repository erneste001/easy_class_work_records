// student.js — student-facing dashboard API.
// Mount in easy.js at: app.use("/api/student", studentRoutes.router);
//
// Requires migration_quiz_attempts.sql to have been run first (adds
// quiz_attempts + quiz_attempt_answers).
//
// SESSIONS — reuses the SAME session store as teacher.js (students and
// teachers share one login system). We import requireUserSession from
// teacher.js rather than re-implementing it, so a token issued at
// POST /api/users/login-google works for either dashboard depending on
// req.user.role.
//
// ROUTES THIS FILE ADDS:
//   GET  /api/student/me
//   GET  /api/student/notes
//   GET  /api/student/quizzes                     -> list + live status
//   POST /api/student/quizzes/:id/start            -> begin or resume an attempt
//   POST /api/student/quizzes/:id/answer            -> autosave one answer
//   POST /api/student/quizzes/:id/away              -> report tab-away seconds (penalty)
//   POST /api/student/quizzes/:id/submit            -> finalize + score
//   GET  /api/student/quizzes/:id/result            -> review a submitted attempt
//
// SCORING RULE (as specified by the school): each question is worth 1
// mark. Every full second the student spends away from the quiz tab
// while an attempt is "in_progress" costs 1 mark. final_score =
// max(raw_correct_count - penalty_marks, 0). This is enforced entirely
// server-side — the client only *reports* away-seconds, it never sends
// a score.

const express = require("express");
const pool = require("./db");
const { requireUserSession } = require("./teacher");

const router = express.Router();

function requireStudent(req, res, next) {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Student account required." });
  }
  next();
}

router.use(requireUserSession, requireStudent);

// ------------------------------------------------------------------
// Shared helper: loads the signed-in student's class, and 404s cleanly
// if the account somehow has none set yet.
// ------------------------------------------------------------------
async function getStudentClass(studentId) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.status, u.class_combination_id AS "classCombinationId",
            cc.display_name AS "className"
     FROM users u
     LEFT JOIN class_combinations cc ON cc.id = u.class_combination_id
     WHERE u.id = $1 AND u.role = 'student'`,
    [studentId]
  );
  return result.rows[0] || null;
}

// Computes the deadline for an attempt: started_at + time_limit_minutes,
// capped by the quiz's own ends_at (a quiz window always wins over a
// per-student timer).
function computeDeadline(startedAt, timeLimitMinutes, quizEndsAt) {
  let deadline = null;
  if (timeLimitMinutes) {
    deadline = new Date(startedAt.getTime() + timeLimitMinutes * 60000);
  }
  if (quizEndsAt) {
    const endsAt = new Date(quizEndsAt);
    if (!deadline || endsAt < deadline) deadline = endsAt;
  }
  return deadline;
}

// ------------------------------------------------------------------
// GET /api/student/me
// ------------------------------------------------------------------
router.get("/me", async (req, res) => {
  try {
    const student = await getStudentClass(req.user.userId);
    if (!student) return res.status(404).json({ success: false, message: "Account not found." });
    if (student.status === "suspended") {
      return res.status(403).json({ success: false, message: "Your account has been suspended by your school admin." });
    }
    res.json({ success: true, student });
  } catch (error) {
    console.log("Error in GET /api/student/me:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// NOTES — published notes for the student's own class only.
// ==================================================================
router.get("/notes", async (req, res) => {
  try {
    const student = await getStudentClass(req.user.userId);
    if (!student || !student.classCombinationId) {
      return res.json({ success: true, notes: [] }); // no class assigned yet — nothing to show
    }
    const result = await pool.query(
      `SELECT n.id, n.subject, n.title, n.content,
              n.file_url AS "fileUrl", n.file_type AS "fileType", n.file_name AS "fileName",
              n.updated_at AS "updatedAt", u.full_name AS "authorName"
       FROM notes n
       JOIN users u ON u.id = n.teacher_id
       WHERE n.class_id = $1 AND n.status = 'published'
       ORDER BY n.updated_at DESC`,
      [student.classCombinationId]
    );
    res.json({ success: true, notes: result.rows });
  } catch (error) {
    console.log("Error in GET /api/student/notes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================================================================
// QUIZZES — list
// ==================================================================
router.get("/quizzes", async (req, res) => {
  try {
    const student = await getStudentClass(req.user.userId);
    if (!student || !student.classCombinationId) {
      return res.json({ success: true, quizzes: [] });
    }

    const quizzes = await pool.query(
      `SELECT q.id, q.subject, q.title, q.time_limit_minutes AS "timeLimitMinutes",
              q.status AS "quizStatus", q.starts_at AS "startsAt", q.ends_at AS "endsAt",
              (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS "questionCount",
              a.id AS "attemptId", a.status AS "attemptStatus", a.started_at AS "startedAt",
              a.deadline_at AS "deadlineAt", a.away_seconds AS "awaySeconds",
              a.penalty_marks AS "penaltyMarks", a.final_score AS "finalScore",
              a.score_percent AS "scorePercent"
       FROM quizzes q
       LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.student_id = $2
       WHERE q.class_id = $1 AND q.status IN ('published', 'closed')
       ORDER BY q.starts_at ASC NULLS LAST, q.created_at DESC`,
      [student.classCombinationId, req.user.userId]
    );

    const now = new Date();
    const shaped = quizzes.rows.map((q) => {
      let status;
      if (q.attemptStatus === "submitted") status = "completed";
      else if (q.attemptStatus === "in_progress") status = "in_progress";
      else if (q.quizStatus === "closed") status = "closed";
      else if (q.startsAt && now < new Date(q.startsAt)) status = "upcoming";
      else if (q.endsAt && now > new Date(q.endsAt)) status = "expired";
      else status = "available";

      return {
        id: q.id,
        subject: q.subject,
        title: q.title,
        timeLimitMinutes: q.timeLimitMinutes,
        startsAt: q.startsAt,
        endsAt: q.endsAt,
        questionCount: q.questionCount,
        status,
        attempt: q.attemptId
          ? {
              id: q.attemptId,
              startedAt: q.startedAt,
              deadlineAt: q.deadlineAt,
              awaySeconds: q.awaySeconds,
              penaltyMarks: Number(q.penaltyMarks),
              finalScore: q.finalScore === null ? null : Number(q.finalScore),
              scorePercent: q.scorePercent === null ? null : Number(q.scorePercent),
            }
          : null,
      };
    });

    res.json({ success: true, quizzes: shaped });
  } catch (error) {
    console.log("Error in GET /api/student/quizzes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// POST /api/student/quizzes/:id/start
// Begins a new attempt, or resumes the existing in-progress one.
// Returns the questions WITHOUT isCorrect flags, plus the deadline the
// client should count down to, plus any answers already saved.
// ------------------------------------------------------------------
router.post("/quizzes/:id/start", async (req, res) => {
  const quizId = req.params.id;
  try {
    const student = await getStudentClass(req.user.userId);
    if (!student || !student.classCombinationId) {
      return res.status(403).json({ success: false, message: "No class assigned to your account yet." });
    }

    const quizResult = await pool.query(
      `SELECT id, class_id AS "classId", status, time_limit_minutes AS "timeLimitMinutes",
              starts_at AS "startsAt", ends_at AS "endsAt", title, subject
       FROM quizzes WHERE id = $1`,
      [quizId]
    );
    const quiz = quizResult.rows[0];
    if (!quiz || quiz.classId !== student.classCombinationId) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }
    if (quiz.status === "draft") {
      return res.status(403).json({ success: false, message: "This quiz hasn't been published yet." });
    }

    const now = new Date();
    if (quiz.startsAt && now < new Date(quiz.startsAt)) {
      return res.status(403).json({ success: false, message: "This quiz hasn't started yet." });
    }
    if (quiz.status === "closed" || (quiz.endsAt && now > new Date(quiz.endsAt))) {
      return res.status(403).json({ success: false, message: "This quiz is closed." });
    }

    // Resume an existing attempt if one is already in progress.
    let attempt = (
      await pool.query(`SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2`, [quizId, req.user.userId])
    ).rows[0];

    if (attempt && attempt.status === "submitted") {
      return res.status(409).json({ success: false, message: "You've already submitted this quiz." });
    }

    if (!attempt) {
      const deadline = computeDeadline(now, quiz.timeLimitMinutes, quiz.endsAt);
      const inserted = await pool.query(
        `INSERT INTO quiz_attempts (quiz_id, student_id, status, started_at, deadline_at)
         VALUES ($1, $2, 'in_progress', $3, $4)
         RETURNING *`,
        [quizId, req.user.userId, now, deadline]
      );
      attempt = inserted.rows[0];
    } else if (attempt.deadline_at && now > new Date(attempt.deadline_at)) {
      // They came back after time ran out — auto-finalize with whatever
      // was saved instead of letting them keep answering.
      const result = await finalizeAttempt(attempt.id);
      return res.status(409).json({ success: false, message: "Time's up — this attempt was auto-submitted.", result });
    }

    const questions = await pool.query(
      `SELECT qq.id, qq.order_index AS "orderIndex", qq.question,
              qo.id AS "optionId", qo.option_text AS "optionText"
       FROM quiz_questions qq
       LEFT JOIN quiz_options qo ON qo.question_id = qq.id
       WHERE qq.quiz_id = $1
       ORDER BY qq.order_index ASC, qo.id ASC`,
      [quizId]
    );
    const qMap = new Map();
    for (const row of questions.rows) {
      if (!qMap.has(row.id)) qMap.set(row.id, { id: row.id, orderIndex: row.orderIndex, question: row.question, options: [] });
      if (row.optionId) qMap.get(row.id).options.push({ id: row.optionId, optionText: row.optionText });
    }

    const savedAnswers = await pool.query(
      `SELECT question_id AS "questionId", option_id AS "optionId" FROM quiz_attempt_answers WHERE attempt_id = $1`,
      [attempt.id]
    );

    res.json({
      success: true,
      quiz: { id: quiz.id, title: quiz.title, subject: quiz.subject, timeLimitMinutes: quiz.timeLimitMinutes, questions: [...qMap.values()] },
      attempt: {
        id: attempt.id,
        startedAt: attempt.started_at,
        deadlineAt: attempt.deadline_at,
        awaySeconds: attempt.away_seconds,
        penaltyMarks: Number(attempt.penalty_marks),
      },
      answers: savedAnswers.rows,
    });
  } catch (error) {
    console.log("Error in POST /api/student/quizzes/:id/start:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// Shared guard: loads an in_progress attempt owned by this student, or
// auto-finalizes + rejects if the deadline has already passed.
// ------------------------------------------------------------------
async function loadActiveAttempt(quizId, studentId) {
  const result = await pool.query(
    `SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2`,
    [quizId, studentId]
  );
  const attempt = result.rows[0];
  if (!attempt) return { error: { status: 404, message: "Start the quiz first." } };
  if (attempt.status === "submitted") return { error: { status: 409, message: "This attempt was already submitted." } };
  if (attempt.deadline_at && new Date() > new Date(attempt.deadline_at)) {
    const scored = await finalizeAttempt(attempt.id);
    return { error: { status: 409, message: "Time's up — this attempt was auto-submitted.", result: scored } };
  }
  return { attempt };
}

// ------------------------------------------------------------------
// POST /api/student/quizzes/:id/answer  { questionId, optionId }
// Autosaves one answer. Called every time the student picks an option
// so a refresh never loses progress.
// ------------------------------------------------------------------
router.post("/quizzes/:id/answer", async (req, res) => {
  const { questionId, optionId } = req.body;
  if (!questionId || !optionId) {
    return res.status(400).json({ success: false, message: "questionId and optionId are required." });
  }
  try {
    const { attempt, error } = await loadActiveAttempt(req.params.id, req.user.userId);
    if (error) return res.status(error.status).json({ success: false, message: error.message, result: error.result });

    // Confirm the option really belongs to a question of this quiz.
    const check = await pool.query(
      `SELECT qo.id FROM quiz_options qo
       JOIN quiz_questions qq ON qq.id = qo.question_id
       WHERE qo.id = $1 AND qo.question_id = $2 AND qq.quiz_id = $3`,
      [optionId, questionId, req.params.id]
    );
    if (check.rows.length === 0) {
      return res.status(400).json({ success: false, message: "That option doesn't belong to this question." });
    }

    await pool.query(
      `INSERT INTO quiz_attempt_answers (attempt_id, question_id, option_id, answered_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (attempt_id, question_id) DO UPDATE SET option_id = $3, answered_at = now()`,
      [attempt.id, questionId, optionId]
    );

    res.json({ success: true, message: "Answer saved." });
  } catch (error) {
    console.log("Error in POST /api/student/quizzes/:id/answer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// POST /api/student/quizzes/:id/away  { seconds }
// Reported by the client whenever the tab regains focus after being
// hidden/blurred. Adds to away_seconds and the 1-mark-per-second
// penalty. Clamped so a tampered client can't report more away-time
// than has actually elapsed since the attempt started.
// ------------------------------------------------------------------
router.post("/quizzes/:id/away", async (req, res) => {
  let { seconds } = req.body;
  seconds = Math.floor(Number(seconds));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return res.status(400).json({ success: false, message: "seconds must be a positive number." });
  }
  try {
    const { attempt, error } = await loadActiveAttempt(req.params.id, req.user.userId);
    if (error) return res.status(error.status).json({ success: false, message: error.message, result: error.result });

    const elapsedSinceStart = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const cappedTotalAway = Math.min(attempt.away_seconds + seconds, Math.max(elapsedSinceStart, 0));
    const addedSeconds = Math.max(cappedTotalAway - attempt.away_seconds, 0);

    const updated = await pool.query(
      `UPDATE quiz_attempts
       SET away_seconds = $1, penalty_marks = penalty_marks + $2
       WHERE id = $3
       RETURNING away_seconds AS "awaySeconds", penalty_marks AS "penaltyMarks"`,
      [cappedTotalAway, addedSeconds, attempt.id]
    );

    res.json({
      success: true,
      message: `${addedSeconds} second${addedSeconds === 1 ? "" : "s"} away — ${addedSeconds} mark${addedSeconds === 1 ? "" : "s"} deducted.`,
      awaySeconds: updated.rows[0].awaySeconds,
      penaltyMarks: Number(updated.rows[0].penaltyMarks),
    });
  } catch (error) {
    console.log("Error in POST /api/student/quizzes/:id/away:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// Computes and stores the final score for an attempt. Shared by the
// explicit submit route and the auto-submit-on-expiry paths above.
// ------------------------------------------------------------------
async function finalizeAttempt(attemptId) {
  const attemptRow = (await pool.query(`SELECT * FROM quiz_attempts WHERE id = $1`, [attemptId])).rows[0];
  if (!attemptRow) throw new Error("Attempt not found.");
  if (attemptRow.status === "submitted") {
    return { finalScore: Number(attemptRow.final_score), totalQuestions: attemptRow.total_questions, scorePercent: Number(attemptRow.score_percent) };
  }

  const questions = await pool.query(
    `SELECT qq.id AS "questionId", qo.id AS "optionId", qo.is_correct AS "isCorrect"
     FROM quiz_questions qq
     LEFT JOIN quiz_options qo ON qo.question_id = qq.id
     WHERE qq.quiz_id = $1`,
    [attemptRow.quiz_id]
  );
  const questionIds = [...new Set(questions.rows.map((r) => r.questionId))];
  const correctOptionByQuestion = new Map();
  for (const row of questions.rows) {
    if (row.isCorrect) correctOptionByQuestion.set(row.questionId, row.optionId);
  }

  const answers = await pool.query(
    `SELECT question_id AS "questionId", option_id AS "optionId" FROM quiz_attempt_answers WHERE attempt_id = $1`,
    [attemptId]
  );
  const answerByQuestion = new Map(answers.rows.map((a) => [a.questionId, a.optionId]));

  let rawScore = 0;
  const skippedQuestionIds = [];
  for (const qid of questionIds) {
    const chosen = answerByQuestion.get(qid);
    if (!chosen) {
      skippedQuestionIds.push(qid);
      continue;
    }
    if (correctOptionByQuestion.get(qid) === chosen) rawScore += 1;
  }

  const totalQuestions = questionIds.length;
  const penaltyMarks = Number(attemptRow.penalty_marks);
  const finalScore = Math.max(rawScore - penaltyMarks, 0);
  const scorePercent = totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 1000) / 10 : 0;

  await pool.query(
    `UPDATE quiz_attempts
     SET status = 'submitted', submitted_at = now(), raw_score = $1, total_questions = $2,
         final_score = $3, score_percent = $4
     WHERE id = $5`,
    [rawScore, totalQuestions, finalScore, scorePercent, attemptId]
  );

  return { rawScore, totalQuestions, penaltyMarks, finalScore, scorePercent, skippedCount: skippedQuestionIds.length };
}

// ------------------------------------------------------------------
// POST /api/student/quizzes/:id/submit
// Finalizes the attempt. The frontend should already have shown the
// student their skipped-question list and gotten a confirm before
// calling this — but scoring itself only ever happens here, server-side.
// ------------------------------------------------------------------
router.post("/quizzes/:id/submit", async (req, res) => {
  try {
    const { attempt, error } = await loadActiveAttempt(req.params.id, req.user.userId);
    if (error) {
      // "Time's up" auto-submit counts as a valid submit outcome here.
      if (error.result) return res.json({ success: true, message: error.message, result: error.result });
      return res.status(error.status).json({ success: false, message: error.message });
    }
    const result = await finalizeAttempt(attempt.id);
    res.json({ success: true, message: "Quiz submitted.", result });
  } catch (error) {
    console.log("Error in POST /api/student/quizzes/:id/submit:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ------------------------------------------------------------------
// GET /api/student/quizzes/:id/result — review after submission, with
// correct answers shown.
// ------------------------------------------------------------------
router.get("/quizzes/:id/result", async (req, res) => {
  try {
    const attempt = (
      await pool.query(`SELECT * FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2`, [req.params.id, req.user.userId])
    ).rows[0];
    if (!attempt || attempt.status !== "submitted") {
      return res.status(404).json({ success: false, message: "No submitted attempt found." });
    }

    const questions = await pool.query(
      `SELECT qq.id, qq.order_index AS "orderIndex", qq.question,
              qo.id AS "optionId", qo.option_text AS "optionText", qo.is_correct AS "isCorrect"
       FROM quiz_questions qq
       LEFT JOIN quiz_options qo ON qo.question_id = qq.id
       WHERE qq.quiz_id = $1
       ORDER BY qq.order_index ASC, qo.id ASC`,
      [req.params.id]
    );
    const qMap = new Map();
    for (const row of questions.rows) {
      if (!qMap.has(row.id)) qMap.set(row.id, { id: row.id, orderIndex: row.orderIndex, question: row.question, options: [] });
      if (row.optionId) qMap.get(row.id).options.push({ id: row.optionId, optionText: row.optionText, isCorrect: row.isCorrect });
    }
    const answers = await pool.query(
      `SELECT question_id AS "questionId", option_id AS "optionId" FROM quiz_attempt_answers WHERE attempt_id = $1`,
      [attempt.id]
    );
    const answerByQuestion = new Map(answers.rows.map((a) => [a.questionId, a.optionId]));

    const questionsWithAnswer = [...qMap.values()].map((q) => ({ ...q, chosenOptionId: answerByQuestion.get(q.id) || null }));

    res.json({
      success: true,
      attempt: {
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        awaySeconds: attempt.away_seconds,
        penaltyMarks: Number(attempt.penalty_marks),
        rawScore: attempt.raw_score,
        totalQuestions: attempt.total_questions,
        finalScore: Number(attempt.final_score),
        scorePercent: Number(attempt.score_percent),
      },
      questions: questionsWithAnswer,
    });
  } catch (error) {
    console.log("Error in GET /api/student/quizzes/:id/result:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = { router };