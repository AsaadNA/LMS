/*
    Restrictions: 
        1. More than one book cannot be issued to the person
*/

const mongoose = require("mongoose");
const booksSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  isbn: {
    type: String,
    required: true,
    unique: false,
  },
  author: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  issueHistory: [
    {
      byName: { type: String },
      byEmail: { type: String },
      toName: { type: String },
      toEmail: { type: String },
      toEmployeeCode: { type: String },
      toExtension: { type: String },
      issueDate: { type: Date },
      returnDate: { type: Date },
      hasDefaulted: { type: Boolean },
    },
  ],
});

module.exports = mongoose.model("books", booksSchema);
