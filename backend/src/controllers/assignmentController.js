import * as assignmentService from "../services/assignmentService.js"

export async function getAssignments(req, res, next) {
  try {
    const data = await assignmentService.listAssignments(req.query)
    res.json({ data, count: data.length })
  } catch (err) {
    next(err)
  }
}

export async function getAssignmentById(req, res, next) {
  try {
    const data = await assignmentService.getAssignment(req.params.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function postAssignment(req, res, next) {
  try {
    const data = await assignmentService.createAssignment(req.body)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function putAssignment(req, res, next) {
  try {
    const data = await assignmentService.updateAssignment(req.params.id, req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteAssignmentById(req, res, next) {
  try {
    await assignmentService.deleteAssignment(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
