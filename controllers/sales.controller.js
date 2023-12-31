const mysql = require("mysql2/promise");
const db = require("../dbfile.js");


exports.getSales = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = (await conn.query( 
    `
      SELECT 
      t1.*,
      t2.nombre,
      t2.descripcion,
      t2.precio,
      t2.cantidad,
      users.*
    FROM ventas t1
    JOIN productos t2 on t1.codigo_producto = t2.codigo 
    JOIN users on t1.id_usuarios = users.id
  `));
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al consultar las ventas" + err.message);
  }
};


exports.createSale = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const {
      codigo_producto,
      cantidad_vendida,
      total_venta,
      id_usuarios,
    } = req.body;
    const [result] = await conn.query(
      "INSERT INTO ventas(codigo_producto, cantidad_vendida, total_venta, id_usuarios) VALUES (?, ?, ?, ?)",
      [
        codigo_producto,
        cantidad_vendida,
        total_venta,
        id_usuarios
      ]
    );
    const [rows] = await conn.query(
      "SELECT * FROM productos WHERE codigo = ?",
      [codigo_producto]
    );
    const cantidadActual = rows[0].cantidad;
    const nuevaCantidad = cantidadActual - cantidad_vendida;
    await conn.query("UPDATE productos SET cantidad = ? WHERE codigo = ?", [
      nuevaCantidad,
      codigo_producto,
    ]);
    conn.release();
    res.json({ ...req.body, codigo: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear la venta");
  }
};

exports.updateSale = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = await conn.query("SELECT * FROM ventas WHERE codigo = ?", [
      req.params.codigo,
    ]);
    if (rows.length === 0) {
      res.status(404).send("venta no encontrada");
      return;
    }
    if (req.body.codigo) {
      res.status(400).send('No se puede actualizar el campo "codigo"');
      return;
    }
    const {
      codigo_producto,
      fecha_venta,
      cantidad_vendida,
      id_usuarios,
      total_venta,
    } = req.body;
    const fieldsToUpdate = {};
    if (codigo_producto) fieldsToUpdate.codigo_producto = codigo_producto;
    if (fecha_venta) fieldsToUpdate.fecha_venta = fecha_venta;
    if (cantidad_vendida) fieldsToUpdate.cantidad_vendida = cantidad_vendida;
    if (total_venta) fieldsToUpdate.total_venta = total_venta;
    if (id_usuarios) fieldsToUpdate.id_usuarios = id_usuarios;
    const [result] = await conn.query("UPDATE ventas SET ? WHERE codigo = ?", [
      fieldsToUpdate,
      req.params.codigo,
    ]);
    conn.release();
    if (result.affectedRows === 0) {
      res.status(404).send("venta no encontrada");
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar la venta");
  }
};
exports.getSaleByCode = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [rows] = await conn.query(`SELECT * FROM ventas t1
    join productos t2 on t1.codigo_producto = t2.codigo
    JOIN users on t1.id_usuarios = users.id WHERE t1.codigo = ?`, [
      req.params.codigo,
    ]);
    conn.release();
    if (rows.length === 0) {
      res.status(404).send("venta no encontrada");
    } else {
      res.json(rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener la venta");
  }
};

exports.deleteSale = async (req, res) => {
  try {
    const conn = await db.getConnection();
    const [result] = await conn.query("DELETE FROM ventas  WHERE codigo = ?", [
      req.params.codigo,
    ]);
    conn.release();
    if (result.affectedRows === 0) {
      res.status(404).send("venta no encontrada");
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar la venta");
  }
};
