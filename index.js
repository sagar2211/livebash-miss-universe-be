require("dotenv/config");
var config = require("./server/config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const log = require("node-file-logger");
const { scheduler } = require("./server/util/scheduler");

// require routes
const misUniverse = require("./server/routes/mis-universe");
// loading express
const app = express();
// middelwares
app.use(cors());
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// route middelwares
app.use(express.static(__dirname + "/public"));
app.use("/mis-universe", misUniverse);
//swagger implementation
const { swaggerServe, swaggerSetup } = require("./swagger-config");

app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
log.Info(`NODE_ENV=${envSettings.NODE_ENV}`);
log.Info(`DB=${envSettings.DB_CONNECT}`);

app.use("/api-docs", swaggerServe, swaggerSetup);

app.get("/", async (req, res) => {
  res.send("health check");
});
scheduler();
// DB connection
mongoose
  .connect(
    envSettings.DB_CONNECT,
    { maxPoolSize: 100 },
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    require("./server/routes/app-routes")(app);
    log.Info("DB connected...");
  })
  .catch((err) => {
    log.Error("Error in DB connection...", err.toString());
  });

// PORT listen
app.listen(envSettings.PORT || 8080);
log.Info(`running on ${envSettings.PORT || 8080}`);
