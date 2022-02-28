const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//---------------------------------MERGE-PARAMS(express advance feature)--------------------------//
const router = express.Router({ mergeParams: true }); //We need to do this because in express by default, each router have access to their specific routes

router.use(authController.protect);
// POST /tour/{tour_id}/reviews
// POST reviews/
router
  .route('/')
  .get(reviewController.getAllReviews)
  //as we want only authenticated users to post reviews and only those users that are actually regular users
  .post(
    // authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
