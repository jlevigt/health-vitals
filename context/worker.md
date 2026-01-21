
I’ll treat this as a **worker design review**, not a tutorial. The goal is to close gaps, remove ambiguity, and define _where responsibilities begin and end_, without over-engineering.

---

## 1. Worker’s contract (what it is and is not)

### The Worker **is**

- A **consumer of file messages**
    
- The **exclusive executor** of file processing
    
- The **only component** allowed to call the LLM API
    
- Responsible for **rate-limit compliance**
    
- Responsible for **state transitions of files**
    

### The Worker **is not**

- An API
    
- A scheduler
    
- A retry orchestrator beyond simple backoff
    
- A consistency enforcer beyond “no concurrent execution”
    

This framing matters because many mistakes come from letting the Worker “help” too much.

---

## 2. Message contract (strict, minimal)

The Worker should receive **only what it cannot derive**.

### Queue message schema

```json
{
  "file_id": "uuid",
  "object_key": "uploads/{user_id}/{file_id}.pdf",
  "user_id": "uuid",
  "enqueued_at": "2026-01-20T18:32:00Z"
}
```

### Explicit exclusions

- No file size
    
- No filename
    
- No status
    
- No retry count
    

The Worker must **re-read authoritative state from DB**.

---

## 3. Worker lifecycle (step-by-step, with responsibility boundaries)

### 3.1 AMQP connection

- Single connection
    
- Single channel
    
- Prefetch = **1**
    

> This alone enforces “same job must not be executed twice at the same time” in practice.

---

### 3.2 Fetch loop

Pseudo-logic:

```
consume(message):
  begin transaction
    SELECT file FOR UPDATE
    validate state
    transition state
  commit

  process file

  ack or nack
```

The **database row lock** is your real concurrency guard, not AMQP.

---

## 4. File state transitions (authoritative)

You were correct to minimize states. This is enough:

```
QUEUED → PROCESSING → SUCCEEDED
                 ↘︎ FAILED_RETRYABLE
                 ↘︎ FAILED_TERMINAL
```

### Transition rules

- Only Worker may move to `PROCESSING`
    
- Only Worker may move out of `PROCESSING`
    
- API never touches these states
    

---

## 5. Worker execution flow (precise responsibilities)

### Step 1 — Lock and validate

```sql
SELECT *
FROM files
WHERE id = $1
FOR UPDATE;
```

Reject if:

- status ≠ `QUEUED`
    
- file is missing object_key
    

Then:

```sql
UPDATE files
SET status = 'PROCESSING'
WHERE id = $1;
```

This guarantees:

- No double execution
    
- Crash safety (file remains PROCESSING)
    

---

### Step 2 — Fetch file from storage

Responsibilities:

- Download
    
- Validate size
    
- Fail fast if missing
    

Failure handling:

- Storage error → `FAILED_RETRYABLE`
    
- Object not found → `FAILED_TERMINAL`
    

No retry loops here. One attempt per message.

---

### Step 3 — Parse PDF → text

Responsibilities:

- Extract text only
    
- No semantic interpretation
    

Rules:

- If extracted text is empty or too small → `FAILED_TERMINAL`
    
- If parser crashes → `FAILED_RETRYABLE`
    

Store **text length** for observability, not content.

---

## 6. Rate limiting (this is the critical design decision)

### Where it belongs

**Inside the Worker, before the LLM call.**

Not:

- In the API
    
- In the queue
    
- In the client
    

### Why

- Only the Worker knows real usage
    
- Limits are global, not per user
    
- Failures must be prevented, not retried
    

---

### Rate limit algorithm (production-looking, simple)

You already have the right primitive: `llm_requests.started_at`.

#### Check logic (inside transaction)

```sql
-- RPM
SELECT count(*)
FROM llm_requests
WHERE started_at > now() - interval '1 minute';

-- RPD
SELECT count(*)
FROM llm_requests
WHERE started_at > now() - interval '1 day';

-- TPM (optional)
SELECT sum(prompt_tokens)
FROM llm_requests
WHERE started_at > now() - interval '1 minute';
```

If **any limit exceeded**:

- Do **not** call LLM
    
- Requeue message with delay (or nack + dead-letter TTL)
    
- Reset file status to `QUEUED`
    

This is not “gross”. This is correct.

---

### Important constraint

**Rate-limit failure is not a file failure.**

Do not mark file as failed.

---

## 7. LLM call responsibility

### Worker responsibilities

- Choose provider/model
    
- Construct prompt
    
- Enforce token constraints
    
- Record metrics
    

### Insert `llm_requests` row

**Before** calling the API:

```sql
INSERT INTO llm_requests (
  file_id,
  provider,
  model,
  started_at
)
RETURNING id;
```

Then update after response.

This gives you:

- Visibility into inflight calls
    
- Rate-limit correctness
    
- Crash observability
    

---

## 8. Optional: confidence logic (where it belongs)

Your instinct is correct.

### Where

**After LLM response, before DB writes.**

### What it can do

- Reject low-confidence extraction
    
- Flag observation_definitions mismatches
    
- Normalize units defensively
    

### What it must not do

- Trigger retries
    
- Change file state by itself
    

This keeps business rules simple.

---

## 9. Persist results (single transaction)

One transaction:

1. Insert report
    
2. Insert observations
    
3. Update file → `SUCCEEDED`
    
4. Update `processed_at`
    

If this transaction fails:

- File remains `PROCESSING`
    
- On restart, you can detect and handle stuck files
    

---

## 10. Crash recovery (minimal, realistic)

You explicitly said **low consistency requirement**.

That means:

- No distributed locks
    
- No exactly-once semantics
    

Recovery rule:

- Any file in `PROCESSING` older than N minutes → set back to `QUEUED`
    

This can be:

- Manual
    
- A simple cron
    
- Or ignored for portfolio scope
    

---

## 11. What you intentionally do not handle

Correctly omitted:

- Partial file success
    
- Cross-file aggregation
    
- User-triggered retries
    
- Backpressure signaling to API
    
- Exactly-once delivery
    

These would _harm_ the clarity of this project.

---

## Final assessment

Your Worker design is **coherent**, **defensible**, and **appropriate** for:

- Rate-limited LLMs
    
- Async ingestion
    
- Portfolio-level realism
    

The key correctness points you got right:

- File is the job
    
- Rate limiting is worker-owned
    
- State machine is minimal
    
- Metrics are first-class
    

If you want next, the natural next step is:

- A concrete worker pseudocode file
    
- Or a failure matrix (error → state → retry?)
    

Say which one.

---

File State Machine:

CREATED
  └─→ QUEUED
        └─→ PROCESSING
              ├─→ SUCCEEDED
              ├─→ FAILED_RETRYABLE
              └─→ FAILED_TERMINAL
