const jwt = require('jsonwebtoken');
const accessKey = require('../config/accessKey');

const auth = (req, res, next) => {
  let token = req.headers["a-access-token"] || req.headers["authorization"];
  if (!token) {
    return res.status(401).json({
      auth: false,
      message: 'Acceso denegado, no contiene un token'
    })
  }
  try {
    // Si llega desde la cabecera autorización
    if (token.includes('Bearer')) {
      token = token.replace('Bearer ', '');
    } 
    const decode = jwt.verify(token, accessKey.secret);
    req.user = decode;
    next();
  } catch (err) {
    res.status(400).json({
      auth: false,
      message: 'El token es inválido'
    });
  }

 }

module.exports = auth;
