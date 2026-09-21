import { Redis } from "@upstash/redis";
import type { Review } from "./types";
import { resolveDemo } from "./demo";

const MAX_REVIEWS = 200;
const INDEX_KEY = "marker:reviews";
const key = (id: string) => `marker:review:${id}`;

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

/** In-memory fallback for local development only. Not shared across serverless instances. */
const g = globalThis as unknown as { __markerMem?: Map<string, Review> };
const mem = (g.__markerMem ??= new Map<string, Review>());

export const storeKind = redis ? "redis" : "memory";

export async function getReview(id: string): Promise<Review | null> {
  const r = redis ? await redis.get<Review>(key(id)) : mem.get(id) ?? null;
  if (!r) return null;
  return finalize(r);
}

export async function listReviews(limit = 50): Promise<Review[]> {
  let rows: Review[];
  if (redis) {
    const ids = await redis.zrange<string[]>(INDEX_KEY, 0, limit - 1, { rev: true });
    if (!ids.length) return [];
    const got = await redis.mget<(Review | null)[]>(...ids.map(key));
    rows = got.filter((r): r is Review => !!r);
  } else {
    rows = [...mem.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
  return Promise.all(rows.map(finalize));
}

/** Insert or merge. Fields in `patch` win over what is stored. */
export async function upsertReview(patch: Partial<Review> & { id: string }): Promise<Review> {
  const existing = redis ? await redis.get<Review>(key(patch.id)) : mem.get(patch.id);
  const merged = { ...(existing ?? {}), ...stripUndefined(patch) } as Review;
  merged.createdAt ??= Date.now();
  if (redis) {
    await redis.set(key(merged.id), merged, { ex: 60 * 60 * 24 * 30 });
    await redis.zadd(INDEX_KEY, { score: merged.createdAt, member: merged.id });
    const count = await redis.zcard(INDEX_KEY);
    if (count > MAX_REVIEWS) await redis.zremrangebyrank(INDEX_KEY, 0, count - MAX_REVIEWS - 1);
  } else {
    mem.set(merged.id, merged);
  }
  return merged;
}

async function finalize(r: Review): Promise<Review> {
  if (r.demo && r.status === "running" && r.demoReadyAt && Date.now() >= r.demoReadyAt) {
    return upsertReview(resolveDemo(r));
  }
  return r;
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
