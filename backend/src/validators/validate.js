import { HttpError } from "../middleware/error.js"

export function validate(validatorFn) {
  return (req, res, next) => {
    try {
      const error = validatorFn(req.body, req.method)
      if (error) {
        throw new HttpError(400, error, "VALIDATION_ERROR")
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
