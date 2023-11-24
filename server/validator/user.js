const { check, query, validationResult } = require("express-validator");

const validateCreateUserRequest = [
  check("name")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Name is required!")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Minimum 3 characters required!")
    .bail(),
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Please enter valid email"),
  check("loginVia")
    .not()
    .isEmpty()
    .withMessage("loginVia is required!")
    .isIn(["email"])
    .withMessage("Invalid value of field loginVia!"),
  check("password")
    .custom((value, { req }) => {
      return req.body.loginVia == "email" && value ? true : false;
    })
    .withMessage("Password is required!"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        status: 400,
      });
    } else {
      next();
    }
  },
];

const validateLoginUserRequest = [
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Please enter valid email"),
  check("loginVia")
    .not()
    .isEmpty()
    .withMessage("loginVia is required!")
    .isIn(["google", "facebook", "email"])
    .withMessage("Invalid value of field loginVia!"),
  check("password")
    .custom((value, { req }) => {
      return (req.body.loginVia == "email" && value) ||
        req.body.loginVia === "google" ||
        req.body.loginVia === "facebook"
        ? true
        : false;
    })
    .withMessage("Password is required!"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        status: 400,
      });
    } else {
      next();
    }
  },
];
const validateForgotPasswordRequest = [
  check("user")
    .not()
    .isEmpty()
    .withMessage("userId is required!"),
  check("password")
    .not()
    .isEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 8 })
    .withMessage("password length should be minimum 8 character!")
    .bail(),
  check("confirmPassword")
    .not()
    .isEmpty()
    .withMessage("Confirm password is required!")
    .custom((value, { req }) => {
      return (req.body.password == value) ? true : false;
    })
    .withMessage("Password doesn't match with confirm password!"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        status: 400,
      });
    } else {
      next();
    }
  },
];
const validateForgotPasswordLinkRequest = [
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email in request!"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        status: 400,
      });
    } else {
      next();
    }
  },
];

module.exports = {
  validateCreateUserRequest,
  validateLoginUserRequest,
  validateForgotPasswordRequest,
  validateForgotPasswordLinkRequest
};