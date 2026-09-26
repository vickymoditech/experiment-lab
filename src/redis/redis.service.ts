import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private isAvailable: boolean = false;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>("REDIS_HOST"),
      port: Number(this.configService.get<string>("REDIS_PORT")),
      connectTimeout: 1000,
      // Disable offline queue and limit retries to avoid long waits during Redis downtime
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      // Implement a retry strategy for connection attempts
      retryStrategy: (times) => {
        return Math.min(times * 500, 30000); // Exponential backoff with a maximum of 30 seconds
      },
    });

    this.client.on("ready", () => {
      this.isAvailable = true;
      this.logger.log("Redis client connected successfully.");
    });

    this.client.on("close", () => {
      this.isAvailable = false;
      this.logger.warn("Redis connection closed.");
    });

    this.client.on("end", () => {
      this.isAvailable = false;
      this.logger.warn("Redis connection ended.");
    });

    this.client.on("error", (err) => {
      this.isAvailable = false;
      this.logger.error("Redis error:", err);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isAvailable) return null;
      return this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      if (!this.isAvailable) return;
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch {}
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.isAvailable) return;
      await this.client.del(key);
    } catch {}
  }

  async acquireLock(key: string, ttlMs: number): Promise<string | null> {
    try {
      if (!this.isAvailable) return null;

      const token = randomUUID();

      const result = await this.client.set(key, token, "PX", ttlMs, "NX");
      return result === "OK" ? token : null;
    } catch {
      return null;
    }
  }

  async releaseLock(key: string, token: string): Promise<void> {
    if (!this.isAvailable) return;

    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      end

      return 0
    `;

    try {
      await this.client.eval(script, 1, key, token);
    } catch {}
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
