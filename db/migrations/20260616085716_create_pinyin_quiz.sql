-- Migration: Create PinyinQuiz Table
-- Created at: 2026-06-16 08:57:16

-- +migrate Up
CREATE TABLE IF NOT EXISTS "PinyinQuiz" (
    "id" SERIAL PRIMARY KEY,
    "wordText" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(2048),
    "audioUrl" VARCHAR(2048),
    "correctAnswer" JSONB NOT NULL
);

COMMENT ON COLUMN "PinyinQuiz"."correctAnswer" IS '存放拆解後的注音結構。格式範例: {"initial": "ㄇ", "final": "ㄠ", "tone": "1"}';

-- +migrate Down
DROP TABLE IF EXISTS "PinyinQuiz";
