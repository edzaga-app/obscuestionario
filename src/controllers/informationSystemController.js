const oracledb = require('oracledb');
const config = require('../config/config');
const controller = {};

/***********************
 * Peticiones (Rutas)
 ***********************/
controller.get = async (req, res) => {
  const thirdpartyId = req.user.thirdpartyId;
  const system = await getInformationSystem(thirdpartyId);
  res.json({
    auth: system ? true: false,
    data: system
  });
} 

controller.save = async(req, res) => {
  const system = validateFiels(req.user.thirdpartyId, req.body);
  const apply = await saveOrUpdate(system);

  if (apply === 0 || apply.id === 0 || apply.id === null) {
    return res.status(500).json({
      auth: false,
      message: 'Error al guardar los sistemas de información, comuniquese con el administrador'
    });
  }
  res.json({
    auth: true,
    data: system.thirdpartyId
  });
}

/***********************
 * Fuciones
 ***********************/
const validateFiels = (thirdpartyId, body) => {
  const system = { 
    id: null,
    thirdpartyId: thirdpartyId,
    hasAcademic: body.hasAcademic || null,
    academicName: body.academicName || null,
    academicYear: body.academicYear || null,
    isAcademicPurchased: body.isAcademicPurchased || null,
    academicBudget: body.academicBudget || null,
    hasResearch: body.hasResearch || null,
    researchName: body.researchName || null,
    researchYear: body.researchYear || null,
    isResearchPurchased: body.isResearchPurchased || null,
    researchBudget: body.researchBudget || null,
    hasExtension: body.hasExtension || null,
    extensionName: body.extensionName || null,
    extensionYear: body.extensionYear || null,
    isExtensionPurchased: body.isExtensionPurchased || null,
    extensionBudget: body.extensionBudget || null,
    hasFinancial: body.hasFinancial || null,
    financialName: body.financialName || null,
    financialYear: body.financialYear || null,
    isFinancialPurchased: body.isFinancialPurchased || null,
    financialBudget: body.financialBudget || null,
    hasHumanTalent: body.hasHumanTalent || null,
    humanTalentName: body.humanTalentName || null,
    humanTalentYear: body.humanTalentYear || null,
    isHumanTalentPurchased: body.isHumanTalentPurchased || null,
    humanTalentBudget: body.humanTalentBudget || null,
    description: body.description || null
  };
  // Validar condiciones
  // académica
  if (system.hasAcademic === 'N') {
    system.academicName = null;
    system.academicYear = null;
    system.isAcademicPurchased = null;
    system.academicBudget = null;
  }
  if (system.isAcademicPurchased === 'A') {
    system.academicBudget = null;
  }
  // Investigacion
  if (system.hasResearch === 'N') {
    system.researchName = null;
    system.researchYear = null;
    system.isResearchPurchased = null;
    system.researchBudget = null;
  }
  if (system.isResearchPurchased === 'A') {
    system.researchBudget = null;
  }
  // Extensión
  if (system.hasExtension === 'N') {
    system.extensionName = null;
    system.extensionYear = null;
    system.isExtensionPurchased = null;
    system.extensionBudget = null;
  }
  if (system.isExtensionPurchased === 'A') {
    system.extensionBudget = null;
  }
  // Financiera
  if (system.hasFinancial === 'N') {
    system.financialName = null;
    system.financialYear = null;
    system.isFinancialPurchased = null;
    system.financialBudget = null;
  }
  if (system.isFinancialPurchased === 'A') {
    system.financialBudget = null;
  }
  // Talento Humano
  if (system.hasHumanTalent === 'N') {    
    system.humanTalentName = null;
    system.humanTalentYear = null;
    system.isHumanTalentPurchased = null;
    system.humanTalentBudget = null;
  }
  if (system.isHumanTalentPurchased === 'A') {
    system.humanTalentBudget = null;
  }

  return system;
}

