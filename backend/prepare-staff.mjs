import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import { requiredEnv } from './env.mjs'

const connection = neon(requiredEnv('DATABASE_URL_UNPOOLED'))
const schema = await readFile(new URL('./staff-access.sql', import.meta.url), 'utf8')
await connection.query(schema)
console.log('Neon staff invitations table is ready.')
