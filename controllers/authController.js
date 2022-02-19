//Here we'll do all User Related Stuff/////////////////////////////////
const crypto = require('crypto');
const { promisify } = require('util'); //util module use for promisifying a function
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign(
    { id } /*Payload*/,
    process.env.JWT_SECRET /*secret-Key_32-char-long*/,
    /*Options*/ {
      expiresIn: '7h'
    }
  );
  // console.log(process.env.JWT_EXPIRES_IN);
};

// const createSendToken = (user, statusCode, res, token) => {
//   res.status(statusCode).json({
//     status: 'success',
//     token,
//     data: {
//       user
//     }
//   });
// };

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
      ? req.body.passwordChangedAt
      : undefined,
    role: req.body.role ? req.body.role : 'user'
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

  res.cookie('jwt', token, {
    //by this we will make it so, that browser or the client in general will delete the cookie after it has expired
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true /*Cookie will only be send to an encrypted Connection means https connection only in production it will work*/,
    httpOnly: true /*by this we make sure that our cookie cannot be modified or accessed by the browser*/
  });

  newUser.password = undefined; //by this it will not show in output,but will go to db
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

  console.log(user, 'user');

  //Comparing decrypted password of database with that given by the user in request(Done in Modal)
  // if(user.password === password)
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3.) If everything ok, send unique token to client
  const token = signToken(user._id);
  console.log(process.env.JWT_EXPIRES_IN);

  res.cookie('jwt', token, {
    //by this we will make it so, that browser or the client in general will delete the cookie after it has expired
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true /*Cookie will only be send to an encrypted Connection means https connection*/,
    httpOnly: true /*by this we make sure that our cookie cannot be modified or accessed by the browser*/
  });

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
    console.log('yes token haii!!');
    token = req.headers.authorization.split(' ')[1];
  }

  console.log(token);

  if (!token) {
    return next(
      new AppError(
        `You are not logged in! Please log in to get access.`,
        401 /*unauthorized*/
      )
    );
  }
  // 2) Verification token(comparing original signature with test signature and checking expiration of token)

  //below function requires a call back function which get executed after token is verified
  //We will promisify the below function to make it return a Promise, To do that we use node built in "util" module
  const decoded = await promisify(jwt.verify)(
    token /*for accessing header & payload*/,
    process.env.JWT_SECRET /*Inorder to create test signature*/
  );
  console.log(decoded); //contains thee objects => {id, iat, expireAt}

  // 3) If User still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4) Check If user changed password after the JWT was issued
  //implemented in user model by Instance Method
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed assword! Please log in again', 401)
    );
  }

  //GRANT ACCES TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});

// Example of implementing of passing arguments to a Middleware Function
// Generally we are not able to pass arguments to middleware function, but we can do so by a wrapper function
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array of parameters passed
    // console.log(req.user)
    // console.log(roles, req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Basic Idea -> We just need to provide out emailAddress and we will then get an email ,
//in that we will be having a link on clicking that its gonna take us to page, where we can put a new Password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log('In forgot Password controller');
  //1.) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }
  //2.) Generate the random token not a Json web Token(will do in Instance Methods in model)
  const resetToken = user.createPasswordResetToken();
  console.log(resetToken, 'In authController after executing InstanceMethod');
  await user.save(
    {
      validateBeforeSave: false
    } /*this option will deactivaet all the validators that we set in Our Schema*/
  ); //saving the modified Document

  //3.) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you did'nt forget your password, please ignore this e-mail`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your PASSWORD RESET TOKEN (valid for 10min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email '
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validationBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try Again later!'),
      500 /*server error*/
    );
  }
});

//Password Reset Functionality
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1.) Get user based on the token
  //now we will encrypt the randomToken to match with to the encrypted resetToken present in database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2.) If token has NOT EXPIRED, and there is user exist, THEN ONLY SET NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3.) Update changedPasswordAt property for the current user
  //This is done by pre middleware in user model

  //4.) Log the user In, send JWT
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    //by this we will make it so, that browser or the client in general will delete the cookie after it has expired
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true /*Cookie will only be send to an encrypted Connection means https connection*/,
    httpOnly: true /*by this we make sure that our cookie cannot be modified or accessed by the browser*/
  });
  res.status(200).json({
    status: 'Success',
    token
  });
});

//By Below controller we allow LoggedIn user to Update his password without forgetting it(without that whole reset process)
exports.updatePassword = catchAsync(async (req, res, next) => {
  //This password updating functionality is only for logged in user, but still we need to pass in his current password, So in order to confirm that the user actually is who he claims to be(Just for Security measure)
  // 1) Get user from collection
  console.log('My request body', req.body);
  const user = await User.findById(req.user.id).select('+password');
  // const user = await User.findOne({ email: req.body.email }).select(
  //   '+password'
  // );
  console.log(user, 'In updatePassword');

  // 2) Check if Posted curent password is correct
  const previousPassword = req.body.prevPassword;
  console.log(req.body.prevPassword);
  if (!user || !(await user.correctPassword(previousPassword, user.password))) {
    // console.log('In first block');
    return next(
      new AppError('Your current Password is wrong', 401 /*Unauthorized*/)
    );
  }
  if (req.body.newPassword !== req.body.newPasswordConfirm) {
    console.log('In second block');
    return next(new AppError('Updated ConfirmPassword should be same', 404));
  }

  // 3) If so, Update password
  // console.log('Hiiii', req.body.newPassword, req.body.newPasswordConfirm);
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  // 4) Log user In, send JWT(with thw new password that was updated)
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    //by this we will make it so, that browser or the client in general will delete the cookie after it has expired
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //secure: true /*Cookie will only be send to an encrypted Connection means https connection*/,
    httpOnly: true /*by this we make sure that our cookie cannot be modified or accessed by the browser*/
  });

  res.status(200).json({
    status: 'Success',
    token
  });
});
