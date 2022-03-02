const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

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

//Uploading multiple images at a time
exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover', //this is same as field nae in databse
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);

//upload.array('images', 5);--> this will produce req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Images processing

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //resizing the image to given dimension
    .toFormat('jpeg') //converting it to jpeg
    .jpeg({ quality: 90 }) //reducing the quality of image, so as to counter high resolution images
    .toFile(`public/img/tours/${req.body.imageCover}`); //saving images to disk

  // 2) Images processing
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) //resizing the image to given dimension
        .toFormat('jpeg') //converting it to jpeg
        .jpeg({ quality: 90 }) //reducing the quality of image, so as to counter high resolution images
        .toFile(`public/img/tours/${filename}`); //saving images to disk

      req.body.images.push(filename);
    })
  );

  console.log(req.body);
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
/*catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    },
    user: req.user //protected route is accessed by this user
  });
});
*/

exports.getTour = factory.getOne(Tour, {
  path: 'reviews'
});

/*
catchAsync(async (req, res, next) => {
  //const tour = await Tour.findById(req.params.id).populate({
  //  path: 'guides',
  //attribute which we want to populate from the referenced collection
  //  select: '-__v -passwordChangedAt'
  //});
  // Tour.findOne({ _id: req.params.id })

  const tour = await Tour.findById(req.params.id).populate('reviews');

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

exports.createTour = factory.createOne(Tour);

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
exports.updateTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
