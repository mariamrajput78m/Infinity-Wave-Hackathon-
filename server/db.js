import pg from 'pg'
import 'dotenv/config'

// Return DATE columns as plain "YYYY-MM-DD" strings (no timezone shifting)
pg.types.setTypeParser(1082, (v) => v)
// Return NUMERIC as numbers
pg.types.setTypeParser(1700, (v) => Number(v))

const useSsl = /sslmode=require/.test(process.env.DATABASE_URL || '')
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
})

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL CHECK (role IN ('ADMIN','MANAGER','AGENT')),
      specialization text,
      skills text[] NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS projects (
      id text PRIMARY KEY,
      name text NOT NULL,
      client_name text NOT NULL,
      description text,
      manager_id text NOT NULL REFERENCES users(id),
      deadline date NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id text PRIMARY KEY,
      project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      assignee_id text NOT NULL REFERENCES users(id),
      deadline date NOT NULL,
      estimated_hours numeric NOT NULL CHECK (estimated_hours > 0)
    );
    CREATE INDEX IF NOT EXISTS tasks_project_idx ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS projects_manager_idx ON projects(manager_id);
  `)
}
