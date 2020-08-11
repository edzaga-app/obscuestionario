const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const campus = await getCampusLicensing(thirdpartyId);
  res.json({
    auth: campus ? true: false,
    data: campus
  });
} 

controller.save = async(req, res) => {
  const campus = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(campus);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar el licenciamiento de tipo campus, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: campus.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const campus = { 
    id: null,
    thirdpartyId: thirdpartyId,
    licensing: body.licensing || null,
    budget: body.budget || null,
    description: body.description || null,
  };
  return campus;
}

const saveOrUpdate = async (campus) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARLICENCIAMIENTOS
        (
          :thirdpartyId,
          :licensing,
          :budget,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: campus.thirdpartyId, 
          licensing: campus.licensing, 
          budget: campus.budget, 
          description: campus.description,
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

const getCampusLicensing = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDLICENCIAMIENTOCAMPUS AS "id", 
        IDTERCERO AS "thirdpartyId", 
        LICENCIAMIENTO AS "licensing", 
        PRESUPUESO AS "budget", 
        DESCRIPCION AS "description"
      FROM TB_SUE_LICENCIAMIENTOCAMPUS
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getCampusLicensing`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

