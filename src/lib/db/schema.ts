import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarPath: text("avatar_path"),
  isPublic: integer("is_public").default(0),
  rebrickableApiKey: text("rebrickable_api_key"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const userSets = sqliteTable("user_sets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  setNum: text("set_num").notNull(),
  name: text("name").notNull(),
  theme: text("theme"),
  year: integer("year"),
  numParts: integer("num_parts"),
  setImgUrl: text("set_img_url"),
  status: text("status").default("owned"),
  buildStatus: text("build_status").default("unbuilt"),
  condition: text("condition"),
  quantity: integer("quantity").default(1),
  purchasePrice: text("purchase_price"),
  notes: text("notes"),
  rating: integer("rating"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const userMinifigs = sqliteTable("user_minifigs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  figNum: text("fig_num").notNull(),
  name: text("name").notNull(),
  numParts: integer("num_parts"),
  imgUrl: text("img_url"),
  quantity: integer("quantity").default(1),
  sourceSetNum: text("source_set_num"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const missingParts = sqliteTable("missing_parts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userSetId: text("user_set_id").references(() => userSets.id),
  partNum: text("part_num").notNull(),
  partName: text("part_name"),
  colorName: text("color_name"),
  colorId: integer("color_id"),
  quantity: integer("quantity").default(1),
  imgUrl: text("img_url"),
  resolved: integer("resolved").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const setPhotos = sqliteTable("set_photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userSetId: text("user_set_id").references(() => userSets.id),
  filePath: text("file_path").notNull(),
  caption: text("caption"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const rebrickableCache = sqliteTable("rebrickable_cache", {
  cacheKey: text("cache_key").primaryKey(),
  data: text("data").notNull(),
  fetchedAt: text("fetched_at").default(sql`(datetime('now'))`),
});

// Inferred types for users
export type InsertUser = InferInsertModel<typeof users>;
export type SelectUser = InferSelectModel<typeof users>;

// Inferred types for userSets
export type InsertUserSet = InferInsertModel<typeof userSets>;
export type SelectUserSet = InferSelectModel<typeof userSets>;

// Inferred types for userMinifigs
export type InsertUserMinifig = InferInsertModel<typeof userMinifigs>;
export type SelectUserMinifig = InferSelectModel<typeof userMinifigs>;

// Inferred types for missingParts
export type InsertMissingPart = InferInsertModel<typeof missingParts>;
export type SelectMissingPart = InferSelectModel<typeof missingParts>;

// Inferred types for setPhotos
export type InsertSetPhoto = InferInsertModel<typeof setPhotos>;
export type SelectSetPhoto = InferSelectModel<typeof setPhotos>;

// Inferred types for rebrickableCache
export type InsertRebrickableCache = InferInsertModel<typeof rebrickableCache>;
export type SelectRebrickableCache = InferSelectModel<typeof rebrickableCache>;
