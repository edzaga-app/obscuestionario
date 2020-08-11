const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const computersAvailability = await getComputersAvailability(thirdpartyId);
  res.json({
    auth: true,
    data: computersAvailability
  });
} 

controller.save = async(req, res) => {
  const computer = { 
    thirdpartyId: req.user.thirdpartyId,
    studentQuantity: req.body.studentQuantity || null,
    teacherQuantity: req.body.teacherQuantity || null,
    administrativeQuantity: req.body.administrativeQuantity || null,
    description: req.body.description || null
  };

  const apply = await saveOrUpdate(computer);
  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la disponibilidad de equipos, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: computer.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const saveOrUpdate = async (computer) => {
    let res = 0;
    let conn;
    try {
      conn = await oracledb.getConnection(config);
      const result = await conn.execute(
        `BEGIN 
          PKG_REPORTES.SP_APLICAREQUIPOSDISPONIBLES
          (
            :thirdpartyId,
            :studentQuantity,
            :teacherQuantity,
            :administrativeQuantity,
            :description,
            :id
          ); END;`,
          {
            thirdpartyId: computer.thirdpartyId,
            studentQuantity: computer.studentQuantity,
            teacherQuantity: computer.teacherQuantity,
            administrativeQuantity: computer.administrativeQuantity,
            description: computer.description,
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

const getComputersAvailability = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDDISPONIBILIDADEQUIPO AS "id",
        IDTERCERO AS "thirdpartyId",
        CANTIDADESTUDIANTE AS "studentQuantity",
        CANTIDADDOCENTE AS "teacherQuantity",
        CANTIDADADMINISTRATIVO AS "administrativeQuantity",
        DESCRIPCION AS "description"
      FROM TB_SUE_DISPONIBILIDADEQUIPOS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getinformation`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}


module.exports = controller;