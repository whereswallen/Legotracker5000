// Rebrickable API response types

export interface RebrickableSet {
  set_num: string;
  name: string;
  year: number;
  theme_id: number;
  num_parts: number;
  set_img_url: string | null;
  set_url: string;
  last_modified_dt: string;
}

export interface RebrickableMinifig {
  set_num: string;
  name: string;
  num_parts: number;
  set_img_url: string | null;
  set_url: string;
}

export interface RebrickablePart {
  part_num: string;
  name: string;
  part_cat_id: number;
  part_url: string;
  part_img_url: string | null;
  print_of: string | null;
}

export interface RebrickableSearchResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type CollectionStatus = "owned" | "wishlist" | "wanted";

export type BuildStatus = "sealed" | "unbuilt" | "built" | "partial";

// Extend next-auth module types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
  }
}
