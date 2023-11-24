const swaggerAutogen = require("swagger-autogen")();
var config = require("./server/config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const port = envSettings.PORT;
const host = envSettings.HOST;
const doc = {
  info: {
    version: "1.0.0",
    title: "Livebash API",
    description: "All livebash API documentation.",
  },
  host: host,
  // host: host+':'+port, //for local env
  basePath: "/",
  schemes: ["http", "https"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "User",
      description: "Endpoints",
    },
  ],
  securityDefinitions: {
    apiKeyAuth: {
      type: "apiKey",
      in: "header", // can be "header", "query" or "cookie"
      name: "X-API-KEY", // name of the header, query parameter or cookie
      description: "any description...",
    },
  },
};

const outputFile = "swagger-output.json";
const endpointsFiles = ["./index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./index"); // Your project's root file
});
