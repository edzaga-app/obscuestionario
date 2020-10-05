const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const cloud = await getCloud(thirdpartyId);
  res.json({
    auth: cloud ? true: false,
    data: cloud
  });
} 

controller.save = async(req, res) => {
  const cloud = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(cloud);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar los servicios de cloud, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: cloud.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const cloud = { 
    id: null,
    thirdpartyId: thirdpartyId,
    hasCloud: body.hasCloud || null,
    aws: body.aws || null,
    azure: body.azure || null,
    googleCloud: body.googleCloud || null,
    otherCloud: body.otherCloud || null,
    cloudType: body.cloudType || null,
    storageQuantity: body.storageQuantity || null,
    cloudServices: body.cloudServices || null,
    cloudBudget: body.cloudBudget || null,
    description: body.description || null,
    other: body.other || null
  };

  if (cloud.hasCloud !== 'S') {
    cloud.aws = null;
    cloud.azure = null;
    cloud.googleCloud = null;
    cloud.otherCloud = null;
    cloud.cloudType = null;
    cloud.storageQuantity = null;
    cloud.cloudServices = null;
    cloud.cloudBudget = null;
    cloud.description = null;
    cloud.other = null;
  }

  if (cloud.aws) {
    cloud.aws = '1';
  }
  if (cloud.azure) {
    cloud.azure = '1';
  }
  if (cloud.googleCloud) {
    cloud.googleCloud = '1'
  }
  if (cloud.otherCloud) {
    cloud.otherCloud = '1';
  }  
  return cloud;
}

const saveOrUpdate = async (cloud) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARCLOUDS
        (
          :thirdpartyId,
          :hasCloud,
          :aws,
          :azure,
          :googleCloud,
          :otherCloud,
          :cloudType,
          :storageQuantity,
          :cloudServices,
          :cloudBudget,
          :description,
          :other,
          :id
        ); END;`,
        {
          thirdpartyId: cloud.thirdpartyId,
          hasCloud: cloud.hasCloud,
          aws: cloud.aws,
          azure: cloud.azure,
          googleCloud: cloud.googleCloud,
          otherCloud: cloud.otherCloud,
          cloudType: cloud.cloudType,
          storageQuantity: cloud.storageQuantity,
          cloudServices: cloud.cloudServices,
          cloudBudget: cloud.cloudBudget,
          description: cloud.description,
          other: cloud.other,
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

const getCloud = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDCLOUD AS "id", 
        IDTERCERO AS "thirdparty", 
        USACLOUD AS "hasCloud", 
        AMAZON AS "aws", 
        AZURE AS "azure", 
        GOOGLECLOUD AS "googleCloud", 
        OTRACLOUD AS "otherCloud", 
        TIPOCLOUD AS "cloudType",
        CANTIDADALMACENAMIENTO AS "storageQuantity", 
        SERVICIOSCLOUD AS "cloudServices", 
        PRESUPUESTOCLOUD AS "cloudBudget", 
        DESCRIPCION AS "description",
        OTRA AS "other"
      FROM TB_SUE_CLOUDS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getCloud`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

