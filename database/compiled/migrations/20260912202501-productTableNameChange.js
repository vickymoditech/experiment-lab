"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.renameTable("products", "Products");
    },
    async down(queryInterface) {
        await queryInterface.renameTable("Products", "products");
    },
};
