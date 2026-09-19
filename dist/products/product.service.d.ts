import { Product } from "./product.model.js";
export declare class ProductService {
    private readonly productModel;
    constructor(productModel: typeof Product);
    getProduct(): Promise<Product>;
}
