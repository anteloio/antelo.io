export const prerender = false

import type { APIRoute } from "astro"
import { auth } from "../../lib/auth"
import { db } from "../../db"
import { projects, timeEntries, locations, dayLocations } from "../../db/schema"
import { and, eq, gte, lte } from "drizzle-orm"

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

// ── Date helpers (duplicated from the Astro page) ─────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0")
const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return addDays(x, -((x.getDay() + 6) % 7)) }

function computeWeekMeta(startParam: string | null) {
  const weekStart = mondayOf(startParam ? new Date(startParam + "T00:00:00") : new Date())
  const weekDates = Array.from({ length: 7 }, (_, i) => fmt(addDays(weekStart, i)))
  const startStr = fmt(weekStart)
  const endStr = weekDates[6]
  const prevStart = fmt(addDays(weekStart, -7))
  const nextStart = fmt(addDays(weekStart, 7))
  const thisStart = fmt(mondayOf(new Date()))
  const todayStr = fmt(new Date())
  const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
  const withYear = (d: Date) =>
    d.getFullYear() === new Date().getFullYear() ? monthDay.format(d) : `${monthDay.format(d)}, ${d.getFullYear()}`
  const weekOffset = Math.round((weekStart.getTime() - mondayOf(new Date()).getTime()) / (7 * 86400000))
  const weekLabel =
    weekOffset === 0 ? "This week" :
    weekOffset === -1 ? "Last week" :
    weekOffset === 1 ? "Next week" :
    `${withYear(weekStart)} - ${withYear(new Date(endStr + "T00:00:00"))}`
  return { weekDates, startStr, endStr, prevStart, nextStart, thisStart, todayStr, weekLabel }
}

// ── GET — week data (for SPA navigation) ─────────────────────────────────────

export const GET: APIRoute = async ({ request, url }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return json({ ok: false, error: "Unauthorized" }, 401)
  const userId = session.user.id

  const { weekDates, startStr, endStr, prevStart, nextStart, thisStart, todayStr, weekLabel } =
    computeWeekMeta(url.searchParams.get("start"))

  const entries = await db
    .select({ projectId: timeEntries.projectId, date: timeEntries.date, hours: timeEntries.hours })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), gte(timeEntries.date, startStr), lte(timeEntries.date, endStr)))

  const dayLocs = await db
    .select({ date: dayLocations.date, locationId: dayLocations.locationId })
    .from(dayLocations)
    .where(and(eq(dayLocations.userId, userId), gte(dayLocations.date, startStr), lte(dayLocations.date, endStr)))

  return json({ weekDates, startStr, prevStart, nextStart, thisStart, todayStr, weekLabel, entries, dayLocations: dayLocs })
}

// ── POST — mutations ──────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return json({ ok: false, error: "Unauthorized" }, 401)
  const userId = session.user.id

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400)
  }

  const { intent } = body

  try {
    if (intent === "setHours") {
      const projectId = Number(body.projectId)
      const date = String(body.date ?? "")
      const hours = Number(body.hours)
      if (!projectId || !date) return json({ ok: false, error: "Missing fields" }, 400)
      if (hours > 0) {
        await db
          .insert(timeEntries)
          .values({ projectId, date, hours, userId })
          .onConflictDoUpdate({ target: [timeEntries.projectId, timeEntries.date], set: { hours } })
      } else {
        await db
          .delete(timeEntries)
          .where(and(eq(timeEntries.projectId, projectId), eq(timeEntries.date, date), eq(timeEntries.userId, userId)))
      }
      return json({ ok: true })
    }

    if (intent === "addProject") {
      const name = String(body.name ?? "").trim()
      if (!name) return json({ ok: false, error: "Name required" }, 400)
      const [project] = await db.insert(projects).values({ name, userId }).returning()
      return json({ ok: true, project })
    }

    if (intent === "renameProject") {
      const projectId = Number(body.projectId)
      const name = String(body.name ?? "").trim()
      const hourlyRate = body.hourlyRate === "" || body.hourlyRate == null ? null : Number(body.hourlyRate)
      if (!projectId || !name) return json({ ok: false, error: "Missing fields" }, 400)
      await db
        .update(projects)
        .set({ name, hourlyRate })
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      return json({ ok: true })
    }

    if (intent === "deleteProject") {
      const projectId = Number(body.projectId)
      if (!projectId) return json({ ok: false, error: "Missing projectId" }, 400)
      await db.delete(timeEntries).where(and(eq(timeEntries.projectId, projectId), eq(timeEntries.userId, userId)))
      await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      return json({ ok: true })
    }

    if (intent === "addLocation") {
      const name = String(body.name ?? "").trim()
      if (!name) return json({ ok: false, error: "Name required" }, 400)
      const [location] = await db.insert(locations).values({ name, userId }).returning()
      return json({ ok: true, location })
    }

    if (intent === "renameLocation") {
      const locationId = Number(body.locationId)
      const name = String(body.name ?? "").trim()
      if (!locationId || !name) return json({ ok: false, error: "Missing fields" }, 400)
      await db
        .update(locations)
        .set({ name })
        .where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
      return json({ ok: true })
    }

    if (intent === "deleteLocation") {
      const locationId = Number(body.locationId)
      if (!locationId) return json({ ok: false, error: "Missing locationId" }, 400)
      await db
        .delete(dayLocations)
        .where(and(eq(dayLocations.locationId, locationId), eq(dayLocations.userId, userId)))
      await db.delete(locations).where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
      return json({ ok: true })
    }

    if (intent === "setDayLocation") {
      const date = String(body.date ?? "")
      const locationId = Number(body.locationId) || 0
      if (!date) return json({ ok: false, error: "Missing date" }, 400)
      if (locationId > 0) {
        await db
          .insert(dayLocations)
          .values({ date, locationId, userId })
          .onConflictDoUpdate({ target: [dayLocations.userId, dayLocations.date], set: { locationId } })
      } else {
        await db.delete(dayLocations).where(and(eq(dayLocations.date, date), eq(dayLocations.userId, userId)))
      }
      return json({ ok: true })
    }

    return json({ ok: false, error: "Unknown intent" }, 400)
  } catch (e) {
    console.error("[api/timesheet]", e)
    return json({ ok: false, error: "Server error" }, 500)
  }
}
