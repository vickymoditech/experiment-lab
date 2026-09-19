import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Product } from "./product.model.js";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private readonly productModel: typeof Product,
  ) {}

  async getProduct(): Promise<Product> {
    const getRandomProductId = Math.floor(Math.random() * 15000) + 1; // Assuming you have 15000 products in the database
    const product = await this.productModel.findByPk(getRandomProductId, {
      attributes: ["id", "name", "image", "qty", "price"],
      raw: true, // Return plain object instead of Sequelize model instance
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${getRandomProductId} not found`,
      );
    }

    return product;
  }
}
