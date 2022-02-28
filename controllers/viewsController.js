const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get all tour data from the collection
  const tours = await Tour.find();

  // 2) Build Template
  // 3) Render that template using tour data from(1)
  res.status(200).render('overview', {
    title: 'All tours',
    tours
  });
});

// exports.getTour = (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour'
//   });
// };

exports.getTour = catchAsync(async (req, res, next) => {
  //   const slug = { req.params };
  const tourData = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    field: 'review, rating, user'
  });
  // console.log(tourData);
  //  console.log({slug});
  res.status(200).render('tour', {
    title: `${tourData.name} Tour`,
    tourInfo: tourData
  });
});

exports.getloginForm = catchAsync(async (req, res, next) => {
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render('login', {
      title: `Login`
    });
});
