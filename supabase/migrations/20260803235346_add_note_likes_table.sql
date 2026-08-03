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
- No-auth app: allow anon + authenticated CRUD.
*/

CREATE TABLE IF NOT EXISTS note_likes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_id bigint NOT NULL,
  liked_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (note_id, liked_by)
);

ALTER TABLE note_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_note_likes" ON note_likes;
CREATE POLICY "anon_select_note_likes" ON note_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_note_likes" ON note_likes;
CREATE POLICY "anon_insert_note_likes" ON note_likes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_note_likes" ON note_likes;
CREATE POLICY "anon_delete_note_likes" ON note_likes FOR DELETE
  TO anon, authenticated USING (true);
