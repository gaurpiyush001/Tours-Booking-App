//Here we'll do all User Related Stuff/////////////////////////////////
const { promisify } = require('util'); //util module use for promisifying a function
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign(
    { id } /*Payload*/,
    process.env.JWT_SECRET /*secret-Key_32-char-long*/,
    /*Options*/ {
      expiresIn: `${process.env.JWT_EXPIRES_IN}d`
    }
  );
};

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
      expiresIn: `${process.env.JWT_EXPIRES_IN}d`
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

  console.log(user, 'user');

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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log('In forgot Password controller');
  //1.) Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with email address', 404));
  }
  //2.) Generate the random token(will do in Instance Methods in model)
  const resetToken = user.createPasswordResetToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });
  //3.) Send it to user's email
});
exports.resetPassword = (req, res, next) => {};
