const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
// const AppError = require('./../utils/appError');

exports.setTourUserIds = (req, res, next) => {
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  const { _id: user } = req.user;
  req.body = { ...req.body, user };
  next();
};

/*
exports.createReview = catchAsync(async (req, res) => {
  //Allow nested Routes
  // console.log(req.body, 'hello testing', req.user);
  //if (!req.body.tour) req.body.tour = req.params.tourId;
  //if (!req.body.user) req.body.user = req.user.id; //we get req.user from protect middleware
  //const { _id: user } = req.user;
  // console.log({ ...req.body, user });
  // If there is any field present in req.body which is not there in Schema then it will simply be ignored
  const newReview = await Review.create({ ...req.body, user });

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});
*/

exports.createReview = factory.createOne(Review);

exports.getAllReviews = factory.getAll(Review);

/*
catchAsync(async (req, res) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const allReview = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    result: allReview.length,
    data: {
      review: allReview
    }
  });
});
*/

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
