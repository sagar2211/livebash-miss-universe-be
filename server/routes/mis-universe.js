const express = require("express");
const router = express.Router();
const {
  createNewUser,
  getAllEvents,
  buyTicket,
  verifyOTP,
  updateBuyer,
  loginUser,
  getEventById,
  getOrdersByEventId,
} = require("../controllers/mis-universe");

//create user for mis universe
router.post("/v1/createNewUser", createNewUser);

router.get("/v1/getAllEvents", getAllEvents);

router.get("/v1/getEventById", getEventById);

router.post("/v1/buyTicket", buyTicket);

router.post("/v1/updateBuyer", updateBuyer);

router.post("/v1/verifyOTP", verifyOTP);

router.post("/v1/login", loginUser);

router.get("/v1/getOrdersByEventId", getOrdersByEventId);

module.exports = router;
