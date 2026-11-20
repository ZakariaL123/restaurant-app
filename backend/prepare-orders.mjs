import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import { requiredEnv } from './env.mjs'

const connection = neon(requiredEnv('DATABASE_URL_UNPOOLED'))
const schema = await readFile(new URL('./orders.sql', import.meta.url), 'utf8')
await connection.query(schema)
console.log('Neon orders and order statuses are ready.')
