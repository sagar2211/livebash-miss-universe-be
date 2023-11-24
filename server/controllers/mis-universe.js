var config = require("../config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const frontendPath = envSettings.FRONTEND_PATH;
const { MisUniverseUser } = require("../model/user");
const log = require("node-file-logger");
const { Venue } = require("../model/venue");
const { Event } = require("../model/event");
const { Buyer } = require("../model/buyer");
const { Order } = require("../model/order");
const { sendEmail } = require("../util/nodemailer");
const {
  getFormatedTime,
  getPSTDate,
  formatDate,
  getEventTime,
} = require("../util/timeFormater");
const { encryptData, decryptData } = require("../../libs/crypto");
const bcryptLib = require("../../libs/bcryptLib");
const csvWriter = require('csv-writer');
const path = require('path');
const orderRepository = require("../repository/order");
const dirPath = path.join(__dirname, '/');
const userRepository = require("../repository/user");
const orderService = require("../services/order-service");
const eventsArray = require('../config/events.json')
//TODO: It's unused method we will removed it in next release.
exports.createNewUser = async (req, res) => {
  try {
    if (req?.body?.loginVia == "email" && !req?.body?.password) {
      log.Info(`Password is required.`);
      res.status(400).json({
        message: "Password is required.",
        status: 400,
        data: req.body,
      });
    } else {
      let password;
      if (req?.body?.loginVia == "email") {
        password = await bcryptLib.generateHashedPassword(req?.body?.password);
      }
      let userObj = { ...req?.body };
      delete userObj?.password; //password will not update if user already exist.
      let userData = await MisUniverseUser.findOneAndUpdate(
        { email: req?.body?.email },
        {
          $set: {
            ...userObj,
          },
        },
        { new: true }
      );
      if (userData) {
        log.Info(`User created successfully.`);
        res.status(200).json({
          message: "User created successfully.",
          status: 200,
          data: userData,
        });
      } else {
        let newUser = new MisUniverseUser({
          ...req.body,
          password: password,
        });
        let userResponse = await newUser.save();
        if (userResponse) {
          log.Info(`${req.body.name} User created successfully.`);
          res.status(200).json({
            message: "User created successfully.",
            status: 200,
            data: userResponse,
          });
        } else {
          log.Info(`Something went wrong.`);
          res.status(500).json({
            message: "Something went wrong.",
            status: 500,
            data: req.body,
          });
        }
      }
    }
  } catch (error) {
    log.Error(`${error.toString()}`);
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

exports.getAllEvents = async (req, res) => {
  let venueName = req.query.name || "miss universe";
  venueName = venueName == "undefined" ? "miss universe" : venueName;
  venueName = venueName.replace("-", " ");
  let userId = req?.query?.userid;
  try {
    // const venueData = await Venue.findOne({
    //   $and: [
    //     {
    //       name: {
    //         $regex: venueName,
    //         $options: "i",
    //       },
    //     },
    //     { is_active: 1 },
    //     { is_deleted: 0 }
    //   ],
    // })
    //   .populate({
    //     path: "events",
    //     model: "event",
    //     select: {
    //       name: 1,
    //       price: 1,
    //       starttime: 1,
    //       endtime: 1,
    //       productId: 1,
    //     },
    //   })
    //   .lean();
    let venueData = {
      name : "Miss Universe",
      events : eventsArray
    }
    if (venueData) {
      let userData = await userRepository.getUserById(userId);
      let venueInfo = await getFilteredResponse(venueData.events, userData);
      log.Info(venueName+" Events fetched successfully.");
      res.send({
        message: "Events fetched successfully.",
        status: 200,
        data: venueInfo,
      });
    } else {
      log.Error("mis-universe getAllEvents : Events does not exist.");
      res.status(404).json({
        message: "Events does not exist.",
        status: 404,
      });
    }
  } catch (error) {
    log.Error("mis-universe getAllEvents failed with error : ",error.toString());
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    let eventid = req.query.eventid;
    const isEventExist = await Event.findOne(
      { $and: [{ _id: eventid }, { is_active: 1 }, { is_deleted: 0 }] },
      { name: 1, link: 1, starttime: 1 }
    ).lean();
    if (isEventExist) {
      log.Info(eventid+" Event fetched successfully.");
      res.send({
        message: "Event fetched successfully.",
        status: 200,
        data: isEventExist,
      });
    } else {
      log.Error("mis-universe getEventById : Event does not exist. id : ",eventid);
      res.status(404).json({
        message: "Event does not exist.",
        status: 404,
      });
    }
  } catch (error) {
    log.Error("mis-universe getEventById failed with error : ",error.toString());
    return res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

//TODO: It's unused method we will removed it in next release.
exports.buyTicket = async (req, res) => {
  try {
    let eventPromiseArray = [];
    req?.body?.events.map((event) => {
      eventPromiseArray.push(() => checkEventExist(event));
    });
    await Promise.all(eventPromiseArray.map((getEvent) => getEvent()))
      .then(async (response) => {
        let orderNumber = await generateOrderNumber();
        let ticketPromiseArray = [];
        response.map((event, index) => {
          ticketPromiseArray.push(() =>
            generateTicketObj(event, req.body, index, orderNumber)
          );
        });
        await Promise.all(
          ticketPromiseArray.map((getTicket) => getTicket())
        ).then(async (result) => {
          saveAll(result)
            .then(async (eventTicket) => {
              let eventPromiseArray = [];
              if (eventTicket) {
                eventTicket.map((event, index) => {
                  eventPromiseArray.push(() =>
                    populateUserAndEventData(event?._doc, eventTicket, index)
                  );
                });
                Promise.all(
                  eventPromiseArray.map((getEvent) => getEvent())
                ).then((eventData) => {
                  try {
                    let responsePromiseArray = [];
                    if (eventData) {
                      eventData.map((data, index) => {
                        responsePromiseArray.push(() =>
                          getUpdatedResponse(eventData, index, eventTicket)
                        );
                      });
                      Promise.all(
                        responsePromiseArray.map((getResponse) => getResponse())
                      ).then(async (result) => {
                        let earlierDateObj = await getEarlierDateObj(result);
                        log.Info(`Ticket booked successfully.`);
                        res.send({
                          message: "Ticket booked successfully.",
                          status: 200,
                          data: [earlierDateObj],
                        });
                      });
                    }
                  } catch (error) {
                    log.Error(`${error.toString()}`);
                    res.status(500).json({
                      message: error.toString(),
                      status: 500,
                    });
                  }
                });
              }
            })
            .catch((error) => {
              log.Error(`${error.toString()}`);
              res.status(500).json({
                message: error.toString(),
                status: 500,
              });
            });
        });
      })
      .catch((error) => {
        log.Info(`Event not found.`);
        res.status(404).json({
          message: "Event not found.",
          status: 404,
          data: error,
        });
      });
  } catch (error) {
    log.Error(`${error.toString()}`);
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

//TODO: It's unused method we will removed it in next release.
exports.updateBuyer = async (req, res) => {
  try {
    let isUserExist = await Buyer.updateMany(
      {
        $and: [
          { userid: req?.body?.userid },
          { orderNumber: req?.body?.orderNumber },
        ],
      },
      {
        $set: {
          pid: req?.body?.pid,
          paymentStatus: req?.body?.paymentStatus,
        },
      },
      { new: true }
    ).lean();
    if (isUserExist?.modifiedCount > 0) {
      if (!req?.body?.paymentStatus) {
        log.Info(`Buyer updated successfully.`);
        res.status(200).json({
          message: "Buyer updated successfully.",
          status: 200,
          data: req.body,
        });
      } else {
        let buyerdata = await Buyer.find({
          $and: [
            { userid: req?.body?.userid },
            { orderNumber: req?.body?.orderNumber },
          ],
        })
          .populate({
            path: "userid",
            model: "mis-universe-user",
          })
          .populate({
            path: "eventid",
            model: "event",
          })
          .lean();
        let eventPromiseArray = [],
          emailPromiseArray = [];
        buyerdata.map((data, index) => {
          eventPromiseArray.push(() =>
            getUserAndEventData(data?.eventid, data, index)
          );
        });

        Promise.all(eventPromiseArray.map((getEvent) => getEvent()))
          .then((eventData) => {
            try {
              let responsePromiseArray = [];
              if (eventData) {
                eventData.map((data, index) => {
                  emailPromiseArray.push(() =>
                    sendEventWiseEmail(data, "misUniverseOrderConfirmed")
                  );
                  responsePromiseArray.push(() =>
                    getUpdatedResponse(eventData, index, buyerdata)
                  );
                });
                Promise.all(emailPromiseArray.map((email) => email()))
                  .then((emailResponse) => {
                    Promise.all(
                      responsePromiseArray.map((getResponse) => getResponse())
                    ).then(async (result) => {
                      let earlierDateObj = await getEarlierDateObj(result);
                      // if (emailResponse) {
                      log.Info(`Buyer updated successfully.`);
                      res.status(200).json({
                        message: "Buyer updated successfully.",
                        status: 200,
                        data: earlierDateObj,
                      });
                      // }
                    });
                  })
                  .catch((error) => {
                    log.Error(`${error.toString()}`);
                    res.status(500).json({
                      message: error.toString(),
                      status: 500,
                    });
                  });
              }
            } catch (error) {
              log.Error(`${error.toString()}`);
              res.status(500).json({
                message: error.toString(),
                status: 500,
              });
            }
          })
          .catch((error) => {
            log.Error(`${error.toString()}`);
            reject(error.toString());
          });
      }
    } else {
      log.Info(`Buyer does not exist.`);
      res.status(500).json({
        message: "Buyer does not exist.",
        status: 500,
        data: req.body,
      });
    }
  } catch (error) {
    log.Error(`${error.toString()}`);
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

//TODO : Move this api under user routes.
exports.verifyOTP = async (req, res) => {
  try {
    let ticketInfo = req.body.ticketInfo;
    let code = req.body.code;
    decryptData(ticketInfo)
      .then(async (data) => {
        let ticketData = JSON.parse(data);
        const userData = await Order.findOne({ $and : [{_id: ticketData.orderId},{isActive : 1}] })
          .populate({
            path: "eventId",
            model: "event",
            select: {
              name: 1,
            },
          })
          .populate({
            path: "userId",
            model: "mis-universe-user",
            select: {
              name: 1,
            },
          })
          .lean();
        if (userData) {
          if (userData?.userId?._id && userData?.eventId?._id) {
            if(code == 151123){//Master code functionality.
              let data = await Order.findOne(
                { $and : [{_id: ticketData.orderId},{isActive : 1}] }
              );
              if (data) {
                log.Info(
                  "Default OTP verified successfully."
                );
                return res.send({
                  message: "OTP verified successfully.",
                  status: 200,
                  data: data,
                });
              }
            }
            let isOTPExist = userData.otpArray.find(
              (otp) => code == otp.code
            );
            if (isOTPExist) {
              let isOTPActive = userData.otpArray.find(
                (otp) => code == otp.code && otp.status == "ACTIVE"
              );
              if (isOTPActive) {
                let data = await Order.findOneAndUpdate(
                  { $and : [{_id: ticketData.orderId}, {"otpArray.code": code},{isActive : 1}] },
                  {
                    $set: {
                      "otpArray.$.status": "VERIFIED",
                    },
                  },
                  { new: true }
                );
                if (data) {
                  log.Info(
                    "OTP verified successfully."
                  );
                  res.send({
                    message: "OTP verified successfully.",
                    status: 200,
                    data: data,
                  });
                }
              } else {
                log.Info(code+" OTP is already used.");
                res.status(400).send({
                  message: `${code} OTP is already used.`,
                  status: 400,
                  data: req.body,
                });
              }
            } else {
              log.Info(code+ " is Invalid OTP.");
              res.status(400).send({
                message: `${code} is Invalid OTP.`,
                status: 400,
                data: req.body,
              });
            }
          }
        } else {
          log.Info(code+" is Invalid OTP.");
          res.status(400).send({
            message: `${code} is Invalid OTP.`,
            status: 400,
            data: req.body,
          });
        }
      })
      .catch((error) => {
        log.Error("mis-universe verifyOTP failed with error : ",error.toString());
        res.status(500).json({
          message: error.toString(),
          status: 500,
        });
      });
  } catch (error) {
    log.Error("mis-universe verifyOTP failed with error : ",error.toString());
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

//TODO: It's unused method we will removed it in next release.
module.exports.loginUser = async (req, res) => {
  try {
    const authUser = await MisUniverseUser.findOne({
      email: req?.body?.email,
    }).lean();
    if (authUser == null) {
      log.Error(`The username that you have entered is incorrect.`);
      return res.status(403).json({
        status: 403,
        message: "The username that you have entered is incorrect.",
      });
    } else {
      let response = await bcryptLib.isPasswordRight(
        req?.body?.password,
        authUser.password
      );
      if (response) {
        log.Info(`${req?.body?.password} User logged in successfully.`);
        res.send({
          message: "Logged in successfully...",
          status: 200,
          data: authUser,
        });
      } else {
        log.Error(`The password that you have entered is incorrect.`);
        res.status(401).json({
          message: `The password that you have entered is incorrect.`,
          status: 401,
        });
      }
    }
  } catch (error) {
    log.Error(`${error.toString()}`);
    res.status(500).json({
      message: error.toString(),
      status: 500,
      data: req.body,
    });
  }
};

exports.getOrdersByEventId = async (req, res) => {
  try {
    let eventId = req.query.eventId;
    let eventName = req.query.name;
    let serialNumber = 0;
    const orderData = await orderRepository.getOrdersByEventId(eventId);
    if (orderData) {
      log.Info(eventId + " event order's fetched successfully.");
      let writer = csvWriter.createObjectCsvWriter({
        path: path.resolve(__dirname, `..${path.sep}..${path.sep}public`, eventName + '.csv'),
        header: [
          { id: 'name', title: 'Name' },
          { id: 'email', title: 'Email' },
          { id: 'ticketQty', title: 'Ticket Quantity' },
          { id: 'price', title: 'Price' },
          { id: 'phone', title: 'Phone' },
        ],
      });
      let csvFileGenerateString = "Sr.No.,Name,Email,Ticket Qty,Price,Phone\r\n"
      orderData.map((order, index) => {
        if (order?.orderNumber) {
          if(order?.userId){
            csvFileGenerateString +=
            ++serialNumber +","
            +order?.userId?.name +","
            +order?.userId?.email +","
            +orderData[index].ticketQty +","
            +order?.eventId?.price +",";
            if(order?.userId?.phone != undefined || order?.userId?.phone != null){
              csvFileGenerateString += +order?.userId?.phone +"\n"
            } else {
              csvFileGenerateString += "\n"
            }
          }
        }
      });
      await writer.writeRecords(orderData).then(async(csv) => {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader("Content-Disposition", 'attachment; filename='+ eventName + '.csv');
        res.send(csvFileGenerateString);
      });
    } else {
      log.Error("mis-universe getOrdersByEventId : Order does not exist. id = "+eventId);
      res.status(404).json({
        message: 'Order does not exist.',
        status: 404,
      });
    }
  } catch (error) {
    log.Error("mis-universe getOrdersByEventId failed with error : ",error.toString());
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const getEarlierDateObj = (result) => {
  return new Promise((resolve, reject) => {
    try {
      let earlierDateObj;
      let date1, date2;
      if (result.length > 1) {
        result.map((savedData, index) => {
          if (index < result.length - 1) {
            let prevObj = earlierDateObj ? earlierDateObj : result[index];
            let nextObj = result[index + 1];
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
      } else {
        earlierDateObj = result[0];
      }
      resolve(earlierDateObj);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const getFilteredResponse = async (events, userData) => {
  try {
    if (userData) {
      let orderData = await orderRepository.findOrdersByUserId(userData._id);
      events?.map(async (event) => {
        let order = orderData?.find((order) => {
          return (order.eventId.toString() == event._id.toString() && order.isActive == 1)
        });
        if(order){
          let generatedOrderResponse = orderService.getUpdatedResponse(event, order);
          event["addedInCart"] = order?.addedInCart;
          event["bookedTicket"] = order?.bookedTicket;
          if(order?.bookedTicket){
            event["ticketInfo"] = generatedOrderResponse.url.split("ticketInfo=")[1];
          }
        } else {
          event["addedInCart"] = false;
          event["bookedTicket"] = false;
        }
        // modifyDate(event);
      });
    }
    return events;
  } catch (error) {
    log.Error("mis-universe getFilteredResponse failed with error : ",error.toString());
    return `${error.toString()}`;
  }
};

const modifyDate = async (event) => {
  try {
    event.starttime = event.starttime
      ? await getPSTDate(event.starttime)
      : null;
    event.endtime = event.endtime ? await getPSTDate(event.endtime) : null;
    return event;
  } catch (error) {
    log.Error(`${error.toString()}`);
    return `${error.toString()}`;
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
      log.Error(`${error.toString()}`);
      reject(`${error.toString()}`);
    }
  });
};

const generateTicketObj = (event, data, index, orderNumber) => {
  return new Promise(async (resolve, reject) => {
    const buyersOfEvent = await Buyer.find({ eventid: event._id }).lean();
    // const count = (await Buyer.count("ticketNumber")) + index;
    const ticketNumber = `${event.code}10000${buyersOfEvent.length + 1}`;
    try {
      let ticketObj = {
        userid: data.userid,
        eventid: event._id,
        ticketQty: data?.events[index]?.ticketQty,
        ticketNumber: `${ticketNumber}`,
        otpArray: await generateOTP(data.events[index]),
        orderNumber: orderNumber,
        productId: data?.events[index]?.productId,
        pid: data?.pid,
      };
      resolve(ticketObj);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const saveAll = (ticketArray) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await Buyer.create(ticketArray);
      resolve(data);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const generateOrderNumber = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let count = await Buyer.distinct("orderNumber");
      count = count.length + 1;
      const orderNumber = "MU" + (10000 + count);
      log.Info(`orderNumber = ${orderNumber}`);
      resolve(orderNumber);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const generateOTP = (event) => {
  return new Promise(async (resolve, reject) => {
    try {
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
        resolve(otpArray);
      }
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const sendEventWiseEmail = (event) => {
  return new Promise(async (resolve, reject) => {
    try {
      await sendEmail(event, "misUniverseOrderConfirmed").then(
        (emailResponse) => {
          resolve(emailResponse);
        }
      );
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
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
      if (eventdata && userdata) {
        userdata.buyerid = event._id;
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
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const modifyBuyerObject = (buyer, eventinfo) => {
  return new Promise(async (resolve, reject) => {
    try {
      buyer.venueName =
        eventinfo?.venueid?.name.charAt(0).toUpperCase() +
        eventinfo?.venueid?.name.slice(1);
      let pstdate, displayTime, encUrl;
      if (eventinfo.starttime) {
        pstdate = await getPSTDate(eventinfo.starttime);
        displayTime = await getFormatedTime(pstdate);
      }
      encUrl = await encryptData(JSON.stringify({ buyerid: buyer.buyerid }));
      let url = `${frontendPath}/streaming/?ticketinfo=${encUrl}`;
      buyer.url = url;
      buyer.formatedDate = eventinfo.startdate
        ? await formatDate(eventinfo.startdate)
        : null;
      let eventTimeData = eventinfo.starttime
        ? await getEventTime(eventinfo.starttime)
        : null;
      buyer.eventTime = eventinfo.starttime
        ? eventTimeData["formattedTimeWithZone"]
        : null;
      buyer.eventTimeWithSmallMeridium = eventTimeData
        ? eventTimeData["displayTime"]
        : null;
      buyer.displayTime = eventinfo.starttime ? displayTime : null;
      buyer.eventName = eventinfo.name;
      buyer.artist_name = eventinfo.artist_name;
      buyer.otpArray = buyer.otpArray;
      resolve(buyer);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(`${error.toString()}`);
    }
  });
};

const getUserAndEventData = (event, buyerData, index) => {
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
        _id: buyerData?.userid?._id,
      }).lean();
      userdata.buyerid = buyerData._id;
      if (eventdata && userdata) {
        userdata.otpArray = buyerData.otpArray;
        let data = await modifyBuyerObject(userdata, eventdata);
        data.ticketNumber = buyerData?.ticketNumber;
        data.orderNumber = buyerData?.orderNumber;
        data.productId = buyerData?.productId;
        resolve(data);
      } else {
        reject({
          eventdata: eventdata,
          userdata: userdata,
        });
      }
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};

const getUpdatedResponse = (data, index, eventTicket) => {
  return new Promise((resolve, reject) => {
    try {
      let responseObj = {
        user: data[index]["_doc"] ? data[index]["_doc"] : data[index],
        eventName: data[index].eventName,
        eventTime: data[index].eventTime,
        buyerid: data[index].buyerid,
        otpArray: data[index].otpArray,
        url: data[index].url,
        ticketNumber: eventTicket[index].ticketNumber,
        orderNumber: eventTicket[index].orderNumber,
        productId: eventTicket[index].productId,
        streamingUrl: eventTicket[index]?.eventid?.link,
      };
      resolve(responseObj);
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error.toString());
    }
  });
};
