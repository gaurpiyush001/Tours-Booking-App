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
      // We will create a function and error message, below is a custom validator, which will only work on saving the document
      // below validation will not work on updating a document
      validator: function(el) {
        return el === this.password; // Equating the Password to check
      },
      message: 'Passwords are not the same' // error message
    }
  },
  passwordChangedAt: Date
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

///////////---------------------------INSTANCE METHOD, for decrypting the password for verificaation at time of logginIn------------------/////////////////
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  //this.password is not available in the output, so we pass candidatePassword as a parameter in function
  //just returns true or false
  return await bcrypt.compare(candidatePassword, userPassword);
};

//checking if logged in user changed his password
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChngedAt.getTime() / 1000,
      10
    );

    console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // Falsemeans NOT changed
  return false;
};

const User = mongoose.model('User', userSchema); //creating model out of schema

module.exports = User;
