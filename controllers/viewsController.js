const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

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

  if (!tourData) {
    return next(
      new AppError('There is no tour with that name.', 404 /*NotFound*/)
    );
  }

  res.status(200).render('tour', {
    title: `${tourData.name} Tour`,
    tourInfo: tourData
  });
});

exports.getloginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: `Login`
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  //console.log('UPDATING USER', req.body);//this will be empty, because we need to add a middleware to get access of data from a submitted form

  const { name, email } = req.body;
  console.log(req.user, 'This from controller');
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      email
    },
    {
      new: true,
      runValidators: true
    }
  );
  console.log(updatedUser, 'This from controller');
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser //we need to specify here new updatedUser
  });
});
