"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TOTAL = 15000;
const BATCH_SIZE = 100;
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const products = [];
        for (let i = 0; i < TOTAL; i++) {
            products.push({
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
    async down(queryInterface) {
        await queryInterface.bulkDelete("Products", {}, {});
    },
};
