import { combineEpics } from 'redux-observable'
import { authEpics } from '@/features/auth/store/authEpics'
import { attributesEpics } from '@/features/attributes/store'
import { dashboardEpics } from '@/features/dashboard/store'
import { productsEpics } from '@/features/products/store'
import { servicesEpics } from '@/features/services/store'
import { spacesEpics } from '@/features/spaces/store'
import { tagsEpics } from '@/features/tags/store'
import { unitsEpics } from '@/features/units/store'

export const rootEpic = combineEpics(
  authEpics,
  dashboardEpics,
  tagsEpics,
  unitsEpics,
  attributesEpics,
  productsEpics,
  servicesEpics,
  spacesEpics,
)
