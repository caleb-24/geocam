import { useCallback } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as albumsRepo from '@/db/repositories/albums';

/** Álbumes en vivo para filtros y la pantalla de detalle. */
export function useAlbums() {
  const { data: albums } = useLiveQuery(albumsRepo.listQuery(), []);

  const createAlbum = useCallback(async (name: string) => {
    return albumsRepo.create(name);
  }, []);

  const removeAlbum = useCallback(async (id: number): Promise<void> => {
    await albumsRepo.remove(id);
  }, []);

  return { albums, createAlbum, removeAlbum };
}
