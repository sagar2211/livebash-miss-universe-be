var config = require("../config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const frontendPath = envSettings.FRONTEND_PATH;
const { MisUniverseUser } = require("../model/user");
const log = require("node-file-logger");
const { Event } = require("../model/event");
const { Order } = require("../model/order");
const { sendEmail } = require("../util/sendgrid");
const { encryptData } = require("../../libs/crypter");
const timeFormater = require("./time-formater");
const mongoose = require("mongoose");
const orderRepository = require("../repository/order");
const getEarliestEvent = (modifiedOrdersArray) => {
  try {
    let earlierDateObj;
    let date1, date2;
    if (modifiedOrdersArray.length > 1) {
      modifiedOrdersArray.map((record, index) => {
        if (index < modifiedOrdersArray.length - 1) {
          let prevObj = earlierDateObj
            ? earlierDateObj
            : modifiedOrdersArray[index];
          let nextObj = modifiedOrdersArray[index + 1];
          if (prevObj?.eventTime) {
            date1 = prevObj?.eventTime.split(" CST")[0];
            date1 = date1.includes("pm")
              ? date1.split("pm").join(" ") + "pm"
              : date1.split("am").join(" ") + "am";
            date1 = new Date(date1).toISOString();
          }
          if (nextObj?.eventTime) {
            date2 = nextObj?.eventTime.split(" CST")[0];
            date2 = date2.includes("pm")
              ? date2.split("pm").join(" ") + "pm"
              : date2.split("am").join(" ") + "am";
            date2 = new Date(date2).toISOString();
          } else {
            date2 = null;
          }
          if (date1 && date2) {
            earlierDateObj = date1 < date2 ? prevObj : nextObj;
          } else if (!date1 && date2) {
            date1 = date2;
            earlierDateObj = nextObj;
          } else if (date1) {
            earlierDateObj = prevObj;
          }
        }
      });
    } else if (modifiedOrdersArray.length == 1) {
      earlierDateObj = modifiedOrdersArray[0]
    }
    return earlierDateObj;
  } catch (error) {
    log.Error("Order service getEarliestEvent failed with error : ",error.toString());
    throw error;
  }
};

const getFilteredResponse = async (events, userid) => {
  try {
    if (userid) {
      let orderData = await getOrder(userid);
      events?.map(async (event) => {
        let eventInfo = orderData?.find((data) => {
          return (
            data.eventid.toString() == event._id.toString() &&
            data.paymentStatus == "success"
          );
        });
        eventInfo
          ? (event["boughtTicket"] = true)
          : (event["boughtTicket"] = false);
        modifyDate(event);
      });
    }
    return events;
  } catch (error) {
    log.Error("Order service getFilteredResponse failed with error : ",error.toString());
    throw error;
  }
};

const getOrder = async (userid) => {
  try {
    let orderData = await Order.find({ userid: userid }).lean();
    return orderData;
  } catch (error) {
    log.Error("Order service getOrder failed with error : ",error.toString());
    throw error;
  }
};

const modifyDate = async (event) => {
  try {
    event.starttime = event.starttime
      ? await timeFormater.getPSTDate(event.starttime)
      : null;
    event.endtime = event.endtime ? await timeFormater.getPSTDate(event.endtime) : null;
    return event;
  } catch (error) {
    log.Error("Order service modifyDate failed with error : ",error.toString());
    throw error;
  }
};

//TODO : we will remove this method in next release.
const checkEventExist = (event) => {
  return new Promise(async (resolve, reject) => {
    try {
      let eventdata = await Event.findOne({
        $and: [{ _id: event.eventid }, { is_active: 1 }, { is_deleted: 0 }],
      });
      if (eventdata) {
        resolve(eventdata);
      } else {
        reject(eventdata);
      }
    } catch (error) {
      log.Error("Order service checkEventExist failed with error : ",error.toString());
      throw error;
    }
  });
};

const generateOrder = (event, request, userId) => {
  const ticketNumber = `${event.code}10000${event?.ticketCount + 1}`;
  try {
    let ticketObj = {
      userId: userId,
      eventId: event._id.toString(),
      ticketQty: request?.ticketQty,
      ticketNumber: `${ticketNumber}`,
      otpArray: generateOTP(request),
      orderNumber: event?.orderNumber ? event?.orderNumber : null,
      productId: request?.productId,
      addedInCart : true,
      bookedTicket : false
    };
    return ticketObj;
  } catch (error) {
    log.Error("Order service generateOrder failed with error : ",error.toString());
    throw error;
  }
};

const generateOrderNumber = (orderCount) => {
  try {
    const orderNumber = "MU" + (10000 + orderCount);
    log.Info(`orderNumber = ${orderNumber}`);
    return orderNumber;
  } catch (error) {
    log.Error("Order service generateOrderNumber failed with error : ",error.toString());
    throw error;
  }
};

const generateOTP = (event) => {
  try {
    //Ticket quantity for now is 1. But this code for multiple ticket quantity.
    let otpArray = [];
    for (let i = 0; i < event.ticketQty; i++) {
      let otp = Math.floor(100000 + Math.random() * 900000);
      if (otp != undefined) {
        let obj = {
          code: otp,
          status: "ACTIVE",
        };
        otpArray.push(obj);
      }
      return otpArray;
    }
  } catch (error) {
    log.Error("Order service generateOTP failed with error : ",error.toString());
    throw error;
  }
};

const sendEventWiseEmail = (event) => {
  return new Promise(async (resolve, reject) => {
    try {
      await sendEmail(event, "orderConfirmed")
        .then((emailResponse) => {
          resolve(emailResponse);
        })
        .catch((error) => {
          log.Error("Order service sendEventWiseEmail failed with error : ",error.toString());
          throw error;
        });
    } catch (error) {
      log.Error("Order service sendEventWiseEmail failed with error : ",error.toString());
      throw error;
    }
  });
};

//TODO : we will remove this method in next release.
const populateUserAndEventData = (event, eventTicket, index) => {
  return new Promise(async (resolve, reject) => {
    try {
      let eventdata = await Event.findOne({
        $and: [{ _id: event.eventid }, { is_active: 1 }, { is_deleted: 0 }],
      })
        .populate({
          path: "venueid",
          model: "venue",
          select: {
            _id: 1,
            name: 1,
          },
        })
        .lean();
      let userdata = await MisUniverseUser.findOne({ _id: event.userid });
      userdata.orderid = event._id;
      if (eventdata && userdata) {
        userdata.otpArray = event.otpArray;
        let data = await modifyBuyerObject(userdata, eventdata);
        data.ticketNumber = eventTicket?.[index]?.ticketNumber;
        data.orderNumber = eventTicket?.[index]?.orderNumber;
        data.productId = eventTicket?.[index]?.productId;
        resolve(data);
      } else {
        reject({
          eventdata: eventdata,
          userdata: userdata,
        });
      }
    } catch (error) {
      log.Error("Order service populateUserAndEventData failed with error : ",error.toString());
      throw error;
    }
  });
};

//TODO : Unused method we will remove in next release.
const getUserAndEventData = (event, orderData, index) => {
  return new Promise(async (resolve, reject) => {
    try {
      let eventdata = await Event.findOne({
        $and: [{ _id: event._id }, { is_active: 1 }, { is_deleted: 0 }],
      })
        .populate({
          path: "venueid",
          model: "venue",
          select: {
            _id: 1,
            name: 1,
          },
        })
        .lean();
      let userdata = await MisUniverseUser.findOne({
        _id: orderData?.userid?._id,
      }).lean();
      userdata.buyerid = orderData._id;
      if (eventdata && userdata) {
        userdata.otpArray = orderData.otpArray;
        let data = await modifyBuyerObject(userdata, eventdata);
        data.ticketNumber = orderData?.ticketNumber;
        data.orderNumber = orderData?.orderNumber;
        data.productId = orderData?.productId;
        resolve(data);
      } else {
        reject({
          eventdata: eventdata,
          userdata: userdata,
        });
      }
    } catch (error) {
      log.Error("Order service getUserAndEventData failed with error : ",error.toString());
      throw error;
    }
  });
};

const getUpdatedResponse = (event, order) => {
  event.starttime = typeof(event.starttime) == "string" ? new Date(event.starttime) : event.starttime;
  let eventTimeData = event.starttime ? timeFormater.getEventTime(event.starttime) : null;
  let pstdate =  timeFormater.getPSTDate(event.starttime);
  let displayTime = timeFormater.getFormatedTime(pstdate);
  let eventTimeWithSmallMeridium = eventTimeData
    ? eventTimeData["displayTime"]
    : null;
  let eventTime = event.starttime
    ? eventTimeData["formattedTimeWithZone"]
    : null;
  let encUrl = encryptData(JSON.stringify({ orderId: order._id }));
  let url = `${frontendPath}/streaming/?ticketInfo=${encUrl}`;
  try {
    let modifiedOrderResponse = {
      user : order?.userId,
      eventName: event?.name,
      eventTime: eventTime,
      orderId: order?._id,
      otpArray: order?.orderNumber ? order?.otpArray : null,
      url: order?.orderNumber ? url : null,
      ticketNumber: order?.ticketNumber,
      orderNumber: order?.orderNumber,
      productId: order?.productId,
      formatedDate: event.starttime ? timeFormater.formatDate(event.starttime) : null,
      displayTime : displayTime,
      eventTimeWithSmallMeridium: eventTimeWithSmallMeridium,
      starttime : event?.starttime
    };
    return modifiedOrderResponse;
  } catch (error) {
    log.Error("Order service getUpdatedResponse failed with error : ",error.toString());
    throw error;
  }
};

const generateOrderArray = (userRequest, eventsData) => {
  let orderArray = [];
  userRequest.events.forEach((request) => {
    orderArray.push(
      generateOrder(
        eventsData.get(request.eventId),
        request,
        userRequest.userId
      )
    );
  });
  return orderArray;
};

const getOrderModifiedResponse = (savedOrders, eventsData) => {
  try {
    let modifiedOrdersArray = [];
    for (let i = 0; i < eventsData.length; i++) {
      for (let j = 0; j < savedOrders.length; j++) {
        if (
          savedOrders[j]?.eventId?.toString() == eventsData[i]?._id?.toString()
        ) {
          eventsData[i].starttime = typeof(eventsData[i].starttime) == "string" ? new Date(eventsData[i].starttime) : eventsData[i].starttime;
          let modifiedOrderResponse = getUpdatedResponse(
            eventsData[i],
            savedOrders[j]
          );
          modifiedOrdersArray.push(modifiedOrderResponse);
        }
      }
    }
    return modifiedOrdersArray;
  } catch (error) {
    log.Error("Order service getOrderModifiedResponse failed with error : ",error.toString());
    throw error;
  }
};

const getModifiedOrdersArray = (orderData, orderNumber) => {
  let modifiedOrdersArray = [];
  try {
    orderData.map((order, index) => {
      order.orderNumber = orderNumber;
      let modifiedOrderResponse = getUpdatedResponse(
        order.eventId,
        order
      );
      modifiedOrdersArray.push(modifiedOrderResponse);
    });
    return modifiedOrdersArray;
  } catch (error) {
    log.Error("Order service getModifiedOrdersArray failed with error : ",error.toString());
    throw error;
  }
};

const getEventIds = (request) => {
  try {
    let eventIds = [];
    request.events.map((event) => {
      eventIds.push(new mongoose.Types.ObjectId(event?.eventId));
    });
    return eventIds;
  } catch (error) {
    log.Error("Order service getEventIds failed with error : ",error.toString());
    throw error;
  }
};

const getUserLoginResponse = (userData, upcomingEvent) =>{
  let nextEvent;
  if(upcomingEvent){
    nextEvent = {
      "eventName" : upcomingEvent.eventName,
      "eventTime" : upcomingEvent.eventTime,
      "ticketInfo" : upcomingEvent.url.split("ticketInfo=")[1],
      "ticketNumber": upcomingEvent.ticketNumber,
      "orderNumber": upcomingEvent.orderNumber,
      "displayTime": upcomingEvent.displayTime
    }
  }
  let responseObject = {
    "user" : {
      "_id": userData._id,
      "name": userData.name,
      "email": userData.email,
      "image": userData.image,
      "loginVia": userData.loginVia,
    },
    "upcomingEvent" : nextEvent ? nextEvent : null
  }
  return responseObject;
}

const getLoginOrderResponse = (userData) =>{
  return new Promise (async(resolve,reject)=>{
    try {
      let userOrdersWithEvents = await orderRepository.getOrderByUserIdWithEvent(userData._id);
      let modifiedOrderArray = [];
      userOrdersWithEvents.map((order)=>{
        if(order.eventId){
          modifiedOrderArray.push(getUpdatedResponse(order.eventId, order));
        }
      });
      let upcomingEvent = getEarliestEvent(modifiedOrderArray);
      let userLoginResponse = getUserLoginResponse(userData, upcomingEvent);
      resolve(userLoginResponse);
    } catch (error) {
      log.Error("Order service getLoginOrderResponse failed with error : ",error.toString())
      //TODO : return loggedin response without event information.
      throw error;
    }
  })
}

module.exports = {
  getEarliestEvent,
  getFilteredResponse,
  checkEventExist,
  generateOrder,
  generateOrderNumber,
  sendEventWiseEmail,
  populateUserAndEventData,
  getUserAndEventData,
  getUpdatedResponse,
  generateOrderArray,
  getOrderModifiedResponse,
  getModifiedOrdersArray,
  getEventIds,
  generateOTP,
  getLoginOrderResponse
};
