import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { RedisService } from "../redis/redis.service.js";
import { Product } from "./product.model.js";
import { ProductBloomService } from "./product-bloom.service.js";

@Injectable()
export class ProductService {
  private readonly logger: Logger = new Logger(ProductService.name);
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    private readonly productBloomService: ProductBloomService,
    private readonly redisService: RedisService,
  ) {}

  async getProduct(): Promise<Product> {
    try {
      const getRandomProductId = Math.floor(Math.random() * 20000) + 1;
      const cacheKey = `product:${getRandomProductId}`;
      const lockKey = `lock:${cacheKey}`;
      const EXPIRATION_TIME_NOT_FOUND = 120; // Cache expiration time in seconds
      const EXPIRATION_TIME_FOUND = 120 + Math.floor(Math.random() * 181); // Random expiration time between 120 and 300 seconds
      const EXPIRATION_TIME_LOCK = 3 * 1000; // Lock expiration time in seconds

      // Check if the product is already cached
      const cachedProduct = await this.redisService.get(cacheKey);

      if (cachedProduct === "NOT_FOUND") {
        throw new NotFoundException(
          `Product with id ${getRandomProductId} not found`,
        );
      }

      if (cachedProduct) {
        return JSON.parse(cachedProduct);
      }

      // Check Bloom filter for potential existence
      const mightExist =
        await this.productBloomService.mightExist(getRandomProductId);

      if (!mightExist) {
        await this.redisService.set(
          cacheKey,
          "NOT_FOUND",
          EXPIRATION_TIME_NOT_FOUND,
        );
        throw new NotFoundException(
          `Product with id ${getRandomProductId} not found`,
        );
      }

      // Single flight mechanism to prevent cache stampede
      const lockToken = await this.redisService.acquireLock(
        lockKey,
        EXPIRATION_TIME_LOCK,
      );
      if (lockToken) {
        try {
          // this.logger.log(`Acquired lock for product ${getRandomProductId}`);
          const product = await this.productModel.findByPk(getRandomProductId, {
            attributes: ["id", "name", "image", "qty", "price"],
            raw: true, // Return plain object instead of Sequelize model instance
          });

          if (!product) {
            await this.redisService.set(
              cacheKey,
              "NOT_FOUND",
              EXPIRATION_TIME_NOT_FOUND,
            );
            throw new NotFoundException(
              `Product with id ${getRandomProductId} not found`,
            );
          }

          await this.redisService.set(
            cacheKey,
            JSON.stringify(product),
            EXPIRATION_TIME_FOUND,
          );

          return product;
        } finally {
          await this.redisService.releaseLock(lockKey, lockToken);
        }
      }

      return this.waitForCachedProduct(cacheKey, getRandomProductId);
    } catch (error) {
      // this.logger.error("Error fetching product:", error);
      throw new NotFoundException(
        "An error occurred while fetching the product.",
      );
    }
  }

  private async waitForCachedProduct(cacheKey: string, productId: number) {
    // this.logger.warn(
    //   `Waiting for cached product ${productId} to become available.`,
    // );
    const maxAttempts = 20;
    const delayMs = 25;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.delay(delayMs);

      const cachedProduct = await this.redisService.get(cacheKey);

      if (cachedProduct === "NOT_FOUND") {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      if (cachedProduct) {
        return JSON.parse(cachedProduct);
      }
    }

    throw new ServiceUnavailableException(
      `Product ${productId} is temporarily unavailable`,
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
