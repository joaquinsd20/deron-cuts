// Reduce la foto en el navegador antes de subirla (las fotos del celular pesan
// varios MB). Resultado: JPEG de máx. 1200px por lado, normalmente < 300 KB.
export async function comprimirImagen(archivo, maxLado = 1200, calidad = 0.85) {
  const bitmap = await cargarImagen(archivo)
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  canvas.getContext('2d').drawImage(bitmap, 0, 0, ancho, alto)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', calidad))
  if (!blob) throw new Error('No se pudo procesar la imagen')
  const nombre = (archivo.name || 'foto').replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], nombre, { type: 'image/jpeg' })
}

function cargarImagen(archivo) {
  if (window.createImageBitmap) {
    return createImageBitmap(archivo, { imageOrientation: 'from-image' })
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(archivo)
  })
}
