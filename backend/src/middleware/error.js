export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code || codeFromStatus(status)
  }
}

function codeFromStatus(status) {
  const map = {
    400: "VALIDATION_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "CAPACITY_EXCEEDED",
    500: "INTERNAL_ERROR"
  }
  return map[status] || "INTERNAL_ERROR"
}

export function errorHandler(err, req, res, next) {
  // Mongoose ValidationError → 400
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message).join("; ")
    return res.status(400).json({ error: messages, code: "VALIDATION_ERROR" })
  }

  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field"
    return res.status(409).json({
      error: `Duplicate value for ${field}`,
      code: "CONFLICT"
    })
  }

  console.error("[error]", err.message)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || "Internal server error",
    code: err.code || codeFromStatus(status)
  })
}

