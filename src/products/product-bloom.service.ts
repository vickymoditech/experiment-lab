import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { RedisService } from "../redis/redis.service.js";
import { Product } from "./product.model.js";

@Injectable()
export class ProductBloomService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductBloomService.name);
  private readonly bloomKey = "bloom:products:ids";
  private readonly batchSize = 10000;
  private initialized = false;

  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
    private readonly redisService: RedisService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.initialize();
  }

  async mightExist(productId: number): Promise<boolean | null> {
    if (!this.initialized) {
      return null;
    }

    return this.redisService.bloomExists(this.bloomKey, productId);
  }

  async add(productId: number): Promise<void> {
    await this.redisService.bloomAdd(this.bloomKey, productId);
  }

  private async initialize(): Promise<void> {
    const reserved = await this.redisService.bloomReserve(
      this.bloomKey,
      0.001,
      10_000_000,
    );

    if (!reserved) {
      this.logger.warn("Bloom filter is unavailable; DB fallback will be used");
      return;
    }

    let lastId = 0;
    let total = 0;

    while (true) {
      const products = await this.productModel.findAll({
        attributes: ["id"],
        where: {
          id: {
            [Op.gt]: lastId,
          },
        },
        order: [["id", "ASC"]],
        limit: this.batchSize,
        raw: true,
      });

      if (products.length === 0) break;

      const ids = products.map((product) => product.id);
      const added = await this.redisService.bloomAddMany(this.bloomKey, ids);

      if (!added) {
        this.logger.warn(
          "Bloom population failed; Bloom checks will remain disabled",
        );
        return;
      }

      lastId = Number(products[products.length - 1].id);
      total += products.length;
    }

    this.initialized = true;
    this.logger.log(`Bloom filter ready with ${total} product IDs`);
  }
}
