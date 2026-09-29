import React, { createContext, useContext, useState, useCallback } from 'react';
import type { GeoPhoto } from '@/types/geo';

interface GeoPhotosContextType {
  photos: GeoPhoto[];
  addPhoto: (photo: GeoPhoto) => void;
  removePhoto: (id: string) => void;
  clearAll: () => void;
}

const GeoPhotosContext = createContext<GeoPhotosContextType | undefined>(undefined);

export function GeoPhotosProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<GeoPhoto[]>([]);

  const addPhoto = useCallback((photo: GeoPhoto) => {
    setPhotos((prev) => [photo, ...prev]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setPhotos([]);
  }, []);

  return (
    <GeoPhotosContext.Provider value={{ photos, addPhoto, removePhoto, clearAll }}>
      {children}
    </GeoPhotosContext.Provider>
  );
}

export function useGeoPhotos() {
  const context = useContext(GeoPhotosContext);
  if (!context) {
    throw new Error('useGeoPhotos debe usarse dentro de GeoPhotosProvider');
  }
  return context;
}
