import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type CameraMountError,
  type CameraType,
  type CameraCapturedPicture,
} from 'expo-camera';
import type { PermissionState } from '@/types/geo';

export function useCamera() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissionState: PermissionState = !permission
    ? 'checking'
    : permission.granted
      ? 'granted'
      : !permission.canAskAgain
        ? 'blocked'
        : permission.status === 'undetermined'
          ? 'undetermined'
          : 'denied';

  const toggleFacing = useCallback(() => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const takePhoto = useCallback(async (): Promise<CameraCapturedPicture | null> => {
    if (!cameraRef.current || !isReady || isCapturing) return null;
    setIsCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      return photo ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo tomar la foto');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, isCapturing]);

  const onCameraReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const onMountError = useCallback((e: CameraMountError) => {
    setError(e.message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const openSettings = useCallback((): void => {
    void Linking.openSettings();
  }, []);

  return {
    cameraRef,
    permissionState,
    requestPermission,
    openSettings,
    facing,
    toggleFacing,
    onCameraReady,
    onMountError,
    takePhoto,
    isCapturing,
    error,
    clearError,
  };
}
