import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { RedisService } from "../redis/redis.service.js";
import { Product } from "./product.model.js";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    private readonly redisService: RedisService,
  ) {}

  async getProduct(): Promise<Product> {
    try {
      const getRandomProductId = Math.floor(Math.random() * 15000) + 1;
      const cacheKey = `product:${getRandomProductId}`;

      const cachedProduct = await this.redisService.get(cacheKey);
      if (cachedProduct) {
        return JSON.parse(cachedProduct);
      }

      const product = await this.productModel.findByPk(getRandomProductId, {
        attributes: ["id", "name", "image", "qty", "price"],
        raw: true, // Return plain object instead of Sequelize model instance
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${getRandomProductId} not found`,
        );
      }

      const ttl = 300 + Math.floor(Math.random() * 60);
      await this.redisService.set(cacheKey, JSON.stringify(product), ttl);

      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw new NotFoundException(
        "An error occurred while fetching the product.",
      );
    }
  }
}
