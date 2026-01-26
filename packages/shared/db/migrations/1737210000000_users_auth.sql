BEGIN;

  

CREATE TABLE users (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

email VARCHAR(255) NOT NULL,

password_hash TEXT NOT NULL,

is_active boolean not null default false,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

  

CREATE UNIQUE INDEX users_email_lower_idx

ON users (LOWER(email));

  
  

CREATE TABLE email_verifications (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

token_hash TEXT NOT NULL,

expires_at TIMESTAMPTZ NOT NULL,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

  

CREATE INDEX idx_email_verifications_hash

ON email_verifications (token_hash);

  
  

CREATE TABLE sessions (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  

token_hash TEXT NOT NULL,

expires_at TIMESTAMPTZ NOT NULL,

revoked_at TIMESTAMPTZ,

  

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

  

CREATE UNIQUE INDEX idx_sessions_hash_unique

ON sessions(token_hash);

CREATE INDEX idx_sessions_user ON sessions(user_id);

  

CREATE TABLE password_resets (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

token_hash TEXT NOT NULL,

expires_at TIMESTAMPTZ NOT NULL,

used_at TIMESTAMPTZ,

created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()

);

  

CREATE UNIQUE INDEX idx_password_resets_hash_unique

ON password_resets(token_hash);
COMMIT;
