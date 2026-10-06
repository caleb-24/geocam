export type PermissionState =
  | 'checking'
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'blocked';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface GeoPhoto {
  id: number;
  uri: string;
  coords: Coords | null;
  source: 'camera' | 'gallery';
  createdAt: number;
  note: string | null;
  favorite: boolean;
  albumId: number | null;
}

export type LocatedPhoto = GeoPhoto & { coords: Coords };
