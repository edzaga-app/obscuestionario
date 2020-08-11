const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const network = await getDomesticNetwork(thirdpartyId);
  res.json({
    auth: network ? true: false,
    data: network
  });
} 

controller.save = async(req, res) => {
  const network = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(network);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la red nacional de educación, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: network.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const network = { 
    id: null,
    thirdpartyId: thirdpartyId,
    hasDomesticNetwork: body.hasDomesticNetwork || null,
    networkName: body.networkName || null,
    hasRenata: body.hasRenata || null,
    hasRenataTools: body.hasRenataTools || null,
    renataTools: body.renataTools || null,
    renataBudget: body.renataBudget || null,
    qualificationRenata: body.qualificationRenata || null,
    forImprovingRenata: body.forImprovingRenata || null,
    doesNotBelongRenata: body.doesNotBelongRenata || null,
    description: body.description || null
  };

  if (network.hasRenataTools === 'N') {
    network.renataTools = null;
    network.renataBudget = null;
  }

  if (network.hasRenata === 'S') {
    network.doesNotBelongRenata = null;
  }

  if (network.hasRenata === 'N') {
    network.hasRenataTools = null;
    network.renataTools = null;
    network.renataBudget = null;
    network.qualificationRenata = null;
    network.forImprovingRenata = null;
  }

  if (network.hasDomesticNetwork === 'N') {
    network.networkName = null;
    network.hasRenata = null;
    network.hasRenataTools = null;
    network.renataTools = null;
    network.renataBudget = null;
    network.qualificationRenata = null;
    network.forImprovingRenata = null;
    network.doesNotBelongRenata = null;
    network.description = null;
  }

  return network;
}

const saveOrUpdate = async (network) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARREDESNACIONALES
        (
          :thirdpartyId,
          :hasDomesticNetwork,
          :networkName,
          :hasRenata,
          :hasRenataTools,
          :renataTools,
          :renataBudget,
          :qualificationRenata,
          :forImprovingRenata,
          :doesNotBelongRenata,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: network.thirdpartyId,
          hasDomesticNetwork: network.hasDomesticNetwork,
          networkName: network.networkName,
          hasRenata: network.hasRenata,
          hasRenataTools: network.hasRenataTools,
          renataTools: network.renataTools,
          renataBudget: network.renataBudget,
          qualificationRenata: network.qualificationRenata,
          forImprovingRenata: network.forImprovingRenata,
          doesNotBelongRenata: network.doesNotBelongRenata,
          description: network.description,
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

const getDomesticNetwork = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDREDESNACIONALES AS "id", 
        IDTERCERO AS "thirdpartyId", 
        USAREDNACIONAL AS "hasDomesticNetwork", 
        NOMBREREDES AS "networkName", 
        USARENATA AS "hasRenata", 
        USAHERRAMIENTASRENATA AS "hasRenataTools", 
        HERRAMIENTASRENATA AS "renataTools", 
        PRESUPUESTORENATA AS "renataBudget", 
        CALIFICACIONRENATA AS "qualificationRenata", 
        PORMEJORARRENATA AS "forImprovingRenata", 
        NOPERTENECERENATA AS "doesNotBelongRenata", 
        DESCRIPCION AS "description"
      FROM TB_SUE_REDESNACIONALES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getDomesticNetwork`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

