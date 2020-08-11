const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
    const thirdpartyId = req.user.thirdpartyId;
    const suite = await getComputer(thirdpartyId);
    res.json({
      auth: suite ? true: false,
      data: suite
    });
 } 

controller.save = async(req, res) => {
  const suite = { 
    id: null,
    thirdpartyId: req.user.thirdpartyId,
    hasSuite: req.body.hasSuite || null,
    suite: req.body.suite || null,
    budget: req.body.budget || null,
    hasAgreement: req.body.hasAgreement || null,
    contractType: req.body.contractType || null,
    description: req.body.description || null
  };

  /**
   * Valida que cuente con una suite
   * de lo contrario debe de borrar tipo suite y 
   * tipo de contrato
   */
  if (suite.hasSuite !== 'S') {
    suite.suite = null;
    suite.budget = null;
    suite.hasAgreement = null;
    suite.contractType = null;
  }

  if (suite.hasAgreement !== 'S') {
    suite.contractType = null;
  }

  const apply = await saveOrUpdate(suite);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la suite, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: suite.thirdpartyId
  });
}

  /***********************
 * Fuciones
 ***********************/
const saveOrUpdate = async (suite) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARSUITE
        (
          :thirdpartyId,
          :hasSuite,
          :suite,
          :budget,
          :hasAgreement,
          :contractType,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: suite.thirdpartyId,
          hasSuite: suite.hasSuite,
          suite: suite.suite,
          budget: suite.budget,
          hasAgreement: suite.hasAgreement,
          contractType: suite.contractType,
          description: suite.description,
          id: suite.id,
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
      `SELECT IDSUITE AS "id", 
        IDTERCERO AS "thirdpartyId", 
        CUENTACONSUITE AS "hasSuite", 
        SUITE AS "suite", 
        PRESUPUESTO AS "budget", 
        TIENECONVENIO AS "hasAgreement", 
        TIPOCONTRATO AS "contractType", 
        DESCRIPCION AS "description"
      FROM CONSULTA_DESERCION.TB_SUE_SUITES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getComputer`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

