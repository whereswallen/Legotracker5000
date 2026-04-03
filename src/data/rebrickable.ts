import type {
  RebrickableSearchResponse,
  RebrickableSet,
  RebrickableMinifigResponse,
  RebrickablePartsResponse,
} from "../types";

const BASE_URL = "https://rebrickable.com/api/v3/lego";

export async function searchSets(
  apiKey: string,
  query: string,
  page = 1
): Promise<RebrickableSearchResponse> {
  const res = await fetch(
    `${BASE_URL}/sets/?key=${apiKey}&search=${encodeURIComponent(query)}&page=${page}&page_size=20`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function getSet(
  apiKey: string,
  setNum: string
): Promise<RebrickableSet> {
  const res = await fetch(
    `${BASE_URL}/sets/${encodeURIComponent(setNum)}/?key=${apiKey}`
  );
  if (!res.ok) throw new Error("Set not found");
  return res.json();
}

export async function getSetMinifigs(
  apiKey: string,
  setNum: string
): Promise<RebrickableMinifigResponse> {
  const res = await fetch(
    `${BASE_URL}/sets/${encodeURIComponent(setNum)}/minifigs/?key=${apiKey}&page_size=100`
  );
  if (!res.ok) throw new Error("Failed to fetch minifigs");
  return res.json();
}

export async function getSetParts(
  apiKey: string,
  setNum: string,
  page = 1
): Promise<RebrickablePartsResponse> {
  const res = await fetch(
    `${BASE_URL}/sets/${encodeURIComponent(setNum)}/parts/?key=${apiKey}&page=${page}&page_size=100`
  );
  if (!res.ok) throw new Error("Failed to fetch parts");
  return res.json();
}
