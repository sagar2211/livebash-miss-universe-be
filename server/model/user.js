const mongoose = require("mongoose");

const misUniverseSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      isEmail: true,
      required: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    isSync: {
      type: Boolean,
    },
    loginVia: {
      type: String,
      enum: ["google", "facebook", "email"],
    },
    phone: {
      type: Number
    },
    resetPassword: {
      type : Boolean
    },
    lastLogin: {
      type: Date
    },
    loginCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const MisUniverseUser = mongoose.model("mis-universe-user", misUniverseSchema);
module.exports.MisUniverseUser = MisUniverseUser;
