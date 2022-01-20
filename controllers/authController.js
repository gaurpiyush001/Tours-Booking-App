//Here we'll do all User Related Stuff/////////////////////////////////
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign(
    { id } /*Payload*/,
    process.env.JWT_SECRET /*secret-Key_32-char-long*/,
    /*Options*/ {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  }); //Creating a New Document Based on the Models
  // By sending this selected data in signUp, we prevented the possiblity of manipulating the admin role

  // ------------------------IMPLEMENTING AUTHENTICATION-----------------------------//

  // 1.) Craeting a unique JWT, during signup
  const token = jwt.sign(
    { id: newUser._id } /*Payload*/,
    process.env.JWT_SECRET /*secret-Key_32-char-long*/,
    /*Options*/ {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
  // token headers are craeted automatically
  res.status(201).json({
    //We will send the created user to client
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1.) Check or Verify requested Email and Password exist or not in user request body data
  if (!email || !password) {
    return next(
      new AppError('Please provide email and password!', 400 /*Bad Request*/)
    );
  }

  // 2.) check if user exist && password is correct
  const user = await User.findOne({ email }).select(
    '+password'
  ); /*explicitly slecting password*/

  //Comparing decrypted password of database with that given by the user in request(Done in Modal)
  // if(user.password === password)
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3.) If everything ok, send unique token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'Success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting Token from user and check if its there in request body
  //Common practice is to send a token using an http header with the request
  //because const and let are blockscope
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        `You are npt logged in! Please log in to get access.`,
        401 /*unauthorized*/
      )
    );
  }
  // 2) Verification token

  // 3) If User still exist

  // 4) Check If user changed password after teh JWT was issued

  next();
});
