export function errorHandler(err, req, res, next) {
  console.error("[error]", err.message)
  const status = err.status || 500
  res.status(status).json({ error: err.message || "Internal server error" })
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
