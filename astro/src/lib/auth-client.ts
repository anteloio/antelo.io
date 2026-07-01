import { createAuthClient } from "better-auth/client"

// baseURL is inferred from window.location (same-origin), so nothing to configure.
export const authClient = createAuthClient()
