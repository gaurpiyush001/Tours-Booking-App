const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

//this tour router should use the review Router, if in case it encounters the route
router.use('/:tourId/reviews', reviewRouter); //here we will further use mergeParams property to access parameters of url in reviewRouter

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(
    //authController.protect /*Middleware for protecting Routes*/,
    tourController.getAllTours //now i want to expose this part of API to everyone
  )
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo(
      'admin',
      'lead-guide'
    ) /*In this function we will pass some user roles which will be authorized to interact with this resource*/,
    tourController.deleteTour
  );

//POST request for a creating a new review
//POST /tour/{tour_id}/reviews
//GET /tour/{tour_id}/reviews   //This will ideally get us all the reviews from tour with specied tour_id
//GET /tour/{tour_id}/reviews/{review_id}   //this will ideally get us all data related to that review

//NESTED POST ROUTE-------------LATER WE WILL FIX THIS WITH ***MERGEPARAM***
/*router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );
*/
module.exports = router;
