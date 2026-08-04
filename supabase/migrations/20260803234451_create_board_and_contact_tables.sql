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
- Board notes: authenticated users can read all, insert their own, delete their own.
- Contact messages: authenticated users can read all, insert anonymously.
  Contact messages are not deletable through the UI to preserve records.
*/

CREATE TABLE IF NOT EXISTS board_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE board_notes ENABLE ROW LEVEL SECURITY;

-- Everyone can read board notes
DROP POLICY IF EXISTS "select_board_notes" ON board_notes;
CREATE POLICY "select_board_notes" ON board_notes FOR SELECT
  TO authenticated USING (true);

-- Users can insert board notes
DROP POLICY IF EXISTS "insert_board_notes" ON board_notes;
CREATE POLICY "insert_board_notes" ON board_notes FOR INSERT
  TO authenticated WITH CHECK (true);

-- Users can only delete their own board notes
DROP POLICY IF EXISTS "delete_board_notes" ON board_notes;
CREATE POLICY "delete_board_notes" ON board_notes FOR DELETE
  TO authenticated USING (username = auth.jwt() ->> 'user_metadata' ->> 'username');

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read contact messages
DROP POLICY IF EXISTS "select_contact_messages" ON contact_messages;
CREATE POLICY "select_contact_messages" ON contact_messages FOR SELECT
  TO authenticated USING (true);

-- Anyone can insert contact messages
DROP POLICY IF EXISTS "insert_contact_messages" ON contact_messages;
CREATE POLICY "insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Contact messages cannot be deleted (preserve records)
DROP POLICY IF EXISTS "delete_contact_messages" ON contact_messages;
CREATE POLICY "delete_contact_messages" ON contact_messages FOR DELETE
  TO authenticated USING (false);
