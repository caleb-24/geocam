import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GeoPhotosProvider } from '@/context/GeoPhotosContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Sin fuentes ni recursos asíncronos que esperar: ocultar en cuanto monta.
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {
      // El splash ya estaba oculto: nada que hacer.
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GeoPhotosProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GeoPhotosProvider>
    </ThemeProvider>
  );
}
