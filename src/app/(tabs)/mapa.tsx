import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert, FlatList, Dimensions } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useIsFocused, useRouter } from 'expo-router';
import { usePhotos } from '@/hooks/usePhotos';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import type { Coords, LocatedPhoto } from '@/types/geo';

const DEFAULT_REGION: Region = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const CLOSE_DELTA = {
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/** Fotos del "mismo lugar": redondeo a 4 decimales (~11 m). */
const GROUP_PRECISION = 4;

interface PhotoGroup {
  key: string;
  latitude: number;
  longitude: number;
  photos: LocatedPhoto[];
}

function groupByLocation(photos: LocatedPhoto[]): PhotoGroup[] {
  const map = new Map<string, PhotoGroup>();
  for (const photo of photos) {
    const latitude = Number(photo.coords.latitude.toFixed(GROUP_PRECISION));
    const longitude = Number(photo.coords.longitude.toFixed(GROUP_PRECISION));
    const key = `${latitude},${longitude}`;
    const existing = map.get(key);
    if (existing) {
      existing.photos.push(photo);
    } else {
      map.set(key, { key, latitude, longitude, photos: [photo] });
    }
  }
  return [...map.values()];
}

function regionForCoords(coords: Coords): Region {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    ...CLOSE_DELTA,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  map: {
    flex: 1,
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 32,
    gap: 8,
  },
  noPhotosText: {
    fontSize: 18,
    color: '#a3a3a3',
    marginTop: 16,
    textAlign: 'center',
  },
  noPhotosSubtext: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 16,
    borderRadius: 9999,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontWeight: '600',
    color: '#111',
  },
  infoBox: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubtext: {
    color: '#a3a3a3',
    fontSize: 12,
    marginTop: 4,
  },
  marker: {
    backgroundColor: '#10b981',
    borderRadius: 50,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 20,
  },
  markerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 9999,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationText: {
    fontSize: 22,
    color: '#10b981',
  },
  errorBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 84,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '55%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetCounter: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetClose: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '700',
    padding: 8,
  },
  carouselImage: {
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sheetButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailButton: {
    backgroundColor: '#10b981',
  },
  detailButtonText: {
    color: '#111',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
  },
  deleteButtonText: {
    color: '#fecaca',
    fontWeight: '700',
  },
});

