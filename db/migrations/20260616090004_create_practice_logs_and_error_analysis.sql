-- Migration: Create PracticeLogs and ErrorAnalysis Tables
-- Created at: 2026-06-16 09:00:04

-- +migrate Up
CREATE TABLE IF NOT EXISTS "PracticeLogs" (
    "id" SERIAL PRIMARY KEY,
    "quizId" INT NOT NULL REFERENCES "PinyinQuiz"("id") ON DELETE CASCADE,
    "isCorrect" BOOLEAN NOT NULL,
    "spentSeconds" INT NOT NULL,
    "practicedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ErrorAnalysis" (
    "id" SERIAL PRIMARY KEY,
    "logId" INT NOT NULL REFERENCES "PracticeLogs"("id") ON DELETE CASCADE,
    "wrongAnswer" JSONB NOT NULL
);

COMMENT ON COLUMN "ErrorAnalysis"."wrongAnswer" IS '存放具體寫錯的注音結構。格式範例: {"initial": "ㄋ", "final": "ㄠ", "tone": "1"}';

-- +migrate Down
DROP TABLE IF EXISTS "ErrorAnalysis";
DROP TABLE IF EXISTS "PracticeLogs";
