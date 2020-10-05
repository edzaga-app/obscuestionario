const oracledb = require('oracledb');
const config = require('../config/config');
const accessKey = require('../config/accessKey');
const jwt = require('jsonwebtoken');
const { json } = require('express');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/

controller.get = async (req, res) => {
   const emailId = req.user.emailId;
   const information = await getInformation(emailId);
   res.json({
     auth: true,
     data: information
   })
}

controller.auth = async(req, res) => {
  const { email, password } = req.body;
  const user = await authUser(email, password);
  if (user === undefined) {
    return res.json({
      auth: false,
      message: 'Usuario y/o contraseña incorrectos, por favor verifique'
    })
  }
  /**
   * Los campos que se van a encriptar son email y idtercero
   */
  const token = jwt.sign({ emailId: user.user, thirdpartyId: user.thirdpartyId}, accessKey.secret, {
    expiresIn: 60 * 60 * 24 // (En segundos) un día
  })
  
  res.json({
    auth: true,
    token,
    completedInventory: user.completedInventory
  })
}

controller.save = async(req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const { email, university } = req.body;
  const isEdit = await save(thirdpartyId, email.toLowerCase(), university);
  if (isEdit === 0) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar la información, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: thirdpartyId
  });
}

controller.completedinventory = async(req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const { completedInventory } = req.body;
  const isCompleted = await completedinventory(thirdpartyId, completedInventory);
  if (isCompleted === 0) {
    return res.status(500).json({
      auth: false,
      message: 'Error al finalizar el inventario, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: thirdpartyId
  });
}



/***********************
 * Fuciones
 ***********************/
const save = async (thirdpartyId, email, university) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_EDITARINFORMACION(:thirdpartyId, :email, :university);
       END;`,
       {
         thirdpartyId: thirdpartyId,
         email: email,
         university: university
       },
       {
         autoCommit: false
       }
    );
    res = thirdpartyId;
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

const completedinventory = async (thirdpartyId, completedInventory) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_FINALIZARINVENTARIO(:thirdpartyId, :completedInventory);
       END;`,
       {
         thirdpartyId: thirdpartyId,
         completedInventory: completedInventory
       },
       {
         autoCommit: false
       }
    );
    res = thirdpartyId;
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


 /**
  * Retorna los datos almacenados en la tabla 
  * de cada tercero
  * @param {*} email correo del usuario en sesión
  */
const getInformation = async (userId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDTERCERO AS "thirdpartyId",
        UNIVERSIDAD AS "university",
        NOMBRE AS "name",
        EMAIL AS "email",
        FINALIZOINVENTARIO AS "completedInventory"  
       FROM TB_SUE_TERCEROS
       WHERE EMAIL LIKE '%${userId}%'`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT}
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


/**
 * Valida el usuario y contraseña en la tabla
 * @param {*} req 
 * @param {*} res 
 */ 
const authUser = async (user, pass) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDUSUARIO AS "userId",
        IDTERCERO AS "thirdpartyId",
        USUARIOEMAIL AS "user",
        CLAVE AS "password",
        FINALIZOINVENTARIO AS "completedInventory"
       FROM TB_SUE_USUARIOS USU
       JOIN TB_SUE_TERCEROS TST ON TST.EMAIL = USU.USUARIOEMAIL
       WHERE USUARIOEMAIL = :USUARIOEMAIL
       AND CLAVE = :CLAVE`, [user, pass], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res = result.rows[0];

  } catch (err) {
    console.log(`Error en authUser`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

/**
 * Retorna la información del tercero
 * filtrado por el correo 
 * @param {*} email correo del usuario
 */
const getThirdpartyById = async (email) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDTERCERO AS "thirdpartyId",
        UNIVERSIDAD AS "university",
        NOMBRE AS "name",
        EMAIL AS "email"  
       FROM TB_SUE_TERCEROS
       WHERE EMAIL LIKE '%${email}%'`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT}
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