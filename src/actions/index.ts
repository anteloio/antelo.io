import { defineAction } from "astro:actions"
import { z } from "astro:schema"
import { eq } from "drizzle-orm"
import { db } from "../db"
import { tweets } from "../db/schema"

export const server = {
  // Toggle a tweet's sent state. sent=true stamps sent_at with now; false clears it.
  toggleSent: defineAction({
    accept: "form",
    input: z.object({
      id: z.coerce.number(),
      sent: z.coerce.boolean(),
    }),
    handler: async ({ id, sent }) => {
      await db
        .update(tweets)
        .set({ sentAt: sent ? new Date().toISOString() : null })
        .where(eq(tweets.id, id))
      return { ok: true }
    },
  }),
}
