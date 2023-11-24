const orderController = require("../controllers/order-controller");
const orderValidator = require("../validator/order");
const express = require("express");
const router = express.Router();

//create order
router.post(
  "/create",
  orderValidator.validateCreateOrderRequest,
  orderController.createOrders
);

//update order
router.put(
  "/update",
  orderValidator.validateUpdateOrderRequest,
  orderController.updateOrders
);

//remove order
router.put(
  "/remove",
  orderValidator.validateRemoveOrderRequest,
  orderController.removeOrder
);

module.exports = router;
