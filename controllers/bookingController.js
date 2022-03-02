//below then will expose a function, and then we can pass our secretKey right into that, Which in turn give us a stripe Object
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
// const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the Currently Booked Store
  const tour = await Tour.findById(req.params.tourId);

  console.log(req.user, 'checkout Session on server');
  // 2) Create checkout Session
  const session = await stripe.checkout.sessions.create({
    //three options are madatory to pass
    //here we can specify multiple types, card is for credit card
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`, // this url will get called as sson as credit card successfully charged, user will be redirected for this url
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //page where the user goes on cancelling the transaction
    customer_email: req.user.email,
    // below is CUSTOM FIELD for client ReferEnce Id, this field allow us to pass in some data, about the session we are currently creating, this sis important bcz once the payment is successful we will then get access to the session object again fo creating a new booking in the data base
    client_reference_id: req.params.tourId,
    line_items: /*this holds the data about current purachsed product itself */ [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //these need to be live images(images hosted live on internet), bcz stripe wil actually upload this image to thier own server
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});
