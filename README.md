# GeoCam - Semana 6

Una cámara inteligente que etiqueta cada foto con coordenadas GPS y reacciona al movimiento del teléfono, construida con Expo SDK 57 y Custom Hooks tipados.

## Características

### Pantalla GeoCam
- **Cámara en vivo** con toggle front/back
- **Ubicación en tiempo real** mostrando coordenadas y precisión
- **Captura de fotos** con degradación elegante
- **Importar desde galería** (botón inferior izquierdo) con permiso en contexto
- **Banner inteligente** que pide ubicación sin bloquear la cámara
- **Agitar para borrar** todas las fotos con confirmación
- **Borrar una foto**: mantén presionada la miniatura en GeoCam, o toca la foto del marcador en Mapa

### Pantalla Mapa
- **MapView interactivo** con markers de cada foto
- **Miniaturas clickeables** de las fotos en los markers
- **Información de ubicación** (coordenadas y precisión)
- **Grid de fotos** sin ubicación

### Permisos Robustos
- **Máquina de estados**: checking → undetermined → granted/denied/blocked
- **Pantalla PermissionPrimer** que explica antes de pedir
- **Botón "Abrir Ajustes"** cuando el permiso está bloqueado
- **Degradación elegante**: sin ubicación → foto sin coords

## Requisitos Implementados

### R1. Estado Global
- `GeoPhotosContext.tsx` con `addPhoto`, `removePhoto`, `clearAll`
- Provider en root layout

### R2. Importar desde Galería
- `hooks/useGallery.ts` con `useMediaLibraryPermissions()` (permiso en contexto) y `launchImageLibraryAsync({ mediaTypes: ['images'] })`
- Botón de galería en GeoCam (ícono, o miniatura de la última foto para elegir otra)
- Degradación elegante: sin ubicación se guarda con `coords: null`, `source: 'gallery'`

### R3. Pestaña Mapa
- MapView con Markers para cada foto
- Miniaturas en los markers
- Fotos sin ubicación listadas aparte

### R4. useShake Hook
- Detecta agitado con `Accelerometer`
- Pregunta antes de borrar todas las fotos
- Cooldown de 1.5s para evitar borrados accidentales

### R5. AI-LOG
- Registro de prompts, correcciones y alucinaciones

## Instalación y Ejecución

```bash
cd geocam
npx expo install
npx expo start
```

Escanea el código QR con **Expo Go** en tu teléfono físico.

> **Nota**: La cámara NO funciona en simulador iOS. Necesitas un teléfono físico con Expo Go.

## Estructura de Archivos

```
src/
├── app/
│   ├── _layout.tsx              # Root layout con GeoPhotosProvider
│   ├── index.tsx                # Redirect a GeoCam
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigator (GeoCam + Mapa)
│       ├── geocam.tsx           # Pantalla cámara
│       └── mapa.tsx             # Pantalla mapa
├── hooks/
│   ├── useGeoLocation.ts        # GPS + permisos + limpieza
│   ├── useCamera.ts             # Cámara + permisos
│   ├── useGallery.ts            # Galería + permiso de fotos
│   └── useShake.ts              # Acelerómetro para agitado
├── components/
│   └── PermissionPrimer.tsx     # Pantalla de permisos
├── context/
│   └── GeoPhotosContext.tsx     # Estado global de fotos
└── types/
    └── geo.ts                   # TypeScript types
```

## Estados de Permiso

> **Capturas pendientes de tomar en dispositivo físico** (la cámara no funciona en simulador).
> Guarda las imágenes en `docs/screenshots/` con estos nombres y aparecerán aquí:
> `permiso-concedido.png`, `permiso-rechazado.png`, `permiso-bloqueado.png`
> (o un GIF del flujo completo como `docs/screenshots/permisos.gif`).

### Estado: Concedido (granted)

![Permiso concedido](docs/screenshots/permiso-concedido.png)

| | |
|---|---|
| **Cómo reproducirlo** | Aceptar el diálogo del sistema al pedir cámara / ubicación |
| **Qué se ve** | Cámara activa, coordenadas en vivo (`±X m`), botón de captura funcional |
| **Código** | `camPermission === 'granted'` → render de `CameraView` (`geocam.tsx`); `geo.coords` en vivo por `watchPositionAsync` |

### Estado: Rechazado (denied)

![Permiso rechazado](docs/screenshots/permiso-rechazado.png)

| | |
|---|---|
| **Cómo reproducirlo** | Negar **una vez** el diálogo del sistema (aún se puede volver a pedir) |
| **Qué se ve (ubicación)** | Aviso amarillo: *"Activa la ubicación para etiquetar tus fotos. La cámara funciona sin ubicación."* + botón **Permitir acceso**. La cámara **sigue funcionando** y la foto se guarda con `coords: null` |
| **Qué se ve (cámara)** | Pantalla `PermissionPrimer` + botón **Permitir acceso** |
| **Código** | `permission === 'denied'` → `canAskAgain === true`, se puede re-llamar `requestPermission()` |

### Estado: Bloqueado (blocked)

![Permiso bloqueado](docs/screenshots/permiso-bloqueado.png)

| | |
|---|---|
| **Cómo reproducirlo** | Negar **dos veces** (Android ya no muestra el diálogo) o desactivar el permiso en Ajustes del sistema |
| **Qué se ve (ubicación)** | Aviso: *"Ubicación desactivada. La cámara sigue funcionando..."* + botón **Abrir Ajustes** → `Linking.openSettings()` |
| **Qué se ve (cámara)** | `PermissionPrimer` con texto *"Desactivaste este permiso..."* + botón **Abrir Ajustes** |
| **Código** | `canAskAgain === false` → `mapPermission()` retorna `'blocked'` (`useGeoLocation.ts`, `useCamera.ts`) |

### Cómo tomar las capturas

1. `npx expo start` y abrir en Expo Go (teléfono físico).
2. **Rechazado**: instalación fresca → negar el diálogo una vez → captura.
3. **Bloqueado**: negar dos veces, o ir a Ajustes → revocar el permiso → volver a la app → captura.
4. **Concedido**: aceptar el diálogo → captura con coordenadas visibles.

## Verificación Previa a Entrega

- [x] Hooks tipados sin `any`
- [x] Permisos en contexto (no al abrir la app)
- [x] Sin ubicación → cámara sigue funcionando
- [x] Botón "Abrir Ajustes" en estado blocked
- [x] Suscripciones limpias al salir (GPS/acelerómetro gated por `isFocused` + `remove()` en cleanup; cámara desmontada sin foco)
- [x] Errores llegan a la UI como estado
- [x] useGeoLocation, useCamera, useShake implementados
- [x] AI-LOG.md documentado

## Tecnologías

- **React Native** 0.86.3
- **Expo SDK** 57.0.25
- **TypeScript** 6.0.3
- **expo-camera**: Acceso a cámara
- **expo-location**: GPS y permisos
- **expo-sensors**: Acelerómetro
- **react-native-maps**: MapView interactivo
- **Expo Router**: Navegación con tabs

## Referencias

- [Expo Camera Docs](https://docs.expo.dev/camera/overview/)
- [Expo Location Docs](https://docs.expo.dev/location/location/)
- [Expo Sensors Docs](https://docs.expo.dev/sensors/accelerometer/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

---

**Estudiante**: [Tu nombre]  
**Semana**: 6  
**Proyecto**: GeoCam - Taller Integrador 2
