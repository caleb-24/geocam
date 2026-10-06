import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePhotos } from '@/hooks/usePhotos';
import { useAlbums } from '@/hooks/useAlbums';
import type { GeoPhoto } from '@/types/geo';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16, gap: 12 },
  search: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  chipText: { color: '#cbd5e1', fontWeight: '600' },
  chipTextActive: { color: '#111' },
  newAlbumRow: { flexDirection: 'row', gap: 8 },
  newAlbumInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  newAlbumButton: {
    borderRadius: 8,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  newAlbumButtonText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 4,
  },
  thumb: { width: '100%', aspectRatio: 1 },
  cardBody: { padding: 8, gap: 2 },
  cardNote: { color: '#e2e8f0', fontSize: 13 },
  cardMeta: { color: '#64748b', fontSize: 11 },
  favBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  favBadgeText: { color: '#fbbf24', fontSize: 14 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 48, fontSize: 15 },
  count: { color: '#10b981', fontSize: 13, fontWeight: '600' },
});

export default function FotosScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [albumId, setAlbumId] = useState<number | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [newAlbum, setNewAlbum] = useState('');

  // Los filtros cambian la consulta y useLiveQuery la re-ejecuta sola.
  const { photos } = usePhotos({ search, albumId, onlyFavorites });
  const { albums, createAlbum } = useAlbums();

  const handleCreateAlbum = (): void => {
    const name = newAlbum.trim();
    if (!name) return;
    void (async () => {
      try {
        await createAlbum(name);
        setNewAlbum('');
      } catch (e) {
        Alert.alert(
          'No se pudo crear el álbum',
          e instanceof Error ? e.message : 'Nombre duplicado o inválido'
        );
      }
    })();
  };

  const renderItem = ({ item }: { item: GeoPhoto }) => (
    <Pressable
      onPress={() => router.push({ pathname: '/foto/[id]', params: { id: String(item.id) } })}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Ver foto ${item.id}`}
    >
      <View>
        <Image source={{ uri: item.uri }} style={styles.thumb} />
        {item.favorite && (
          <View style={styles.favBadge}>
            <Text style={styles.favBadgeText}>★</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardNote} numberOfLines={1}>
          {item.note ?? 'Sin nota'}
        </Text>
        <Text style={styles.cardMeta}>
          {item.coords
            ? `${item.coords.latitude.toFixed(3)}, ${item.coords.longitude.toFixed(3)}`
            : 'Sin ubicación'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nota…"
          placeholderTextColor="#475569"
          style={styles.search}
        />
        <View style={styles.chipsRow}>
          <Pressable
            onPress={() => setAlbumId(null)}
            style={[styles.chip, albumId === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, albumId === null && styles.chipTextActive]}>
              Todas
            </Text>
          </Pressable>
          {albums.map((album) => (
            <Pressable
              key={album.id}
              onPress={() => setAlbumId(albumId === album.id ? null : album.id)}
              style={[styles.chip, albumId === album.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, albumId === album.id && styles.chipTextActive]}>
                {album.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setOnlyFavorites((v) => !v)}
            style={[styles.chip, onlyFavorites && styles.chipActive]}
          >
            <Text style={[styles.chipText, onlyFavorites && styles.chipTextActive]}>
              ★ Favoritas
            </Text>
          </Pressable>
        </View>
        <View style={styles.newAlbumRow}>
          <TextInput
            value={newAlbum}
            onChangeText={setNewAlbum}
            placeholder="Nuevo álbum…"
            placeholderTextColor="#475569"
            style={styles.newAlbumInput}
            onSubmitEditing={handleCreateAlbum}
          />
          <Pressable onPress={handleCreateAlbum} style={styles.newAlbumButton}>
            <Text style={styles.newAlbumButtonText}>Crear</Text>
          </Pressable>
        </View>
        <Text style={styles.count}>
          {photos.length} foto{photos.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay fotos con estos filtros</Text>
        }
      />
    </View>
  );
}
