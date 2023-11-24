const log = require("node-file-logger");
const getPSTDate = (date) => {
  try {
    let isotime = date.toISOString();
    let pstdate = new Date(isotime).toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    pstdate = new Date(pstdate);
    return pstdate;
  } catch (error) {
    log.Error("time-formater getPSTDate failed with error : ",error.toString());
    throw error;
  }
};

const getFormatedTime = (pstdate) => {
  try {
    let pststarttime = getDisplayTime(pstdate);
    let MS_PER_MINUTE = 60000;
    let durationInMinutes = 15;
    let virtualdoortime = new Date(pstdate - durationInMinutes * MS_PER_MINUTE);
    virtualdoortime = getDisplayTime(virtualdoortime);
    return {
      pststarttime: pststarttime,
      virtualdoortime: virtualdoortime,
    };
  } catch (error) {
    log.Error("time-formater getFormatedTime failed with error : ",error.toString());
    throw error;
  }
};

const formatDate = (date) => {
  try {
    let pstdate = date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    date = new Date(pstdate);
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
    let finalString = dayName + ", " + monthName + " " + day;
    return finalString;
  } catch (error) {
    log.Error("time-formater formatDate failed with error : ",error.toString());
    throw error;
  }
};

const getEventTime = (timestamp) => {
  try {
    let d = new Date(timestamp);
    let pstdate = d.toLocaleString("en-US", {
      timeZone: "America/Chicago",
    });
    let date = new Date(pstdate);
    let displayTime = getDisplayTime(date);
    // displayTime = displayTime.split(" ");
    // let meridium = displayTime[1].toLowerCase();
    // displayTime = displayTime[0] + meridium + " " + displayTime[2];
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;
    pstdate = month + "." + day + "." + year + " " + displayTime;
    const formattedTimeWithZone = `${pstdate}`; //09.25.2023, 8:00pm PST
    return {
      formattedTimeWithZone: formattedTimeWithZone,
      displayTime: displayTime,
    };
  } catch (error) {
    log.Error("time-formater getEventTime failed with error : ",error.toString());
    return error.toString();
  }
};

const getDisplayTime = (pststarttime) => {
  try {
    var hours = pststarttime.getHours();
    var minutes = pststarttime.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + ampm;
    const formattedTimeWithZone = `${strTime} CST`;
    return formattedTimeWithZone;
  } catch (error) {
    log.Error(`${error.toString()}`);
  }
};

module.exports = {
  getPSTDate,
  getFormatedTime,
  formatDate,
  getEventTime,
  getDisplayTime,
};
