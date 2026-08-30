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
      category,
      barcode,
      cost_price,
      sale_price,
      stock_quantity,
      unit,
    } = product;
    const [result] = await pool.query(
      `INSERT INTO products (name, category, barcode, cost_price, sale_price, stock_quantity, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
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
      category,
      barcode,
      cost_price,
      sale_price,
      stock_quantity,
      unit,
    } = product;
    await pool.query(
      `UPDATE products SET name=?, category=?, barcode=?, cost_price=?, sale_price=?, stock_quantity=?, unit=? WHERE id=?`,
      [
        name,
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
    await pool.query("DELETE FROM products WHERE id=?", [id]);
    return { id };
  });
}

module.exports = registerProductHandlers;
