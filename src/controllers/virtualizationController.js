const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const virtualization = await getVirtualization(thirdpartyId);
  res.json({
    auth: virtualization ? true: false,
    data: virtualization
  });
} 

controller.save = async(req, res) => {
  const virtualization = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(virtualization);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la virtualización, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: virtualization.thirdparty
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const virtualization = { 
    id: null, 
    thirdparty: thirdpartyId,
    hasVirtualization: body.hasVirtualization || null,
    virtualization: body.virtualization || null,
    description: body.description || null
  };

  if (virtualization.hasVirtualization !== 'S') {
    virtualization.virtualization = null;
    virtualization.description = null;
  }
  return virtualization;
}

const saveOrUpdate = async (virtual) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARVIRTUALIZACION
        (
          :thirdparty,
          :hasVirtualization,
          :virtualization,
          :description,
          :id
        ); END;`,
        {
          thirdparty: virtual.thirdparty,
          hasVirtualization: virtual.hasVirtualization,
          virtualization: virtual.virtualization,
          description: virtual.description,
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

const getVirtualization = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDVIRTUALIZACION AS "id", 
        IDTERCERO AS "thirdparty", 
        USAVIRTUALIZACION AS "hasVirtualization", 
        VIRTUALIZACION AS "virtualization", 
        DESCRIPCION AS "description"
      FROM TB_SUE_VIRTUALIZACIONES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getVirtualization`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

