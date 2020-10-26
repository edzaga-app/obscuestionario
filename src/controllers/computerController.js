const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
    const thirdpartyId = req.user.thirdpartyId;
    const computer = await getComputer(thirdpartyId);
    res.json({
      auth: computer ? true: false,
      data: computer
    });
 } 

controller.save = async(req, res) => {
  const computer = { 
    thirdpartyId: req.user.thirdpartyId,
    functionalQuantity: req.body.functionalQuantity || null,
    studentQuantity: req.body.studentQuantity || null,
    teacherQuantity: req.body.teacherQuantity || null,
    administrativeQuantity: req.body.administrativeQuantity || null,
    useReplacement: req.body.useReplacement || null,
    budget: req.body.budget || null,
    repositionComputer: req.body.repositionComputer || null,
    description: req.body.description || null
  };
  // Valida que tenga reposición para preguntar su presuesto y los equipos en reposiscion
  if (computer.useReplacement !== 'S') {
    computer.budget = null;
    computer.repositionComputer = null;    
  }
  const apply = await saveOrUpdate(computer);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar los equipos de computo, comuniquese con el administrador'
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
        PKG_REPORTES.SP_APLICAREQUIPO
        (
          :thirdpartyId,
          :functionalQuantity,
          :studentQuantity,
          :teacherQuantity,
          :administrativeQuantity,
          :useReplacement,
          :budget,
          :repositionComputer,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: computer.thirdpartyId,
          functionalQuantity: computer.functionalQuantity,
          studentQuantity: computer.studentQuantity,
          teacherQuantity: computer.teacherQuantity,
          administrativeQuantity: computer.administrativeQuantity,
          useReplacement: computer.useReplacement,
          budget: computer.budget,
          repositionComputer: computer.repositionComputer,
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

const getComputer = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDEQUIPO AS "id", 
        IDTERCERO AS "thirdpartyId", 
        CANTIDADFUNCIONAL AS "functionalQuantity", 
        CANTIDADESTUDIANTE AS "studentQuantity", 
        CANTIDADDOCENTE AS "teacherQuantity", 
        CANTIDADADMINISTRATIVO AS "administrativeQuantity", 
        USAREPOSICION AS "useReplacement", 
        PRESUPUESTO AS "budget", 
        EQUIPOSENREPOSICION AS "repositionComputer", 
        DESCRIPCION AS "description" 
      FROM CONSULTA_DESERCION.TB_SUE_EQUIPOS
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

const findThirdparty = async (id) => {
    let res = [];
    let conn;
    try {
      conn = await oracledb.getConnection(config);
      const result = await conn.execute(
        `SELECT COUNT(1) AS "exist"
         FROM TB_SUE_EQUIPOS
         WHERE IDTERCERO = :IDTERCERO`, [id], { outFormat: oracledb.OUT_FORMAT_OBJECT}
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