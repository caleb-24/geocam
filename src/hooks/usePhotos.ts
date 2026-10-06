import { useCallback } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as photosRepo from '@/db/repositories/photos';
import type { PhotoFilters } from '@/db/repositories/photos';
import type { Photo } from '@/db/schema';
import { deletePhotoFile, persistPhoto } from '@/services/photoFiles';
import type { Coords, GeoPhoto, LocatedPhoto } from '@/types/geo';

export type { PhotoFilters };

export interface AddPhotoInput {
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
}

const EMPTY_FILTERS: PhotoFilters = { search: '', albumId: null, onlyFavorites: false };

function toGeoPhoto(row: Photo): GeoPhoto {
  return {
    id: row.id,
    uri: row.uri,
    coords:
      row.latitude !== null && row.longitude !== null
        ? {
            latitude: row.latitude,
            longitude: row.longitude,
            accuracy: row.accuracy,
            timestamp: row.createdAt.getTime(),
          }
        : null,
    source: row.source,
    createdAt: row.createdAt.getTime(),
    note: row.note,
    favorite: row.favorite,
    albumId: row.albumId,
  };
}

/**
 * Fuente única de fotos para las pantallas. Las pantallas nunca importan
 * Drizzle: toda consulta/mutación pasa por este hook y los repositorios.
 */
export function usePhotos(filters?: PhotoFilters) {
  const active: PhotoFilters = filters ?? EMPTY_FILTERS;

  const { data: rows } = useLiveQuery(
    photosRepo.filteredQuery(active),
    [active.search, active.albumId, active.onlyFavorites]
  );

  const { data: locatedRows } = useLiveQuery(photosRepo.withLocationQuery(), []);

  const addPhoto = useCallback(async (input: AddPhotoInput): Promise<GeoPhoto> => {
    // C5: la foto de la cámara vive en caché y el sistema puede borrarla.
    // Se copia a documentos antes de guardar la ruta en SQLite.
    let storedUri = input.uri;
    try {
      storedUri = await persistPhoto(input.uri);
    } catch {
      // Degradación elegante: orígenes no copiables (p. ej. galería)
      // se guardan con su uri original.
      storedUri = input.uri;
    }
    const row = await photosRepo.create({
      uri: storedUri,
      latitude: input.coords?.latitude ?? null,
      longitude: input.coords?.longitude ?? null,
      accuracy: input.coords?.accuracy ?? null,
      source: input.source,
    });
    return toGeoPhoto(row);
  }, []);

  const removePhoto = useCallback(async (id: number): Promise<void> => {
    const row = await photosRepo.getById(id);
    await photosRepo.remove(id);
    // C5: al eliminar el registro también se elimina el archivo.
    if (row) {
      deletePhotoFile(row.uri);
    }
  }, []);

  const updatePhoto = useCallback(
    async (id: number, patch: Partial<Pick<Photo, 'note' | 'favorite' | 'albumId'>>): Promise<void> => {
      await photosRepo.update(id, patch);
    },
    []
  );

  const clearAll = useCallback(async (): Promise<void> => {
    const all = await photosRepo.listQuery();
    await photosRepo.clearAll();
    for (const row of all) {
      deletePhotoFile(row.uri);
    }
  }, []);

  return {
    photos: rows.map(toGeoPhoto),
    photosWithLocation: locatedRows
      .map(toGeoPhoto)
      .filter((p): p is LocatedPhoto => p.coords !== null),
    addPhoto,
    removePhoto,
    updatePhoto,
    clearAll,
  };
}

/** Una sola foto en vivo, para la pantalla de detalle. */
export function usePhoto(id: number) {
  const { data: rows } = useLiveQuery(photosRepo.byIdQuery(id), [id]);
  const row = rows[0] ?? null;
  return row ? toGeoPhoto(row) : null;
}
