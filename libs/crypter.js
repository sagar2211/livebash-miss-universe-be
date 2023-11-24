var config = require("../server/config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const key = envSettings.CRYPTO_KEY;
const Cryptr = require("cryptr");
const cryptr = new Cryptr(key);
const log = require("node-file-logger");

const encryptData = (data) => {
  try {
    const encrypted = cryptr.encrypt(data);
    return encrypted;
  } catch (error) {
    log.Error(`${error.toString()}`);
    return `${error.toString()}`;
  }
};

const decryptData = (data) => {
  try {
    const decrypted = cryptr.decrypt(data);
    return decrypted;
  } catch (error) {
    log.Error(`${error.toString()}`);
    return `${error.toString()}`;
  }
};
module.exports = {
  encryptData,
  decryptData,
};
