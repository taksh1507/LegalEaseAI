ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
-- Additive migration: no existing data or columns are removed.
CREATE TABLE IF NOT EXISTS auth_challenges (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('signup', 'signin')),
    code_hash VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_email_mode
    ON auth_challenges (email, mode, created_at DESC);

ALTER TABLE document_history ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE document_history ALTER COLUMN user_email DROP NOT NULL;
-- Bind only unambiguous legacy email identities. Unmatched/ambiguous rows are retained for manual reconciliation.
WITH unique_owners AS (
  SELECT LOWER(email) AS email_key, MIN(id) AS owner_id, MIN(created_at) AS owner_created_at
  FROM users WHERE email IS NOT NULL GROUP BY LOWER(email) HAVING COUNT(*) = 1
)
UPDATE document_history AS history SET user_id = owners.owner_id
FROM unique_owners AS owners
WHERE history.user_id IS NULL AND LOWER(history.user_email) = owners.email_key AND owners.owner_created_at <= history.analysis_date;
CREATE INDEX IF NOT EXISTS idx_document_history_owner_date ON document_history(user_id, analysis_date DESC);
