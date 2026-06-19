import { sqliteTable, integer, text, real, uniqueIndex } from "drizzle-orm/sqlite-core"

export const tweets = sqliteTable("tweets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Local date/time you intend to post, ISO without timezone, e.g. "2026-06-23T19:07" */
  scheduledAt: text("scheduled_at").notNull(),
  /** The tweet text. Real line breaks are preserved. */
  text: text("text").notNull(),
  /** ISO timestamp set when you mark it posted. Null = still queued. */
  sentAt: text("sent_at"),
  /** ISO timestamp of when the row was created. */
  createdAt: text("created_at"),
})

export type Tweet = typeof tweets.$inferSelect
export type NewTweet = typeof tweets.$inferInsert

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** Hourly rate for the project, in euros. Null = not set. */
  hourlyRate: real("hourly_rate"),
})

export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Day worked, as YYYY-MM-DD (local). */
    date: text("date").notNull(),
    /** Hours worked that day on that project. */
    hours: real("hours").notNull(),
  },
  (t) => ({
    // One entry per project per day, so cell edits are an upsert.
    projectDate: uniqueIndex("time_entries_project_date").on(t.projectId, t.date),
  }),
)

export type Project = typeof projects.$inferSelect
export type TimeEntry = typeof timeEntries.$inferSelect

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
})

export const dayLocations = sqliteTable(
  "day_locations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Day, as YYYY-MM-DD (local). One location per day. */
    date: text("date").notNull(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
  },
  (t) => ({
    dateUniq: uniqueIndex("day_locations_date").on(t.date),
  }),
)

export type Location = typeof locations.$inferSelect
export type DayLocation = typeof dayLocations.$inferSelect
