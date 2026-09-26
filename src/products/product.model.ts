import {
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "Products",
  timestamps: true,
})
export class Product extends Model<Product> {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare image: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare qty: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
  })
  declare price: string;

  @CreatedAt
  @Column(DataType.DATE)
  declare createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updatedAt: Date;
}
