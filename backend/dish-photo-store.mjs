import { dishPhotoUrl } from './dish-photos.mjs'
import { sql } from './menu.mjs'

export async function saveDishPhoto(filename, bytes) {
  await sql`
    INSERT INTO public.dish_photos (filename, image)
    VALUES (${filename}, decode(${Buffer.from(bytes).toString('base64')}, 'base64'))
  `
}

export async function readDishPhoto(filename) {
  const [photo] = await sql`
    SELECT encode(image, 'base64') AS contents
    FROM public.dish_photos WHERE filename = ${filename}
      AND EXISTS (SELECT 1 FROM public.menu_items WHERE image_url = ${dishPhotoUrl(filename)})
  `
  return photo ? Buffer.from(photo.contents, 'base64') : null
}
