export interface LegoSet {
  id: string;
  setNum: string;
  name: string;
  theme: string | null;
  year: number | null;
  numParts: number | null;
  setImgUrl: string | null;
  status: "owned" | "wishlist" | "wanted";
  buildStatus: "sealed" | "unbuilt" | "built" | "partial";
  condition: string | null;
  quantity: number;
  purchasePrice: string | null;
  notes: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Minifig {
  id: string;
  figNum: string;
  name: string;
  numParts: number | null;
  imgUrl: string | null;
  quantity: number;
  sourceSetNum: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MissingPart {
  id: string;
  userSetId: string;
  partNum: string;
  partName: string | null;
  colorName: string | null;
  colorId: number | null;
  quantity: number;
  imgUrl: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface SetPhoto {
  id: string;
  userSetId: string;
  dataUrl: string; // base64 data URL for photos stored locally
  caption: string | null;
  createdAt: string;
}

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

export interface RebrickableSetPart {
  id: number;
  inv_part_id: number;
  part: RebrickablePart;
  color: {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
  };
  set_num: string;
  quantity: number;
  is_spare: boolean;
  element_id: string | null;
  num_sets: number;
}

export interface RebrickableSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RebrickableSet[];
}

export interface RebrickableMinifigResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RebrickableMinifig[];
}

export interface RebrickablePartsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RebrickableSetPart[];
}

export interface CollectionStats {
  totalSets: number;
  totalPieces: number;
  totalMinifigs: number;
  estimatedValue: number;
  ownedSets: number;
  wishlistSets: number;
  wantedSets: number;
  builtSets: number;
  sealedSets: number;
  themeBreakdown: { theme: string; count: number; pieces: number }[];
  yearBreakdown: { year: number; count: number }[];
}
