# Fallacy Forum 🎓

A debate-crossfire practice site for spotting logical fallacies in Public Forum debate. Built for middle/high school debaters who want sharper reasoning.

## What it does

- **Learn** — A library of 25 fallacies most common in PF crossfire, with definitions, debate examples, how to spot them, and how to push back.
- **Practice** — Pick one fallacy + a topic + difficulty. The AI generates fresh PF crossfire snippets that contain that fallacy. Repeat until you can spot it cold.
- **Test** — A 10-question mixed-fallacy challenge. Immediate feedback after each question. Ends with a weak-area summary pointing to which fallacies to review next.
- **History** — Tracks accuracy per fallacy across all sessions per profile. Surfaces what each debater most often gets wrong.

Multi-profile (e.g. one per daughter), works on web / iPhone / iPad, light & dark mode.

---

## Tech stack

| Layer    | Choice                                     |
| -------- | ------------------------------------------ |
| Frontend | Next.js 14 App Router · React · Tailwind   |
| AI       | OpenAI Chat Completions (`gpt-4o-mini`)    |
| Database | Supabase (Postgres)                        |
| Host     | Vercel                                     |
| Repo     | GitHub                                     |

---

## Setup — first time

### 1. Get the code onto your machine and into GitHub

This project ships as a zip — there's nothing to clone yet. The first time you set it up:

```bash
# 1. Unzip and enter the folder
unzip debate-fallacy-trainer.zip
cd debate-fallacy-trainer

# 2. Install dependencies
npm install

# 3. (Optional but recommended) Push to your own GitHub repo so Vercel can auto-deploy
#    First, create a new empty repo on github.com — do NOT initialize it with a README.
#    Then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/debate-fallacy-trainer.git
git push -u origin main
```

After that initial push, `git clone <your-repo-url>` is what you (or anyone else) would use to pull the project down to a *new* machine in the future.

### 2. Supabase

A Supabase project named **`fallacy-forum`** has already been created for you with the schema applied and RLS policies in place. You can find it at:

<https://supabase.com/dashboard/project/xmxmgyvjhbekrcezfpup>

Go to **Project Settings → API** and copy:

- **Project URL** → `SUPABASE_URL`
- **`anon` key** (publishable) → `SUPABASE_ANON_KEY`

> The schema uses permissive RLS policies that allow anonymous read/write, so the anon key is the right choice and is safe to expose. If you'd rather bypass RLS, copy the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY` instead — the code prefers it when both are set.

If you ever need to start fresh (or set up a separate project), the schema lives in `supabase/schema.sql` — paste it into the Supabase SQL Editor and run it once.

### 3. Set up OpenAI

Get an API key at <https://platform.openai.com/api-keys>. Each question costs roughly **$0.0002** with `gpt-4o-mini` — practically free even for heavy use.

### 4. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

### 5. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Deploy to Vercel

### Option A — via the Vercel dashboard

