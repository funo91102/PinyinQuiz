import fs from 'fs';
import path from 'path';

// Vanilla .env file loader to run before dynamically importing db connection
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("DATABASE_URL is not configured in .env file.");
    console.warn("Skipping database initialization.");
    return;
  }

  console.log("Connecting to PostgreSQL database...");
  
  let pool;
  try {
    const dbModule = await import('./db.js');
    pool = dbModule.default;
  } catch (importError) {
    console.error("Failed to import database connection module.", importError);
    return;
  }

  const client = await pool.connect();
  try {
    console.log("Starting database initialization transaction...");
    await client.query("BEGIN");

    // 1. Create StudentProfile Table
    console.log('Creating "StudentProfile" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "StudentProfile" (
        "student_id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "age" INT,
        "level_zh" VARCHAR(50),
        "level_en" VARCHAR(50)
      );
    `);

    // 1b. Insert Default Student Profile
    console.log('Inserting default student profile if not exists...');
    await client.query(`
      INSERT INTO "StudentProfile" ("student_id", "name", "age", "level_zh", "level_en")
      VALUES (1, '小寶貝', 5, 'Beginner', 'Beginner')
      ON CONFLICT ("student_id") DO NOTHING;
    `);

    // 2. Create PracticeSession Table
    console.log('Creating "PracticeSession" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PracticeSession" (
        "session_id" SERIAL PRIMARY KEY,
        "student_id" INT REFERENCES "StudentProfile"("student_id") ON DELETE CASCADE,
        "subject" VARCHAR(100) NOT NULL,
        "start_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "end_time" TIMESTAMP,
        "total_questions" INT DEFAULT 0,
        "correct_count" INT DEFAULT 0
      );
    `);

    // 3. Create PracticeLog Table
    console.log('Creating "PracticeLog" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PracticeLog" (
        "id" SERIAL PRIMARY KEY,
        "session_id" INT REFERENCES "PracticeSession"("session_id") ON DELETE CASCADE,
        "quiz_id" INT NOT NULL,
        "subject" VARCHAR(100) NOT NULL,
        "is_correct" BOOLEAN NOT NULL,
        "spent_seconds" INT
      );
    `);

    // 4. Create ErrorAnalysis Table
    console.log('Creating "ErrorAnalysis" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ErrorAnalysis" (
        "id" SERIAL PRIMARY KEY,
        "session_id" INT REFERENCES "PracticeSession"("session_id") ON DELETE CASCADE,
        "quiz_id" INT NOT NULL,
        "subject" VARCHAR(100) NOT NULL,
        "correct" BOOLEAN NOT NULL,
        "user_answer" JSONB NOT NULL,
        "wrong_part" JSONB,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create ZhuyinQuiz Table
    console.log('Creating "ZhuyinQuiz" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ZhuyinQuiz" (
        "id" SERIAL PRIMARY KEY,
        "word" VARCHAR(255) NOT NULL,
        "image" VARCHAR(2048),
        "zhuyin" VARCHAR(255),
        "initial" VARCHAR(50),
        "medial" VARCHAR(50),
        "final" VARCHAR(50),
        "tone" VARCHAR(50),
        "difficulty" INT DEFAULT 1,
        "category" VARCHAR(255),
        "tags" VARCHAR(255)[]
      );
    `);

    // 6. Create EnglishQuiz Table
    console.log('Creating "EnglishQuiz" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "EnglishQuiz" (
        "id" SERIAL PRIMARY KEY,
        "wordText" VARCHAR(255) NOT NULL,
        "imageUrl" VARCHAR(2048),
        "audioUrl" VARCHAR(2048),
        "correctAnswer" JSONB NOT NULL
      );
    `);

    // 7. Create StudentQuizWeight Table if not exists
    console.log('Creating "StudentQuizWeight" table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "StudentQuizWeight" (
        "student_id" INT NOT NULL REFERENCES "StudentProfile"("student_id") ON DELETE CASCADE,
        "quiz_id" INT NOT NULL REFERENCES "ZhuyinQuiz"("id") ON DELETE CASCADE,
        "attempt_count" INT DEFAULT 0,
        "correct_count" INT DEFAULT 0,
        "weight" INT DEFAULT 8,
        PRIMARY KEY ("student_id", "quiz_id")
      );
    `);

    await client.query("COMMIT");
    console.log("Database initialization finished successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database initialization failed and transaction was rolled back.", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
