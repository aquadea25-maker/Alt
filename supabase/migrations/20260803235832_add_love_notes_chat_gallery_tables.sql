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
- No-auth app pattern: allow anon + authenticated CRUD on all tables.
- RLS enabled on all tables.
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
DROP POLICY IF EXISTS "anon_select_love_notes" ON love_notes;
CREATE POLICY "anon_select_love_notes" ON love_notes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_love_notes" ON love_notes;
CREATE POLICY "anon_insert_love_notes" ON love_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_love_notes" ON love_notes;
CREATE POLICY "anon_delete_love_notes" ON love_notes FOR DELETE
  TO anon, authenticated USING (true);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender text NOT NULL,
  display_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages FOR DELETE
  TO anon, authenticated USING (true);

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
DROP POLICY IF EXISTS "anon_select_gallery_uploads" ON gallery_uploads;
CREATE POLICY "anon_select_gallery_uploads" ON gallery_uploads FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_gallery_uploads" ON gallery_uploads;
CREATE POLICY "anon_insert_gallery_uploads" ON gallery_uploads FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_gallery_uploads" ON gallery_uploads;
CREATE POLICY "anon_delete_gallery_uploads" ON gallery_uploads FOR DELETE
  TO anon, authenticated USING (true);
