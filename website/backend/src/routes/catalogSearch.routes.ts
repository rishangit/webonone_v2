import { Router } from 'express'
import * as catalogSearchController from '../controllers/catalogSearch.controller.js'

const router = Router()

/** Anonymous public catalog search (BFF → WebOnOne internal). */
router.get('/catalog/search', catalogSearchController.searchCatalog)

export default router
