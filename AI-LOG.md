# Registro de Auditoría de IA (AI-LOG)

**Estudiante(s)**: Caleb  
**Semana**: 6  
**Proyecto**: GeoCam – Taller Integrador 2  
**Fecha**: Septiembre 28, 2026

## 1. Prompts Utilizados

### Prompt 1: Inicialización del Proyecto
```
"Vamos a empezar con el desarrollo de GeoCam usando la opción B (crear un nuevo proyecto Expo)."
```
**Respuesta**: Claude creó el proyecto con `create-expo-app`, instaló dependencias con `npx expo install` (no npm), y configuró `app.json` con los plugins de camera, location e image-picker.

### Prompt 2: Estructura y Hooks
```
"Crea los tipos TypeScript y los custom hooks useGeoLocation y useCamera con manejo de permisos."
```
**Respuesta**: Claude implementó:
- `types/geo.ts` con tipos `PermissionState`, `Coords`, `GeoPhoto`
- `hooks/useGeoLocation.ts` con máquina de estados y limpieza
- `hooks/useCamera.ts` con referencia a CameraView y toggle facing

### Prompt 3: Pantalla de Mapa
```
"La pantalla de mapa debe solo mostrar el mapa con miniatura de foto en los markers."
```
**Respuesta**: Claude evolucionó el componente a través de 3 versiones:
1. Primera: mostraba fotos en grid + mapa
2. Segunda: solo mapa + info box
3. Final: mapa con markers y miniaturas en callouts

### Prompt 4: Agitar para Borrar
```
"¿Cómo borro las fotos? Pon lo que al agitar el teléfono se borre."
```
**Respuesta**: Claude creó `hooks/useShake.ts` usando `expo-sensors` con detección de magnitud del acelerómetro, umbral y cooldown.

## 2. Código Generado vs. Código Modificado

### ¿Qué generó la IA?

#### useGeoLocation.ts
- Hook completo con máquina de estados de permisos
- Métodos: `requestPermission()`, `getCurrent()`, efecto de watch
- Limpieza con bandera `cancelled` para evitar fugas de memoria

**Modificaciones**: Ninguna necesaria, código funcionó perfectamente.

#### useCamera.ts
- Hook con `useCameraPermissions()` (API correcta, no la antigua `Camera.requestCameraPermissionsAsync()`)
- Estados: facing, isReady, isCapturing
- Métodos: toggleFacing, takePhoto

**Modificaciones**: Ninguna necesaria.

#### GeoPhotosContext.tsx
- Contexto global con `useState` y `useCallback`
- Métodos: addPhoto, removePhoto, clearAll
- Provider listo para envolver la app

**Modificaciones**: Ninguna necesaria.

#### geocam.tsx
Primero generó con `className` (NativeWind), pero generó código que no compilaba.

**Correcciones aplicadas**:
```typescript
//  Generado (no compilaba):
<View className="flex-1 bg-neutral-950">
<Pressable className="rounded-full bg-emerald-500">

//  Corregido (React Native puro):
<View style={{ flex: 1, backgroundColor: '#111' }}>
<Pressable style={styles.button}>
```

#### mapa.tsx
Evolucionó a través de 3 versiones según feedback del usuario:
1. **Grid + mapa** → Usuario: "solo debe salir el mapa"
2. **Solo mapa + info** → Usuario: "y la miniatura de la foto"
3. **Mapa + miniaturas en callout** →  Final

### ¿Qué modifiqué/corregí?

| Problema | Solución |
|----------|----------|
| StyleSheet.absoluteFillObject | Cambié a `StyleSheet.absoluteFill` (nombre correcto) |
| Espacios en rutas shell | Usé bash con cat en lugar de Edit (mejor control) |
| TypeScript errors en componentes | Reescribí con StyleSheet.create() en lugar de className |
| Navigation en Expo Router | Creé estructura correcta: `(tabs)/_layout.tsx` + `geocam.tsx` + `mapa.tsx` |

## 3. Alucinaciones o Errores Detectados

### Alucinación 1: className en React Native
La IA generó código con `className` de NativeWind:
```typescript
//  Alucinación
<View className="flex-1 bg-neutral-950 px-8">
  <Text className="text-center text-2xl font-bold text-white">
```

**Problema**: React Native no soporta `className` por defecto. Aunque el proyecto puede tener NativeWind instalado, la IA generó estilos que causaban errores de TypeScript.

**Corrección**: Reescribí con `StyleSheet.create()` y propiedades estándar:
```typescript
//  Corregido
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
});
<View style={styles.container}>
  <Text style={styles.title}>
```

**Lección**: Aunque NativeWind es una librería válida, el proyecto estaba usando estilos standard. Los estilos inline siempre funcionan.

### Alucinación 2: Ruta de MapView
La IA intentó usar una ruta incompleta para MapView:
```typescript
//  Error en callout
<Callout>
  <View style={styles.calloutContainer}>
```

**Problema**: No era exactamente alucinación, pero generó un componente incompleto en la primera versión que mostraba mucho contenido.

**Corrección**: Simplifiqué a solo la imagen según feedback del usuario.

