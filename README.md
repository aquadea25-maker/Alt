# Alt

**Alt** is a private, romantic couples' web application designed to capture moments, messages, and memories in one secure, cozy space. It features a Freedom Board, Photo Gallery, Love Notes, a real-time Chat, a Monthsarry Countdown, and a Contact page.

Built with **Vite**, **vanilla JavaScript**, and **Supabase** (Postgres + Storage + Realtime), the project uses a modular architecture for easy maintenance and extension.

---

## Features

| Feature | Description |
|---------|-------------|
| **Freedom Board** | Leave sweet messages for each other and react with hearts on your favorite notes. |
| **Photo Gallery** | Upload and share your favorite photos together. Includes a lightbox for enlarged viewing. |
| **Love Notes** | Write free-form letters and notes. Your words stay here forever for both of you. |
| **Real-time Chat** | Talk to each other in real time. Messages appear instantly using Supabase Realtime. |
| **Countdown Timer** | Track how long you've been together and count down to your next monthsarry. |
| **Contact Page** | Send a little message to each other or leave a note in the shared inbox. |

---

## Prerequisites

Before running this project, you will need:

- **Node.js** (v18 or later recommended)
- **A Supabase project** with Postgres and Storage enabled

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/aquadea25-maker/Alt.git
cd Alt
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your Supabase project details:

```bash
cp .env.example .env
```

Open `.env` and update the values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

Apply the SQL migrations in `supabase/migrations/` to your Supabase project. You can do this via the Supabase Dashboard (SQL Editor) or the Supabase CLI.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Database Schema

The application uses the following tables in Supabase:

| Table | Description |
|-------|-------------|
| `board_notes` | Notes posted on the Freedom Board. |
| `note_likes` | Heart reactions on board notes. |
| `love_notes` | Free-form love letters and notes. |
| `chat_messages` | Real-time chat messages between partners. |
| `gallery_uploads` | Metadata for photos uploaded to the gallery. |
| `contact_messages` | Messages sent through the contact form. |

All tables have Row-Level Security (RLS) enabled to ensure data privacy and integrity.

---

## Project Structure

```
Alt/
├── src/
│   ├── lib/
│   │   ├── auth.js         # Authentication and session management
│   │   ├── nav.js          # Shared navigation and footer components
│   │   ├── supabase.js     # Supabase client initialization
│   │   └── utils.js        # Shared utility functions
│   ├── features/
│   │   ├── board.js        # Freedom Board logic
│   │   ├── chat.js         # Real-time Chat logic
│   │   ├── contact.js      # Contact form logic
│   │   ├── countdown.js    # Countdown timer logic
│   │   ├── gallery.js      # Photo gallery logic
│   │   └── notes.js        # Love notes logic
│   └── app.js              # Main entry point
├── supabase/
│   └── migrations/         # Database schema and RLS policies
├── .env.example
├── package.json
├── style.css
└── vite.config.js
```

---

## Building for Production

To create a production-ready build, run:

```bash
npm run build
```

The built files will be placed in the `dist/` directory.

---

## License

This project is private and intended for personal use.
