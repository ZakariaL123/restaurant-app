import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { requiredEnv } from './env.mjs'

const storage = new S3Client({
  endpoint: requiredEnv('AWS_ENDPOINT_URL_S3'),
  region: requiredEnv('AWS_REGION'),
  credentials: {
    accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
    secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const menuFile = { Bucket: 'assets', Key: 'menu/restaurant-menu.txt' }

export async function publishMenuFile(text) {
  await storage.send(
    new PutObjectCommand({ ...menuFile, Body: text, ContentType: 'text/plain; charset=utf-8' }),
  )
}

export async function downloadMenuFile() {
  const result = await storage.send(new GetObjectCommand(menuFile))
  if (!result.Body) throw new Error('The stored menu has no content.')
  return result.Body.transformToString()
}

