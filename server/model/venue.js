const mongoose = require("mongoose");
// const mongoosePaginate = require("mongoose-paginate");
const venueSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    logo: {
      type: Object,
    },
    userids: {
      type: Array,
    },
    template: {
      type: String,
      enum: ["templateA", "templateB", "templateC"],
      default: "templateA",
    },
    events: {
      type: Array,
    },
    is_active: {
      type: Number,
    },
    is_deleted: {
      type: Number,
    },
  },
  { timestamps: true }
);

// venueSchema.plugin(mongoosePaginate);
const Venue = mongoose.model("venue", venueSchema);
module.exports.Venue = Venue;
module.exports.venueSchema = venueSchema;
