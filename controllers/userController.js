const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

//logged in user can update his data by this controller
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates, Please use /updatePassword',
        400 /*bad request*/
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  // 3) Update user document

  // We can use here findByIdAndUpdate because we are not dealing with any sensitive data here
  //So findById and then saving the document will not be used here because we don't want to run every validator to run against our Schema
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody /*data feild that should be updated*/,
    {
      new: true /*So that it returns the updated object instead of old one*/,
      runValidators: true
    }
  );
  // user.name = 'Piyush';
  // await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

//When a user decides to delete his account, we actually do not delete that document from database, But we just set that account to inactive, So that user at some point of time reactivate his account
exports.deleteMe = catchAsync(async (req, res) => {
  console.log(req.user.id, 'id');
  await User.findByIdAndUpdate(req.user.id, { active: false });

  //now we will use here Query Middleware, in userModel

  res.status(204 /*when we don't want to see any repsonse on postman*/).json({
    status: 'success',
    data: null
  });
});

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
