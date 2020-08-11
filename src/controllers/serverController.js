const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const sever = await getServer(thirdpartyId);
  res.json({
    auth: sever ? true: false,
    data: sever
  });
} 

controller.save = async(req, res) => {
  const server = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(server);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar los servidores, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: server.thirdparty
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const server = { 
    id: null,
    thirdparty: thirdpartyId,
    isOwn: body.isOwn || null,
    isRented: body.isRented || null,
    isMixed: body.isMixed || null,
    noServer: body.noServer || null,
    ownQuantity: body.ownQuantity || null,
    ownBudget: body.ownBudget || null,
    ownMaintenance: body.ownMaintenance || null,
    ownServices: body.ownServices || null,
    rentedQuantity: body.rentedQuantity || null,
    rentedBudget: body.rentedBudget || null,
    rentedServices: body.rentedServices || null,
    mixedQuantity: body.mixedQuantity || null,
    mixedBudget: body.mixedBudget || null,
    mixedMaintenance: body.mixedMaintenance || null,
    mixedServices: body.mixedServices || null,
    mixedRented: body.mixedRented || null,
    mixedRentedBudget: body.mixedRentedBudget || null,
    mixedRentedServices: body.mixedRentedServices || null,
    description: body.description || null
  };

  if (server.isOwn === "A") {
    server.isRented = null;
    server.isMixed = null;
    server.noServer = null;
    server.rentedQuantity = null;
    server.rentedBudget = null;
    server.rentedServices = null;
    server.mixedQuantity = null;
    server.mixedBudget = null;
    server.mixedMaintenance = null;
    server.mixedServices = null;
    server.mixedRented = null;
    server.mixedRentedBudget = null;
    server.mixedRentedServices = null;
  }

  if (server.isRented === 'B') {
    server.isOwn = null;
    server.isMixed = null;
    server.noServer = null;
    server.ownQuantity = null;
    server.ownBudget = null;
    server.ownMaintenance = null;
    server.ownServices = null;
    server.mixedQuantity = null;
    server.mixedBudget = null;
    server.mixedMaintenance = null;
    server.mixedServices = null;
    server.mixedRented = null;
    server.mixedRentedBudget = null;
    server.mixedRentedServices = null;
  }

  if (server.isMixed === 'C') {
    server.isOwn = null;
    server.isRented = null;
    server.noServer = null;
    server.ownQuantity = null;
    server.ownBudget = null;
    server.ownMaintenance = null;
    server.ownServices = null;
    server.rentedQuantity = null;
    server.rentedBudget = null;
    server.rentedServices = null;
  }

  if (server.noServer === 'D') {
    server.isOwn = null;
    server.isRented = null;
    server.isMixed = null;
    server.ownQuantity = null;
    server.ownBudget = null;
    server.ownMaintenance = null;
    server.ownServices = null;
    server.rentedQuantity = null;
    server.rentedBudget = null;
    server.rentedServices = null;
    server.mixedQuantity = null;
    server.mixedBudget = null;
    server.mixedMaintenance = null;
    server.mixedServices = null;
    server.mixedRented = null;
    server.mixedRentedBudget = null;
    server.mixedRentedServices = null;
  }

  return server;

}

const saveOrUpdate = async (server) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARSEVIDORES
        (
          :thirdparty,
          :isOwn,
          :isRented,
          :isMixed,
          :noServer,
          :ownQuantity,
          :ownBudget,
          :ownMaintenance,
          :ownServices,
          :rentedQuantity,
          :rentedBudget,
          :rentedServices,
          :mixedQuantity,
          :mixedBudget,
          :mixedMaintenance,
          :mixedServices,
          :mixedRented,
          :mixedRentedBudget,
          :mixedRentedServices,
          :description,
          :id
        ); END;`,
        {
          thirdparty: server.thirdparty,
          isOwn: server.isOwn,
          isRented: server.isRented,
          isMixed: server.isMixed,
          noServer: server.noServer,
          ownQuantity: server.ownQuantity,
          ownBudget: server.ownBudget,
          ownMaintenance: server.ownMaintenance,
          ownServices: server.ownServices,
          rentedQuantity: server.rentedQuantity,
          rentedBudget: server.rentedBudget,
          rentedServices: server.rentedServices,
          mixedQuantity: server.mixedQuantity,
          mixedBudget: server.mixedBudget,
          mixedMaintenance: server.mixedMaintenance,
          mixedServices: server.mixedServices,
          mixedRented: server.mixedRented,
          mixedRentedBudget: server.mixedRentedBudget,
          mixedRentedServices: server.mixedRentedServices,
          description: server.description,
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

const getServer = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDSERVIDOR AS "id", 
        IDTERCERO AS "thirdparty", 
        ESPROPIO AS	"isOwn", 
        ESRENTADO AS "isRented", 
        ESMIXTO AS "isMixed", 
        SINSERVIDOR AS "noServer", 
        CANTIDADPROPIO AS "ownQuantity", 
        PRESUPUESTOPROPIO AS "ownBudget", 
        MANTENIMIENTOPROPIO AS "ownMaintenance", 
        SERVICIOSPROPIO AS "ownServices", 
        CANTIDADRENTADO AS "rentedQuantity", 
        PRESUPUESTORENTADO AS "rentedBudget", 
        SERVICIOSRENTADO AS "rentedServices", 
        CANTIDADMIXTO AS "mixedQuantity", 
        PRESUPUESTOMIXTO AS "mixedBudget", 
        MANTENIMIENTOMIXTO AS "mixedMaintenance", 
        SERVICIOSMIXTO AS "mixedServices", 
        RENTADOMIXTO AS "mixedRented", 
        PRESUPUESTORENTADOMIXTO AS "mixedRentedBudget", 
        SERVICIOSRENTADOMIXTO AS "mixedRentedServices", 
        DESCRIPCION AS "description"
      FROM TB_SUE_SERVIDORES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getServer`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

