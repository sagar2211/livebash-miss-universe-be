var config = require("../config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const log = require("node-file-logger");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const dirPath = path.join(__dirname, "../");
const fromEmail = envSettings.NODEMAILER_FROM_EMAIL;
const username = envSettings.NODEMAILER_USERNAME;
const password = envSettings.NODEMAILER_PASSWORD;

exports.sendEmail = async (userinfo, emailType) => {
  return new Promise((resolve, reject) => {
    let ejsPageName;
    let subject;
    switch (emailType) {
      case "eventRemainder":
        ejsPageName = "misUniverseEventRemainder.ejs";
        subject = `Tomorrow ${userinfo.displayTime.daypart}: ${userinfo.name} Livestream.`;
        break;
      case "orderConfirmed":
        ejsPageName = "orderConfirmed.ejs";
        subject = `Order Confirmed: ${userinfo.eventName} Livestream ${
          userinfo?.eventTime != null ? userinfo?.eventTime : ""
        } Order Number : ${userinfo.orderNumber} Ticket Number : ${
          userinfo.ticketNumber
        }`;
        break;
      default:
        ejsPageName = "orderConfirmed.ejs";
        subject = `Order Confirmed: ${userinfo.eventName} Livestream ${
          userinfo?.eventTime != null ? userinfo?.eventTime : ""
        } Order Number : ${userinfo.orderNumber} Ticket Number : ${
          userinfo.ticketNumber
        }`;
    }
    try {
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: username, // write your smtp account user name
          pass: password, // write your smtp account user password
        },
      });
      if (
        (ejsPageName == "misUniverseEventRemainder.ejs" ||
          ejsPageName == "eventRemainder.ejs") &&
        userinfo.buyers
      ) {
        let htmlContentArray = [];
        userinfo.buyers.map((buyer) => {
          //pushed getHtmlContent function call into htmlContentArray
          htmlContentArray.push(() =>
            getHtmlContent(ejsPageName, buyer, userinfo, subject)
          );
        });
        Promise.all(htmlContentArray.map((htmlContent) => htmlContent())).then(
          (data) => {
            let msg = {
              from: fromEmail, // Change to your verified sender
              to: userinfo.email, // Change to your recipient
              subject: subject,
              html: data,
            };
            transporter
              .sendMail(msg)
              .then((response) => {
                resolve(response[0]);
              })
              .catch((error) => {
                reject(error);
              });
          }
        );
      } else if (ejsPageName != "eventRemainder.ejs") {
        ejs.renderFile(
          dirPath + "view/" + ejsPageName,
          { userinfo: userinfo },
          (error, data) => {
            if (error) {
              throw error;
            } else {
              let msg;
              msg = {
                from: "sagar.bhujbal@codeastu.com", // Change to your verified sender
                to: userinfo?.email || userinfo?.user?.email, // Change to your recipient
                subject: subject,
                html: data,
              };

              transporter
                .sendMail(msg)
                .then((response) => {
                  resolve(response[0]);
                })
                .catch((error) => {
                  log.Error(`${error.toString()}`);
                  resolve(error);
                });
            }
          }
        );
      }
    } catch (error) {
      log.Error(`${error.toString()}`);
      reject(error);
    }
  });
};

const getHtmlContent = async (ejsPageName, buyer, userinfo, subject) => {
  let result = await getHTMLData(ejsPageName, buyer, userinfo, subject);
  return result;
};

const getHTMLData = (ejsPageName, buyer, userinfo, subject) => {
  return new Promise((resolve, reject) => {
    try {
      ejs.renderFile(
        dirPath + "/view/" + ejsPageName,
        { userinfo: buyer, eventData: userinfo },
        (err, data) => {
          let obj;
          obj = {
            to: buyer.email,
            from: fromEmail, // Change to your verified sender
            subject: subject,
            html: data,
          };
          msg.push(obj);
          resolve(msg);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};
