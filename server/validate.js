const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

const str = (v) => typeof v === 'string' && v.trim().length > 0

// Returns a list of { path, message } problems. Empty list = draft is valid.
export function validateDraft(draft, users) {
  const issues = []
  const byId = new Map(users.map((u) => [u.id, u]))
  const add = (path, message) => issues.push({ path, message })

  if (!draft || !Array.isArray(draft.projects) || draft.projects.length === 0) {
    add('projects', 'No projects were found in the draft.')
    return issues
  }

  draft.projects.forEach((p, i) => {
    const pp = `projects[${i}]`
    if (!str(p?.name)) add(`${pp}.name`, 'Project name is required.')
    if (!str(p?.clientName)) add(`${pp}.clientName`, 'Client name is required.')
    const mgr = byId.get(p?.managerId)
    if (!mgr) add(`${pp}.managerId`, `Manager "${p?.managerId ?? ''}" is not an existing user.`)
    else if (mgr.role !== 'MANAGER') add(`${pp}.managerId`, `${mgr.name} is not a manager.`)
    const projectDateOk = isValidDate(p?.deadline)
    if (!projectDateOk) add(`${pp}.deadline`, 'Project deadline must be a valid YYYY-MM-DD date.')

    if (!Array.isArray(p?.tasks) || p.tasks.length === 0) add(`${pp}.tasks`, 'Project has no tasks.')
    ;(p?.tasks ?? []).forEach((t, j) => {
      const tp = `${pp}.tasks[${j}]`
      if (!str(t?.title)) add(`${tp}.title`, 'Task title is required.')
      const a = byId.get(t?.assigneeId)
      if (!a) add(`${tp}.assigneeId`, `Assignee "${t?.assigneeId ?? ''}" is not an existing user.`)
      else if (a.role !== 'AGENT') add(`${tp}.assigneeId`, `${a.name} is not an agent.`)
      const h = t?.estimatedHours
      if (typeof h !== 'number' || !Number.isFinite(h) || h <= 0) add(`${tp}.estimatedHours`, 'Estimated hours must be a positive number.')
      if (!isValidDate(t?.deadline)) add(`${tp}.deadline`, 'Task deadline must be a valid YYYY-MM-DD date.')
      else if (projectDateOk && t.deadline > p.deadline) add(`${tp}.deadline`, 'Task deadline is after the project deadline.')
    })
  })
  return issues
}
