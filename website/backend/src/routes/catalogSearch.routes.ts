import { Router } from 'express'
import * as catalogSearchController from '../controllers/catalogSearch.controller.js'

const router = Router()

/** Anonymous public catalog search (BFF → WebOnOne internal). */
router.get('/catalog/search', catalogSearchController.searchCatalog)

/** Anonymous public catalog detail (BFF → WebOnOne internal). */
router.get('/catalog/:kind/:id', catalogSearchController.getCatalogItem)

export default router
