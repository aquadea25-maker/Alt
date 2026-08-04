/*
# Add love_notes, chat_messages, and gallery_uploads tables

1. New Tables
- `love_notes`: free-form love letters/notes written by either partner.
  - id, author (username), display_name, title, body, created_at
- `chat_messages`: real-time chat between the two partners.
  - id, sender (username), display_name, body, created_at
- `gallery_uploads`: metadata for photos uploaded to the gallery.
  - id, uploaded_by (username), display_name, image_url, caption, created_at

2. Security
- Enable RLS on all tables.
- love_notes: authenticated users can read all, insert their own, delete their own.
- chat_messages: authenticated users can read all, insert messages.
  Deletion is restricted to prevent accidental loss.
- gallery_uploads: authenticated users can read all, insert their own, delete their own.
*/

-- Love Notes
CREATE TABLE IF NOT EXISTS love_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author text NOT NULL,
  display_name text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE love_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_love_notes" ON love_notes;
CREATE POLICY "select_love_notes" ON love_notes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_love_notes" ON love_notes;
CREATE POLICY "insert_love_notes" ON love_notes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_love_notes" ON love_notes;
CREATE POLICY "delete_love_notes" ON love_notes FOR DELETE
  TO authenticated USING (author = auth.jwt() ->> 'user_metadata' ->> 'username');

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender text NOT NULL,
  display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (true);

-- Chat messages are not deletable to preserve conversation history
DROP POLICY IF EXISTS "delete_chat_messages" ON chat_messages;
CREATE POLICY "delete_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (false);

-- Gallery Uploads
CREATE TABLE IF NOT EXISTS gallery_uploads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uploaded_by text NOT NULL,
  display_name text NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_gallery_uploads" ON gallery_uploads;
CREATE POLICY "select_gallery_uploads" ON gallery_uploads FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_gallery_uploads" ON gallery_uploads;
CREATE POLICY "insert_gallery_uploads" ON gallery_uploads FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "delete_gallery_uploads" ON gallery_uploads;
CREATE POLICY "delete_gallery_uploads" ON gallery_uploads FOR DELETE
  TO authenticated USING (uploaded_by = auth.jwt() ->> 'user_metadata' ->> 'username');
