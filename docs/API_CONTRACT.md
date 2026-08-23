# VocabVault REST API Contract

**Base URL:** `/api`  
**Auth:** JWT in `Authorization: Bearer <token>` header (all non-public endpoints)  
**Error format:** `{ "message": "..." }`  
**Content-Type:** `application/json`

---

## Authentication

### `POST /api/auth/register` — Create new user
**Request:**
```json
{ "name": "string", "email": "string", "password": "string (min 6)" }
```
**Response 201:**
```json
{ "token": "jwt-string", "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
**Errors:** 400 (validation), 409 (email exists), 500

---

### `POST /api/auth/login` — User login
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response 200:**
```json
{ "token": "jwt-string", "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
**Errors:** 400 (validation), 401 (invalid credentials), 500

---

### `GET /api/auth/me` — Get current user
**Auth:** required  
**Response 200:**
```json
{ "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }
```
**Errors:** 401 (unauthorized), 500

---

## Words (Vocabulary)

### `GET /api/words` — List words with filtering & pagination
**Auth:** required  
**Query params:**
- `q` (string, optional) — case-insensitive prefix search on `word`
- `difficulty` (enum: `basic` | `intermediate` | `advanced`, optional)
- `page` (number, default 1)
- `limit` (number, default 20)

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
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1200,
  "page": 1
}
```
**Errors:** 500

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
      "createdBy": "userObjectId",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```
**Note:** `wordCount` is derived from `wordIds.length` and must be present in every deck object.

**Errors:** 500

---

### `GET /api/decks/:id` — Get single deck
**Auth:** required  
**Params:** `id` (ObjectId)  
**Response 200:**
```json
{ "deck": { ... } }
```
**Errors:** 400 (invalid id), 404 (not found), 500

---

## Progress (Leitner SRS)

### `GET /api/progress/summary` — Get user's progress summary
**Auth:** required  
**Response 200:**
```json
{ "summary": { "new": 45, "learning": 12, "mastered": 8 } }
```
**Errors:** 500

---

### `POST /api/progress/review` — Record a practice answer
**Auth:** required  
**Request:**
```json
{ "wordId": "ObjectId", "correct": true }
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
  }
}
```
**Behavior (Leitner):** correct → box+1 (max 5), streak +1; wrong → box 1, streak 0.
Status: first review → `learning`; box reaches 5 → `mastered`.  
**Errors:** 400 (invalid wordId / non-boolean correct), 404 (unknown word), 500

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
{ "status": "ok", "uptime": 123.45 }
```
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
| banglaMeaning | string | ❌ | **deferred / optional** |
| difficulty | enum | ❌ | `basic` \| `intermediate` \| `advanced`, default `basic` |
| createdAt / updatedAt | Date | auto | |

### Deck
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | ✅ | trimmed |
| description | string | ❌ | |
| difficulty | enum | ❌ | default `basic` |
| wordIds | ObjectId[] | ❌ | ref `Word`, default `[]` |
| createdBy | ObjectId | ❌ | ref `User` |
| createdAt / updatedAt | Date | auto | |

### User
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | trimmed |
| email | string | ✅ | unique, lowercase, trimmed |
| passwordHash | string | ✅ | bcrypt |
| role | enum | ❌ | `user` \| `admin`, default `user` |
| createdAt / updatedAt | Date | auto | |

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
| createdAt / updatedAt | Date | auto | |
| unique index | | | `(userId, wordId)` |

---

## Contract Compliance Rules

1. **All PRs must reference this contract** in title/body
2. **Backend changes** must update this document if response shapes change
3. **Frontend must not assume fields** not documented here
4. **Breaking changes** require a new version prefix (`/api/v2/...`) or explicit team sync
5. **New endpoints** added to this file before implementation starts