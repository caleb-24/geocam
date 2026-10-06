import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import migrations from '../../drizzle/migrations';
import { db } from '@/db/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Las migraciones se aplican antes de mostrar cualquier pantalla:
  // sin tablas, ningún repositorio puede consultar.
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    void SplashScreen.hideAsync().catch(() => {
      // El splash ya estaba oculto: nada que hacer.
    });
  }, [success]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#f87171', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          No se pudo migrar la base de datos: {error.message}
        </Text>
      </View>
    );
  }

  // Mientras migran, el splash sigue visible: no se renderiza nada.
  if (!success) {
    return <View style={{ flex: 1, backgroundColor: '#1e293b' }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="foto/[id]"
          options={{
            title: 'Foto',
            headerStyle: { backgroundColor: '#1e293b' },
            headerTintColor: '#10b981',
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
