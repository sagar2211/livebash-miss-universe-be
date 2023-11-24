const otpController = require("../controllers/otp-controller");
const otpValidator = require("../validator/otp");
const express = require("express");
const router = express.Router();

//create order
router.get(
  "/resend",
  otpValidator.validateResendOTPRequest,
  otpController.resendOTP
);
module.exports = router;
