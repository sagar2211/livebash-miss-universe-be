var envSettings = {
  local: {
    NODE_ENV: "local",
    PORT: 8080,
    DB_CONNECT:
    "mongodb+srv://sagarbhujbal:kNlJ2s9wfwVjuiHl@cluster0.wm7el9i.mongodb.net/?retryWrites=true&w=majority",
    SENDGRID_USERNAME: "santosh.mantri@codeastu.com",
    SENDGRID_API_KEY: "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",
    CRYPTO_KEY: "IFXK3akpC0n1lrIgwiwHrQorn0xbc02F",
    FRONTEND_PATH: "http://localhost:3000",
    NODEMAILER_FROM_EMAIL: "sagar.bhujbal@codeastu.com",
    NODEMAILER_USERNAME: "sagar.bhujbal@codeastu.com",
    NODEMAILER_PASSWORD: "gvasqlnsmwtqceex",
    S3_BUCKET_PATH : "https://miss-universe.s3.amazonaws.com"
  },
  default: {
    NODE_ENV: "local",
    PORT: 8080,
    DB_CONNECT:
      "mongodb+srv://sagarbhujbal:kNlJ2s9wfwVjuiHl@cluster0.wm7el9i.mongodb.net/?retryWrites=true&w=majority",
    SENDGRID_USERNAME: "santosh.mantri@codeastu.com",
    SENDGRID_API_KEY: "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",
    CRYPTO_KEY: "IFXK3akpC0n1lrIgwiwHrQorn0xbc02F",
    FRONTEND_PATH: "http://localhost:3000",
    NODEMAILER_FROM_EMAIL: "sagar.bhujbal@codeastu.com",
    NODEMAILER_USERNAME: "sagar.bhujbal@codeastu.com",
    NODEMAILER_PASSWORD: "gvasqlnsmwtqceex",
    S3_BUCKET_PATH : "https://miss-universe.s3.amazonaws.com"
  },
};

exports.getEnvSettings = function getEnvSettings(env) {
  return envSettings[env] || envSettings.default;
};
