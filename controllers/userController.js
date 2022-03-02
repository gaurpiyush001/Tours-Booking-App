const multer = require('multer'); //Multer is very popular middleware to handle Multi-Part form data, which is a form in coding used to uploading files from a form
const sharp = require('sharp'); //Image processing Library for Nodejs
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//Now we will create a multer storage and a multer filter
//--const multerStorage = multer.diskStorage({
//--destination: (req, file, cb) => {
//this accepts a callback function
//--cb(null /*if any error*/, 'public/img/users'); //this is the folder where we want to store the images
//--},
//--filename: (req, file, cb) => {
// here we will give proper filenames
// like user-userId-currentTimestamp.jpeg ->by this no two images would have same file name
//--const extension = file.mimetype.split('/')[1];
//--cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//--}
//--});

const multerStorage = multer.memoryStorage(); //This way the image is stored as a buffer in memory, and not in disk, saving in this style would be helpfull in Image Processing

//now lets create a multer filter => goal of this function is to check if the uploaed file is image or Not
const multerFilter = (req, file, cb) => {
  //(thsi can be used as function to check all kinds of file that we want to upload and accordingly send the error)
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not an Image! Please uplaod an image.',
        400 /*Bad request*/
      ),
      false
    );
  }
};

//If we call multer function just without any option then the images are jsut stored in the memory and are not saved in disk
//Now we can use this upload as a middleware in our req/res cycle to upload images
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo'); //because we need to upload only a single image and paasing the name of the field which is going to store the image in our FORM

//this middleware is going to do the job of Image Processing
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //At this point we already have our file on our request body
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // otherWise do image resizing by using sharp package
  await sharp(req.file.buffer)
    .resize(500, 500) //resizing the image to given dimension
    .toFormat('jpeg') //converting it to jpeg
    .jpeg({ quality: 90 }) //reducing the quality of image, so as to counter high resolution images
    .toFile(`public/img/users/${req.file.filename}`); //saving images to disk

  next();
});

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
  // console.log(req.file);
  // console.log(req.body);

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
  if (req.file) filteredBody.photo = req.file.filename;

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

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use sign Up insteadf'
  });
};

/// Do NOT UPDATE passwords with this!!!
exports.updateUser = factory.updateOne(User); //Only for administrators

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

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!'
//   });
// }; After Factory Function below
exports.deleteUser = factory.deleteOne(User); //This route is specified for Administrator only, to delete the user

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
