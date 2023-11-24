var config = require("../config/config");
var envSettings = config.getEnvSettings(process.env.NODE_ENV);
const sgMail = require("@sendgrid/mail");
const log = require("node-file-logger");
const ejs = require("ejs");
const path = require("path");
const { throws } = require("assert");
const dirPath = path.join(__dirname, "../");
sgMail.setApiKey(envSettings.SENDGRID_API_KEY);
const s3BucketPath = envSettings.S3_BUCKET_PATH;
let fromEmail = envSettings.SENDGRID_USERNAME;
exports.sendEmail = (userinfo, emailType) => {
  userinfo.s3BucketPath = s3BucketPath;
  return new Promise((resolve, reject) => {
    let ejsPageName;
    let subject;
    switch (emailType) {
      case "eventRemainder":
        ejsPageName = "eventRemainder.ejs";
        let eventVirtualTime = userinfo?.displayTime?.virtualdoortime;
        userinfo.displayTime["virtualTimeWithCapitalMeridium"] = eventVirtualTime.includes("am") ? eventVirtualTime.replace("am"," AM") : eventVirtualTime.replace("pm"," PM");
        subject = `Tomorrow ${userinfo.displayTime.daypart}: ${userinfo.name} Livestream.`;
        break;
      case "orderConfirmed":
        ejsPageName = "orderConfirmed.ejs";
        let eventTime = userinfo.eventTime.replaceAll('.', '/');
        eventTime = eventTime.replace(' ', ' at ');
        eventTime = eventTime.includes("am") ? eventTime.replace('am', ' AM') : eventTime.replace('pm', ' PM')
        subject = `Order: ${userinfo.orderNumber} - 72nd MISS UNIVERSE ${userinfo.eventName} Livestream on ${eventTime}`;
        break;
      case "resendOTP":
        ejsPageName = "resendOTP.ejs";
        let virtualTime = userinfo?.eventId?.displayTime?.virtualdoortime;
        userinfo.eventId.displayTime["virtualTimeWithCapitalMeridiun"] = virtualTime.includes("am") ? virtualTime.replace("am"," AM") : virtualTime.replace("pm"," PM");
        let eventStartTime = userinfo?.eventId?.displayTime?.pststarttime;
        userinfo.eventId.displayTime["eventStartTimeWithCapitalMeridiun"] = eventStartTime.includes("am") ? eventStartTime.replace("am"," AM") : eventStartTime.replace("pm"," PM");
        subject = `OTP verification for Order: ${userinfo.eventId.name}`;
        break;
      case "forgotPassword":
          ejsPageName = "forgot-password.ejs";
          subject = `Miss Universe: reset your password`;
          break;
      case "digitalCollectible":
        ejsPageName = "digital-collectible.ejs";
        subject = `Yesterday's ${userinfo.displayTime.daypart}: ${userinfo.name} was Livestream.`;
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
      if ((ejsPageName == "eventRemainder.ejs" || ejsPageName == "digital-collectible.ejs") && userinfo.orders) {
        let htmlContentArray = [];
        userinfo.orders.map((order) => {
          //pushed getHtmlContent function call into htmlContentArray
          htmlContentArray.push(() =>
            getHtmlContent(ejsPageName, order, userinfo, subject)
          );
        });
        Promise.all(htmlContentArray.map((htmlContent) => htmlContent())).then(
          (msg) => {
            //call getHtmlContent one by one.
            sgMail
              .send(msg)
              .then((response) => {
                resolve(response[0]);
              })
              .catch((error) => {
                reject(error);
              });
          }
        );
      } else if (ejsPageName != "eventRemainder.ejs" || ejsPageName != "digital-collectible.ejs") {
        ejs.renderFile(
          dirPath + "view/" + ejsPageName,
          { userinfo: userinfo },
          (error, data) => {
            if (error) {
              throw error;
            } else {
              let msg;
              msg = {
                to: userinfo?.email || userinfo?.user?.email || userinfo.userId.email, // Change to your recipient
                from: fromEmail, // Change to your verified sender
                subject: subject,
                html: data,
              };
              sgMail
                .send(msg)
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

const getHtmlContent = async (ejsPageName, order, userinfo, subject) => {
  let result = await getHTMLData(ejsPageName, order, userinfo, subject);
  return result;
};

const getHTMLData = (ejsPageName, order, userinfo, subject) => {
  return new Promise((resolve, reject) => {
    try {
      ejs.renderFile(
        dirPath + "/view/" + ejsPageName,
        { userinfo: order, eventData: userinfo },
        (err, data) => {
          let obj;
          obj = {
            to: order.email,
            from: fromEmail, // Change to your verified sender
            subject: subject,
            html: data,
          };
          resolve(obj);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};
