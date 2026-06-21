import { Router } from 'express'
import * as filesController from '../controllers/files.controller.js'

const router = Router()

router.get('/files/:id/:fileName', filesController.serveFile)

export default router
