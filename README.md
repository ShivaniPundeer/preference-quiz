# 💗 Little Things About You — Private Preference Quiz

A mobile-friendly 20-question picture MCQ quiz with a private Supabase database and a separate admin dashboard.

## What it does

### Participant
- Enters only their name.
- Answers 20 picture-based MCQs.
- Submits once.
- Cannot read the response database.

### Admin
- Separate `admin.html` portal.
- Email + password login through Supabase Auth.
- Only accounts added to `admin_users` can read responses.
- Search participants and open their full answers.

## Setup

### 1. Create a Supabase project
Create a project at https://supabase.com/

### 2. Create the database
Open **SQL Editor**, paste everything from `supabase.sql`, and run it.

### 3. Create your admin account
In Supabase:
**Authentication → Users → Add user**

Create the email/password you will use for your private admin dashboard.

Copy that user's UUID, then run:

```sql
insert into public.admin_users (user_id)
values ('YOUR-UUID-HERE');
```

### 4. Add Supabase keys
Open `config.js` and replace:

```js
SUPABASE_URL: "PASTE_YOUR_SUPABASE_URL_HERE",
SUPABASE_ANON_KEY: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
```

Use the **Project URL** and **anon/publishable key** from Supabase Project Settings → API.

**Never put the `service_role`/secret key in browser code.**

### 5. Open/deploy
For a quick test, open `index.html` through a local/static server.

For online use, upload the project to GitHub and enable GitHub Pages, or use another static host. `admin.html` is your private admin URL.

## Changing questions/images

Edit `questions.js`.

Each option looks like:

```js
{ text: "Samosa", image: "assets/samosa.svg" }
```

Replace the image path with your own JPG/PNG/WebP if you want real food photos.

## Security note

The participant form intentionally has no read permission. A name-only entry is convenient but is not identity verification: someone who knows another participant's name could submit under that name. If you later need stronger participant authentication, add a one-time code or magic-link login.

The important privacy boundary here is enforced by Supabase Row Level Security, not by hiding buttons in JavaScript.
