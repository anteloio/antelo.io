import { sqliteTable, integer, text, real, uniqueIndex, index } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// --- Better Auth tables (managed by better-auth via the drizzle adapter) ---
// Field (JS) names must match better-auth's expectations; SQL names are snake_case.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
)

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
)

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)

export type User = typeof user.$inferSelect

// --- App tables ---

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
  /** Owner. Null on rows created before auth; backfilled by migration. */
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** Hourly rate for the project, in euros. Null = not set. */
  hourlyRate: real("hourly_rate"),
})

export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Owner. Null on rows created before auth; backfilled by migration. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** Day worked, as YYYY-MM-DD (local). */
    date: text("date").notNull(),
    /** Hours worked that day on that project. */
    hours: real("hours").notNull(),
  },
  (t) => ({
    // One entry per project per day, so cell edits are an upsert. projectId already
    // implies the owner, so this stays correct across users.
    projectDate: uniqueIndex("time_entries_project_date").on(t.projectId, t.date),
  }),
)

export type Project = typeof projects.$inferSelect
export type TimeEntry = typeof timeEntries.$inferSelect

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Owner. Null on rows created before auth; backfilled by migration. */
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
})

export const dayLocations = sqliteTable(
  "day_locations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Owner. Null on rows created before auth; backfilled by migration. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    /** Day, as YYYY-MM-DD (local). One location per day per user. */
    date: text("date").notNull(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
  },
  (t) => ({
    userDate: uniqueIndex("day_locations_user_date").on(t.userId, t.date),
  }),
)

export type Location = typeof locations.$inferSelect
export type DayLocation = typeof dayLocations.$inferSelect