1. Push this repo to GitHub.
2. At <https://vercel.com/new>, import the GitHub repo.
3. Under **Environment Variables**, add:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL` — must be the **Project URL** from Supabase → Settings → API (`https://YOUR-REF.supabase.co`). **Do not** paste the `supabase.com/dashboard/...` link from your browser; that breaks the profile picker with a wall of HTML.
   - `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
   - `SITE_PASSWORD` — optional family password; when set, the whole site (including `/api/*`) requires login at `/login` first. Add `SITE_AUTH_SECRET` (a long random string) in production so the cookie is not signed with the password itself.
   
   For the bundled `fallacy-forum` project, the Project URL is:
   `https://xmxmgyvjhbekrcezfpup.supabase.co`
4. Click **Deploy**. Vercel auto-detects Next.js — no other config needed.
5. After changing env vars, **redeploy** (Deployments → ⋯ → Redeploy) so production picks them up.

### Option B — via the CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel deploy --prod
```

After the first deploy, every `git push` to the main branch auto-deploys.

---

## Project structure

```
app/
  api/               # server routes (run on Vercel as serverless functions)
    generate/        # POST → calls OpenAI, returns a crossfire snippet + MCQ
    profiles/        # CRUD for daughter profiles
    sessions/        # practice + test sessions
    attempts/        # per-question answers
    stats/[id]       # accuracy per fallacy
  learn/             # Information section (fallacy library)
  practice/          # Practice mode
  test/              # Test mode (10-question)
  history/           # Per-profile history & weak areas
  profile/           # Active profile & switch
  layout.tsx
  page.tsx           # Home + profile picker
  globals.css        # Design tokens, light/dark mode, base styles

components/
  Nav.tsx
  ThemeToggle.tsx
  ProfileContext.tsx
  QuestionCard.tsx   # Shared between Practice & Test

lib/
  fallacies.json     # 25 PF-debate fallacies (source data)
  fallacies.ts       # Helpers + MCQ option builder (smart distractors)
  openai.ts          # OpenAI client init
  supabase.ts        # Supabase client init

supabase/
  schema.sql         # Run this once in the Supabase SQL Editor
```

---

## How it works

### Generation prompt

For each question, the server:

1. Picks a target fallacy (user-chosen in Practice, random+exclusion in Test).
2. Sends a system prompt to OpenAI describing PF crossfire format and a difficulty calibration (Easy = obvious, Medium = subtle, Hard = woven into reasonable-sounding argumentation).
3. Asks for JSON with `argument_text` (the crossfire snippet) and `explanation` (post-answer teaching note that quotes the fallacious phrase and how to push back).
4. Builds 4 multiple-choice options: the correct fallacy + 3 distractors drawn from `common_confusions` in `fallacies.json` (with same-category fallback) so the wrong answers are pedagogically plausible — not random.

### Why the distractors are smart

Each fallacy in `fallacies.json` lists `common_confusions` — other fallacies students typically mix it up with. The MCQ builder pulls distractors from that list first, so a wrong answer teaches something instead of being trivially eliminable.

### Data model

- **profiles** — `{ id, name, avatar_emoji }`. No auth; profile selection is stored in the browser.
- **sessions** — One per practice / test run, with mode + topic + difficulty + totals.
- **attempts** — One per question, with the AI-generated snippet, options, what the user picked, and whether they got it right.
- **profile_fallacy_stats** — A SQL view: accuracy per fallacy per profile.

The History page reads from sessions + the stats view to surface weak areas.

---

## Customization

- **Change the fallacy list:** edit `lib/fallacies.json`. The file ships with 25 research-vetted fallacies but you can add more or rewrite the kid-friendly explanations as you like.
- **Change the OpenAI model:** set `OPENAI_MODEL` in env. `gpt-4o` produces more nuanced subtle examples at higher cost; `gpt-4o-mini` is plenty good for practice.
- **Change the visual style:** all design tokens (colors, fonts, radii, shadows) live in `app/globals.css`. Light + dark mode toggle in the header.

---

## Site password (optional)

Set `SITE_PASSWORD` in `.env.local` or Vercel to require a shared family password before using the app. Middleware checks an **httpOnly cookie** (not the password in the browser). Use **Sign out** in the header to clear it. Leave `SITE_PASSWORD` unset during local dev if you want open access.

## Notes & limits

- **Debater profiles** are not login accounts — they remain per-browser picks under the site gate. For per-user accounts and private data, add Supabase Auth + RLS later.
- **Profiles are stored on the server**, so they sync across devices. Profile selection (which profile you're using right now) is stored in the browser.
- **Costs:** ~$0.0002 per generated question with `gpt-4o-mini`. A 10-question test ≈ 0.2¢.
- **iPhone/iPad ready** — fully responsive. Add to Home Screen for an app-like experience.

Have fun, and happy crossfiring.
