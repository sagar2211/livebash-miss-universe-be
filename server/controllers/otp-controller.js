const log = require("node-file-logger");
const orderService = require("../services/order-service");
const orderRepository = require("../repository/order");
const { decryptData } = require("../../libs/crypto");
const { sendEmail } = require("../util/sendgrid");
const timeFormater = require("../services/time-formater");

const resendOTP = async (req, res) => {
  try {
    decryptData(req.query.ticketInfo)
      .then(async (data) => {
        let ticketData = JSON.parse(data);
        let orderData = await orderRepository.getOrderById(ticketData.orderId);
        let pstDate = timeFormater.getPSTDate(orderData?.eventId?.starttime);
        orderData.eventId["displayTime"] =
          timeFormater.getFormatedTime(pstDate);
        let response = await orderService.getUpdatedResponse(
          orderData.eventId,
          orderData
        );
        orderData.url = response?.url;
        let otpArray = orderService.generateOTP(orderData);
        let updatedOTPResponse = await orderRepository.updateOTP(
          orderData._id,
          otpArray
        );
        if (updatedOTPResponse) {
          orderData.otpArray = otpArray;
          let emailResponse = await sendEmail(orderData, "resendOTP");
          if (emailResponse) {
            log.Info("OTP is sent on your email successfully done!");
            res.send({
              message: "OTP is sent on your email successfully done!",
              status: 200,
            });
          }
        }
      })
      .catch((error) => {
        log.Error(
          "otp-controller resendOTP failed with error : ",
          error.toString()
        );
        res.status(400).json({
          message: "Invalid request!",
          status: 400,
        });
      });
  } catch (error) {
    log.Error(
      "otp-controller resendOTP failed with error : ",
      error.toString()
    );
    res.status(400).json({
      message: "Invalid request!",
      status: 400,
    });
  }
};

module.exports = {
  resendOTP,
};
