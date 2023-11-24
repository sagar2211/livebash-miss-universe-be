const { MisUniverseUser } = require("../model/user");
const log = require("node-file-logger");

const saveUser = (request, password) => {
  try {
    let newUser = MisUniverseUser({
      ...request,
      password: password,
      lastLogin: new Date(),
      loginCount: 1
    });
    let userData = newUser.save();
    return userData;
  } catch (error) {
    log.Error(
      "user repository saveUser failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const upsertUser = async (request) => {
  try {
    let userData = await MisUniverseUser.findOneAndUpdate(
      { email: request.email },
      {
        $set: {
          ...request,
        },
      },
      { upsert: true, new: true } // Make this update into an upsert
    ).lean();
    return userData;
  } catch (error) {
    log.Error(
      "user repository upsertUser failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    let userData = await MisUniverseUser.aggregate([
      {
        "$match": {
          "$expr": {
            "$eq": [
              { "$toLower": "$email" },
              { "$toLower": email }
            ]
          }
        }
      }
    ])
    return userData.length >0 ? userData[0] : null;
  } catch (error) {
    log.Error(
      "user repository getUserByEmail failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    let userData = await MisUniverseUser.findOne({ _id: id }).lean();
    return userData;
  } catch (error) {
    log.Error(
      "user repository getUserById failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const updateUserPasswordById = async (userData, password) => {
  try {
    let updatedData = await MisUniverseUser.findOneAndUpdate(
      { $and: [{ _id: userData._id }, { resetPassword: true }] },
      {
        $set: {
          password: password,
          loginVia: "email",
          resetPassword: false,
        },
      },
      {
        new: true,
        select: {
          password: 0,
          phone: 0,
        },
      }
    );
    return updatedData;
  } catch (error) {
    log.Error(
      "user repository updateUserPasswordById failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const updateUserResetPasswordFlagById = async (userId, resetPassword) => {
  try {
    let updatedData = await MisUniverseUser.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          resetPassword: resetPassword,
        },
      },
      {
        new: true,
      }
    );
    return updatedData;
  } catch (error) {
    log.Error(
      "user repository updateUserResetPasswordFlagById failed with error : ",
      error.toString()
    );
    throw error;
  }
};

const updateUserLastLoginById = async (userId) => {
  try {
    let updatedData = await MisUniverseUser.findOneAndUpdate(
      { _id: userId },
      {
        lastLogin: new Date(),
        $inc: { loginCount: 1 },
      },
      { new: true }
    ).lean();
    return updatedData;
  } catch (error) {
    log.Error(
      "user repository updateUserLastLoginById failed with error : ",
      error.toString()
    );
    throw error;
  }
};
module.exports = {
  saveUser,
  upsertUser,
  getUserByEmail,
  getUserById,
  updateUserPasswordById,
  updateUserResetPasswordFlagById,
  updateUserLastLoginById,
};
