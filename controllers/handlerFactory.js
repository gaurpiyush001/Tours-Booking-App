const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//Goal here is to basically create a function which will then return a general function, but for every single model that we have in our application, So inside factory function we will pass in the model
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

/*
exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
  
    if (!tour) {
      return next(new AppError('No tour found with that ID', 404));
    }
  
    res.status(204).json({
      status: 'success',
      data: null
    });
});
*/

/*
exports.updateTour = catchAsync(async (req, res, next) => {
  //findByIdAndUpdate allows all query middleware to run, But is stops all the document middleware
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});
*/

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    //findByIdAndUpdate allows all query middleware to run, But is stops all the document middleware
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //const tour = await Tour.findById(req.params.id).populate({
    //  path: 'guides',/*attribute which we want to populate from the referenced collection*/
    //  select: '-__v -passwordChangedAt'
    //});
    // Tour.findOne({ _id: req.params.id })

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    //MongoDb indexes are used to improve the read performance query by examining only some ste of documents ona query

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      },
      user: req.user //protected route is accessed by this user
    });
  });
