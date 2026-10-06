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

## 8. Importar desde Galería - R2 (Septiembre 29, 2026)

**Prompt**: "falta seleccionar una foto de galeria".

**Implementación** (API verificada en docs Expo SDK 57):
- `hooks/useGallery.ts`: `useMediaLibraryPermissions()` (solo lee al montar, pide en contexto al tocar el botón), `launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })`.
- Resultado tipado como unión `GalleryPickOutcome`: `picked | canceled | denied | blocked | error` — sin `any`.
- Bloqueado → `Alert` con botón **Abrir Ajustes** (`Linking.openSettings()`); denegado/error → mensaje como estado en `galleryError`, visible en la UI.
- Foto de galería se etiqueta con ubicación actual si hay permiso, si no `coords: null` con `source: 'gallery'`.
- Botón en `geocam.tsx` (slot inferior izquierdo): ícono `images`, o la miniatura de la última foto para elegir otra.

## 9. Borrado individual (Septiembre 29, 2026)

**Prompt**: "si" (agregar borrado por foto, antes solo agitar para borrar todo).

**Implementación**:
- GeoCam: `onLongPress` en la miniatura → `Alert` de confirmación → `removePhoto(id)`; `lastPhoto` pasa a la más reciente restante.
- Mapa: `Marker.onCalloutPress` → confirmación → `removePhoto(id)`.
- Corrección propia: el primer `useCallback` quedó tras un `return` temprano (violación de reglas de hooks) → movido junto a los demás hooks. `tsc` y `lint` limpios.

---

**Total de Alucinaciones Detectadas**: 3 menores (todas corregidas)  
**Total de Versiones Iteradas**: Mapa (3), Geocam (1), General (1)  
**Errores de TypeScript Iniciales**: 28 → Reducidos a 0 en src/

---

# Semana 7 — GeoCam persistente (SQLite + Drizzle ORM)

**Estudiante(s):** Caleb
**Semana:** 7
**Proyecto:** GeoCam persistente – Taller Integrador 2
**Fecha:** Octubre 6, 2026

## 1. Prompts Utilizados

- "Reemplaza el GeoPhotosContext en memoria por SQLite con Drizzle: instala dependencias, crea drizzle.config.ts, babel.config.js, metro.config.js y genera la primera migración con la tabla photos."
- "Crea db/client.ts con openDatabaseSync y protege el layout raíz con useMigrations."
- "Escribe el repositorio photos.ts (listQuery, withLocationQuery con isNotNull, create, remove, clearAll) y el hook usePhotos que convierta coords a columnas planas."
- "Crea la tabla albums con FK opcional onDelete set null, agrega note y favorite a photos como segunda migración aditiva, sin editar migraciones a mano."
- "Pantalla app/foto/[id].tsx para ver, editar nota, favorita, mover de álbum y eliminar con confirmación; lista con buscador por nota y filtros por álbum/favoritas con useLiveQuery."
- "Archivos permanentes con la API nueva de expo-file-system (File, Directory, Paths): copiar de caché a documentos al guardar, borrar el archivo al eliminar el registro."

## 2. Código Generado vs. Código Modificado

- **¿Qué generó la IA?:** El esquema con `albumId` FK via `references(() => albums.id, { onDelete: 'set null' })`, el cliente con `drizzle-orm/expo-sqlite`, los repositorios y el servicio `photoFiles.ts` con `source.copy(destination)` sin `await`.
- **¿Qué modifiqué/corregí?:**
  1. `persistPhoto` pasó a `async` con `await source.copy(destination)`: en SDK 57 `copy()` devuelve `Promise<void>`; sin `await` se guardaba en SQLite una ruta cuyo archivo aún no existía.
  2. Borrado de álbum con `SET NULL` explícito en el repositorio (transacción: primero `UPDATE photos SET album_id = NULL`, luego `DELETE`), porque la migración generada por drizzle-kit emite `REFERENCES albums(id)` sin la cláusula `ON DELETE SET NULL`, y las migraciones no se editan a mano. Además `PRAGMA foreign_keys = ON` en el cliente, sin el cual SQLite ignora la regla.
  3. Pantalla de detalle dividida en `FotoDetailScreen` (carga + título) y `FotoEditor` con `key={photo.id}`: así el `TextInput` se inicializa con la nota sin `setState` dentro de un efecto (lo exige el lint `react-hooks/set-state-in-effect`).
  4. `babel.config.js` sin presets de NativeWind: el proyecto no tiene NativeWind instalado (solo un comentario en `theme.ts`), así que solo lleva `babel-preset-expo` + `inline-import`.

## 3. Alucinaciones o Errores Detectados

- **Migración sin ON DELETE:** la IA asumió que `references(..., { onDelete: 'set null' })` bastaba. Verificando el SQL generado (`ALTER TABLE photos ADD album_id integer REFERENCES albums(id)`) se confirmó que la cláusula no aparece. Corrección a nivel repositorio (punto 2 anterior), documentada también en el comentario del código.
- **Mezcla de APIs de expo-file-system:** el esquema de referencia del taller muestra `source.copy(destination)` sincrónico. La firma real instalada (verificada en `node_modules/expo-file-system/build`) es `copy(): Promise<void>` (existe además `copySync`). Se usó `await copy()`; `exists` es propiedad (`file.exists`), no método.
- **Rutas tipadas desactualizadas:** tras crear `foto/[id].tsx`, `tsc` rechazó el `pathname` porque `.expo/types/router.d.ts` aún no incluía la ruta. Se regeneró corriendo el bundler una vez; no se tocó el código para "conformar" el error.
- **APIs evitadas (verificadas contra `node_modules`, no de memoria):** `SQLite.openDatabase` / `db.transaction(tx => tx.executeSql(...))` (retirada), `drizzle-orm/better-sqlite3` (driver de Node), `drizzle-kit push` (para servidores), dinero en `real` (no aplica: coordenadas sí son decimales), `FileSystem.copyAsync` mezclado con `new File()` (APIs distintas).
- **Pre-existente, no tocado:** `npx expo-doctor` reporta drift de parches (`expo 57.0.25` vs `~57.0.27` esperado, etc.) anterior a este taller; y el lint mantiene 1 error + warnings del template (`use-color-scheme.web.ts`, imports de `expo-router`).

## 4. Verificación

- `npx tsc --noEmit` → 0 errores.
- `npx expo lint` → 0 errores en archivos propios.
- `drizzle/` versionada con `0000` (photos) + `0001` (aditiva: albums, album_id, note, favorite) y `migrations.js` con ambas.
- Pendiente en dispositivo físico (T6): 3 fotos → cerrar Expo Go → reabrir → marcadores intactos; modo avión; filtros que se recalculan solos.

