import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const DATABASE_PATH = process.env.DATABASE_PATH || "./data/legotracker.db";

// Ensure data directory exists
const dir = dirname(DATABASE_PATH);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  sqlite: Database.Database | undefined;
};

const sqlite = globalForDb.sqlite ?? new Database(DATABASE_PATH);

// Auto-create tables on first connection
if (!globalForDb.sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_path TEXT,
      is_public INTEGER DEFAULT 0,
      rebrickable_api_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_sets (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      set_num TEXT NOT NULL,
      name TEXT NOT NULL,
      theme TEXT,
      year INTEGER,
      num_parts INTEGER,
      set_img_url TEXT,
      status TEXT DEFAULT 'owned',
      build_status TEXT DEFAULT 'unbuilt',
      condition TEXT,
      quantity INTEGER DEFAULT 1,
      purchase_price TEXT,
      notes TEXT,
      rating INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_minifigs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      fig_num TEXT NOT NULL,
      name TEXT NOT NULL,
      num_parts INTEGER,
      img_url TEXT,
      quantity INTEGER DEFAULT 1,
      source_set_num TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS missing_parts (
      id TEXT PRIMARY KEY,
      user_set_id TEXT REFERENCES user_sets(id),
      part_num TEXT NOT NULL,
      part_name TEXT,
      color_name TEXT,
      color_id INTEGER,
      quantity INTEGER DEFAULT 1,
      img_url TEXT,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS set_photos (
      id TEXT PRIMARY KEY,
      user_set_id TEXT REFERENCES user_sets(id),
      file_path TEXT NOT NULL,
      caption TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rebrickable_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      fetched_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export const db = globalForDb.db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
  globalForDb.sqlite = sqlite;
}
