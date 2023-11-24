const log = require("node-file-logger");
const userRepository = require("../repository/user");
const bcryptLib = require("../../libs/bcryptLib");
const orderService = require("../services/order-service");
const userService = require("../services/user-service");
const { decryptData } = require("../../libs/crypto");
const { sendEmail } = require("../util/sendgrid");

const createUser = async (req, res) => {
  try {
    let userData = await userRepository.getUserByEmail(req?.body?.email);
    if (userData) {
      log.Info("User already exist.");
      res.status(409).json({
        message: `User already exist.`,
        status: 409,
      });
    } else {
      let password = await bcryptLib.generateHashedPassword(
        req?.body?.password
      );
      userData = await userRepository.saveUser(req?.body, password);
      log.Info("User created successfully.");
      res.status(200).json({
        message: "User created successfully.",
        status: 200,
        data: userData,
      });
    }
  } catch (error) {
    log.Error(
      "user-controller createUser failed with error : ",
      error.toString()
    );
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    if (req?.body?.loginVia == "google" || req?.body?.loginVia == "facebook") {
      let userObject = req?.body;
      delete userObject?.password;
      const userData = await userRepository.upsertUser(userObject);
      log.Info("User logged in successfully.");
      let response = await orderService.getLoginOrderResponse(userData);
      userRepository.updateUserLastLoginById(userData._id);
      res.status(200).json({
        message: "User logged in successfully.",
        status: 200,
        data: response,
      });
    } else if (req?.body?.loginVia == "email") {
      const userData = await userRepository.getUserByEmail(req?.body?.email);
      if (userData) {
        if (userData.loginVia == "email") {
          let isValidPassword = await bcryptLib.isPasswordRight(
            req?.body?.password,
            userData.password
          );
          if (isValidPassword) {
            log.Info("User logged in successfully.");
            let response = await orderService.getLoginOrderResponse(userData);
            userRepository.updateUserLastLoginById(userData._id);
            res.status(200).json({
              message: "User logged in successfully.",
              status: 200,
              data: response,
            });
          } else {
            log.Info("Incorrect password.");
            res.status(401).json({
              message: `Incorrect password.`,
              status: 401,
            });
          }
        } else {
          log.Info("Please try to login with " + userData?.loginVia + ".");
          res.status(403).json({
            message: `Please try to login with ${userData?.loginVia}.`,
            status: 403,
          });
        }
      } else {
        log.Info("User not found with email and password.");
        res.status(403).json({
          message: `User not found with email and password.`,
          status: 403,
        });
      }
    }
  } catch (error) {
    log.Error(
      "user-controller loginUser failed with error : ",
      error.toString()
    );
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    decryptData(req.body.user).then(async (data) => {
      let userInfo = JSON.parse(data);
      let isUrlExpires = userService.checkIsUrlExpired(userInfo.currentDate);
      if(isUrlExpires){
        return res.status(400).json({
          message: "Link is expired!",
          status: 400,
        });
      }
      let userData = await userRepository.getUserById(userInfo.userId);
      if(userData.resetPassword == false){
        return res.status(409).json({
          message: "Link is already used!",
          status: 409,
        });
      }
      if (userData) {
        let password = await bcryptLib.generateHashedPassword(
          req?.body?.password
        );
        let updateResponse = await userRepository.updateUserPasswordById(
          userData,
          password
        );
        log.Info("Password updated successfully.");
        res.status(200).json({
          message: "Password updated successfully.",
          status: 200,
          data: updateResponse,
        });
      } else {
        log.Error(
          "user-controller forgotPassword user doesn't found with email : ",
          req.body.email
        );
        res.status(404).json({
          message: "User doesn't found with email : " + req.body.email,
          status: 404,
        });
      }
    }).catch((error)=>{
      log.Error(
        "user-controller forgotPassword failed with error : ",
        error.toString()
      );
      res.status(500).json({
        message: error.toString(),
        status: 500,
      });
    });
  } catch (error) {
    log.Error(
      "user-controller forgotPassword failed with error : ",
      error.toString()
    );
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const forgotPasswordLink = async (req, res) => {
  try {
    let userData = await userRepository.getUserByEmail(req.body.email);
    if (userData) {
      let link = userService.generateForgotPasswordLink(userData._id);
      userData["forgotPasswordLink"] = link;
      await userRepository.updateUserResetPasswordFlagById(userData._id, true);
      sendEmail(userData, "forgotPassword")
        .then((response) => {
          if (response.statusCode == 202) {
            log.Info("Link sent on your email.");
            res.status(200).json({
              message: "Link sent on your email.",
              status: 200,
            });
          } else {
            log.Info(
              "user-controller forgotPassword failed with error : ",
              response.message
            );
            res.status(500).json({
              message: response.message,
              status: 500,
            });
          }
        })
        .catch((error) => {
          log.Error(
            "user-controller forgotPassword failed with error : ",
            error.toString()
          );
          res.status(500).json({
            message: error.toString(),
            status: 500,
          });
        });
    } else {
      log.Error(
        "user-controller forgotPassword user doesn't found with email : ",
        req.body.email
      );
      res.status(404).json({
        message: "User doesn't found with email : " + req.body.email,
        status: 404,
      });
    }
  } catch (error) {
    log.Error(
      "user-controller forgotPassword failed with error : ",
      error.toString()
    );
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};
module.exports = { createUser, loginUser, forgotPasswordLink, forgotPassword };
