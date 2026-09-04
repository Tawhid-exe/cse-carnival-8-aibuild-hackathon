import { HttpError } from "./error.js"

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000"

export async function resolveUserFromSession(cookieOrToken) {
  if (!cookieOrToken) return null

  try {
    const headers = {}
    if (cookieOrToken.startsWith("Bearer ")) {
      headers["Authorization"] = cookieOrToken
    } else {
      headers["cookie"] = cookieOrToken
    }

    const sessionRes = await fetch(`${FRONTEND_ORIGIN}/api/auth/get-session`, {
      headers
    })

    if (!sessionRes.ok) return null
    const data = await sessionRes.json()
    return data?.user || null
  } catch (err) {
    // If frontend is unreachable during tests or offline dev, gracefully return null
    return null
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const cookie = req.headers.cookie

    const user = await resolveUserFromSession(authHeader || cookie)
    if (user) {
      req.user = user
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function requireAuth(req, res, next) {
  try {
    if (!req.user) {
      const authHeader = req.headers.authorization
      const cookie = req.headers.cookie
      const user = await resolveUserFromSession(authHeader || cookie)
      if (user) {
        req.user = user
      }
    }

    if (!req.user) {
      throw new HttpError(401, "Authentication required", "UNAUTHORIZED")
    }

    next()
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(new HttpError(403, "Admin privileges required", "FORBIDDEN"))
  }
  next()
}
