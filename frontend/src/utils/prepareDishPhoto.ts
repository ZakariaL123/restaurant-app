const maxFileSize = 30 * 1024 * 1024
const maxSide = 1600

export async function prepareDishPhoto(file: File): Promise<Blob> {
  if (!file.size || file.size > maxFileSize) throw new Error('Unsupported photo size')

  const source = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = source
    await image.decode()
    const { naturalWidth, naturalHeight } = image
    if (!naturalWidth || !naturalHeight) throw new Error('Could not read photo')

    const scale = Math.min(1, maxSide / Math.max(naturalWidth, naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(naturalHeight * scale))
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Could not prepare photo')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob?.type === 'image/jpeg') resolve(blob)
          else reject(new Error('Could not encode photo'))
        },
        'image/jpeg',
        0.85,
      )
    })
  } finally {
    URL.revokeObjectURL(source)
  }
}
