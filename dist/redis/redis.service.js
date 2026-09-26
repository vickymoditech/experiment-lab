var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new Logger(RedisService_1.name);
    client;
    isAvailable = false;
    constructor(configService) {
        this.configService = configService;
        this.client = new Redis({
            host: this.configService.get("REDIS_HOST"),
            port: Number(this.configService.get("REDIS_PORT")),
            connectTimeout: 1000,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                return Math.min(times * 500, 30000);
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
    async get(key) {
        try {
            if (!this.isAvailable)
                return null;
            return this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (!this.isAvailable)
                return;
            await this.client.set(key, value, "EX", ttlSeconds);
        }
        catch { }
    }
    async delete(key) {
        try {
            if (!this.isAvailable)
                return;
            await this.client.del(key);
        }
        catch { }
    }
    async ping() {
        return this.client.ping();
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
};
RedisService = RedisService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], RedisService);
export { RedisService };
//# sourceMappingURL=redis.service.js.map