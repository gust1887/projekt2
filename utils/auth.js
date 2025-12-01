const crypto = require('crypto');


// Hash funktion
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }
  
  function validatePassword(password, salt, hash) {
    const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
  }
  
  module.exports = { hashPassword, validatePassword };
