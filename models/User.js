// Эта директория и файл в частности отвечают за структуру данных и их обработку, Схема и действия с ними (запросы к бд, валидация)
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Please provide email"],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
  },
});
// Hashing password by using Mongoose middleware, hashing is here, //  pre-routine for the save operation, will run before saving data to the database for any .save() call
UserSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10); // genSalt method - random bytes
  this.password = await bcrypt.hash(this.password, salt); // hash method - looking for password and salt that we will get hasged result
});

// // Schema Instance methods, Этот токен создается и хранится в локал storage browser
// UserSchema.methods.createJWT = function () {
//   // Access the document
//   return jwt.sign(
//     { userId: this._id, name: this.name },
//     process.env.JWT_SECRET,
//     {
//       expiresIn: process.env.JWT_LIFETIME,
//     }
//   );
// };

// Compare hashed password
UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};
module.exports = mongoose.model("User", UserSchema);