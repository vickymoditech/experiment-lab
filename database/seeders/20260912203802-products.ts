import { QueryInterface } from "sequelize";

const TOTAL = 15000;
const BATCH_SIZE = 100;

function productId(index: number): string {
  return `b732e841-92ca-4f65-a014-${String(index).padStart(12, "0")}`;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const products: any[] = [];
    for (let i = 0; i < TOTAL; i++) {
      products.push({
        id: productId(i),
        name: `Product ${i + 1}`,
        image: `Image for Product ${i + 1}`,
        qty: 100000,
        price: (Math.random() * 100).toFixed(2),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        await queryInterface.bulkInsert("Products", batch, { transaction });
      }
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Products", {}, {});
  },
};
