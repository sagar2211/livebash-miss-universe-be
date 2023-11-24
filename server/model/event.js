const mongoose = require("mongoose");
const { Venue } = require("./venue");
// const mongoosePaginate = require("mongoose-paginate");

const eventSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    artist_name: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      require: true,
    },
    starttime: {
      type: Date,
    },
    endtime: {
      type: Date,
    },
    startdate: {
      type: Date,
      required: true,
    },
    enddate: {
      type: Date,
      required: true,
    },
    eventtype: {
      type: String,
    },
    price: {
      type: Number,
    },
    productId: {
      type: String,
    },
    venueid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Venue,
    },
    images: {
      filename: String,
      path: String,
    },
    bgimages: {
      filename: String,
      path: String,
    },
    template: {
      type: String,
      enum: ["templateA", "templateB", "templateC"],
      default: "templateA",
    },
    is_active: {
      type: Number,
    },
    is_deleted: {
      type: Number,
    },
    code: {
      type: String,
    },
  },
  { timestamps: true }
);

// eventSchema.plugin(mongoosePaginate);
const Event = mongoose.model("event", eventSchema);
module.exports.Event = Event;
module.exports.eventSchema = eventSchema;
