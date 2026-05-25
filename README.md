# AI Email Agent MVP

AI-powered email assistant that:

* Reads unread Gmail emails
* Classifies emails
* Generates draft responses using AI
* Stores drafts for approval
* Sends replies only after manual confirmation

---

# Tech Stack

* Node.js
* TypeScript
* Express
* PostgreSQL
* Prisma
* Docker
* OpenAI API
* Gmail API

---

# Project Structure

```text
apps/
└── backend/
    ├── src/
    ├── prisma/
    ├── Dockerfile
    ├── start.sh
    ├── package.json
    └── tsconfig.json
```

---

# Environment Variables

Create a `.env` file in the project root.

## `.env`

```env
PORT=5000

DATABASE_URL="postgresql://postgres:password@postgres:5432/email_agent"

OPENAI_API_KEY=YOUR_OPENAI_API_KEY

GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
```

---

# Start Application

## Build and Start Containers

Run from project root:

```bash
docker compose up --build
```

This automatically:

* Starts PostgreSQL
* Builds backend
* Generates Prisma client
* Applies database migrations
* Starts backend server

---

# Stop Application

```bash
docker compose down
```

---

# Remove Containers + Database Volume

```bash
docker compose down -v
```

---

# Backend URL

```text
http://localhost:5000
```

---

# API Endpoints

## Sync Emails

Fetch unread emails from Gmail and process them.

```http
POST /emails/sync
```

Example:

```bash
curl -X POST http://localhost:5000/emails/sync
```

---

## Get Emails

Returns processed emails and drafts.

```http
GET /emails
```

Example:

```bash
curl http://localhost:5000/emails
```

---

## Approve Draft

Approves and sends draft email.

```http
POST /drafts/:id/approve
```

Example:

```bash
curl -X POST http://localhost:5000/drafts/DRAFT_ID/approve
```

---

# Database Migrations

Migrations are automatically applied during container startup using:

```bash
npx prisma migrate deploy
```

---

# Development Notes

## Rebuild Containers

```bash
docker compose up --build
```

---

## View Logs

```bash
docker compose logs -f
```

---

## Open Backend Container

```bash
docker exec -it email-agent-backend sh
```

---

## Open PostgreSQL Container

```bash
docker exec -it email-agent-postgres psql -U postgres -d email_agent
```

---

# Prisma Commands

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Create New Migration

Run locally when schema changes:

```bash
npx prisma migrate dev --name migration_name
```

---

# Email Processing Flow

```text
Unread Email
    ↓
Classifier Agent
    ↓
Context Agent
    ↓
Draft Agent
    ↓
Safety Agent
    ↓
Store Draft
    ↓
Manual Approval
    ↓
Send Email
```

---

# Future Improvements

* Redis Queue
* BullMQ Workers
* Multi-user OAuth
* Frontend Dashboard
* RAG-based memory
* Email threading
* Vector search
* Autonomous follow-ups
* Human feedback learning

---