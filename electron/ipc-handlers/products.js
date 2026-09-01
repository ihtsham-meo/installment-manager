const { ipcMain } = require("electron");
const pool = require("../db");

function registerProductHandlers() {
  ipcMain.handle("products:list", async () => {
    const [rows] = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    return rows;
  });

  ipcMain.handle("products:add", async (event, product) => {
    const {
      name,
      company,
      category,
      barcode,
      cost_price,
      sale_price,
      stock_quantity,
      unit,
    } = product;
    const [result] = await pool.query(
      `INSERT INTO products (name, company, category, barcode, cost_price, sale_price, stock_quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        company || null,
        category,
        barcode || null,
        cost_price,
        sale_price,
        stock_quantity,
        unit || "pcs",
      ],
    );
    return { id: result.insertId, ...product };
  });

  ipcMain.handle("products:update", async (event, id, product) => {
    const {
      name,
      company,
      category,
      barcode,
      cost_price,
      sale_price,
      stock_quantity,
      unit,
    } = product;
    await pool.query(
      `UPDATE products SET name=?, company=?, category=?, barcode=?, cost_price=?, sale_price=?, stock_quantity=?, unit=? WHERE id=?`,
      [
        name,
        company || null,
        category,
        barcode || null,
        cost_price,
        sale_price,
        stock_quantity,
        unit,
        id,
      ],
    );
    return { id, ...product };
  });

  ipcMain.handle("products:delete", async (event, id) => {
    try {
      await pool.query("DELETE FROM products WHERE id=?", [id]);
    } catch (err) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        throw new Error(
          "Cannot delete this product because it is used in sale records.",
        );
      }
      throw err;
    }
    return { id };
  });
}

module.exports = registerProductHandlers;
