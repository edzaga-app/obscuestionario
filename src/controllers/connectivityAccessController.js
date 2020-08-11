const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
    const thirdpartyId = req.user.thirdpartyId;
    const connectivity = await getConnectvityAccess(thirdpartyId);
    res.json({
      auth: connectivity ? true: false,
      data: connectivity
    });
 } 

controller.save = async(req, res) => {
  const connectivity = { 
    id: null,
    thirdpartyId: req.user.thirdpartyId, 
    studentQuantity: req.body.studentQuantity || null,
    teacherQuantity: req.body.teacherQuantity || null,
    administrativeQuantity: req.body.administrativeQuantity || null,
    description: req.body.description || null
  };

  const apply = await saveOrUpdate(connectivity);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la conectividad, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: connectivity.thirdpartyId
  });
}

  /***********************
 * Fuciones
 ***********************/
const saveOrUpdate = async (connectivity) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARACCESOCONECTIVIDADES
        (
          :thirdpartyId,
          :studentQuantity,
          :teacherQuantity,
          :administrativeQuantity,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: connectivity.thirdpartyId,
          studentQuantity: connectivity.studentQuantity,
          teacherQuantity: connectivity.teacherQuantity,
          administrativeQuantity: connectivity.administrativeQuantity,
          description: connectivity.description,
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

const getConnectvityAccess = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDACCESOCONECTIVIDAD AS "id", 
        IDTERCERO AS "thirdpartyId", 
        CANTIDADESTUDIANTE AS "studentQuantity", 
        CANTIDADDOCENTE AS "teacherQuantity", 
        CANTIDADADMINITRATIVO AS "administrativeQuantity",
        DESCRIPCION AS "description"
      FROM TB_SUE_ACCESOCONECTIVIDADES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getConnectvityAccess`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

