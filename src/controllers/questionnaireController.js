const oracledb = require('oracledb');
const config = require('../config/config');
const { getConnection, Promise } = require('oracledb');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/

/**
 * Obtiene todos los datos del tercero y del cuestionario
 * @param {*} req Recibe el id del tercero desde la ruta
 * @param {*} res Retorna el objeto json con los datos del cuestionario
 */
controller.get = async(req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const [
      dataStudent,
      semesterStudent,
      survey
    ] = await Promise.all([
      getPersonalData(id),
      fromSemester(id),
      surveyAll()
    ]);

    res.json({
      dataStudent: dataStudent,
      semesterStudent: semesterStudent,
      survey: survey
    });

  } catch (err) {
    console.error(`Error en get`, err);
    res.status(500).json({error: err})
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/***********************
 * Fuciones
 ***********************/

 /**
  * Obtiene la información personal del tercero
  * @param {*} id id del tercero 
  */
const getPersonalData = async(id) => {
  let response = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDTERCERO AS "stsonalrudentId",
        PRIMERNOMBRE || ' ' || PRIMERAPELLIDO || ' ' || SEGUNDOAPELLIDO AS "name",
        CELULAR AS "cellPhone",
        TELEFONO AS "phone",
        '' AS "otherPhone",
        DEPARTAMENTO AS "department",
        MUNICIPIO  AS "municipality",
        BARRIO AS "neighborhood",
        '' AS "zone",
        DIRECCION AS "address",
        '' AS "zipCode",
        '' AS "familiarDeparment",
        '' AS "familiarMunicipality",
        '' AS "familiarneighborhood",
        '' AS "familiarZone",
        '' AS "familiarAddress",
        '' AS "familiarZipCode"
      FROM VI_DATOS_TERCERO
      WHERE IDTERCERO = :IDTERCERO`, [id], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    response = result.rows[0];
    
  } catch (e) {
    console.error(`Error en getPersonalData`, e);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return response;
}

/**
 * Obtiene las preguntas del cuestionario
 */
const getQuestions = async() => {
  let response = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDPREGUNTA "questionId",
        PREGUNTA "question",
        IDTIPOCUESTIONARIO "questionnaireTypeId",
        ENUMERACION "enumeration",
        CONDICIONAL "conditional",
        '' "aswers"
       FROM TB_OBS_PREGUNTAS
       ORDER BY 1`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    response = result.rows;

  } catch (e) {
    console.error(`Error en getQuestions`, e);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return response;
}

/**
 * Obtiene las respuestas del cuestionario
 */
const getAnswers = async() => {
  let response = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDRESPUESTA "answerid",
        RESPUESTA "answer",
        ESCOMPLEMENTADA "isSupplemented",
        IDPREGUNTA "questionId",
        IDTIPORESPUESTA "answerTypeId" 
      FROM TB_OBS_RESPUESTAS
      ORDER BY 1`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );
    response = result.rows;

  } catch (e) {
    console.error(`Error en getAnswers`, e);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return response;
}

/**
 * Si el estudiante es de primer semestre retorna 
 * A, si ya ha cursado mas de un semestre retorna B
 * @param {*} id recibe el id del tercero
 */
const fromSemester = async(id) => {
  let response;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT COUNT(1) AS ESPRIMIPARO
       FROM REGISTRO.TB_MAT_MATRICULA TMM
       JOIN REGISTRO.TB_RYC_PERIODOACADEMICO TRP ON TRP.IDPERIODOACADEMICO = TMM.IDPERIODOACADEMICO 
       WHERE TMM.IDTERCERO = :id
       AND TRP.IDTIPOCALENDARIO = 16`, [id]
    );
    response = result.rows[0][0] > 1 ? 'B' : 'A';

  } catch (e) {
    console.error(`Error en fromSemester`, e);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return response;
}

/**
 * Construye la encuesta relacionando las preguntas
 * con las respuestas que le corresponden
 */
const surveyAll = async() => {
  let survey = [];
  try {
    const [questions, answers] = await Promise.all([getQuestions(), getAnswers()]);
    survey = questions.map(item => ({
      questionId: item.questionId,
      question: item.question,
      questionnaireTypeId: item.questionnaireTypeId,
      enumeration: item.enumeration,
      conditional: item.conditional,
      answers: answers.filter(answer => answer.questionId === item.questionId)
    }));

  } catch (e) {
    console.error(`Error en fromSemester`, e);
  }
  return survey;
}

module.exports = controller;