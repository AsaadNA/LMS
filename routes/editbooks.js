const express = require("express");
const router = express.Router();

const booksSchema = require("../models/books");

router.post("/editbooks/issue", (req, res) => {
  const { isbn, fullName, email } = req.body;
  let result = booksSchema.findOneAndUpdate(
    { isbn },
    {
      $push: {
        issueHistory: {
          byName: req.session.firstName + " " + req.session.lastName,
          byEmail: req.session.email,
          toName: fullName,
          toEmail: email,
          issueDate: new Date(),
          returnDate: null,
        },
      },
    },
    (err, data) => {
      if (err) {
        res.status(400).send({
          error: "Some error occured while issuing book",
        });
      } else if (data) {
        res.status(200).send({
          message: "Book Issued",
        });
      } else {
        res.status(400).send({
          error: "Could not find book",
        });
      }
    }
  );
});

router.put("/editbooks", (req, res) => {
  const { title, isbn, stock, oldisbn, author, category } = req.body;
  const result = booksSchema.findOneAndUpdate(
    { isbn: oldisbn },
    {
      title,
      isbn,
      stock,
      author,
      category,
    },
    (err, data) => {
      if (err) {
        res.status(400).send({
          error: "Some error occured",
        });
      } else if (data) {
        res.status(200).send({
          message: "Updated Data",
        });
      } else {
        res.status(400).send({
          error: "Could not find data",
        });
      }
    }
  );
});

router.get("/editbooks", async (req, res) => {
  if (req.session.email !== undefined) {
    const result = await booksSchema.find({});
    if (result.length > 0) {
      //Returns Available stock using whether returnDate is null or not
      let availableStock = [];
      const resMap = result.map((book) => {
        let filteredArr = book.issueHistory.filter((h) => {
          return h.returnDate === null;
        });
        availableStock.push(book.stock - filteredArr.length);
      });

      res.render("editbooks", {
        data: result,
        availableStock,
        email: req.session.email,
        fullName: req.session.firstName + " " + req.session.lastName,
      });
    } else {
      res.render("home", {
        error: "Some error occured while displaying books",
        email: req.session.email,
        fullName: req.session.firstName + " " + req.session.lastName,
      });
    }
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
