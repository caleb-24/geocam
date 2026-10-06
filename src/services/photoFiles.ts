import { Directory, File, Paths } from 'expo-file-system';

const photosDir = new Directory(Paths.document, 'photos');

/**
 * Copia la foto desde la caché (donde la deja la cámara) a la carpeta de
 * documentos de la app, que el sistema no borra. Devuelve el nuevo uri
 * permanente para guardar en SQLite.
 *
 * Nota: `copy()` es asíncrono en la API nueva (SDK 57); por eso esta
 * función también lo es. Si la copia falla (p. ej. un uri `ph://` de la
 * galería que no es un archivo copiable), se propaga el error y quien
 * llama decide si conserva el uri original.
 */
export async function persistPhoto(cacheUri: string): Promise<string> {
  if (!photosDir.exists) {
    photosDir.create();
  }
  const source = new File(cacheUri);
  const destination = new File(photosDir, `${Date.now()}.jpg`);
  await source.copy(destination);
  return destination.uri;
}

/** Borra el archivo permanente. No falla si ya no existe. */
export function deletePhotoFile(uri: string): void {
  try {
    // Solo se administran archivos dentro de la carpeta de la app.
    if (!uri.startsWith(photosDir.uri)) return;
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // El registro en SQLite manda: un archivo huérfano no bloquea el borrado.
  }
}
