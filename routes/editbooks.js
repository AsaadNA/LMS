const express = require("express");
const router = express.Router();

const booksSchema = require("../models/books");

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
      res.render("editbooks", {
        data: result,
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
