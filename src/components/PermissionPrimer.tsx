import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PermissionState } from '@/types/geo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#111',
    paddingHorizontal: 32,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: '#a3a3a3',
  },
  button: {
    borderRadius: 9999,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: '600',
    color: '#111',
  },
});

interface Props {
  title: string;
  description: string;
  state: PermissionState;
  onRequest: () => void | Promise<unknown>;
  onOpenSettings: () => void;
}

export function PermissionPrimer({
  title,
  description,
  state,
  onRequest,
  onOpenSettings,
}: Props) {
  const isBlocked = state === 'blocked';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        {isBlocked
          ? 'Desactivaste este permiso. Puedes habilitarlo desde los Ajustes del sistema.'
          : description}
      </Text>
      <Pressable
        onPress={isBlocked ? onOpenSettings : onRequest}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {isBlocked ? 'Abrir Ajustes' : 'Permitir acceso'}
        </Text>
      </Pressable>
    </View>
  );
}
