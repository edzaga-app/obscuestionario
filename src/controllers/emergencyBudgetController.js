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
    obsStudentConnectivity: body.obsStudentConnectivity || null,
    teacherConnectivity: body.teacherConnectivity || null,
    obsTeacherConnectivity: body.obsTeacherConnectivity || null,
    administrativeConnectivity: body.administrativeConnectivity || null,
    obsAdministrativeConnectivity: body.obsAdministrativeConnectivity || null,
    studentComputer: body.studentComputer || null,
    obsStudentComputer: body.obsStudentComputer || null,
    teacherComputer: body.teacherComputer || null,
    obsTeacherComputer: body.obsTeacherComputer || null,
    administrativeComputer: body.administrativeComputer || null,
    obsAdministrativeComputer: body.obsAdministrativeComputer || null
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
          :obsStudentConnectivity,
          :teacherConnectivity,
          :obsTeacherConnectivity,
          :administrativeConnectivity,
          :obsAdministrativeConnectivity,
          :studentComputer,
          :obsStudentComputer,
          :teacherComputer,
          :obsTeacherComputer,
          :administrativeComputer,
          :obsAdministrativeComputer,
          :id
        ); END;`,
        {
          thirdpartyId: emergencyBudget.thirdpartyId,
          studentConnectivity: emergencyBudget.studentConnectivity,
          obsStudentConnectivity: emergencyBudget.obsStudentConnectivity,
          teacherConnectivity: emergencyBudget.teacherConnectivity,
          obsTeacherConnectivity: emergencyBudget.obsTeacherConnectivity,
          administrativeConnectivity: emergencyBudget.administrativeConnectivity,
          obsAdministrativeConnectivity: emergencyBudget.obsAdministrativeConnectivity,
          studentComputer: emergencyBudget.studentComputer,
          obsStudentComputer: emergencyBudget.obsStudentComputer,
          teacherComputer: emergencyBudget.teacherComputer,
          obsTeacherComputer: emergencyBudget.obsTeacherComputer,
          administrativeComputer: emergencyBudget.administrativeComputer,
          obsAdministrativeComputer: emergencyBudget.obsAdministrativeComputer,
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
        OBSCONECTIVIDADESTUDIANTE AS "obsStudentConnectivity", 
        CONECTIVIDADDOCENTE AS "teacherConnectivity", 
        OBSCONECTIVIDADDOCENTE AS "obsTeacherConnectivity", 
        CONECTIVIDADADMINISTRATIVO AS "administrativeConnectivity", 
        OBSCONECTIVIDADADMINISTRATIVO AS "obsAdministrativeConnectivity", 
        EQUIPOESTUDIANTE AS "studentComputer", 
        OBSEQUIPOESTUDIANTE AS "obsStudentComputer", 
        EQUIPODOCENTE AS "teacherComputer", 
        OBSEQUIPODOCENTE AS "obsTeacherComputer", 
        EQUIPOADMINISTRATIVO AS "administrativeComputer", 
        OBSEQUIPOADMINISTRATIVO AS "obsAdministrativeComputer"
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
