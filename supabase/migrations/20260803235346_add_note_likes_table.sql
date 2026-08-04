/*
# Add note_likes table for heart reactions on Freedom Board notes

1. New Tables
- `note_likes`: stores heart reactions on board notes.
  - `id` (bigint, primary key, identity)
  - `note_id` (bigint, not null) - references board_notes.id
  - `liked_by` (text, not null) - the username who liked the note
  - `created_at` (timestamptz, default now)
  - Unique constraint on (note_id, liked_by) so each user can like a note only once.

2. Security
- Enable RLS on note_likes.
- Authenticated users can read all likes.
- Authenticated users can insert likes and delete their own likes.
*/

CREATE TABLE IF NOT EXISTS note_likes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id bigint NOT NULL,
  liked_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (note_id, liked_by)
);

ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;

-- Everyone can read likes
DROP POLICY IF EXISTS "select_note_likes" ON note_likes;
CREATE POLICY "select_note_likes" ON note_likes FOR SELECT
  TO authenticated USING (true);

-- Authenticated users can insert likes
DROP POLICY IF EXISTS "insert_note_likes" ON note_likes;
CREATE POLICY "insert_note_likes" ON note_likes FOR INSERT
  TO authenticated WITH CHECK (true);

-- Users can only delete their own likes
DROP POLICY IF EXISTS "delete_note_likes" ON note_likes;
CREATE POLICY "delete_note_likes" ON note_likes FOR DELETE
  TO authenticated USING (liked_by = auth.jwt() ->> 'user_metadata' ->> 'username');
