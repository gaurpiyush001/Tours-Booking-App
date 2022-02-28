const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    //parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//now we will enforce that each user should only review each tour ONCE, this can be acheived by complex indexing with having combination of both userId and tourid to be UNIQUE
reviewSchema.index({ tour: 1, user: 1 }, { unique: 1 });

//Query Middleware
//Populating the review dataset with
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});
// reviewSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'tour',
//     select: 'name'
//   });
//   next();
// });

/////////////////////////---------------STATIC_METHOD(ALL THESE ARE AVAILABLE ON MODEL)---------//////////
reviewSchema.statics.calcAverageRating = async function(
  tourId /*tour_id for which the current review belong to*/
) {
  //Aggregation pipeline, used to do some statistics
  //We need to call aggregate method on the model
  const stats = await this.aggregate([
    //In static method, this keyword points to the MODEl
    {
      $match: { tour: tourId } //We only selects the tour that we want to update
    },
    {
      $group: {
        /*first field we specify is _id*/
        _id: '$tour', //common field which all documents have in common
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);

  if (stats.length > 0) {
    //We need to updating the tour fields
    await Tour.findByIdAndUpdate(tourId, {
      /*Object of data that we want to Update*/
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

//Updating tour document field on saving a new review
reviewSchema.post('save', function() {
  //Here this points to current review document

  /*
  In below line, problem will arise as the Review model is not yet defined before
  Review.calcAverageRating(this.tour);
  */
  ///////////////////----------------------IMPORTANT IMPORTANT IMPORTANT----------------------/////////
  //this.constructor points to the Model that created the review Document
  this.constructor.calcAverageRating(this.tour);
});

//Now updating tour document on Updating and Deleting a new Review, for this we have no document middleware, but we have Query Middleware but in that we can't have access of Model as before
//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //Now "this" points to Current Query, but goal here is to get access to Current Document
  //so we are going to execute the query, and then that will give us the document that's currently being processed
  this.r = await this.findOne(); //this we cannot do in post hook as their query will already get executed
  console.log(this.r); //This will not give updated document from database as it is pre hook
  next();
});

//Now this point of time after the query has already finished and so THE DOCUMENT HAS ALSO BEEN UPDATED, now its perfect time to call static method below in post hook
reviewSchema.post(/^findOneAnd/, async function() {
  //now for getting acces to tourId we need to pass data from pre to post middleware
  await this.r.constructor.calcAverageRating(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema); //Review model should be created after all the middlewares and proper schema is defined

module.exports = Review;
