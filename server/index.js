import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool, initSchema } from './db.js'
import { validateDraft } from './validate.js'
import { draftFromTranscript } from './ai.js'

const app = express()
const PROD = process.env.NODE_ENV === 'production'
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET is required (see .env.example)')

app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
    credentials: true,
  }),
)

// ---------- auth ----------
// Cross-site cookies (Vercel frontend -> separate API host) need SameSite=None + Secure in production.
const cookieOpts = { httpOnly: true, secure: PROD, sameSite: PROD ? 'none' : 'lax', maxAge: 8 * 3600 * 1000 }

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, specialization: u.specialization, skills: u.skills })

// The current user always comes from the signed session cookie, re-read from the DB.
async function requireAuth(req, res, next) {
  try {
    const payload = jwt.verify(req.cookies.session || '', JWT_SECRET)
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub])
    if (!rows[0]) return res.status(401).json({ error: 'Not logged in.' })
    req.user = rows[0]
    next()
  } catch {
    res.status(401).json({ error: 'Not logged in.' })
  }
}
const requireAdmin = (req, res, next) =>
  req.user.role === 'ADMIN' ? next() : res.status(403).json({ error: 'Admin access required.' })

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required.' })
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email.trim()])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' })
  res.cookie('session', jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '8h' }), cookieOpts)
  res.json({ user: publicUser(user) })
})
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session', { ...cookieOpts, maxAge: undefined })
  res.json({ ok: true })
})
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))

// ---------- team directory (read-only, no emails/hashes) ----------
app.get('/api/team', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, role, specialization, skills FROM users ORDER BY id')
  res.json({ team: rows })
})

// ---------- access rules ----------
const projectSelect = `
  SELECT p.id, p.name, p.client_name AS "clientName", p.description, p.deadline,
         p.manager_id AS "managerId", m.name AS "managerName"
  FROM projects p JOIN users m ON m.id = p.manager_id`

// getProjects(currentUser): ADMIN all, MANAGER own, AGENT projects containing their tasks
async function visibleProjects(user, projectId = null) {
  const params = []
  let where = ''
  if (user.role === 'MANAGER') { params.push(user.id); where = `p.manager_id = $${params.length}` }
  else if (user.role === 'AGENT') { params.push(user.id); where = `EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.assignee_id = $${params.length})` }
  if (projectId) { params.push(projectId); where += `${where ? ' AND ' : ''}p.id = $${params.length}` }
  const { rows } = await pool.query(`${projectSelect} ${where ? 'WHERE ' + where : ''} ORDER BY p.deadline, p.name`, params)
  return rows
}

// getTasks(currentUser, projectId): ADMIN/MANAGER all tasks of a visible project, AGENT only their own
async function visibleTasks(user, projectId) {
  const params = [projectId]
  let extra = ''
  if (user.role === 'AGENT') { params.push(user.id); extra = 'AND t.assignee_id = $2' }
  const { rows } = await pool.query(
    `SELECT t.id, t.project_id AS "projectId", t.title, t.description, t.assignee_id AS "assigneeId",
            a.name AS "assigneeName", t.deadline, t.estimated_hours AS "estimatedHours"
     FROM tasks t JOIN users a ON a.id = t.assignee_id
     WHERE t.project_id = $1 ${extra} ORDER BY t.deadline, t.title`, params)
  return rows
}

app.get('/api/projects', requireAuth, async (req, res) => {
  const projects = await visibleProjects(req.user)
  for (const p of projects) p.tasks = await visibleTasks(req.user, p.id) // agents only get their own tasks
  res.json({ projects: projects.map((p) => ({ ...p, taskCount: p.tasks.length, totalHours: p.tasks.reduce((s, t) => s + t.estimatedHours, 0) })) })
})

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  const [project] = await visibleProjects(req.user, req.params.id)
  if (!project) return res.status(404).json({ error: 'Project not found.' }) // outside the user's access
  res.json({ project: { ...project, tasks: await visibleTasks(req.user, project.id) } })
})

app.get('/api/my-tasks', requireAuth, async (req, res) => {
  if (req.user.role !== 'AGENT') return res.status(403).json({ error: 'Only agents have a My Tasks list.' })
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.description, t.deadline, t.estimated_hours AS "estimatedHours",
            p.id AS "projectId", p.name AS "projectName", m.name AS "managerName"
     FROM tasks t JOIN projects p ON p.id = t.project_id JOIN users m ON m.id = p.manager_id
     WHERE t.assignee_id = $1 ORDER BY t.deadline`, [req.user.id])
  res.json({ tasks: rows })
})

// ---------- transcript -> projects/tasks ----------
async function saveDraft(draft) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN') // all-or-nothing
    const created = []
    for (const p of draft.projects) {
      const pid = crypto.randomUUID()
      await client.query(
        'INSERT INTO projects (id, name, client_name, description, manager_id, deadline) VALUES ($1,$2,$3,$4,$5,$6)',
        [pid, p.name.trim(), p.clientName.trim(), p.description ?? '', p.managerId, p.deadline])
      for (const t of p.tasks) {
        await client.query(
          'INSERT INTO tasks (id, project_id, title, description, assignee_id, deadline, estimated_hours) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [crypto.randomUUID(), pid, t.title.trim(), t.description ?? '', t.assigneeId, t.deadline, t.estimatedHours])
      }
      created.push({ id: pid, name: p.name, taskCount: p.tasks.length })
    }
    await client.query('COMMIT')
    return created
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

const inFlight = new Set() // blocks duplicate submissions per admin while one is processing
const allUsers = async () => (await pool.query('SELECT id, name, role, skills FROM users')).rows

app.post('/api/transcript', requireAuth, requireAdmin, async (req, res) => {
  const transcript = typeof req.body?.transcript === 'string' ? req.body.transcript.trim() : ''
  if (!transcript) return res.status(400).json({ error: 'Transcript is empty.' })
  if (inFlight.has(req.user.id)) return res.status(409).json({ error: 'A conversion is already running. Please wait.' })
  inFlight.add(req.user.id)
  try {
    const users = await allUsers()
    let draft
    try { draft = await draftFromTranscript(transcript, users) }
    catch (e) { return res.status(502).json({ error: `AI conversion failed: ${e.message}` }) }
    const issues = validateDraft(draft, users)
    if (issues.length) return res.status(422).json({ error: 'Some required details need correction. Nothing was saved.', issues, draft })
    res.status(201).json({ created: await saveDraft(draft) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Could not save projects. Nothing was saved.' })
  } finally {
    inFlight.delete(req.user.id)
  }
})

// Resubmit a corrected draft (from a 422 response) without calling the AI again.
app.post('/api/transcript/commit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const draft = req.body?.draft
    const issues = validateDraft(draft, await allUsers())
    if (issues.length) return res.status(422).json({ error: 'Some required details still need correction. Nothing was saved.', issues, draft })
    res.status(201).json({ created: await saveDraft(draft) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Could not save projects. Nothing was saved.' })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use((req, res) => res.status(404).json({ error: 'Not found.' }))

await initSchema()
const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on :${port}`))