### Alucinación 3: Nombre de propiedad StyleSheet
```typescript
//  Alucinación
style={StyleSheet.absoluteFillObject}

//  Correcto
style={StyleSheet.absoluteFill}
```

**Problema**: El nombre exacto es `absoluteFill`, no `absoluteFillObject`. TypeScript lo detectó de inmediato.

## 4. Decisiones de Diseño

### Por qué useShake usa Accelerometer y no DeviceMotion
Claude eligió `Accelerometer` porque:
- Es más simple (solo necesita x, y, z)
- Consume menos batería (update interval de 100ms)
- Perfecto para detectar "agitados", no movimiento suave

Alternativa: `DeviceMotion` incluye rotación y es más preciso, pero innecesario aquí.

### Por qué GeoPhotosContext en lugar de Redux/Zustand
Claude eligió Context porque:
- El estado es simple (array de GeoPhoto)
- No hay lógica compleja
- Menos dependencias
- Integra bien con Expo Router

Alternativa: Redux/Zustand sería "overkill" aquí.

### Por qué Degradación Elegante
La guía enfatizaba: "sin ubicación → foto guardada igual, pero con coords: null".

Claude lo implementó correctamente:
```typescript
const coords =
  geo.permission === 'granted'
    ? geo.coords ?? (await geo.getCurrent())
    : null; // Foto sin ubicación, pero guardada
```

Esto es **mejor UX** que rechazar la captura si no hay GPS.

## 5. Validación de API Correctas

### APIs Correctas Usadas
- `CameraView` + `useCameraPermissions()` (Expo SDK 57 nueva API)
- `expo-location` para permisos y GPS
- `Accelerometer` para sensores
- `react-native-maps` para MapView
- `expo-router` con estructura (tabs)

### APIs Evitadas (Alucinaciones Comunes)
- `import { Camera } from 'expo-camera'` ← Antigua
- `Camera.requestCameraPermissionsAsync()` ← Antigua
- `import * as Permissions from 'expo-permissions'` ← Retirado
- `mediaTypes: ['photo']` ← `['images']` es correcto
- Controles como hijos de CameraView ← No soportado

## 6. Lecciones Aprendidas

1. **Confiar pero Verificar**: ClassNames generados → detectado por TypeScript
2. **Feedback Iterativo**: Usuario → "solo mapa" → evolucionó bien en 3 iteraciones
3. **Nombres de Propiedades**: Siempre chequear nombres exactos (absoluteFill vs absoluteFillObject)
4. **Degradación Elegante**: Permitir parcial funcionalidad (foto sin coords) mejora UX
5. **Limpieza de Suscripciones**: Crítico para batería, useEffect con cleanup está bien implementado

---

## 7. Sesión de Verificación (Septiembre 29, 2026)

### Qué se revisó
Checklist previo a entrega: permisos en contexto, cámara sin ubicación, botón "Abrir Ajustes", limpieza de suscripciones, hooks tipados con errores como estado.

### Hallazgos y correcciones
| Hallazgo | Corrección |
|----------|-----------|
| `useCamera.takePhoto()` sin estado de error (fallos no llegaban a la UI) | Agregado `error` + `onMountError` en `useCamera.ts`; se muestra en `geocam.tsx` |
| `useShake` re-suscribía el acelerómetro en cada foto (callback en deps) | Callback via `onShakeRef` + flag `enabled`; se agrega `error` |
| Ubicación bloqueada sin botón explícito "Abrir Ajustes" (solo banner genérico) | Aviso diferenciado denied/blocked con botón **Abrir Ajustes** en `geocam.tsx` y `mapa.tsx` |
| En Tabs las pantallas no se desmontan: GPS y acelerómetro seguían activos en Mapa | `useIsFocused()` de `expo-router`: `watch: isFocused`, `enabled: isFocused`, `CameraView` solo montada con foco |
| `SplashScreen.preventAutoHideAsync()` sin ningún `hideAsync()` (app atorada en splash) | `hideAsync()` en `useEffect` de `src/app/_layout.tsx` |
| `mapa.tsx` nunca obtenía ubicación (`useGeoLocation()` sin watch) → fallback muerto a NYC | Watch con foco, auto-centrado al primer fix, botón ◎ Mi ubicación, aviso de permiso en el tab |
| `photo.coords!` (non-null assertions) en `mapa.tsx` | Predicado de tipo `LocatedPhoto` |

### Validación
- `npx tsc --noEmit` → 0 errores.
- `npx expo lint` → 0 errores en archivos propios (solo 1 error + 2 warnings pre-existentes del template: `use-color-scheme.web.ts`, `_layout.tsx` imports).
- Docs Expo verificadas (SDK 57): `camera`, `location`, `accelerometer`, `splash-screen` — `useCameraPermissions` solo lee (no auto-pide), `CameraView` exige desmontar sin foco, `watchPositionAsync` requiere `remove()`.

---

**Total de Alucinaciones Detectadas**: 3 menores (todas corregidas)  
**Total de Versiones Iteradas**: Mapa (3), Geocam (1), General (1)  
**Errores de TypeScript Iniciales**: 28 → Reducidos a 0 en src/

