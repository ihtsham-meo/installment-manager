const { ipcMain } = require("electron");
const pool = require("../db");
const { requireRole } = require("../session");
const { logAudit } = require("../audit");

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
    await logAudit("create", "products", result.insertId, null, product);
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
    await logAudit("update", "products", id, null, product);
    return { id, ...product };
  });

  ipcMain.handle("products:delete", async (event, id) => {
    requireRole("admin", "manager");
    await pool.query("DELETE FROM products WHERE id=?", [id]);
    await logAudit("delete", "products", id, null, null);
    return { id };
  });
}

module.exports = registerProductHandlers;
