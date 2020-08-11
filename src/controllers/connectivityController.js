const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
    const thirdpartyId = req.user.thirdpartyId;
    const connectivity = await getConnectvity(thirdpartyId);
    res.json({
      auth: connectivity ? true: false,
      data: connectivity
    });
 } 

controller.save = async(req, res) => {
  const connectivity = { 
    id: null, 
    thirdparty: req.user.thirdpartyId, 
    provider: req.body.provider || null, 
    budget: req.body.budget || null, 
    startDate: req.body.startDate || null, 
    endDate: req.body.endDate || null, 
    bandWidth: req.body.bandWidth || null, 
    hasBackup: req.body.hasBackup || null, 
    backup: req.body.backup || null, 
    budgetBackup: req.body.budgetBackup || null, 
    startDateBackup: req.body.startDateBackup || null, 
    endDateBackup: req.body.endDateBackup || null, 
    bandWidthBackup: req.body.bandWidthBackup || null, 
    description: req.body.description || null
  };

  /**
   * Valida que cuente con una suite
   * de lo contrario debe de borrar tipo suite y 
   * tipo de contrato
   */
  if (connectivity.hasBackup !== 'S') {
    connectivity.backup = null;
    connectivity.budgetBackup = null;
    connectivity.startDateBackup = null;
    connectivity.endDateBackup = null;
    connectivity.bandWidthBackup = null;
  }

  /**
   * Da formato a las fechas para guardar
   */
  if (connectivity.startDate !== null) {
    connectivity.startDate = new Date(connectivity.startDate);
  } 
  if (connectivity.endDate !== null) {
    connectivity.endDate = new Date(connectivity.endDate);
  }
  if (connectivity.startDateBackup !== null) {
    connectivity.startDateBackup = new Date(connectivity.startDateBackup);
  }
  if (connectivity.endDateBackup !== null) {
    connectivity.endDateBackup = new Date(connectivity.endDateBackup);
  }

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
        PKG_REPORTES.SP_APLICARCONECTIVIDADES
        (
          :thirdparty,
          :provider,
          :budget,
          :startDate,
          :endDate,
          :bandWidth,
          :hasBackup,
          :backup,
          :budgetBackup,
          :startDateBackup,
          :endDateBackup,
          :bandWidthBackup,
          :description,
          :id
        ); END;`,
        {
          thirdparty: connectivity.thirdparty,
          provider: connectivity.provider,
          budget: connectivity.budget,
          startDate: connectivity.startDate,
          endDate: connectivity.endDate,
          bandWidth: connectivity.bandWidth,
          hasBackup: connectivity.hasBackup,
          backup: connectivity.backup,
          budgetBackup: connectivity.budgetBackup,
          startDateBackup: connectivity.startDateBackup,
          endDateBackup: connectivity.endDateBackup,
          bandWidthBackup: connectivity.bandWidthBackup,
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

const getConnectvity = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDCONECTIVIDAD AS "id", 
        IDTERCERO AS "thirdparty", 
        PROVEEDOR AS "provider", 
        PRESUPUESTO AS "budget", 
        FECHAINICIO AS "startDate", 
        FECHAFIN AS "endDate", 
        ANCHODEBANDA AS "bandWidth", 
        USARESPALDO AS "hasBackup", 
        RESPALDO AS "backup", 
        RESPALDOPRESUPUESTO AS "budgetBackup", 
        RESPALDOFECHAINICIO AS "startDateBackup", 
        RESPALDOFECHAFIN AS "endDateBackup", 
        RESPALDOANCHODEBANDA AS "bandWidthBackup", 
        DESCRIPCION AS "description"
      FROM CONSULTA_DESERCION.TB_SUE_CONECTIVIDADES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getConnectvity`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

