import { RedisService } from "../redis/redis.service.js";
import { Product } from "./product.model.js";
export declare class ProductService {
    private readonly productModel;
    private readonly redisService;
    constructor(productModel: typeof Product, redisService: RedisService);
    getProduct(): Promise<Product>;
}
