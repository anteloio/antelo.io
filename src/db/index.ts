import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

const url = process.env.TURSO_DATABASE_URL ?? import.meta.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN ?? import.meta.env.TURSO_AUTH_TOKEN

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set (check .envrc)")
}

const client = createClient({ url, authToken })

export const db = drizzle(client, { schema })
export { schema }
