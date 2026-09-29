import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import {
  launchImageLibraryAsync,
  useMediaLibraryPermissions,
  type ImagePickerAsset,
} from 'expo-image-picker';
import type { PermissionState } from '@/types/geo';

export type GalleryPickOutcome =
  | { status: 'picked'; asset: ImagePickerAsset }
  | { status: 'canceled' }
  | { status: 'denied' }
  | { status: 'blocked' }
  | { status: 'error' };

function mapPermission(res: {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}): PermissionState {
  if (res.granted) return 'granted';
  if (!res.canAskAgain) return 'blocked';
  if (res.status === 'undetermined') return 'undetermined';
  return 'denied';
}

export function useGallery() {
  const [permission, requestPermission] = useMediaLibraryPermissions();
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissionState: PermissionState = !permission
    ? 'checking'
    : mapPermission(permission);

  const openSettings = useCallback((): void => {
    void Linking.openSettings();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // El permiso se pide aquí, en contexto (tap del usuario), nunca al montar.
  const pickImage = useCallback(async (): Promise<GalleryPickOutcome> => {
    setError(null);
    try {
      if (permissionState !== 'granted') {
        const res = await requestPermission();
        const next = mapPermission(res);
        if (next === 'blocked') return { status: 'blocked' };
        if (next !== 'granted') {
          setError('Permiso de galería denegado. Puedes intentarlo de nuevo.');
          return { status: 'denied' };
        }
      }

      setIsPicking(true);
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (result.canceled) return { status: 'canceled' };

      const asset = result.assets[0] ?? null;
      if (!asset) {
        setError('No se pudo leer la imagen seleccionada.');
        return { status: 'error' };
      }
      return { status: 'picked', asset };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir la galería');
      return { status: 'error' };
    } finally {
      setIsPicking(false);
    }
  }, [permissionState, requestPermission]);

  return {
    permissionState,
    pickImage,
    isPicking,
    error,
    clearError,
    openSettings,
  };
}
