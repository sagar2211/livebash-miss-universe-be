const { Invoice } = require("../model/invoice");
const log = require("node-file-logger");
const createInvoice = () =>{
    return new Promise(async(resolve,reject)=>{
        try {
            let invoiceData = await Invoice.findOneAndUpdate(
            {name: "invoiceSequence"},
            {"$inc" : {invoiceNumber:1}},
            {upsert:true,new:true}).lean();
            resolve(invoiceData);
        } catch (error) {
            log.Error("Invoice repository createInvoice failed with error : ", error.toString());
            reject(error)
        }
    })
 }
module.exports = {
    createInvoice
};
