const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// ------------FAT MODELS , THIN CONTROLLERS --------------//

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    //this is a unique identifier of each User
    type: String,
    required: [true, 'Please tell us your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide Password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm your Password'],
    validate: {
      // We will create a function and error message, below is a custom validator, which will only work on saving or creating the document
      // below validation will not work on updating a document
      validator: function(el) {
        return el === this.password; // Equating the Password to check
      },
      message: 'Passwords are not the same' // error message
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String /*We need to encrypt this field bcz if hacker gets access to database then he can to change users password*/,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// For doing Password Encryption Password, we will use pre save hook(), i.e document middleware
// manipulating data between getting the data and saving it to the database
userSchema.pre('save', async function(next) {
  //we will only encrypt the password, when user has updated/created the Password field
  if (!this.isModified('password')) return next(); //All documents have a method --> isModified

  // Hashing/Encrypting the password, we will do encryption using an algorithm called Bcrypt, first
  // this algo will salt the password and then encrypt/hash
  this.password = await bcrypt.hash(
    this.password,
    10 /*Cost parameter for salting*/
  );
  this.passwordConfirm = undefined; //we don't want to persist confirm password to database
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //by subtracting 1 second manually, we will ensure JWT is issued after the password has been changed and the user wil be logged in
  next();
});

//pre-find hook, now this below middleware will run for each find query
userSchema.pre(/^find/, function(next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

///////////---------------------------INSTANCE METHOD, for decrypting the password for verificaation at time of logginIn------------------/////////////////
//INSTANCE METHOD IS AVAILABLE ON ALL DOCUMENTS
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  console.log('in the correctPassword instance');
  //this.password is not available in the output, so we pass candidatePassword as a parameter in function
  //just returns true or false
  //function will decrypt the password saved in database and then compare it
  console.log(candidatePassword, userPassword);
  return await bcrypt.compare(candidatePassword, userPassword);
};

//checking if logged in user changed his password
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(this.passwordChangedAt.get)
    console.log(
      this.passwordChangedAt,
      JWTTimestamp,
      'checking password changed timing'
    );
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // Falsemeans NOT changed
  console.log('passwordChangedAt property not exist');
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  //passwordResetToken should be a random string, but it does'nt need to be cryptographically strong as
  //the password hash, so we can use RANDOM BYTES FUNCTION , from built-in CRYPTO MODULE

  const resetToken = crypto.randomBytes(32).toString('hex');
  //resetToken will be send to the user, so its like a reset Password, which the user can use to create a new REAL PASSWORD, and ofcourse ONLY THE USER WILL HAVE ACCESS TO THIS TOKEN

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // this.passwordResetToken = resetToken;

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken; //plain text token that we gonna send through Email
};

const User = mongoose.model('User', userSchema); //creating model out of schema

module.exports = User;
