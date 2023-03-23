const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { isEmail } = require('validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  tax_id: {
    type: String,
    required: true,
    default: uuidv4(),
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: isEmail,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  address: {
    type: String,
    required: true,
  },
});

// Hooks
userSchema.pre('save', async function (next) {
  console.log('saving user:', this.email);

  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

userSchema.post('save', function (doc, next) {
  console.log('saved user:', doc.email);
  next();
});

// Static methods
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const isMatched = await bcrypt.compare(password, user.password);
    if (isMatched) {
      return user;
    } else {
      // Wrong password
      throw Error('Wrong password!');
    }
  } else {
    // Email is not registered
    throw Error('There is no such registered email!');
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
