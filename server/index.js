import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper for weighted sampling without replacement
function weightedSample(candidates, count) {
  const selected = [];
  const poolList = [...candidates];
  for (let i = 0; i < count && poolList.length > 0; i++) {
    const totalWeight = poolList.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      const randIdx = Math.floor(Math.random() * poolList.length);
      selected.push(poolList[randIdx]);
      poolList.splice(randIdx, 1);
      continue;
    }
    let r = Math.random() * totalWeight;
    for (let j = 0; j < poolList.length; j++) {
      r -= poolList[j].weight;
      if (r <= 0) {
        selected.push(poolList[j]);
        poolList.splice(j, 1);
        break;
      }
    }
  }
  return selected;
}

// API: Get all quizzes (Smart weighted sampling or random)
app.get('/api/quizzes', async (req, res) => {
  const studentId = parseInt(req.query.student_id || req.query.studentId, 10) || 1;
  try {
    const query = `
      SELECT 
        zq.id, 
        zq.word, 
        zq.image, 
        zq.zhuyin, 
        zq.initial, 
        zq.medial, 
        zq.final, 
        zq.tone,
        COALESCE(sqw.attempt_count, 0) as attempt_count,
        COALESCE(sqw.correct_count, 0) as correct_count,
        COALESCE(sqw.weight, 8) as weight
      FROM "ZhuyinQuiz" zq
      LEFT JOIN "StudentQuizWeight" sqw 
        ON zq.id = sqw.quiz_id AND sqw.student_id = $1 AND sqw.subject = 'zhuyin'
    `;
    const result = await pool.query(query, [studentId]);
    
    if (result.rows.length === 0) {
      return res.json([]);
    }

    const hasHistory = result.rows.some(row => parseInt(row.attempt_count, 10) > 0);

    const quizzes = result.rows.map(row => {
      const attempts = parseInt(row.attempt_count, 10) || 0;
      const corrects = parseInt(row.correct_count, 10) || 0;
      const correctRate = attempts > 0 ? (corrects / attempts) : 0;
      const weight = parseInt(row.weight, 10) || 8;
      return {
        id: row.id,
        wordText: row.word,
        imageUrl: row.image ? `/images/${row.image}` : '',
        audioUrl: '',
        correctAnswer: {
          initial: row.initial || '',
          medial: row.medial || '',
          final: row.final || '',
          tone: row.tone || '1'
        },
        correctRate,
        weight
      };
    });

    if (!hasHistory) {
      const shuffled = quizzes.sort(() => Math.random() - 0.5).slice(0, 15);
      return res.json(shuffled);
    }

    // Sort quizzes by correctRate descending, then random
    const sortedQuizzes = quizzes.sort((a, b) => {
      if (b.correctRate !== a.correctRate) {
        return b.correctRate - a.correctRate;
      }
      return Math.random() - 0.5;
    });

    // Extract 60% (9 items) with high correct rates
    const highRateQuizzes = sortedQuizzes.slice(0, 9);
    
    // Remaining candidates for weighted sampling
    const remainingQuizzes = sortedQuizzes.slice(9);
    
    // Sample 40% (6 items) proportional to error weights
    const weightedQuizzes = weightedSample(remainingQuizzes, 6);

    // Combine and shuffle the final 15
    const selectedQuizzes = [...highRateQuizzes, ...weightedQuizzes].sort(() => Math.random() - 0.5);
    res.json(selectedQuizzes);

  } catch (error) {
    console.warn('Error fetching quizzes from ZhuyinQuiz database, falling back to seed JSON:', error);
    try {
      const fileData = fs.readFileSync(path.join(process.cwd(), 'quizzes_seed.json'), 'utf8');
      const seedQuizzes = JSON.parse(fileData);
      const shuffled = seedQuizzes.sort(() => Math.random() - 0.5).slice(0, 15);
      res.json(shuffled);
    } catch (fallbackError) {
      console.error('Database query failed and fallback seed JSON reading failed:', fallbackError);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// API: Insert a practice attempt log
app.post('/api/practice-logs', async (req, res) => {
  const { quizId, isCorrect, spentSeconds } = req.body;

  if (quizId === undefined || isCorrect === undefined || spentSeconds === undefined) {
    return res.status(400).json({ error: 'Missing required fields: quizId, isCorrect, spentSeconds' });
  }

  try {
    const query = `
      INSERT INTO "PracticeLog" ("quiz_id", "subject", "is_correct", "spent_seconds")
      VALUES ($1, $2, $3, $4)
      RETURNING "id";
    `;
    const values = [parseInt(quizId, 10), 'zhuyin', !!isCorrect, parseInt(spentSeconds, 10)];
    const result = await pool.query(query, values);
    
    // Update StudentQuizWeight
    const studentId = parseInt(req.body.studentId || req.body.student_id, 10) || 1;
    const correctInc = isCorrect ? 1 : 0;
    const initialWeight = isCorrect ? 1 : 8;
    
    const upsertQuery = `
      INSERT INTO "StudentQuizWeight" ("student_id", "quiz_id", "subject", "attempt_count", "correct_count", "weight")
      VALUES ($1, $2, 'zhuyin', 1, $3, $4)
      ON CONFLICT ("student_id", "quiz_id", "subject") DO UPDATE SET
        "attempt_count" = "StudentQuizWeight"."attempt_count" + 1,
        "correct_count" = "StudentQuizWeight"."correct_count" + $3,
        "weight" = CASE
          WHEN (CAST("StudentQuizWeight"."correct_count" + $3 AS FLOAT) / ("StudentQuizWeight"."attempt_count" + 1)) > 0.90 THEN 1
          WHEN (CAST("StudentQuizWeight"."correct_count" + $3 AS FLOAT) / ("StudentQuizWeight"."attempt_count" + 1)) >= 0.70 THEN 2
          WHEN (CAST("StudentQuizWeight"."correct_count" + $3 AS FLOAT) / ("StudentQuizWeight"."attempt_count" + 1)) >= 0.50 THEN 4
          ELSE 8
        END;
    `;
    const upsertValues = [studentId, parseInt(quizId, 10), correctInc, initialWeight];
    await pool.query(upsertQuery, upsertValues);

    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error inserting into PracticeLog / StudentQuizWeight:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Insert an error analysis details log
app.post('/api/error-analysis', async (req, res) => {
  const { logId, quizId, wrongAnswer, wrongPart } = req.body;

  try {
    let targetQuizId = quizId;
    
    if (!targetQuizId && logId) {
      const logResult = await pool.query('SELECT quiz_id FROM "PracticeLog" WHERE id = $1', [parseInt(logId, 10)]);
      if (logResult.rows.length > 0) {
        targetQuizId = logResult.rows[0].quiz_id;
      }
    }

    if (!targetQuizId) {
      return res.status(400).json({ error: 'Missing required fields: quizId or logId' });
    }

    let calculatedWrongPart = wrongPart;
    if (!calculatedWrongPart && wrongAnswer) {
      const quizResult = await pool.query('SELECT "initial", "medial", "final", "tone" FROM "ZhuyinQuiz" WHERE id = $1', [targetQuizId]);
      if (quizResult.rows.length > 0) {
        const correct = quizResult.rows[0];
        const parts = [];
        if (wrongAnswer.initial !== (correct.initial || '')) parts.push('initial');
        if (wrongAnswer.medial !== (correct.medial || '')) parts.push('medial');
        if (wrongAnswer.final !== (correct.final || '')) parts.push('final');
        if (wrongAnswer.tone !== (correct.tone || '1')) parts.push('tone');
        calculatedWrongPart = parts;
      }
    }

    const query = `
      INSERT INTO "ErrorAnalysis" ("quiz_id", "subject", "correct", "user_answer", "wrong_part")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING "id";
    `;
    const values = [
      parseInt(targetQuizId, 10),
      'zhuyin',
      'false',
      JSON.stringify(wrongAnswer || {}),
      JSON.stringify(calculatedWrongPart || [])
    ];
    
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error inserting into ErrorAnalysis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
