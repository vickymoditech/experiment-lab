import { ProductService } from "./product.service.js";
export declare class ProductsController {
    private readonly productService;
    constructor(productService: ProductService);
    getProduct(): Promise<import("./product.model.js").Product>;
}
