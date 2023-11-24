const userRoutes = require("./user-routes");
const orderRoutes = require("./order-routes");
const otpRoutes = require("./otp-routes");

module.exports = function (app) {
  app.use("/api/v1/user", userRoutes);
  app.use("/api/v1/order", orderRoutes);
  app.use("/api/v1/otp", otpRoutes);
};
