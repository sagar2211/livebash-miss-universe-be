const crypter = require("../../libs/crypter");
var config = require("../config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const frontendPath = envSettings.FRONTEND_PATH;
const log = require("node-file-logger");
const generateForgotPasswordLink = (userId) =>{
    try {
        let currentDate = new Date()
        currentDate.setDate(currentDate.getDate() + 1);
        let userObject = { 
            userId: userId,
            currentDate : currentDate
        }
        let encryptedUrl = crypter.encryptData(JSON.stringify(userObject));
        let link = `${frontendPath}/change-password/?user=${encryptedUrl}`;
        return link;
    } catch (error) {
        log.Error("User service generateForgotPasswordLink failed with error : ",error.toString());
        throw error;
    }
}

const checkIsUrlExpired = (currentDate) =>{
    try {
        let urlGeneratedTime = new Date(currentDate);
        let currentTime = new Date();
        if(urlGeneratedTime < currentTime){
            return true;
        } else {
            return false;
        }
    } catch (error) {
        log.Error("User service checkIsUrlExpired failed with error : ",error.toString());
        throw error;
    }
}

module.exports = {
    generateForgotPasswordLink,
    checkIsUrlExpired
}