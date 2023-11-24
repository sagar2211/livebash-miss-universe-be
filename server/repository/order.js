const { Order } = require("../model/order");
const log = require("node-file-logger");

const getTicketCount = (event) => {
  return new Promise(async (resolve, reject) => {
    try {
      //TODO : confirm will there be different ticket number based on ticket id for event
      const ordersOfEvent = await Order.find({
        $and: [{ eventid: event._id }, { isActive: 1 }],
      }).lean();
      const ticketNumber = `${event.code}10000${ordersOfEvent.length + 1}`;
      resolve(ticketNumber);
    } catch (error) {
      log.Error(
        "order repository getTicketCount failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};

const getOrderById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOne({
        $and: [{ _id: id }, { isActive: 1 }],
      })
        .populate({
          path: "userId",
          model: "mis-universe-user",
        })
        .populate({
          path: "eventId",
          model: "event",
          populate: {
            path: "venueid",
            model: "venue",
          },
        })
        .populate({
          path: "userId",
          model: "mis-universe-user",
        })
        .lean();
      resolve(order);
    } catch (error) {
      log.Error(
        "order repository getOrderById failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};
const getAllOrder = async () => {
  try {
    //TODO : confirm will there be different ticket number based on ticket id for event
    const orders = await Order.find({ isActive: 1 }).lean();
    return orders;
  } catch (error) {
    log.Error(
      "order repository getAllOrder failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const createOrders = async (orderArray) => {
  try {
    let savedOrderArray = [];
    let data = await Order.create(orderArray);
    data.map((order) => {
      savedOrderArray.push(order?._doc);
    });
    return savedOrderArray;
  } catch (error) {
    log.Error(
      "order repository createOrders failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const updateOrders = (request, orderNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      let updatedOrders = await Order.updateMany(
        {
          $and: [
            { userId: request?.userId },
            { eventId: { $in: request.eventIds } },
            { addedInCart: true },
            { bookedTicket: false },
            { isActive: 1 },
          ],
        },
        {
          $set: {
            paymentId: request?.paymentId,
            paymentStatus: request?.paymentStatus,
            addedInCart: request?.paymentStatus == "success" ? false : true,
            bookedTicket: request?.paymentStatus == "success" ? true : false,
            orderNumber: orderNumber,
          },
        }
      );
      resolve(updatedOrders);
    } catch (error) {
      log.Error(
        "order repository updateOrders failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};

const findOrdersByUserId = async (userId) => {
  try {
    let orderData = await Order.find({
      $and: [{ userId: userId }, { isActive: 1 }],
    }).lean();
    return orderData;
  } catch (error) {
    log.Error(
      "order repository findOrdersByUserId failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const findOrderByUserIdAndOrderId = async (request) => {
  try {
    let orderData = await Order.find({
      $and: [
        { userId: request?.userId },
        { eventId: { $in: request.eventIds } },
        { addedInCart: true },
        { bookedTicket: false },
      ],
    })
      .populate({
        path: "userId",
        model: "mis-universe-user",
      })
      .populate({
        path: "eventId",
        model: "event",
      })
      .lean();
    return orderData;
  } catch (error) {
    log.Error(
      "order repository findOrderByUserIdAndOrderId failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const updateOTP = (id, otpArray) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await Order.findOneAndUpdate(
        { $and: [{ _id: id }, { isActive: 1 }] },
        {
          $set: {
            otpArray: otpArray,
          },
        },
        {
          new: true,
        }
      ).lean();
      resolve(order);
    } catch (error) {
      log.Error(
        "order repository updateOTP failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};

const getOrdersByEventId = (eventId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let ordersData = await Order.find({
        $and: [
          { eventId: eventId },
          { paymentStatus: "success" },
          { isActive: 1 },
        ],
      })
        .populate({
          path: "userId",
          model: "mis-universe-user",
          select: {
            name: 1,
            email: 1,
            phone: 1
          },
        })
        .populate({
          path: "eventId",
          model: "event",
          select: {
            name: 1,
            price: 1,
          },
        })
        .sort({ createdAt: "descending" })
        .lean();
      resolve(ordersData);
    } catch (error) {
      log.Error(
        "order repository getOrdersByEventId failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};

const getOrdersByUserIdAndEventId = (userId, eventIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userOrders = await Order.find({
        $and: [
          {
            userId: userId,
          },
          {
            eventId: { $in: [...eventIds] },
          },
          {
            addedInCart: true,
          },
          {
            bookedTicket: false,
          },
        ],
      }).lean();
      resolve(userOrders);
    } catch (error) {
      log.Error(
        "order repository getOrdersByUserIdAndEventId failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};
const getConfirmOrdersByUserIdAndEventId = (userId, eventIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userOrders = await Order.find({
        $and: [
          {
            userId: userId,
          },
          {
            eventId: { $in: [...eventIds] },
          },
          {
            addedInCart: false,
          },
          {
            bookedTicket: true,
          },
        ],
      }).lean();
      resolve(userOrders);
    } catch (error) {
      log.Error(
        "order repository getConfirmOrdersByUserIdAndEventId failed with error : ",
        error.toString()
      );
    }
  });
};

const findOrdersByUserIdAndEventId = (userId, eventIds) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userOrders = await Order.find({
        $and: [
          {
            userId: userId,
          },
          {
            eventId: { $in: [...eventIds] },
          }
        ],
      }).lean();
      resolve(userOrders);
    } catch (error) {
      log.Error(
        "order repository findOrdersByUserIdAndEventId failed with error : ",
        error.toString()
      );
    }
  });
};

const removeOrder = (userId, eventId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let removedOrder = await Order.findOneAndRemove({
        $and: [
          { userId: userId },
          { eventId: eventId },
          { addedInCart: true },
          { bookedTicket: false },
          { isActive: 1 },
        ],
      }).lean();
      resolve(removedOrder);
    } catch (error) {
      log.Error(
        "order repository removeOrder failed with error : ",
        error.toString()
      );
      reject(error);
    }
  });
};

const getOrderByUserIdWithEvent = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userOrders = await Order.find({
        $and: [
          {
            userId: userId,
          },
          {
            addedInCart: false,
          },
          {
            bookedTicket: true,
          },
        ],
      })
        .populate({
          path: "eventId",
          model: "event",
          match: {
            starttime: { $gt: new Date().toISOString() },
          },
        })
        .lean();
      resolve(userOrders);
    } catch (error) {
      log.Error(
        "order repository getOrderByUserIdWithEvent failed with error : ",
        error.toString()
      );
    }
  });
};

module.exports = {
  getTicketCount,
  createOrders,
  updateOrders,
  findOrderByUserIdAndOrderId,
  getAllOrder,
  getOrderById,
  updateOTP,
  findOrdersByUserId,
  getOrdersByEventId,
  getOrdersByUserIdAndEventId,
  getConfirmOrdersByUserIdAndEventId,
  removeOrder,
  getOrderByUserIdWithEvent,
  findOrdersByUserIdAndEventId
};
