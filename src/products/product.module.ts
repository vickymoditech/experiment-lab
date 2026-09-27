import { Module } from "@nestjs/common";
import { ProductService } from "./product.service.js";
import { ProductsController } from "./products.controller.js";
import { Product } from "./product.model.js";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductBloomService } from "./product-bloom.service.js";

@Module({
  imports: [SequelizeModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductService, ProductBloomService],
})
export class ProductModule {}
