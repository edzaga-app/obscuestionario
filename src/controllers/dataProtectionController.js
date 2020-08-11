const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const data = await getDataProtection(thirdpartyId);
  res.json({
    auth: data ? true: false,
    data: data
  });
} 

controller.save = async(req, res) => {
  const data = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(data);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la implementación SGSI, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: data.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const data = { 
    id: null,
    thirdpartyId: thirdpartyId,
    hasSgsi: body.hasSgsi || null,
    budget: body.budget || null,
    dataProtection: body.dataProtection || null,
    description: body.description || null,
  };

  if (data.hasSgsi === 'N') {
    data.budget = null;
  }

  return data;
}

const saveOrUpdate = async (data) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARPROTECCIONDATOS
        (
          :thirdpartyId,
          :hasSgsi,
          :budget,
          :dataProtection,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: data.thirdpartyId,
          hasSgsi: data.hasSgsi,
          budget: data.budget,
          dataProtection: data.dataProtection,
          description: data.description,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        },
        {
          autoCommit: false
        }
    );
    res = result.outBinds;
    await conn.commit();
    
  } catch (err) {
    console.error(err);
    await conn.rollback();
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

const getDataProtection = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDPROTECCIONDATO AS "id", 
        IDTERCERO AS "thirdpartyId", 
        USASGSI AS "hasSgsi", 
        PORCENTAJE AS "budget", 
        USAPROTECCIONDATOS AS "dataProtection", 
        DESCRIPCION AS "description"
      FROM TB_SUE_PROTECCIONDATOS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getDataProtection`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

