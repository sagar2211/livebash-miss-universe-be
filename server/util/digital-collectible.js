const { Event } = require("../model/event");
const log = require("node-file-logger");
const { sendEmail } = require("./sendgrid");
var config = require("../config/config");
const { getDayPart } = require("./timeFormater");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const frontendPath = envSettings.FRONTEND_PATH;
const key = envSettings.CRYPTO_KEY;
const Cryptr = require("cryptr");
const orderRepository = require("../repository/order");
const cryptr = new Cryptr(key);

const createDigitalCollectible = async () => {
  try {
    let dateObj = getStartDate();
    let eventsArray = await getTodaysEvent(dateObj);
    if (eventsArray.length > 0) {
      let promiseArray = [];
      let timePromiseArray = [];
      eventsArray.map(async (event) => {
        timePromiseArray.push(() => getEventTime(event)); //push getEventTime function call in timeFormatPromiseArray.
      });
      eventsArray = await setEventTime(timePromiseArray, eventsArray);
      eventsArray.map(async (event) => {
        promiseArray.push(orderRepository.getOrdersByEventId(event._id));
      });
      eventsArray = await getOrders(eventsArray, promiseArray);
      eventsArray = await setStreamingUrl(eventsArray);
      let eventPromiseArray = [];
      let emailType = "digitalCollectible";
      eventsArray.map((eventData) => {
        eventPromiseArray.push(() => sendBulkEmail(eventData, emailType)); //Pushed sendBulkEmail function call into eventPromiseArray.
      });
      await Promise.all(eventPromiseArray.map((bulkEmail) => bulkEmail())) //Call one by one sendBulkEmail function.
        .then((data) => {
          log.Info(data);
        })
        .catch((error) => {
          log.Error("digital-collectible createDigitalCollectible failed with error : ",error.toString());
        });
    } else {
      log.Info(`Yesterday this time didn't have any event.`);
    }
  } catch (error) {
    log.Error("digital-collectible createDigitalCollectible failed with error : ",error.toString());
  }
};

const getStartDate = () => {
  try {
    let currentDate = new Date();
    let startDate = new Date(new Date().setHours(currentDate.getHours() - 24));
    startDate.setMinutes(startDate.getMinutes() +1);
    let endDate = new Date(startDate)
    endDate = new Date(endDate.setMinutes(endDate.getMinutes()+14));
    startDate = startDate.toISOString()
    endDate = endDate.toISOString()
    return({
      startTime: startDate,
      endTime: endDate
    });
  } catch (error) {
    log.Error("digital-collectible getStartDate failed with error : ",error.toString());
    throw error;
  }
};

const getTodaysEvent = (dateObj) => {
  return new Promise(async (resolve, reject) => {
    try {
      let eventArray = await Event.find({
        $and: [
          { is_active: 1 },
          { is_deleted: 0 },
          { starttime: {$gte : new Date(dateObj.startTime)} },
          { starttime: {$lte : new Date(dateObj.endTime)} }
        ],
      })
        .populate({
          path: "venueid",
          model: "venue",
          select: {
            name: 1,
            location: 1,
          },
        })
        .lean();
      resolve(eventArray);
    } catch (error) {
      reject(error);
    }
  });
};

const sendBulkEmail = async (eventData, emailType) => {
  let result = await sendEmail(eventData, emailType);
  return result;
};

const getEventTime = async (eventdata) => {
  let result = await getFormatedTime(eventdata.starttime);
  return result;
};

const getFormatedTime = async(date) => {
    try {
        let isotime = date.toISOString();
        let pstdate = new Date(isotime).toLocaleString("en-US", {
          timeZone: "America/Chicago",
        });
        pstdate = new Date(pstdate);
        let pststarttime = getDisplayTime(pstdate);
        let MS_PER_MINUTE = 60000;
        let durationInMinutes = 15;
        let virtualdoortime = new Date(
          pstdate - durationInMinutes * MS_PER_MINUTE
        );
        virtualdoortime = getDisplayTime(virtualdoortime);
        let dayPart = await getDayPart(pstdate);
        let eventTimeObj = {
          pststarttime: pststarttime,
          virtualdoortime: virtualdoortime,
          daypart: dayPart,
        };
        return eventTimeObj;
      } catch (error) {
        throw error;
      }
};

const setEventTime = (timePromiseArray, eventsArray) => {
  return new Promise((resolve, reject) => {
    try {
      Promise.all(
        timePromiseArray.map((eventTimeFunction) => eventTimeFunction())
      ) // call getEventTime function in promise.
        .then(async (formatedTimeData) => {
          formatedTimeData.map((time, indx) => {
            eventsArray[indx].displayTime = time; //Added event specific virtual and start time.
          });
          resolve(eventsArray);
        })
        .catch((error) => {
          log.Error(`${error.toString()}`);
          reject(`${error.toString()}`);
        });
    } catch (error) {
      reject(`${error.toString()}`);
    }
  });
};

const getOrders = (eventsArray, promiseArray) => {
  return new Promise((resolve, reject) => {
    try {
      Promise.all([...promiseArray])
        .then(async (result) => {
          if (result.length > 0) {
            result.map((orderData, indx) => {
              //Added event specific orders
              if (eventsArray[indx].venueid.name == "Miss Universe") {
                if (orderData.length > 0) {
                  orderData.map((data) => {
                    data.name = data?.userId?.name;
                    data.email = data?.userId?.email;
                  });
                  eventsArray[indx].orders = [...orderData];
                }
              } else {
                if (orderData.length > 0)
                  eventsArray[indx].orders = [...orderData];
              }
            });
            resolve(eventsArray);
          }
        })
        .catch((error) => {
          log.Error(`${error.toString()}`);
          reject(`${error.toString()}`);
        });
    } catch (error) {
      reject(`${error.toString()}`);
    }
  });
};

const getDisplayTime = (pststarttime) => {
  try {
    let hours = pststarttime.getHours();
    let minutes = pststarttime.getMinutes();
    let ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    let strTime = hours + ":" + minutes + " " + ampm;
    const formattedTimeWithZone = `${strTime} CST`;
    return formattedTimeWithZone;
  } catch (error) {
    log.Error(`${error.toString()}`);
  }
};

const setStreamingUrl = async (eventsArray) => {
  return new Promise((resolve, reject) => {
    try {
      eventsArray.map((eventData, indx) => {
        if (eventData.hasOwnProperty("orders") && eventData.orders.length > 0) {
          eventData.orders.map((order, orderIndx) => {
            let encryptedUrl = cryptr.encrypt(
              JSON.stringify({
                orderId: order._id.toString(),
              })
            );
            eventsArray[indx].orders[
              orderIndx
            ].url = `${frontendPath}/streaming/?ticketInfo=${encryptedUrl}`;
          });
        }
      });
      resolve(eventsArray);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
    createDigitalCollectible
}