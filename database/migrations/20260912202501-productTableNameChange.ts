import type { QueryInterface } from "sequelize";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.renameTable("products", "Products");
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.renameTable("Products", "products");
  },
};
