const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmPassword: {
    type: String,
    required: true,
  }
}, { timestamps: true });

userSchema.pre('save', async function () {
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
});

// userSchema.methods.comparePasswords = async function (
//   userProvided,
//   hashStored
// ) {
//   return await bcrypt.compare(userProvided, hashStored);
// };

userSchema.methods.comparePasswords = async function (userProvided, hashStored) {
  const result = await bcrypt.compare(userProvided, hashStored);
  console.log(`Comparing ${userProvided} with ${hashStored}: ${result}`);
  return result;
};


module.exports = mongoose.model('User', userSchema);

