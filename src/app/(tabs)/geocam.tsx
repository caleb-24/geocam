import { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { useCamera } from '@/hooks/useCamera';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useShake } from '@/hooks/useShake';
import { useGallery } from '@/hooks/useGallery';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { useGeoPhotos } from '@/context/GeoPhotosContext';
import type { GeoPhoto } from '@/types/geo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    ...StyleSheet.absoluteFill,
  },
  locationNotice: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(180, 161, 0, 0.92)',
    padding: 12,
    gap: 8,
  },
  locationNoticeText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#111',
  },
  locationNoticeButton: {
    alignSelf: 'center',
    borderRadius: 9999,
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  locationNoticeButtonText: {
    fontWeight: '600',
    color: '#fff',
  },
  coordsView: {
    position: 'absolute',
    left: 16,
    top: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordsViewBelowNotice: {
    top: 168,
  },
  coordsText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#10b981',
  },
  accuracyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#9ca3af',
  },
  errorView: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 128,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#fff',
  },
  controlsView: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  thumbnail: {
    height: 56,
    width: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  galleryButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  captureButton: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    height: 64,
    width: 64,
    borderRadius: 32,
  },
  toggleButton: {
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 24,
  },
});

export default function GeoCamScreen() {
  // Solo suscribir GPS / acelerómetro y montar la cámara con la pantalla enfocada.
  // En Tabs las pantallas no se desmontan al cambiar de tab: sin esto el GPS
  // y el acelerómetro seguirían activos en segundo plano.
  const isFocused = useIsFocused();
  const {
    cameraRef,
    permissionState: camPermission,
    requestPermission: requestCamPermission,
    openSettings: openCamSettings,
    facing,
    toggleFacing,
    onCameraReady,
    onMountError,
    takePhoto,
    isCapturing,
    error: camError,
  } = useCamera();
  const geo = useGeoLocation({ watch: isFocused });
  const {
    pickImage,
    isPicking,
    error: galleryError,
    openSettings: openGallerySettings,
  } = useGallery();
  const { addPhoto, photos, removePhoto, clearAll } = useGeoPhotos();
  const [lastPhoto, setLastPhoto] = useState<GeoPhoto | null>(null);

  const handleShake = useCallback(() => {
    if (photos.length === 0) {
      Alert.alert('Sin fotos', 'No hay fotos para borrar');
      return;
    }

    Alert.alert(
      '¿Borrar todas las fotos?',
      `Se eliminarán ${photos.length} foto${photos.length !== 1 ? 's' : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            clearAll();
            setLastPhoto(null);
            Alert.alert('Completado', 'Todas las fotos han sido eliminadas');
          },
        },
      ]
    );
  }, [photos.length, clearAll]);

  // enabled: isFocused limpia la suscripción al acelerómetro al salir.
  const shake = useShake(handleShake, {
    threshold: 2.5,
    cooldownMs: 1500,
    enabled: isFocused,
  });

  const handleDeleteOne = useCallback((): void => {
    if (!lastPhoto) return;
    const target = lastPhoto;
    Alert.alert('¿Eliminar esta foto?', 'Solo se eliminará la última foto.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          removePhoto(target.id);
          const remaining = photos.filter((p) => p.id !== target.id);
          setLastPhoto(remaining[0] ?? null);
        },
      },
    ]);
  }, [lastPhoto, photos, removePhoto]);

  if (camPermission === 'checking') {
    return <View style={{ flex: 1, backgroundColor: '#111' }} />;
  }

  if (camPermission !== 'granted') {
    return (
      <PermissionPrimer
        title="GeoCam necesita tu cámara"
        description="La usamos solo para tomar fotos que tú decidas guardar."
        state={camPermission}
        onRequest={requestCamPermission}
        onOpenSettings={openCamSettings}
      />
    );
  }

  const handleCapture = async (): Promise<void> => {
    const photo = await takePhoto();
    if (!photo) return;

    // La cámara funciona sin ubicación: si se negó, se guarda sin coords.
    const coords =
      geo.permission === 'granted' ? (geo.coords ?? (await geo.getCurrent())) : null;

    const geoPhoto: GeoPhoto = {
      id: String(Date.now()),
      uri: photo.uri,
      coords,
      source: 'camera',
      createdAt: Date.now(),
    };

    addPhoto(geoPhoto);
    setLastPhoto(geoPhoto);

    Alert.alert(
      'Foto capturada',
      coords
        ? `Con ubicación.\nTotal: ${photos.length + 1}`
        : `Sin ubicación (permiso denegado). La cámara sigue funcionando.\nTotal: ${photos.length + 1}`
    );
  };

  const handlePickGallery = async (): Promise<void> => {
    const outcome = await pickImage();
    if (outcome.status === 'canceled' || outcome.status === 'denied') return;
    if (outcome.status === 'blocked') {
      Alert.alert(
        'Galería bloqueada',
        'Desactivaste el acceso a fotos. Habilítalo en Ajustes para elegir imágenes.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: openGallerySettings },
        ]
      );
      return;
    }
    if (outcome.status === 'error') return; // error ya visible como estado

    // Igual que la cámara: sin ubicación se guarda igual, con coords: null.
    const coords =
      geo.permission === 'granted' ? (geo.coords ?? (await geo.getCurrent())) : null;

    const geoPhoto: GeoPhoto = {
      id: String(Date.now()),
      uri: outcome.asset.uri,
      coords,
      source: 'gallery',
      createdAt: Date.now(),
    };

    addPhoto(geoPhoto);
    setLastPhoto(geoPhoto);

    Alert.alert(
      'Foto agregada',
      coords
        ? `Desde galería, con ubicación.\nTotal: ${photos.length + 1}`
        : `Desde galería, sin ubicación.\nTotal: ${photos.length + 1}`
    );
  };

  const showLocationNotice =
    geo.permission !== 'granted' && geo.permission !== 'checking';
  const locationBlocked = geo.permission === 'blocked';
  const displayError = camError ?? geo.error ?? shake.error ?? galleryError;

  return (
    <View style={styles.container}>
      {isFocused ? (
        <CameraView
          ref={cameraRef}
          style={styles.cameraView}
          facing={facing}
          onCameraReady={onCameraReady}
          onMountError={onMountError}
        />
      ) : (
        <View style={styles.cameraView} />
      )}

      {showLocationNotice && (
        <View style={styles.locationNotice}>
          <Text style={styles.locationNoticeText}>
            {locationBlocked
              ? 'Ubicación desactivada. La cámara sigue funcionando, pero tus fotos no tendrán ubicación.'
              : 'Activa la ubicación para etiquetar tus fotos. La cámara funciona sin ubicación.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              locationBlocked ? 'Abrir Ajustes' : 'Permitir acceso a ubicación'
            }
            onPress={
              locationBlocked ? geo.openSettings : geo.requestPermission
            }
            style={styles.locationNoticeButton}
          >
            <Text style={styles.locationNoticeButtonText}>
              {locationBlocked ? 'Abrir Ajustes' : 'Permitir acceso'}
            </Text>
          </Pressable>
        </View>
      )}

      {geo.coords && (
        <View
          style={[
            styles.coordsView,
            showLocationNotice && styles.coordsViewBelowNotice,
          ]}
        >
          <Text style={styles.coordsText}>
            {geo.coords.latitude.toFixed(5)}, {geo.coords.longitude.toFixed(5)}
          </Text>
          <Text style={styles.accuracyText}>
            ±{Math.round(geo.coords.accuracy ?? 0)} m
          </Text>
        </View>
      )}

      {displayError && (
        <View style={styles.errorView}>
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      <View style={styles.controlsView}>
        {lastPhoto ? (
          <Pressable
            onPress={handlePickGallery}
            onLongPress={handleDeleteOne}
            disabled={isPicking}
            accessibilityRole="button"
            accessibilityLabel="Elegir foto de galería. Mantén presionado para eliminar la última foto."
          >
            <Image source={{ uri: lastPhoto.uri }} style={styles.thumbnail} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handlePickGallery}
            disabled={isPicking}
            style={styles.galleryButton}
            accessibilityRole="button"
            accessibilityLabel="Elegir foto de galería"
          >
            <Ionicons name="images" size={28} color="#fff" />
          </Pressable>
        )}

        <Pressable
          onPress={handleCapture}
          disabled={isCapturing}
          style={styles.captureButton}
        >
          <View
            style={[
              styles.captureButtonInner,
              { backgroundColor: isCapturing ? '#a3a3a3' : '#fff' },
            ]}
          />
        </Pressable>

        <Pressable onPress={toggleFacing} style={styles.toggleButton}>
          <Text style={styles.toggleText}>↻</Text>
        </Pressable>
      </View>
    </View>
  );
}
