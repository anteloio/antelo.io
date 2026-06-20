import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date().optional(),
    draft: z.boolean().optional(),
  }),
})

const tweets = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tweets" }),
  schema: z.object({}),
})

export const collections = { blog, tweets }
