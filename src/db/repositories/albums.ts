import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { albums, photos, type Album } from '../schema';

export function listQuery() {
  return db.select().from(albums).orderBy(desc(albums.createdAt));
}

export async function list(): Promise<Album[]> {
  return listQuery();
}

export async function create(name: string): Promise<Album> {
  const clean = name.trim();
  if (clean.length === 0) throw new Error('El nombre del álbum no puede estar vacío');
  const rows = await db.insert(albums).values({ name: clean }).returning();
  const row = rows[0];
  if (!row) throw new Error('No se pudo crear el álbum');
  return row;
}

/**
 * Borra un álbum dejando sus fotos huérfanas (album_id = NULL), no borrándolas.
 * Se hace explícito en el repositorio porque la migración generada por
 * drizzle-kit no incluye la cláusula ON DELETE SET NULL en el ALTER TABLE,
 * y las migraciones no se editan a mano.
 */
export async function remove(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(photos).set({ albumId: null }).where(eq(photos.albumId, id));
    await tx.delete(albums).where(eq(albums.id, id));
  });
}
