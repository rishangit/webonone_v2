import knex from 'knex'
import { knexConfig } from '../config/knex.js'

export const db = knex(knexConfig)
