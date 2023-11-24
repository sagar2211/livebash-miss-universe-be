var config = require("./server/config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const basePath = envSettings.BASEPATH;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Live Bash",
      version: "1.0.0",
    },
    servers: [
      {
        url: basePath,
      },
    ],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = {
  swaggerServe: swaggerUi.serve,
  swaggerSetup: swaggerUi.setup(swaggerDocument, swaggerSpec),
};

//  module.exports = { swaggerServe: swaggerUI.serve, swaggerSetup: swaggerUI.setup(swaggerJSDocs,options) };
