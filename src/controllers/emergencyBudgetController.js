const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const emergencyBudget = await getEmergencyBudget(thirdpartyId);
  res.json({
    auth: emergencyBudget ? true: false,
    data: emergencyBudget
  });
} 

controller.save = async(req, res) => {
  const emergencyBudget = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(emergencyBudget);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar el presupuesto de emergencia, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: emergencyBudget.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const emergencyBudget = { 
    id: null,
    thirdpartyId: thirdpartyId,
    studentConnectivity: body.studentConnectivity || null,
    teacherConnectivity: body.teacherConnectivity || null,
    administrativeConnectivity: body.administrativeConnectivity || null,
    studentComputer: body.studentComputer || null,
    teacherComputer: body.teacherComputer || null,
    administrativeComputer: body.administrativeComputer || null,
    description: body.description || null
  };
  return emergencyBudget;
}

const saveOrUpdate = async (emergencyBudget) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARPRESUPUESTOEMERG
        (
          :thirdpartyId,
          :studentConnectivity,
          :teacherConnectivity,
          :administrativeConnectivity,
          :studentComputer,
          :teacherComputer,
          :administrativeComputer,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: emergencyBudget.thirdpartyId,
          studentConnectivity: emergencyBudget.studentConnectivity,
          teacherConnectivity: emergencyBudget.teacherConnectivity,
          administrativeConnectivity: emergencyBudget.administrativeConnectivity,
          studentComputer: emergencyBudget.studentComputer,
          teacherComputer: emergencyBudget.teacherComputer,
          administrativeComputer: emergencyBudget.administrativeComputer,
          description: emergencyBudget.description,
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

const getEmergencyBudget = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDPRESUPUESTOEMERGENCIA AS "id",
        IDTERCERO AS "thirdpartyId",
        CONECTIVIDADESTUDIANTE AS "studentConnectivity",
        CONECTIVIDADDOCENTE AS "teacherConnectivity",
        CONECTIVIDADADMINISTRATIVO AS "administrativeConnectivity",
        EQUIPOESTUDIANTE AS "studentComputer",
        EQUIPODOCENTE AS "teacherComputer",
        EQUIPOADMINISTRATIVO AS "administrativeComputer",
        DESCRIPCION AS "description"
      FROM TB_SUE_PRESUPUESTOEMERGENCIAS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getEmergencyBudget`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;
