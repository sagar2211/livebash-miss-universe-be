var config = require("../server/config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const key = envSettings.CRYPTO_KEY;
const Cryptr = require("cryptr");
const cryptr = new Cryptr(key);
const log = require("node-file-logger");

exports.encryptData = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const encrypted = cryptr.encrypt(data);
      resolve(encrypted);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(`${error.toString()}`);
    }
  });
};

exports.decryptData = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const decrypted = cryptr.decrypt(data);
      resolve(decrypted);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(`${error.toString()}`);
    }
  });
};
