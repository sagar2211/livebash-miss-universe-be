const { check, validationResult } = require("express-validator");

const validateCreateOrderRequest = [
  check("userId")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Userid is required!")
    .bail(),
  check("events")
    .custom((value, { req }) => {
      return req?.body?.events?.length > 0 ? true : false;
    })
    .withMessage("Events are required!")
    .bail()
    .custom((value, { req }) => {
      let isValidEvents = true;
      isValidEvents = req?.body?.events.find((event) => {
        return event.eventId && event.ticketQty && event.productId
          ? true
          : false;
      });
      return isValidEvents;
    })
    .withMessage("Event has required eventid, ticket quantity and productId!")
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

const validateUpdateOrderRequest = [
  check("userId")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("userId is required!")
    .bail(),
  check("paymentStatus")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("PaymentStatus is required!")
    .isIn(["success", "fail"])
    .withMessage("Invalid value of field payment status!")
    .bail(),
  check("eventIds")
  .custom((value, { req }) => {
    return req?.body?.eventIds?.length > 0 ? true : false;
  })
  .withMessage("eventIds are required!")
  .bail(),
  check("paymentId")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Payment id is required!")
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

const validateRemoveOrderRequest = [
  check("userId")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("userId is required!")
    .bail(),
  check("eventId")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("eventId is required!")
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
  validateCreateOrderRequest,
  validateUpdateOrderRequest,
  validateRemoveOrderRequest
};
