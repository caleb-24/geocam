import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// enableChangeListener es obligatorio para que useLiveQuery se actualice solo.
const sqlite = openDatabaseSync('geocam.db', { enableChangeListener: true });

// Sin este PRAGMA, SQLite ignora las llaves foráneas (p. ej. el SET NULL
// de photos.album_id al borrar un álbum).
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type AppDb = typeof db;
