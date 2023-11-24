const userController = require("../controllers/user-controller");
const userValidator = require("../validator/user");
const express = require("express");
const router = express.Router();

//create user for mis universe
router.post(
  "/create",
  userValidator.validateCreateUserRequest,
  userController.createUser
);

router.post(
  "/login",
  userValidator.validateLoginUserRequest,
  userController.loginUser
);

router.post(
  "/forgot-password-link",
  userValidator.validateForgotPasswordLinkRequest,
  userController.forgotPasswordLink
);

router.put(
  "/forgot-password",
  userValidator.validateForgotPasswordRequest,
  userController.forgotPassword
);

module.exports = router;