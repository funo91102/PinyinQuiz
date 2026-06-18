-- DDL for PinyinQuiz table
-- Enforcing camelCase names with double quotes for PostgreSQL compatibility

CREATE TABLE IF NOT EXISTS "PinyinQuiz" (
    "id" SERIAL PRIMARY KEY,
    "wordText" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(2048),
    "audioUrl" VARCHAR(2048),
    "correctAnswer" JSONB NOT NULL
);

-- Add comment to correctAnswer to explain its JSON structure
COMMENT ON COLUMN "PinyinQuiz"."correctAnswer" IS '存放拆解後的注音結構。格式範例: {"initial": "ㄇ", "final": "ㄠ", "tone": "1"}';

-- Create PracticeLogs table
CREATE TABLE IF NOT EXISTS "PracticeLogs" (
    "id" SERIAL PRIMARY KEY,
    "quizId" INT NOT NULL REFERENCES "PinyinQuiz"("id") ON DELETE CASCADE,
    "isCorrect" BOOLEAN NOT NULL,
    "spentSeconds" INT NOT NULL,
    "practicedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ErrorAnalysis table
CREATE TABLE IF NOT EXISTS "ErrorAnalysis" (
    "id" SERIAL PRIMARY KEY,
    "logId" INT NOT NULL REFERENCES "PracticeLogs"("id") ON DELETE CASCADE,
    "wrongAnswer" JSONB NOT NULL
);

-- Add comment to wrongAnswer to explain its JSON structure
COMMENT ON COLUMN "ErrorAnalysis"."wrongAnswer" IS '存放具體寫錯的注音結構。格式範例: {"initial": "ㄋ", "final": "ㄠ", "tone": "1"}';
