import { and, desc, eq, isNotNull, like, type SQL } from 'drizzle-orm';
import { db } from '../client';
import { photos, type NewPhoto, type Photo } from '../schema';

export interface PhotoFilters {
  search: string;
  albumId: number | null;
  onlyFavorites: boolean;
}

/** Consulta base: todas las fotos, más recientes primero. */
export function listQuery() {
  return db.select().from(photos).orderBy(desc(photos.createdAt));
}

/** Solo fotos con ubicación (latitud no nula). */
export function withLocationQuery() {
  return db
    .select()
    .from(photos)
    .where(isNotNull(photos.latitude))
    .orderBy(desc(photos.createdAt));
}

/** Una foto por id (para la pantalla de detalle). */
export function byIdQuery(id: number) {
  return db.select().from(photos).where(eq(photos.id, id));
}

/**
 * Lista con búsqueda por nota y filtros por álbum / favoritas.
 * Se reconstruye cuando cambian los filtros y useLiveQuery la re-ejecuta.
 */
export function filteredQuery(filters: PhotoFilters) {
  const conditions: SQL[] = [];
  const search = filters.search.trim();
  if (search.length > 0) {
    conditions.push(like(photos.note, `%${search}%`));
  }
  if (filters.albumId !== null) {
    conditions.push(eq(photos.albumId, filters.albumId));
  }
  if (filters.onlyFavorites) {
    conditions.push(eq(photos.favorite, true));
  }
  const base = db.select().from(photos);
  const withWhere = conditions.length > 0 ? base.where(and(...conditions)) : base;
  return withWhere.orderBy(desc(photos.createdAt));
}

export async function create(input: NewPhoto): Promise<Photo> {
  const rows = await db.insert(photos).values(input).returning();
  const row = rows[0];
  if (!row) throw new Error('No se pudo guardar la foto');
  return row;
}

export async function getById(id: number): Promise<Photo | null> {
  const rows = await byIdQuery(id);
  return rows[0] ?? null;
}

export async function update(
  id: number,
  patch: Partial<Pick<Photo, 'note' | 'favorite' | 'albumId'>>
): Promise<void> {
  await db.update(photos).set(patch).where(eq(photos.id, id));
}

export async function remove(id: number): Promise<void> {
  await db.delete(photos).where(eq(photos.id, id));
}

export async function clearAll(): Promise<void> {
  await db.delete(photos);
}
