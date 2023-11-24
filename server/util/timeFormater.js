const log = require("node-file-logger");
exports.getPSTDate = (date) => {
  return new Promise((resolve, reject) => {
    try {
      let isotime = date.toISOString();
      let pstdate = new Date(isotime).toLocaleString("en-US", {
        timeZone: "America/Chicago",
      });
      pstdate = new Date(pstdate);
      resolve(pstdate);
    } catch (error) {
      reject(error);
    }
  });
};

exports.getFormatedTime = (pstdate) => {
  return new Promise((resolve, reject) => {
    try {
      let pststarttime = getDisplayTime(pstdate);
      let MS_PER_MINUTE = 60000;
      let durationInMinutes = 15;
      let virtualdoortime = new Date(
        pstdate - durationInMinutes * MS_PER_MINUTE
      );
      virtualdoortime = getDisplayTime(virtualdoortime);
      let obj = {
        pststarttime: pststarttime,
        virtualdoortime: virtualdoortime,
      };
      resolve(obj);
    } catch (error) {
      reject(error);
    }
  });
};

const getDisplayTime = (pststarttime) => {
  try {
    var hours = pststarttime.getHours();
    var minutes = pststarttime.getMinutes();
    var ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    const formattedTimeWithZone = `${strTime} CST`;
    return formattedTimeWithZone;
  } catch (error) {
    log.Error(`${error.toString()}`);
  }
};

exports.formatDate = (date) => {
  return new Promise((resolve, reject) => {
    try {
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let d = new Date(date);
      let dayName = days[d.getDay()];

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      let monthName = monthNames[d.getMonth()];
      let day = d.getDate();
      day =
        day == 1
          ? 1 + "st"
          : day == 2
          ? 2 + "2nd"
          : day == 3
          ? 3 + "rd"
          : day + "th";
      let year = d.getFullYear();
      let finalString = dayName + ", " + monthName + " " + day;
      resolve(finalString);
    } catch (error) {
      reject(error);
    }
  });
};

exports.getEventTime = (timestamp) => {
  return new Promise(async (resolve, reject) => {
    try {
      let d = new Date(timestamp);
      let pstdate = d.toLocaleString("en-US", {
        timeZone: "America/Chicago",
      });
      let date = new Date(pstdate);
      let displayTime = getDisplayTime(date);
      displayTime = displayTime.split(" ");
      let meridium = displayTime[1].toLowerCase();
      displayTime = displayTime[0] + meridium + " " + displayTime[2];
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      day = day < 10 ? "0" + day : day;
      month = month < 10 ? "0" + month : month;
      pstdate = month + "." + day + "." + year + " " + displayTime;
      const formattedTimeWithZone = `${pstdate}`; //09.25.2023, 8:00pm PST
      resolve({
        formattedTimeWithZone: formattedTimeWithZone,
        displayTime: displayTime,
      });
    } catch (error) {
      reject(error);
    }
  });
};

exports.getDayPart = (date) => {
  return new Promise((resolve, reject) => {
    try {
      let curHr = date.getHours();
      if (curHr >= 5 && curHr < 12) {
        resolve("Morning");
      } else if (curHr >= 12 && curHr < 17) {
        resolve("Afternoon");
      } else if (curHr >= 17 && curHr < 21) {
        resolve("Evening");
      } else {
        resolve("Night");
      }
    } catch (error) {
      reject(error);
    }
  });
};
