const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.createReview = catchAsync(async (req, res) => {
  //If there is any field present in req.body which is not there in Schema then it will simply be ignored
  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});

exports.getAllReviews = catchAsync(async (req, res) => {
  const allReview = await Review.find();

  res.status(200).json({
    status: 'success',
    result: allReview.length,
    data: {
      review: allReview
    }
  });
});
