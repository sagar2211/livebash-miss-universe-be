const mongoose = require("mongoose");
const { Venue } = require("./venue");
const { MisUniverseUser } = require("./user");

const buyerSchema = mongoose.Schema(
  {
    name: {
      type: String,
    },
    mobile: {
      type: Number,
    },
    email: {
      type: String,
      isEmail: true,
    },
    venueid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Venue,
    },
    eventid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Event,
    },
    ticketQty: {
      type: Number,
    },
    price: {
      type: Number,
    },
    encUrl: {
      type: String,
    },
    otpArray: {
      type: Array,
    },
    is_active: {
      type: Number,
      default: 1,
    },
    is_deleted: {
      type: Number,
      default: 0,
    },
    pid: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["success", "fail"],
    },
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MisUniverseUser,
    },
    ticketNumber: {
      type: String,
    },
    orderNumber: {
      type: String,
    },
    productId: {
      type: String,
    },
  },
  { timestamps: true }
);

const Buyer = mongoose.model("buyer", buyerSchema);
module.exports.Buyer = Buyer;
module.exports.buyerSchema = buyerSchema;
