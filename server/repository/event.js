const { model, default: mongoose } = require("mongoose");
const { Event } = require("../model/event");
const log = require("node-file-logger");
const { Order } = require("../model/order");
const eventsArray = require('../config/events.json')

const getEventById = async (id) => {
  try {
    let eventData = await Event.findOne({ _id: id }).lean();
    return eventData;
  } catch (error) {
    log.Error("Event repository getEventById failed with error : ",error.toString()); 
    throw error;
  }
};

const getAllEvents = () => {
  return new Promise(async(resolve,reject)=>{
    try {
      let eventData = await Event.find()
        .populate({
          path: "venueid",
          model: "venue",
          select: {
            name: 1,
          },
        })
        .lean();
      resolve(eventData);
    } catch (error) {
      log.Error("Event repository getAllEvents failed with error : ",error.toString());
      reject(error);
    }
  })
};

const getEventsByIds = (eventIds) =>{
  return new Promise(async(resolve,reject)=>{
    try {
      let eventIDArray = [];
      for(let i=0;i<eventIds.length;i++){
        eventIDArray.push(eventIds[i].toString());
      }
      // let eventData = await Event.find({_id : {
      //   $in : eventIDArray
      // }})
      //   .populate({
      //     path: "venueid",
      //     model: "venue",
      //     select: {
      //       name: 1,
      //     },
      //   })
      //   .lean();
      let eventData = eventsArray;
      resolve(eventData);
    } catch (error) {
      log.Error("Event repository getEventsByIds failed with error : ",error.toString());
      reject(error);
    }
  })
}
const getTicketCountByEvents = (eventIds) =>{
  return new Promise(async(resolve,reject)=>{
    try {
      const aggregatorOptions = [
        { "$match": { "eventId": { "$in": [...eventIds] } } },
        {
          $group: {
             _id: "$eventId",
             countEventWiseTicketNumber: {
                $count: {}
             }
          }
       }
      ]
    let ticketCount= await Order.aggregate(aggregatorOptions);
    if(eventIds.length != ticketCount.length){
      eventIds.forEach((id)=>{
        let existTicketCount = ticketCount.find(data=>{
          return data._id.toString() == id.toString()
        })
        if(!existTicketCount){
          ticketCount.push({_id: id, countEventWiseTicketNumber: 0})
        }
      })
    }
    resolve(ticketCount);
    } catch (error) {
      log.Error("Event repository getTicketCountByEvents failed with error : ",error.toString());
      reject(error);
    }
  })
}

module.exports = {
  getEventById,
  getAllEvents,
  getEventsByIds,
  getTicketCountByEvents
};
