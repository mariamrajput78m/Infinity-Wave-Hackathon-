import bcrypt from 'bcryptjs'
import { pool, initSchema } from './db.js'

const PASSWORD = 'Demo123!'
const USERS = [
  ['ADMIN', 'Admin', 'admin@novaworks.example', 'ADMIN', 'Administrator', ['Company overview', 'Transcript creation']],
  ['PM01', 'Ayesha Khan', 'ayesha@novaworks.example', 'MANAGER', 'Web PM', ['Web projects', 'Client coordination']],
  ['PM02', 'Bilal Ahmed', 'bilal@novaworks.example', 'MANAGER', 'Mobile PM', ['Mobile projects', 'Delivery planning']],
  ['PM03', 'Hina Malik', 'hina@novaworks.example', 'MANAGER', 'AI PM', ['AI projects', 'Requirement review']],
  ['DEV01', 'Ali Raza', 'ali@novaworks.example', 'AGENT', 'Full-Stack', ['React', 'Frontend integration']],
  ['DEV02', 'Hamza Shah', 'hamza@novaworks.example', 'AGENT', 'Full-Stack', ['Node.js', 'Databases', 'APIs']],
  ['DEV03', 'Sara Noor', 'sara@novaworks.example', 'AGENT', 'App Developer', ['Flutter', 'Mobile UI']],
  ['DEV04', 'Usman Tariq', 'usman@novaworks.example', 'AGENT', 'App Developer', ['Flutter', 'Integration', 'Testing']],
  ['DEV05', 'Zain Abbas', 'zain@novaworks.example', 'AGENT', 'AI Developer', ['LLMs', 'Extraction', 'Prompts']],
  ['DEV06', 'Maryam Asif', 'maryam@novaworks.example', 'AGENT', 'AI Developer', ['Retrieval', 'Document processing']],
]

await initSchema()
const hash = await bcrypt.hash(PASSWORD, 10)
for (const [id, name, email, role, specialization, skills] of USERS) {
  // Upsert by email so re-running never duplicates users
  await pool.query(
    `INSERT INTO users (id, name, email, password_hash, role, specialization, skills)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name, role = EXCLUDED.role,
       specialization = EXCLUDED.specialization, skills = EXCLUDED.skills,
       password_hash = EXCLUDED.password_hash`,
    [id, name, email, hash, role, specialization, skills],
  )
}
console.log(`Seeded ${USERS.length} demo users (password: ${PASSWORD})`)
await pool.end()
