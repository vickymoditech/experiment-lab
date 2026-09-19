var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Product } from "./product.model.js";
let ProductService = class ProductService {
    productModel;
    constructor(productModel) {
        this.productModel = productModel;
    }
    async getProduct() {
        const getRandomProductId = Math.floor(Math.random() * 15000) + 1;
        const product = await this.productModel.findByPk(getRandomProductId, {
            attributes: ["id", "name", "image", "qty", "price"],
            raw: true,
        });
        if (!product) {
            throw new NotFoundException(`Product with id ${getRandomProductId} not found`);
        }
        return product;
    }
};
ProductService = __decorate([
    Injectable(),
    __param(0, InjectModel(Product)),
    __metadata("design:paramtypes", [Object])
], ProductService);
export { ProductService };
//# sourceMappingURL=product.service.js.map