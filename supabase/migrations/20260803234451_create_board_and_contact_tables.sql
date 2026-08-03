/*
# Create Freedom Board notes and Contact messages tables

1. New Tables
- `board_notes`: stores notes posted on the Freedom Board.
  - `id` (bigint, primary key, identity)
  - `username` (text, not null) - the poster's username
  - `display_name` (text, not null) - the poster's display name
  - `text` (text, not null) - the note content
  - `created_at` (timestamptz, default now)
- `contact_messages`: stores secret love letters from the Contact form.
  - `id` (bigint, primary key, identity)
  - `name` (text, not null) - sender name
  - `text` (text, not null) - message content
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- This is a no-auth app (login is a hardcoded local check, not Supabase auth),
  so all data is intentionally shared. Policies allow anon + authenticated CRUD.
*/

CREATE TABLE IF NOT EXISTS board_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE board_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_board_notes" ON board_notes;
CREATE POLICY "anon_select_board_notes" ON board_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_board_notes" ON board_notes;
CREATE POLICY "anon_insert_board_notes" ON board_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_board_notes" ON board_notes;
CREATE POLICY "anon_delete_board_notes" ON board_notes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS contact_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_contact_messages" ON contact_messages;
CREATE POLICY "anon_select_contact_messages" ON contact_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_contact_messages" ON contact_messages;
CREATE POLICY "anon_delete_contact_messages" ON contact_messages FOR DELETE
  TO anon, authenticated USING (true);
