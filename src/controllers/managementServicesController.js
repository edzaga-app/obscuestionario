const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const management = await getManagementServices(thirdpartyId);
  res.json({
    auth: management ? true: false,
    data: management
  });
} 

controller.save = async(req, res) => {
  const management = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(management);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la gestión de servicios, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: management.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const management = { 
    id: null,
    tirdpartyId: thirdpartyId,
    hasManagement: body.hasManagement || null,
    management: body.management || null,
    description: body.description || null
  };

  if (management.hasManagement !== 'S') {
    management.management = null;
    management.description = null;
  }
  return management;
}

const saveOrUpdate = async (management) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARGESTIONSERVICIOS
        (
          :tirdpartyId,
          :hasManagement,
          :management,
          :description,
          :id
        ); END;`,
        {
          tirdpartyId: management.tirdpartyId,
          hasManagement: management.hasManagement,
          management: management.management,
          description: management.description,
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

const getManagementServices = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDGESTIONSERVICIOS AS "id", 
        IDTERCERO AS "tirdpartyId", 
        USAGESTION AS "hasManagement", 
        GESTION AS "management", 
        DESCRIPCION AS "description"
      FROM TB_SUE_GESTIONSERVICIOS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getManagementServices`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

