const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    //Below Object is not for Schema Type Options, But this Object is really an Embedded Object. So inside this Object we can specify a couple of properties.
    //In order for this Object to be recognized as GeoSpatial JSON, we need type and coordinates Properties
    startLocation: {
      // GeoJSON
      // Each of this sub-fields will get its own schema tye options
      type: {
        type: String,
        default: 'Point', //we can specify multiple geometries in mongoDB
        enum: ['Point']
      },
      coordinates: [Number], //we accept an array of Numbers[longitude, latitude] this how it work in MongoDB
      address: String,
      description: String
    },
    //Now below we have embedded all the tours location in the tour Document
    //By below we have created new Document and have embedded into tours document by creating an array
    //By specifing an array of objects, we can create brand new Documents inside of the parent Documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
      }
    ],
    //-------------------This below Approach for embedding the user guides document into tours document will be very costly as if any guide have its data changed then we have to update again the guides field in tour document BUT THAT PRE MIDDLEWARE WILL WORK only on creating the document, SO WE WILL USE REFERENCING(CHILD REFERENCING) instead of embedding-----------------//
    /*
----------------------------------------OLD APPROACH----------------------------------------------------
    //Embedding tour Guide documents(present in user collection) into a tour documents
    //Idea here is,When creating a new Tour Docuemnt, it will simply contain an array of UserId and we will get corresponding User Documents based on these Ids from User Collection and add them to tour Document
    guides: Array //this will be done by Document pre Middlewares
--------------------------------------------------------------------------------------------------------
    */
    //Now we will start with an approach that tours and users will always remain complete seaparate Entities in our Database, so we will only save ID's of the users that are the tour guides
    //______🙌🙌👀👀✨😃✨✌IMPLEMENTING REFERENCING IN MONGOOSE
    guides: [
      //Later we will populate this,Only in the query not in the actual data
      //array sign means that, these will be some sub-documents(embedd document)
      {
        //we can populate this with populate process at the query time as if the documents are embedded
        type:
          mongoose.Schema
            .ObjectId /*means we expect the type of each element in the guides array as MONGODB ID*/,
        ref: 'User' //this is how we establish references between different datasets/collections in mongoose
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*
//below code only works for creating and saving new document not for updating them 
tourSchema.pre('save', async function(next) {
  //Below guides array will be full of promises as map will return the result of each iteration as a promise
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  //we now need to run all these promises at the same time
  this.guides = await Promise.all(guidesPromises);
  next();
});
*/

// tourSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

//This query middleware is there to run each time, when there is a query starting with the 'find' on the Tour Model
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path:
      'guides' /*attribute which we want to populate from the referenced collection*/,
    select: '-__v -passwordChangedAt'
  });

  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
