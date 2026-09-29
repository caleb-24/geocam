import { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import MapView, { Marker, Callout, type Region } from 'react-native-maps';
import { useIsFocused } from 'expo-router';
import { useGeoPhotos } from '@/context/GeoPhotosContext';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import type { Coords, GeoPhoto } from '@/types/geo';

type LocatedPhoto = GeoPhoto & { coords: Coords };

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
  calloutImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
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
});

export default function MapaScreen() {
  // GPS solo con la pantalla enfocada: al salir del tab se limpia el watch.
  const isFocused = useIsFocused();
  const { photos, removePhoto } = useGeoPhotos();
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

  const photosWithCoords: LocatedPhoto[] = photos.filter(
    (p): p is LocatedPhoto => p.coords !== null
  );

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

  const handleDeletePhoto = useCallback(
    (photo: LocatedPhoto): void => {
      Alert.alert('¿Eliminar esta foto?', 'Se quitará del mapa y de la lista.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removePhoto(photo.id),
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

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {photosWithCoords.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.coords.latitude,
              longitude: photo.coords.longitude,
            }}
            onCalloutPress={() => handleDeletePhoto(photo)}
          >
            <View
              style={{
                backgroundColor: '#10b981',
                borderRadius: 50,
                padding: 8,
                borderWidth: 3,
                borderColor: '#fff',
              }}
            >
              <Text style={{ fontSize: 20 }}>📸</Text>
            </View>

            <Callout>
              <Image
                source={{ uri: photo.uri }}
                style={styles.calloutImage}
              />
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📍 {photosWithCoords.length} foto{photosWithCoords.length !== 1 ? 's' : ''} en el mapa
        </Text>
        <Text style={styles.infoSubtext}>Toca un marcador para ver la foto, tócala para eliminarla</Text>
      </View>

      {locError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{locError}</Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
        onPress={handleMyLocation}
        style={styles.myLocationButton}
      >
        <Text style={styles.myLocationText}>◎</Text>
      </Pressable>
    </View>
  );
}
