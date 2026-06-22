import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db, schema } from "../db"

const env = (key: string): string | undefined => process.env[key] ?? (import.meta.env[key] as string | undefined)

export const auth = betterAuth({
  baseURL: env("BETTER_AUTH_URL") ?? "http://localhost:4321",
  secret: env("BETTER_AUTH_SECRET"),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: env("GOOGLE_CLIENT_ID") ?? "",
      clientSecret: env("GOOGLE_CLIENT_SECRET") ?? "",
    },
  },
})
