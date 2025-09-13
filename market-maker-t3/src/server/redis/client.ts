import { Redis } from "@upstash/redis";
import { env } from "../../env.js";

// Create Redis client only if environment variables are configured
let redis: Redis | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("⚠️ Redis not configured - some features may not work");
}

// Export with fallback handling
export { redis };
export default redis; 