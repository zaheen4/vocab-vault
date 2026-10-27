# VocabVault REST API Contract

**Base URL:** `/api`  
**Auth:** JWT in `Authorization: Bearer <token>` header (all non-public endpoints).
Tokens are HS256, expire after **1 day** (`expiresIn: 1d`), and carry
`iss: vocabvault` / `aud: vocabvault-web`.  
**Error format:** `{ "message": "..." }`. Unexpected failures return generic
`500 { "message": "Server error" }` / `503 { "message": "Service temporarily unavailable" }`
— Mongo internals are never exposed.  
**Content-Type:** `application/json`  
**Security:** auth responses carry the user profile only — `passwordHash` is never returned.
**Rate limits:** `/api` 1000 req/15 min per IP; `/api/auth/*` 30 req/15 min;
`POST /api/progress/review` 200 req/15 min. Exceeding a limit returns 429.

---

## Authentication

### `POST /api/auth/register` — Create new user
**Request:**
```json
{ "name": "string (1–100 chars)", "email": "string (valid, max 254)", "password": "string (6–128 chars)" }
```
Email is trimmed + lowercased before lookup/creation.
**Response 201:**
```json
{ "token": "jwt-string", "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
Note: the user object is a superset of the shape above (XP/streak/goal fields
are also returned) — clients must not assume an exact shape.
**Errors:** 400 (validation), 409 (unable to create account — generic, no enumeration), 429 (rate limit), 500

---

### `POST /api/auth/login` — User login
**Request:**
```json
{ "email": "string", "password": "string", "rememberMe": false }
```
`rememberMe` is optional (boolean). When true, the issued JWT expires after 30 days (`expiresIn: 30d`) instead of 1 day.  
**Response 200:**
```json
{ "token": "jwt-string", "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
**Errors:** 401 (invalid credentials), 423 (account temporarily locked due to 5 consecutive failed attempts), 429 (rate limit), 500

---

### `POST /api/auth/forgot-password` — Request password reset link
**Request:**
```json
{ "email": "string" }
```
**Response 200:**
```json
{
  "message": "If that email is registered, password reset instructions have been sent.",
  "devResetUrl": "http://localhost:5173/reset-password?token=..."
}
```
Uniform message prevents account enumeration. In development environments (`NODE_ENV !== 'production'`), `devResetUrl` is included for direct evaluation.  
**Errors:** 400 (validation), 429, 500

---

### `POST /api/auth/reset-password` — Reset password using token
**Request:**
```json
{ "token": "string (hex)", "password": "string (6–128 chars)" }
```
Validates the SHA-256 hash of the 15-minute token, hashes the new password with bcrypt 12, and increments `tokenVersion` to invalidate any pre-existing sessions.  
**Response 200:**
```json
{ "ok": true, "message": "Password reset successful. Please log in with your new password." }
```
**Errors:** 400 (invalid or expired token, invalid password), 429, 500

---

### `PATCH /api/auth/profile` — Update display name
**Auth:** required  
**Request:**
```json
{ "name": "string (1–100 chars)" }
```
**Response 200:**
```json
{ "user": { "_id": "...", "name": "...", "email": "...", ... } }
```
**Errors:** 400 (validation), 401, 500

---

### `PATCH /api/auth/password` — Change password
**Auth:** required  
**Request:**
```json
{ "currentPassword": "string", "newPassword": "string (6–128 chars)" }
```
Verifies `currentPassword`, hashes `newPassword` with bcrypt 12, increments `tokenVersion` (invalidating other active sessions), and returns a fresh JWT token for the current session.  
**Response 200:**
```json
{ "ok": true, "token": "new-jwt-string", "user": { ... } }
```
**Errors:** 400 (validation), 401 (incorrect current password), 500

---

### `POST /api/auth/revoke-all` — Log out all other sessions
**Auth:** required  
Increments `tokenVersion` in the user document, immediately rejecting all other active JWT tokens with 401 on their next request.  
**Response 200:**
```json
{ "ok": true, "message": "All other sessions have been revoked" }
```
**Errors:** 401, 500

---

### `POST /api/auth/reset-progress` — Reset learning progress
**Auth:** required  
**Request:**
```json
{ "password": "string" }
```
Verifies account password, permanently deletes all user `Progress` and `QuizSession` records, and resets XP, level, streak, and badges to default values while retaining the user account and custom lists.  
**Response 200:**
```json
{ "ok": true, "user": { ... } }
```
**Errors:** 400 (missing password), 401 (incorrect password), 500

---

### `DELETE /api/auth/account` — Permanently delete account
**Auth:** required  
**Request:**
```json
{ "password": "string" }
```
Verifies account password, cascades deletion across all user data (`Progress`, `QuizSession`, `Bookmark`, `CustomList`, `User`).  
**Response 200:**
```json
{ "ok": true, "message": "Account permanently deleted" }
```
**Errors:** 400 (missing password), 401 (incorrect password), 500

---

### `GET /api/auth/me` — Get current user
**Auth:** required  
**Response 200:**
```json
{ "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
Same superset note as register — extra profile fields may be present.
**Errors:** 401 (unauthorized), 500

---

### `POST /api/auth/logout` — End session (acknowledgement)
**Auth:** required  
Logout is client-driven (discard token + clear cache); this endpoint records
the intent server-side and is the hook for future token revocation.
**Response 200:**
```json
{ "ok": true }
```
**Errors:** 401 (unauthorized), 500

---

## Words (Vocabulary)

### `GET /api/words` — List words with filtering & pagination
**Auth:** required  
**Query params:**
- `q` (string, optional) — case-insensitive **substring** search on `word`
  (regex meta-characters matched literally, capped at 100 chars)
- `difficulty` (enum: `basic` | `intermediate` | `advanced`, optional — anything else is 400)
- `page` (number, default 1, clamped 1–10000)
- `limit` (number, default 20, clamped 1–100)

**Response 200:**
```json
{
  "words": [
    {
      "_id": "...",
      "word": "string",
      "definition": "string",
      "example": "string | null",
      "partOfSpeech": "string | null",
      "synonyms": ["string"],
      "banglaMeaning": "string | null",
      "difficulty": "basic | intermediate | advanced",
      "group": "number | null",
      "part": "number (1-3) | null",
      "source": "gregmat | null",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 42,
  "page": 1
}
```
**Errors:** 400 (non-string `q`, invalid `difficulty`), 500

---

### `GET /api/words/:id` — Get single word
**Auth:** required  
**Params:** `id` (ObjectId)  
**Response 200:**
```json
{ "word": { ... } }
```
**Errors:** 400 (invalid id), 404 (not found), 500

---

### `POST /api/words` — Add your own word
**Auth:** required  
**Request:**
```json
{ "word": "string", "definition": "string", "example": "string | null", "partOfSpeech": "string | null", "difficulty": "basic | intermediate | advanced" }
```
`word` and `definition` are required (trimmed, non-empty; word max 100 chars,
definition/example max 2000, partOfSpeech max 50); `difficulty` defaults to `basic`.  
**Response 201:**
```json
{ "word": { ... }, "deckId": "my-words-deck-ObjectId" }
```
The word is created with `source: "custom"` and added to the caller's
personal "My Words" deck (auto-created), so it is immediately practicable in
practice/quiz/typing.  
**Duplicate:** `word` is globally unique (case-insensitive) — re-adding an
existing word returns **409** `{ "message": "...", "existingWordId": "..." }`
so the client can link the existing entry instead.
**Errors:** 400 (validation), 409 (duplicate), 500

---

## Decks

### `GET /api/decks` — List decks
**Auth:** required  
**Response 200:**
```json
{
  "decks": [
    {
      "_id": "...",
      "title": "string",
      "description": "string | null",
      "difficulty": "basic | intermediate | advanced",
      "wordIds": ["wordObjectId"],
      "wordCount": 42,
      "progress": { "new": 30, "learning": 10, "mastered": 2 },
      "dueCount": 12,
      "parts": [
        {
          "part": 1,
          "wordCount": 10,
          "progress": { "new": 10, "learning": 0, "mastered": 0 },
          "dueCount": 10
        }
      ],
      "group": "number | null",
      "part": "number (1-3) | null",
      "source": "gregmat | null",
      "createdBy": "userObjectId",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```
**Note:** `wordCount` is derived from `wordIds.length` and must be present in every deck object.
`progress` counts the caller's SRS states across the deck's words (unreviewed words
count as `new`), joined in one query — no per-deck fan-out. `dueCount` is the
practicable subset right now (unseen plus due), mirroring the practice-pool
selection order exactly.
Decks are returned sorted by `group` ascending; decks without a group come last.
**Scoping:** only shared decks (`createdBy` absent) and the caller's own
personal decks are returned — never another user's.

**Errors:** 500

---

### `GET /api/decks/:id` — Get single deck
**Auth:** required, owner-scoped (shared decks + caller's own; anyone else's id reads as 404)  
**Params:** `id` (ObjectId)  
**Response 200:**
```json
{ "deck": { ... } }
```
**Errors:** 400 (invalid id), 404 (not found), 500

---

### `GET /api/decks/:id/practice?limit=10&part=1` — Get a practice session for a deck
**Auth:** required, owner-scoped (shared + own; other users' ids read as 404)  
**Params:** `id` (ObjectId)  
**Query:**
- `limit` (number, default 10, max 50)
- `part` (optional number 1-3; scopes to that part's words)  
**Selection order:** words never seen by this user first (deck order), then seen
words whose SRS due date (`reviewDueAfter`) has passed — oldest due first.
Seen-but-not-yet-due words are excluded.  
**Response 200:**
```json
{ "words": [ { ...word }, { ...word } ] }
```
**Errors:** 400 (invalid id), 404 (deck not found), 500

---

### `GET /api/decks/all/quiz?limit=50&scope=viewed` — Get words for all-deck quiz
**Auth:** required  
**Query:**
- `limit` (number, default 50, max 100)
- `scope` (enum: `viewed` | `all`, default `viewed`)

When `scope=viewed`, returns words this user has already viewed across all decks,
most-recently-reviewed first (supplemented from catalog if fewer than 4 viewed).
When `scope=all`, returns a random sample across all 1,110 GregMat words.  
**Response 200:**
```json
{ "deck": { "_id": "all", "title": "All Decks" }, "words": [ { ...word } ], "totalViewed": 48 }
```
**Errors:** 500

---

### `GET /api/decks/:id/quiz?limit=50&part=1` — Get viewed words for a quiz
**Auth:** required, owner-scoped (shared + own; other users' ids read as 404)  
**Params:** `id` (ObjectId)  
**Query:**
- `limit` (number, default 50, max 100)
- `part` (optional number 1-3; scopes to viewed words in that part)  
Only words this user has already viewed (has a Progress record for) are
returned, most-recently-reviewed first. Unviewed words are excluded so
quizzes test recall, not first exposure. Empty array when nothing viewed yet.  
**Response 200:**
```json
{ "deck": { "_id": "...", "title": "..." }, "words": [ { ...word } ] }
```
**Errors:** 400 (invalid id), 404 (deck not found), 500

---

## Progress (Leitner SRS)

### `GET /api/progress/summary` — Get user's progress summary
**Auth:** required  
**Response 200:**
```json
{ "summary": { "new": 45, "learning": 12, "mastered": 8 } }
```
Keys are zero-filled — a fresh user gets `{ "new": 0, "learning": 0, "mastered": 0 }`.
**Errors:** 500

---

### `GET /api/progress/due` — Get due spaced-repetition words across all decks
**Auth:** required  
**Query:**
- `limit` (optional integer, default 20, clamped 1–100)

**Response 200:**
```json
{
  "words": [ { ...word } ],
  "totalDue": 14
}
```
Aggregates all learning/mastered cards whose `reviewDueAfter` timestamp is past or equal to the current time across all decks, ordered chronologically by due date. Returns `{ "words": [], "totalDue": 0 }` when nothing is due.  
**Errors:** 401, 500

---

### `GET /api/progress/weak` — Get weak words (mistake bank) across all decks
**Auth:** required  
**Query:**
- `limit` (optional integer, default 20, clamped 1–50)

**Response 200:**
```json
{
  "words": [ { ...word } ],
  "totalWeak": 6
}
```
Returns learning words currently stuck in Box 1 with low correct streaks, ordered by streak ascending and last reviewed descending. Returns `{ "words": [], "totalWeak": 0 }` when no words are in Box 1.  
**Errors:** 401, 500

---

### `GET /api/progress/word/:wordId` — Get my progress on one word
**Auth:** required  
**Params:** `wordId` (ObjectId)  
**Response 200:**
```json
{
  "progress": {
    "wordId": "...",
    "box": 3,
    "status": "learning",
    "streakCorrect": 2,
    "lastReviewed": null,
    "reviewDueAfter": null,
    "history": [{ "at": "...", "correct": true, "box": 3 }]
  }
}
```
`history` holds the last 20 reviews, newest last. A never-reviewed word
returns the fresh shape (`box: 1`, `status: "new"`, `lastReviewed: null`,
`reviewDueAfter: null`, `history: []`).  
**Errors:** 400 (invalid wordId), 404 (unknown word), 500

---

### `GET /api/progress/history` — Get chronological review history
**Auth:** required  
**Query:**
- `page` (optional integer, default 1, clamped 1–1000)
- `limit` (optional integer, default 20, clamped 1–100)
- `filter` (optional string enum: `all` | `correct` | `incorrect`, default `all`)

**Response 200:**
```json
{
  "history": [
    {
      "reviewId": "string",
      "wordId": "string",
      "word": "string",
      "definition": "string",
      "partOfSpeech": "string | null",
      "difficulty": "basic | intermediate | advanced",
      "correct": true,
      "box": 3,
      "mode": "practice | quiz | typing",
      "reviewedAt": "2026-10-27T14:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```
Aggregates across the user's progress records, sorted newest first. Returns `"history": []` and `"total": 0` when no review history exists.  
**Errors:** 400 (invalid page/limit/filter), 401, 500

---

### `POST /api/progress/review` — Record a practice answer
**Auth:** required  
**Request:**
```json
{ "wordId": "ObjectId", "correct": true, "mode": "practice | quiz | typing" }
```
**Response 200:**
```json
{
  "progress": {
    "_id": "...",
    "userId": "...",
    "wordId": "...",
    "box": 2,
    "streakCorrect": 1,
    "lastReviewed": "...",
    "reviewDueAfter": "...",
    "status": "learning",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "gamification": {
    "xpEarned": 14,
    "xp": 340,
    "level": 3,
    "levelUp": false,
    "dailyStreak": 5,
    "streakIncreased": false,
    "freezeUsed": false,
    "streakFreezes": 1,
    "dailyGoalMet": false,
    "freezeRefilled": false,
    "newWordsLearned": 1,
    "reviewsCaughtUp": 0,
    "reviewsToday": 8,
    "dailyGoalTarget": 10,
    "newBadges": [{ "id": "first-word", "name": "First Word", "icon": "🌱" }]
  }
}
```
**Behavior (Leitner):** correct → box+1 (max 5), streak +1; wrong → box 1, streak 0.
Status: first review → `learning`; box reaches 5 → `mastered`.  
**Gamification:** XP awarded per answer (`10 + box*2` correct, `3` wrong); user's
XP/level/totals/daily streak updated atomically; `levelUp` true when the user's
level increases; `newWordsLearned` is 1 when a word moves `new → learning`;
`reviewsCaughtUp` is 1 when a word becomes `mastered`.
**Streak freeze:** `freezeUsed` true when a 1-day gap was survived via a freeze;
`streakFreezes` is the remaining freeze count (0–1).
**Daily goal:** `reviewsToday` counts today's reviews; when it reaches
`dailyGoalTarget`, `dailyGoalMet` becomes true and `freezeRefilled` true on the
first cross per day (freeze count resets to 1).
**Badges:** `newBadges` lists badges earned by this exact review (empty when
none); each entry carries the catalog `id`, `name`, and `icon`. Award is
idempotent — an already-earned badge is never returned again.
**Errors:** 400 (invalid wordId / non-boolean correct), 404 (unknown word), 500

---

## Quiz History & Performance

### `POST /api/quiz/session` — Record a completed quiz attempt
**Auth:** required  
**Request:**
```json
{
  "deckId": "ObjectId | null",
  "deckTitle": "string",
  "part": 1,
  "scope": "viewed | all",
  "score": 8,
  "total": 10,
  "timeSpentSeconds": 142,
  "answers": [
    {
      "wordId": "ObjectId",
      "word": "string",
      "definition": "string",
      "partOfSpeech": "string | null",
      "userAnswer": "string",
      "correctAnswer": "string",
      "correct": true
    }
  ]
}
```
**Response 201:**
```json
{
  "session": {
    "_id": "...",
    "userId": "...",
    "deckId": "...",
    "deckTitle": "...",
    "part": 1,
    "scope": "viewed",
    "score": 8,
    "total": 10,
    "percentage": 80,
    "timeSpentSeconds": 142,
    "answers": [],
    "createdAt": "2026-10-27T14:30:00.000Z"
  }
}
```
Persists the session in the dedicated `QuizSession` collection, capped at 100 sessions per user.  
**Errors:** 400 (validation error), 401, 500

---

### `GET /api/quiz/history` — List user's quiz sessions and performance stats
**Auth:** required  
**Query:**
- `page` (optional integer, default 1, clamped 1–1000)
- `limit` (optional integer, default 10, clamped 1–50)

**Response 200:**
```json
{
  "sessions": [
    {
      "_id": "string",
      "deckId": "string | null",
      "deckTitle": "string",
      "part": 1,
      "scope": "viewed",
      "score": 8,
      "total": 10,
      "percentage": 80,
      "timeSpentSeconds": 142,
      "answers": [],
      "createdAt": "2026-10-27T14:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "stats": {
    "totalQuizzes": 25,
    "averageScore": 82,
    "bestScore": 100,
    "totalQuestions": 250
  }
}
```
**Errors:** 400 (invalid page/limit), 401, 500

---

### `GET /api/quiz/history/:id` — Get single quiz session detail
**Auth:** required  
**Response 200:**
```json
{
  "session": {
    "_id": "string",
    "deckTitle": "string",
    "score": 8,
    "total": 10,
    "percentage": 80,
    "timeSpentSeconds": 142,
    "answers": []
  }
}
```
**Errors:** 400 (invalid id), 401, 404 (session not found), 500

---

## Gamification

### `GET /api/gamification/me` — Get current user's XP / level / streak
**Auth:** required  
**Response 200:**
```json
{
  "gamification": {
    "xp": 340,
    "level": 3,
    "dailyStreak": 5,
    "totalCorrect": 21,
    "totalReviewed": 30,
    "nextLevelXp": 400,
    "progressToNext": 0.6,
    "streakFreezes": 1,
    "dailyGoalTarget": 10,
    "reviewsToday": 8,
    "goalsMet": 3,
    "activity": [{ "date": "2026-09-14", "reviews": 8 }],
    "badges": [{ "id": "first-word", "awardedAt": "..." }]
  }
}
```
`activity` holds per-day review counts, newest last (response window: last 14 days;
storage retains 60 days).
**Errors:** 401 (unauthorized), 404 (user not found), 500

---

### `PATCH /api/gamification/goal` — Set daily review target
**Auth:** required  
**Request:**
```json
{ "target": 10 }
```
Valid targets: `5 | 10 | 15 | 20 | 25 | 30 | 40 | 50`  
**Response 200:**
```json
{ "dailyGoalTarget": 10 }
```
**Errors:** 400 (invalid target), 401 (unauthorized), 404 (user not found), 500

---

## Bookmarks

### `GET /api/bookmarks` — List my starred words
**Auth:** required  
**Response 200:**
```json
{ "bookmarks": [{ "_id": "...", "word": { ... }, "status": "new | learning | mastered", "box": 0, "addedAt": "..." }] }
```
Newest first. `status`/`box` reflect the caller's SRS progress (`new`/`0` when unreviewed).  
**Errors:** 500

---

### `POST /api/bookmarks` — Star a word
**Auth:** required  
**Request:**
```json
{ "wordId": "ObjectId" }
```
Idempotent — starring an already-starred word returns 200 with the same shape.
Note: the create response always reports `status: "new"`, `box: 0`; the SRS
state is joined only on `GET /api/bookmarks`.  
**Response 200:**
```json
{ "bookmark": { "_id": "...", "word": { ... }, "status": "new", "box": 0, "addedAt": "..." } }
```
**Errors:** 400 (invalid wordId), 404 (unknown word), 500

---

### `DELETE /api/bookmarks/:wordId` — Unstar a word
**Auth:** required  
**Params:** `wordId` (ObjectId)  
Idempotent — unstarring a non-starred word still returns 200.  
**Response 200:**
```json
{ "removed": true }
```
**Errors:** 400 (invalid wordId), 500

---

### `GET /api/bookmarks/practice?limit=10` — Get a practice session from saved words
**Auth:** required  
**Query:** `limit` (number, default 10, max 50)  
**Selection order:** saved words never seen by this user first (saved order),
then seen words whose SRS due date (`reviewDueAfter`) has passed — oldest due
first. Seen-but-not-yet-due words are excluded.  
**Response 200:**
```json
{ "words": [ { ...word }, { ...word } ] }
```
**Errors:** 500

---

## Custom lists

### `GET /api/lists` — List my custom lists
**Auth:** required  
**Response 200:**
```json
{ "lists": [{ "_id": "...", "title": "string", "wordCount": 3 }] }
```
**Errors:** 500

---

### `POST /api/lists` — Create a custom list
**Auth:** required  
**Request:**
```json
{ "title": "string (1–60 chars)" }
```
**Response 201:**
```json
{ "list": { "_id": "...", "title": "string", "wordCount": 0 } }
```
**Errors:** 400 (validation), 500

---

### `GET /api/lists/:id` — Get one custom list with words
**Auth:** required, owner only (`:id` of another user reads as 404)  
**Response 200:**
```json
{ "list": { "_id": "...", "title": "string", "words": [{ ...word }] } }
```
**Errors:** 400 (invalid id), 404 (unknown list), 500

---

### `PATCH /api/lists/:id` — Rename a custom list
**Auth:** required, owner only  
**Request:**
```json
{ "title": "string (1–60 chars)" }
```
**Response 200:**
```json
{ "list": { "_id": "...", "title": "string", "wordCount": 3 } }
```
**Errors:** 400 (validation / invalid id), 404 (unknown list), 500

---

### `DELETE /api/lists/:id` — Delete a custom list
**Auth:** required, owner only  
**Response 200:**
```json
{ "removed": true }
```
**Errors:** 400 (invalid id), 404 (unknown list), 500

---

### `POST /api/lists/:id/words` — Add a word to a list
**Auth:** required, owner only  
**Request:**
```json
{ "wordId": "ObjectId" }
```
Idempotent (`$addToSet`).  
**Response 200:**
```json
{ "list": { "_id": "...", "title": "string", "wordCount": 4 } }
```
**Errors:** 400 (invalid id / wordId), 404 (unknown list or word), 500

---

### `DELETE /api/lists/:id/words/:wordId` — Remove a word from a list
**Auth:** required, owner only  
**Response 200:**
```json
{ "list": { "_id": "...", "title": "string", "wordCount": 3 } }
```
**Errors:** 400 (invalid id / wordId), 404 (unknown list), 500

---

## Admin

### `GET /api/admin/ping` — Admin health check
**Auth:** required + `admin` role  
**Response 200:**
```json
{ "message": "admin ok for email@example.com" }
```
**Errors:** 401, 403, 500

---

## General

### `GET /api/health` — Service health check
**Auth:** none  
**Response 200:**
```json
{ "status": "ok", "uptime": 123.45, "db": true, "deploy": "6faab1c" }
```
`db` reflects Mongo connectivity. `deploy` is the short commit SHA baked in
by the platform at build time (`RENDER_GIT_COMMIT` / `SOURCE_VERSION`, or
`dev` locally) — use it to confirm a specific push went live. Status stays
200 so the Render health check passes; routes 503 via `requireDB` when the
database is down.
**Errors:** 500

---

## Models Reference

### Word
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| word | string | ✅ | unique, lowercase, trimmed |
| definition | string | ✅ | |
| example | string | ❌ | |
| partOfSpeech | string | ❌ | |
| synonyms | string[] | ❌ | default `[]` |
| banglaMeaning | string | ❌ | optional, unused |
| difficulty | enum | ❌ | `basic` \| `intermediate` \| `advanced`, default `basic` |
| group | number | ❌ | seed-convention group number (e.g. GregMat 1–37), unenforced |
| source | enum | ❌ | `gregmat` \| `custom` |
| createdBy | ObjectId | ❌ | ref `User`; set for user-added words, absent for curated |
| createdAt / updatedAt | Date | auto | |

### Deck
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | trimmed |
| description | string | ❌ | |
| difficulty | enum | ❌ | default `basic` |
| wordIds | ObjectId[] | ❌ | ref `Word`, default `[]` |
| group | number | ❌ | seed-convention group number (e.g. GregMat 1–37), unenforced |
| source | enum | ❌ | `gregmat` \| `custom` (`custom` = personal "My Words" deck) |
| createdBy | ObjectId | ❌ | ref `User`; set for personal decks, absent for shared |
| createdAt / updatedAt | Date | auto | |

### User
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | trimmed |
| email | string | ✅ | unique, lowercase, trimmed |
| passwordHash | string | ✅ | bcrypt |
| role | enum | ❌ | `user` \| `admin`, default `user` |
| xp | number | ❌ | default 0, earned via reviews |
| level | number | ❌ | default 1, derived from XP (sqrt curve) |
| totalCorrect | number | ❌ | default 0 |
| totalReviewed | number | ❌ | default 0 |
| lastPracticeDate | Date | ❌ | last review date (for daily streak) |
| practiceStreakDays | number | ❌ | default 0, consecutive daily-practice count |
| streakFreezes | number | ❌ | default 1, available grace days (0–1) |
| dailyGoalTarget | number | ❌ | default 10; settable only to `5, 10, 15, 20, 25, 30, 40, 50` via `PATCH /api/gamification/goal` |
| reviewsToday | number | ❌ | today's review count |
| reviewsTodayDate | Date | ❌ | date of current reviewsToday |
| goalMetDate | Date | ❌ | last date daily goal was met |
| goalsMet | number | ❌ | total goals met |
| activityLog | object[] | ❌ | per-day `{ date, reviews }`, capped at 60 entries |
| badges | object[] | ❌ | earned badges `{ id, awardedAt }`, default `[]` |
| perfectRun | number | ❌ | current consecutive-correct run (for flawless), default 0 |
| createdAt / updatedAt | Date | auto | |

**Gamification XP/level rule:** `xpForAnswer`: `10 + box*2` for a correct answer,
`3` for an incorrect one. `level = floor(sqrt(xp / 100)) + 1`. Daily streak
increments when practicing on a new consecutive calendar day, resets to 1 after
a gap of 2+ days, and is idempotent within the same day.
**Streak freeze:** 1 grace day survives a missed practice day. Freezes are
consumed when a 1-day gap is detected and refilled to 1 when the daily goal
target is met. Max freeze count is 1.
**Badges** (`server/src/utils/gamify.js` `BADGES`, awarded idempotently on each
review via `awardBadges`): `first-word` (1+ total reviews), `century` (100+),
`week-warrior` (7+ day streak), `level-5` (level 5+), `flawless` (10 correct in
a row across any mode, tracked by `perfectRun`).

### Progress
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | ✅ | ref `User` |
| wordId | ObjectId | ✅ | ref `Word` |
| box | number | ❌ | 1–5, default 1 |
| streakCorrect | number | ❌ | default 0 |
| lastReviewed | Date | ❌ | default now |
| reviewDueAfter | Date | ❌ | set by review; SRS due date |
| status | enum | ❌ | `new` \| `learning` \| `mastered`, default `new` |
| history | object[] | ❌ | last 20 reviews `{ at, correct, box }`, newest last |
| createdAt / updatedAt | Date | auto | |
| unique index | | | `(userId, wordId)` |

### Bookmark
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | ✅ | ref `User` |
| wordId | ObjectId | ✅ | ref `Word` |
| createdAt / updatedAt | Date | auto | |
| unique index | | | `(userId, wordId)` |

### CustomList
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId | ✅ | ref `User` (owner) |
| title | string | ✅ | trimmed, 1–60 chars |
| wordIds | ObjectId[] | ❌ | ref `Word`, default `[]` |
| createdAt / updatedAt | Date | auto | |

---

## Contract Compliance Rules

1. **Backend changes** must update this document if response shapes change
2. **Frontend must not assume fields** not documented here
3. **Breaking changes** require a new version prefix (`/api/v2/...`) or explicit team sync
4. **New endpoints** added to this file before implementation starts