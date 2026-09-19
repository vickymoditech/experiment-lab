import { Model } from "sequelize-typescript";
export declare class Product extends Model<Product> {
    id: string;
    name: string;
    image: string | null;
    qty: number;
    price: string;
    createdAt: Date;
    updatedAt: Date;
}
