const mongoose = require("mongoose");
const invoiceSchema = mongoose.Schema(
  {
    name: {
        type : String
    },
    invoiceNumber: {
        type: Number,
        unique : true
    }
  }
);
const Invoice = mongoose.model("invoice", invoiceSchema);
module.exports.Invoice = Invoice;
