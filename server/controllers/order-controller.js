const log = require("node-file-logger");
const eventRepository = require("../repository/event");
const userRepository = require("../repository/user");
const orderService = require("../services/order-service");
const orderRepository = require("../repository/order");
const invoiceRepository = require("../repository/invoice");

const createOrders = async (req, res) => {
  try {
    // let userData = await userRepository.getUserById(req?.body?.userId);
    let eventmap = new Map();
    // if (userData) {
      let eventIds = orderService.getEventIds(req.body);
      let confirmOrderArray = [],
        cartOrderArray = [];
      let orderData = await orderRepository.findOrdersByUserIdAndEventId(
        req?.body?.userId,
        eventIds
      );
      if (orderData.length == eventIds.length) {
        log.Info(
          "order-controller createOrder : Order is already exist in database."
        );
        return res.status(400).json({
          message: "Order is already exist in database.",
          status: 400,
        });
      }
      for (let i = 0; i < eventIds.length; i++) {
        let confirmOrder = orderData.find(
          (order) =>
            order.eventId.toString() == eventIds[i].toString() &&
            order.paymentStatus == "success"
        );
        if (confirmOrder) {
          confirmOrderArray.push(confirmOrder);
        }
        let cartOrder = orderData.find(
          (order) =>
            order.eventId.toString() == eventIds[i].toString() &&
            order.addedInCart == true
        );
        if (cartOrder) {
          cartOrderArray.push(cartOrder);
        }
      }
      let eventData = await eventRepository.getEventsByIds(eventIds);
      if (eventData.length == 0) {
        log.Error(
          "order-controller createOrders : Eventid not found with upcoming events."
        );
        return res.status(400).json({
          message: `Eventid not found with upcoming events`,
          status: 400,
        });
      }
      if (cartOrderArray?.length == eventIds.length) {
        let modifiedOrdersArray = orderService.getOrderModifiedResponse(
          cartOrderArray,
          eventData,
          userData
        );
        // let earlierDateObj = orderService.getEarliestEvent(modifiedOrdersArray);
        log.Info("Order created successfully.");
        res.send({
          message: "Order created successfully.",
          status: 200,
          data: modifiedOrdersArray,
        });
      } else {
        for (let i = 0; i < cartOrderArray?.length; i++) {
          for (let j = 0; j < eventIds.length; j++) {
            if (
              cartOrderArray[i].eventId.toString() == eventIds[j].toString()
            ) {
              eventIds.splice(j, 1);
            }
          }
          for (let j = 0; j < req.body.events.length; j++) {
            if (
              cartOrderArray[i].eventId.toString() ==
              req.body.events[j].eventId.toString()
            ) {
              req.body.events.splice(j, 1);
            }
          }
        }
        let ticketCountData = await eventRepository.getTicketCountByEvents(
          eventIds
        );
        for (let i = 0; i < eventIds.length; i++) {
          let data = eventData.find(
            (event) => event._id.toString() == eventIds[i].toString()
          );
          for (let j = 0; j < ticketCountData.length; j++) {
            if (ticketCountData[j]._id.toString() == eventIds[i].toString()) {
              data["ticketCount"] =
                ticketCountData[j].countEventWiseTicketNumber;
            }
          }
          eventmap.set(eventIds[i].toString(), data);
        }
        let orderArray = orderService.generateOrderArray(req?.body, eventmap);
        let savedOrders = await orderRepository.createOrders(orderArray);
        if (orderData?.length > 0) {
          savedOrders.push(...orderData);
        }
        let modifiedOrdersArray = orderService.getOrderModifiedResponse(
          savedOrders,
          eventData
        );
        // let earlierDateObj = orderService.getEarliestEvent(modifiedOrdersArray);
        log.Info(`Order created successfully.`);
        res.send({
          message: "Order created successfully.",
          status: 200,
          data: modifiedOrdersArray,
        });
      }
    // } else {
    //   log.Error(
    //     "order-controller createOrders : User not found with this userid."
    //   );
    //   res.status(403).json({
    //     message: `User not found with this userid.`,
    //     status: 403,
    //   });
    // }
  } catch (error) {
    log.Error(
      "order-controller createOrders failed with error : ",
      error.toString()
    );
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const updateOrders = async (req, res) => {
  try {
    let orderData = await orderRepository.findOrderByUserIdAndOrderId(
      req?.body
    );
    if (orderData && orderData[0]?.paymentStatus == req?.body?.paymentStatus) {
      log.Info(`Order is already buy please check your email.`);
      res.status(400).json({
        message: "Order is already buy please check your email.",
        status: 400,
      });
    } else {
      let invoice = await invoiceRepository.createInvoice();
      let orderNumber = orderService.generateOrderNumber(invoice.invoiceNumber);
      let modifiedOrdersData = await orderRepository.updateOrders(req.body, orderNumber);
      if (modifiedOrdersData?.modifiedCount > 0) {
        if (req?.body?.paymentStatus == "fail") {
          log.Info("Order updated successfully.");
          res.status(200).json({
            message: "Order updated successfully.",
            status: 200,
            data: req.body,
          });
        } else {
          let modifiedOrdersArray =
            orderService.getModifiedOrdersArray(orderData, orderNumber);
          let emailPromiseArray = [];
          modifiedOrdersArray.map((order) => {
            emailPromiseArray.push(() =>
              orderService.sendEventWiseEmail(order)
            );
          });
          let upcomingEvent = await orderService.getEarliestEvent(
            modifiedOrdersArray
          );
          Promise.all(emailPromiseArray.map((email) => email()))
            .then(async (emailResponse) => {
              log.Info("Order confirmed successfully.");
              delete upcomingEvent.otpArray;
              res.send({
                message: "Order confirmed successfully.",
                status: 200,
                data: upcomingEvent,
              });
            })
            .catch((error) => {
              log.Info(error.toString());
              res.send({
                message: error.toString(),
                status: 500,
              });
            });
        }
      } else {
        log.Info("Order not found with userId and  eventIds.");
        res.status(403).json({
          message: "Order not found with userId and eventIds.",
          status: 403,
        });
      }
    }
  } catch (error) {
    log.Error("order-controller updateOrders failed with error : ",error.toString());
    res.status(500).json({
      message: error.toString(),
      status: 500,
    });
  }
};

const removeOrder = async (req, res) => {
  try {
    let removedOrder = await orderRepository.removeOrder(req.body.userId,req.body.eventId);
    if(removedOrder){
      log.Info("Order deleted successfully.");
      res.send({
        message: "Order deleted successfully.",
        status: 200,
      });
    } else {
      log.Info("Order not fount with event id : "+req.body.eventId);
      res.status(400).json({
        message: "Order not fount with event id : "+req.body.eventId,
        status: 400,
      });
    }
  } catch (error) {
    log.Info("Order-controller removeOrder failed with error : ",error.toString());
        res.status(500).json({
          message: error.toString(),
          status: 500,
        });
  }
}

module.exports = {
  createOrders,
  updateOrders,
  removeOrder
};
