import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { usePhoto, usePhotos } from '@/hooks/usePhotos';
import { useAlbums } from '@/hooks/useAlbums';
import type { GeoPhoto } from '@/types/geo';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, gap: 16 },
  image: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#1e293b' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  noteInput: {
    backgroundColor: '#1e293b',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
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
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButton: { backgroundColor: '#10b981' },
  saveButtonText: { color: '#111', fontWeight: '700' },
  deleteButton: { backgroundColor: '#7f1d1d' },
  deleteButtonText: { color: '#fecaca', fontWeight: '700' },
  meta: { color: '#64748b', fontSize: 12 },
  centered: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
});

function FotoEditor({ photo }: { photo: GeoPhoto }) {
  const router = useRouter();
  const { updatePhoto, removePhoto } = usePhotos();
  const { albums } = useAlbums();

  // Estado local inicializado con la foto: el padre remonta este editor
  // con key={photo.id} cuando llega una foto distinta (sin efectos).
  const [note, setNote] = useState(photo.note ?? '');
  const [saving, setSaving] = useState(false);

  const dirty = (note.trim() ? note.trim() : null) !== photo.note;

  const handleSaveNote = (): void => {
    void (async () => {
      setSaving(true);
      try {
        await updatePhoto(photo.id, { note: note.trim() ? note.trim() : null });
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleToggleFavorite = (): void => {
    void updatePhoto(photo.id, { favorite: !photo.favorite });
  };

  const handleMoveAlbum = (albumId: number | null): void => {
    if (albumId === photo.albumId) return;
    void updatePhoto(photo.id, { albumId });
  };

  const handleDelete = (): void => {
    Alert.alert('¿Eliminar esta foto?', 'Se borrará el registro y su archivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await removePhoto(photo.id);
            router.back();
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: photo.uri }} style={styles.image} />

      <View>
        <Text style={styles.label}>NOTA</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Agrega una nota…"
          placeholderTextColor="#475569"
          multiline
          style={styles.noteInput}
        />
        {dirty && (
          <View style={{ marginTop: 8 }}>
            <Pressable
              onPress={handleSaveNote}
              disabled={saving}
              style={[styles.button, styles.saveButton]}
              accessibilityRole="button"
              accessibilityLabel="Guardar nota"
            >
              <Text style={styles.saveButtonText}>{saving ? 'Guardando…' : 'Guardar nota'}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View>
        <Text style={styles.label}>FAVORITA</Text>
        <Pressable
          onPress={handleToggleFavorite}
          style={[styles.chip, photo.favorite && styles.chipActive]}
          accessibilityRole="button"
          accessibilityLabel="Marcar como favorita"
        >
          <Text style={[styles.chipText, photo.favorite && styles.chipTextActive]}>
            {photo.favorite ? '★ Favorita' : '☆ Marcar favorita'}
          </Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.label}>ÁLBUM</Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => handleMoveAlbum(null)}
            style={[styles.chip, photo.albumId === null && styles.chipActive]}
          >
            <Text style={[styles.chipText, photo.albumId === null && styles.chipTextActive]}>
              Sin álbum
            </Text>
          </Pressable>
          {albums.map((album) => (
            <Pressable
              key={album.id}
              onPress={() => handleMoveAlbum(album.id)}
              style={[styles.chip, photo.albumId === album.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, photo.albumId === album.id && styles.chipTextActive]}>
                {album.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.meta}>
        {photo.coords
          ? `${photo.coords.latitude.toFixed(5)}, ${photo.coords.longitude.toFixed(5)} · `
          : 'Sin ubicación · '}
        {new Date(photo.createdAt).toLocaleString()} ·{' '}
        {photo.source === 'camera' ? 'Cámara' : 'Galería'}
      </Text>

      <Pressable
        onPress={handleDelete}
        style={[styles.button, styles.deleteButton]}
        accessibilityRole="button"
        accessibilityLabel="Eliminar foto"
      >
        <Text style={styles.deleteButtonText}>Eliminar foto</Text>
      </Pressable>
    </ScrollView>
  );
}

export default function FotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoId = Number(id);
  const navigation = useNavigation();
  const photo = usePhoto(photoId);

  useEffect(() => {
    if (photo) {
      navigation.setOptions({ title: `Foto #${photo.id}` });
    }
  }, [photo, navigation]);

  if (!photo) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return <FotoEditor key={photo.id} photo={photo} />;
}
