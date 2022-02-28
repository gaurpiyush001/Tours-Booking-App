const path = require('path'); //path is built-in core module, used to manipulate path-names
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); //this package is for preventing DOS and Brute force attack
const helmet = require('helmet'); //this package is for important security http headers, to set these header we will use middleware function used in helmet
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//In order to get access to the cookies, that are in our request, we need to install a middleware
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

///////---setting up tepmplate ENGINE WITH express
//How do we build or render these websites, well we use TEMPLATE ENGINES, which will allow us to create template an then easily fill up that template with our data, AND one such TEMPLATE ENGINE is PUG which we will use(others are handlebars, EJS)
//below we DEFINED OUR VIEW ENGINE
app.set('view engine', 'pug'); //Express automatically supports some engines, we don't need to require pug
//NOW below we define, where these views(pug-templates) are located in file system
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES

//Serving Static Files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public'))); //all the static assets are served by this route

//Setting Securtiy http headers
//In app.use we always need a function not a function call
app.use(helmet() /*this will return a function*/);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//this below limiter function is an middleware function, limiting request from same API
const limiter = rateLimit({
  /*Here we will specify how much request per IP are we goin to allowed*/
  max: 100, //100 request for same IP
  windowMs: 60 * 60 * 1000, //In one hour
  message: 'Too many request fom this IP, please try again in an hour' //If limits exceeds then this error message
});
app.use('/api' /*limit acces to our api starting with this string*/, limiter);

// Body parser, reading data from body into req.body
// by this, We can actually limit the amount of data that comes in the body
app.use(
  express.json({
    limit: '10kb' /*body larger then 10KiloByte will not be accepted*/
  })
);
app.use(cookieParser()); //this middleware parses the data from cookie

/*{
  "email": { "$gt": ""},
  "password": "browny06"
}*/

//-----Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize()); //This will clean any user input from malicious query string

//-----Data sanitization against XSS
app.use(xss()); //This will clean any user input from malicious code

// Prevent parameter pollution....this prevent the parameter polltion in sort parameters
app.use(
  hpp({
    whitelist: [
      /*Whitelist is simply an array of properties for which allow duplicates in query String*/
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//Tets Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// 3) ROUTES
//Here we are performing mounting of routes
app.use('/', viewRouter);
app.use(
  '/api/v1/tours',
  tourRouter /*this will now act as middleware function, and will be called whenever there is a request to this route */
);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
