import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  tls: {}, // IMPORTANT for Upstash
});

redis.on("connect", () => console.log("Redis connected to Upstash"));
redis.on("error", (err) => console.error("Redis error:", err));

export default redis;
