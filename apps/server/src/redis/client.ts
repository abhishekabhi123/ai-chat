import { createClient } from "redis";

const enabled = process.env.REDIS_ENABLED === "true";
const url = process.env.REDIS_URL;

export const redis =
  enabled && url
    ? createClient({ url, socket: { reconnectStrategy: false } }).on(
        "error",
        (err) => {
          console.error("Redis error", err);
        }
      )
    : null;
let redisReady = false;

if (redis) {
  redis.on("error", (err) => {
    console.warn("Redis client error:", err?.message ?? err);
    redisReady = false;
  });
}

export async function ConnectRedisIfConfigured() {
  if (!redis) return;

  try {
    if (!redis.isOpen) await redis.connect();
    redisReady = true;
    console.log("Redis connected (cache enabled).");
  } catch (e) {
    redisReady = false;
    console.warn("Redis not reachable; continuing without cache.");
  }
}

export function isRedisReady() {
  return Boolean(redis && redisReady && redis.isOpen);
}