const saveOrUpdate = async (system) => {
  let res = 0;
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `BEGIN 
        PKG_REPORTES.SP_APLICARSISTEMAINFORMACION
        (
          :thirdpartyId,
          :hasAcademic,
          :academicName,
          :academicYear,
          :isAcademicPurchased,
          :academicBudget,
          :hasResearch,
          :researchName,
          :researchYear,
          :isResearchPurchased,
          :researchBudget,
          :hasExtension,
          :extensionName,
          :extensionYear,
          :isExtensionPurchased,
          :extensionBudget,
          :hasFinancial,
          :financialName,
          :financialYear,
          :isFinancialPurchased,
          :financialBudget,
          :hasHumanTalent,
          :humanTalentName,
          :humanTalentYear,
          :isHumanTalentPurchased,
          :humanTalentBudget,
          :description,
          :id
        ); END;`,
        {
          thirdpartyId: system.thirdpartyId,
          hasAcademic: system.hasAcademic,
          academicName: system.academicName,
          academicYear: system.academicYear,
          isAcademicPurchased: system.isAcademicPurchased,
          academicBudget: system.academicBudget,
          hasResearch: system.hasResearch,
          researchName: system.researchName,
          researchYear: system.researchYear,
          isResearchPurchased: system.isResearchPurchased,
          researchBudget: system.researchBudget,
          hasExtension: system.hasExtension,
          extensionName: system.extensionName,
          extensionYear: system.extensionYear,
          isExtensionPurchased: system.isExtensionPurchased,
          extensionBudget: system.extensionBudget,
          hasFinancial: system.hasFinancial,
          financialName: system.financialName,
          financialYear: system.financialYear,
          isFinancialPurchased: system.isFinancialPurchased,
          financialBudget: system.financialBudget,
          hasHumanTalent: system.hasHumanTalent,
          humanTalentName: system.humanTalentName,
          humanTalentYear: system.humanTalentYear,
          isHumanTalentPurchased: system.isHumanTalentPurchased,
          humanTalentBudget: system.humanTalentBudget,
          description: system.description,
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

const getInformationSystem = async (thirdpartyId) => {
  let res = [];
  let conn;
  try {
    conn = await oracledb.getConnection(config);
    const result = await conn.execute(
      `SELECT IDSISTEMAINFORMACION AS "id", 
        IDTERCERO AS "thirdpartyId", 
        USAACADEMICO AS "hasAcademic", 
        NOMBREACADEMICO AS "academicName", 
        ANIOACADEMICO AS "academicYear", 
        ESCOMPRADOACADEMICO AS "isAcademicPurchased", 
        PRESUPUESTOACADEMICO AS "academicBudget", 
        USAINVESTIGACION AS "hasResearch", 
        NOMBREINVESTIGACION AS "researchName", 
        ANIOINVESTIGACION AS "researchYear", 
        ESCOMPRADOINVESTIGACION AS "isResearchPurchased", 
        PRESUPUESTOINVESTIGACION AS "researchBudget", 
        USAEXTENSION AS "hasExtension", 
        NOMBREEXTENSION AS "extensionName", 
        ANIOEXTENSION AS "extensionYear", 
        ESCOMPRADOEXTENSION AS "isExtensionPurchased", 
        PRESUPUESTOEXTENSION AS "extensionBudget", 
        USAFINANCIERO AS "hasFinancial", 
        NOMBREFINANCIERO AS "financialName", 
        ANIOFINANCIERO AS "financialYear", 
        ESCOMPRADOFINANCIERO AS "isFinancialPurchased", 
        PRESUPUESTOFINANCIERO AS "financialBudget", 
        USATALENTOHUMANO AS "hasHumanTalent", 
        NOMBRETALENTOHUMANO AS "humanTalentName", 
        ANIOTALENTOHUMANO AS "humanTalentYear", 
        ESCOMPRADOTALENTOHUMANO AS "isHumanTalentPurchased", 
        PRESUPUESTOTALENTOHUMANO AS "humanTalentBudget",
        DESCRIPCION AS "description"
      FROM TB_SUE_SISTEMAINFORMACIONES
      WHERE IDTERCERO = :IDTERCERO`, [thirdpartyId], { outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    res = result.rows[0];

  } catch (err) {
    console.error(`Error en getInformationSystem`, err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
  return res;
}

module.exports = controller;