export default function MapaScreen() {
  // GPS solo con la pantalla enfocada: al salir del tab se limpia el watch.
  const isFocused = useIsFocused();
  const router = useRouter();
  const { photosWithLocation: photosWithCoords, removePhoto } = usePhotos();
  const {
    permission: locPermission,
    coords: locCoords,
    error: locError,
    requestPermission: requestLocPermission,
    getCurrent: getCurrentLoc,
    openSettings: openLocSettings,
  } = useGeoLocation({ watch: isFocused });
  const mapRef = useRef<MapView>(null);
  const hasCenteredRef = useRef(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const groups = useMemo(() => groupByLocation(photosWithCoords), [photosWithCoords]);
  // El grupo se deriva de los datos en vivo: si se borra la última foto,
  // la hoja se cierra sola.
  const selectedGroup = groups.find((g) => g.key === selectedKey) ?? null;
  const selectedPhoto = selectedGroup?.photos[page] ?? null;

  const centerOn = useCallback((region: Region): void => {
    mapRef.current?.animateToRegion(region, 500);
  }, []);

  // Al llegar el primer fix (y si no hay fotos que mostrar), centrar una vez.
  // No se repite para no pelear con los gestos del usuario.
  useEffect(() => {
    if (hasCenteredRef.current || photosWithCoords.length > 0) return;
    if (locCoords) {
      hasCenteredRef.current = true;
      mapRef.current?.animateToRegion(regionForCoords(locCoords), 500);
    }
  }, [locCoords, photosWithCoords.length]);

  const handleSelectGroup = useCallback((key: string): void => {
    setSelectedKey(key);
    setPage(0);
  }, []);

  const handleDeletePhoto = useCallback(
    (photo: LocatedPhoto, groupSize: number): void => {
      Alert.alert('¿Eliminar esta foto?', 'Se quitará del mapa y de la lista.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await removePhoto(photo.id);
              // Si era la última del grupo, la hoja se cierra sola.
              setPage((p) => Math.max(0, Math.min(p, groupSize - 2)));
            })();
          },
        },
      ]);
    },
    [removePhoto]
  );

  const handleMyLocation = useCallback(async (): Promise<void> => {
    if (locPermission === 'blocked') {
      openLocSettings();
      return;
    }
    if (locPermission !== 'granted') {
      const granted = await requestLocPermission();
      if (!granted) return;
    }
    const coords = locCoords ?? (await getCurrentLoc());
    if (coords) {
      hasCenteredRef.current = true;
      centerOn(regionForCoords(coords));
    }
  }, [locPermission, locCoords, requestLocPermission, getCurrentLoc, openLocSettings, centerOn]);

  if (locPermission === 'checking') {
    return <View style={{ flex: 1, backgroundColor: '#1e293b' }} />;
  }

  const initialRegion =
    photosWithCoords.length > 0
      ? regionForCoords(photosWithCoords[0].coords)
      : (locCoords ? regionForCoords(locCoords) : DEFAULT_REGION);

  const showEmptyState =
    photosWithCoords.length === 0 &&
    locCoords === null &&
    locPermission !== 'granted';

  if (showEmptyState) {
    const blocked = locPermission === 'blocked';
    return (
      <View style={styles.noPhotosContainer}>
        <Text style={{ fontSize: 50 }}>🗺️</Text>
        <Text style={styles.noPhotosText}>No hay fotos geolocalizadas</Text>
        <Text style={styles.noPhotosSubtext}>
          {blocked
            ? 'La ubicación está desactivada. Actívala en Ajustes para centrar el mapa.'
            : 'Permite la ubicación para centrar el mapa, o captura fotos en GeoCam.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={blocked ? 'Abrir Ajustes' : 'Permitir acceso a ubicación'}
          onPress={blocked ? openLocSettings : requestLocPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>
            {blocked ? 'Abrir Ajustes' : 'Permitir acceso'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const imageSize = Math.min(280, screenWidth - 64);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {groups.map((group) => (
          <Marker
            key={group.key}
            coordinate={{ latitude: group.latitude, longitude: group.longitude }}
            onPress={() => handleSelectGroup(group.key)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerIcon}>📸</Text>
              {group.photos.length > 1 && (
                <View style={styles.markerBadge}>
                  <Text style={styles.markerBadgeText}>{group.photos.length}</Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📍 {photosWithCoords.length} foto{photosWithCoords.length !== 1 ? 's' : ''} en el mapa
        </Text>
        <Text style={styles.infoSubtext}>Toca un marcador para ver sus fotos en carrusel</Text>
      </View>

      {locError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{locError}</Text>
        </View>
      )}

      {selectedGroup && selectedPhoto && (
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {selectedGroup.photos.length} foto{selectedGroup.photos.length !== 1 ? 's' : ''} aquí
            </Text>
            <Text style={styles.sheetCounter}>
              {Math.min(page + 1, selectedGroup.photos.length)} / {selectedGroup.photos.length}
            </Text>
            <Pressable
              onPress={() => setSelectedKey(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar carrusel"
            >
              <Text style={styles.sheetClose}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            data={selectedGroup.photos}
            keyExtractor={(item) => String(item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: (screenWidth - imageSize) / 2, gap: 16 }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (imageSize + 16));
              setPage(Math.max(0, Math.min(index, selectedGroup.photos.length - 1)));
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={[styles.carouselImage, { width: imageSize, height: imageSize }]}
              />
            )}
          />

          <View style={styles.sheetActions}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/foto/[id]', params: { id: String(selectedPhoto.id) } })
              }
              style={[styles.sheetButton, styles.detailButton]}
              accessibilityRole="button"
              accessibilityLabel="Ver detalle de la foto"
            >
              <Text style={styles.detailButtonText}>Ver</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDeletePhoto(selectedPhoto, selectedGroup.photos.length)}
              style={[styles.sheetButton, styles.deleteButton]}
              accessibilityRole="button"
              accessibilityLabel="Eliminar esta foto"
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
        onPress={handleMyLocation}
        style={[styles.myLocationButton, selectedGroup && { bottom: 440 }]}
      >
        <Text style={styles.myLocationText}>◎</Text>
      </Pressable>
    </View>
  );
}
