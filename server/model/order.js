const mongoose = require("mongoose");
const { Venue } = require("./venue");
const { MisUniverseUser } = require("./user");

const orderSchema = mongoose.Schema(
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
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Venue,
    },
    eventId: {
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
    isActive: {
      type: Number,
      default: 1,
    },
    isDeleted: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["success", "fail"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MisUniverseUser,
    },
    ticketNumber: {
      type: String,
    },
    orderNumber: {
      type: String
    },
    productId: {
      type: String,
    },
    addedInCart: {
      type: Boolean
    },
    bookedTicket: {
      type: Boolean
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("order", orderSchema);
module.exports.Order = Order;
module.exports.orderSchema = orderSchema;
