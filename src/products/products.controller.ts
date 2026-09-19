import { Controller, Get, Param } from "@nestjs/common";
import { ProductService } from "./product.service.js";

@Controller("products")
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  getProduct() {
    return this.productService.getProduct();
  }
}
