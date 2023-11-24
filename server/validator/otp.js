const { query, validationResult } = require("express-validator");

const validateResendOTPRequest = [
  query("ticketInfo")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Ticket information is required!")
    .bail(),
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
    validateResendOTPRequest
};
