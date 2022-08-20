const express = require("express");
const router = express.Router();

const booksSchema = require("../models/books");

const nodemailer = require("nodemailer");

router.post("/editbooks/return/", (req, res) => {
  const { isbn, employeeCode } = req.body;
  const result = booksSchema.findOneAndUpdate(
    {
      isbn,
      "issueHistory.toEmployeeCode": employeeCode,
      "issueHistory.returnDate": null,
    },
    {
      $set: {
        "issueHistory.$[el].returnDate": new Date(),
        "issueHistory.$[el].hasDefaulted": false,
      },
    },
    {
      arrayFilters: [
        { "el.toEmployeeCode": employeeCode, "el.returnDate": null },
      ],
    },
    (err, data) => {
      if (err) {
        res.status(400).send("Unexpected Error Occured");
      } else if (data === null) {
        res.status(400).send("Book is not issued to the user");
      } else if (data) {
        res.status(200).send({
          data,
        });
      }
    }
  );
});

router.post("/editbooks/issue", (req, res) => {
  const { isbn, fullName, email, employeeCode } = req.body;

  //Check if user is defaulted in any books
  const defaultSearch = booksSchema.find(
    {
      "issueHistory.toEmployeeCode": employeeCode,
      "issueHistory.hasDefaulted": true,
    },
    (err, data) => {
      if (data.length === 0) {
        //Check if book already issued or not
        const result = booksSchema.findOne(
          {
            isbn,
            "issueHistory.toEmployeeCode": employeeCode,
            "issueHistory.returnDate": null,
          },
          (err, data) => {
            if (err) {
              res.status(400).send("Unexpected Error Occurred");
            } else if (data === null) {
              //if not issued
              let result = booksSchema.findOneAndUpdate(
                { isbn },
                {
                  $push: {
                    issueHistory: {
                      byName:
                        req.session.firstName + " " + req.session.lastName,
                      byEmail: req.session.email,
                      toName: fullName,
                      toEmail: email,
                      toEmployeeCode: employeeCode,
                      issueDate: new Date(),
                      returnDate: null,
                    },
                  },
                },
                (err, data) => {
                  if (err) {
                    res.status(400).send("Some error occured issuing book");
                  } else if (data) {
                    var date = new Date(); // Now
                    date.setDate(date.getDate() + 30);
                    let transporter = nodemailer.createTransport({
                      service: "gmail",
                      auth: {
                        user: process.env.SYSTEM_EMAIL,
                        pass: process.env.SYSTEM_PASSWORD,
                      },
                      tls: {
                        rejectUnauthorized: false,
                      },
                    });
                    let mailOptions = {
                      from: "process.env.SYSTEM_EMAIL",
                      to: email,
                      subject: "NEW BOOK ISSUED : " + data["title"],
                      text: "Kindly return book before 30 days i.e " + date,
                    };

                    transporter.sendMail(mailOptions, (err, info) => {}); //sending the mail

                    res.status(200).send({
                      message: "Book Issued",
                    });
                  } else {
                    res.status(400).send("Could not find book");
                  }
                }
              );
            } else if (data) {
              res
                .status(400)
                .send("Book already Has been issued to this employee code");
            }
          }
        );
      } else {
        res.status(400).send("Sorry, this user is defaulted");
      }
    }
  );
});

router.post("/editbooks", (req, res) => {
  const { title, isbn, stock, author, category } = req.body;
  const newBook = new booksSchema({
    title,
    category,
    isbn,
    stock,
    author,
  });

  const result = newBook.save((err, data) => {
    if (err) {
      res.status(400).send("Error occured while inserting book");
    } else if (data) {
      res.status(200).send({
        message: "new book added to the database",
      });
    } else {
      res.status(400).send("Unexpected Error Occurred");
    }
  });
});

router.delete("/editbooks", (req, res) => {
  const { isbn } = req.body;
  const result = booksSchema.findOneAndDelete({ isbn }, (err, data) => {
    if (err) {
      res.status(400).send("Could not find book with the ISBN");
    } else if (data) {
      res.status(200).send("Successfully deleted the book");
    } else {
      res.status(400).send("Unexpected Error Occured");
    }
  });
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
        res.status(400).send("Unexpected Error Occured");
      } else if (data) {
        res.status(200).send({
          message: "Updated Data",
        });
      } else {
        res.status(400).send("Could not find book");
      }
    }
  );
});

router.get("/view/:isbn/:title", (req, res) => {
  const { isbn, title } = req.params;
  if (req.session.email !== undefined) {
    const result = booksSchema.findOne({ isbn }, (err, data) => {
      if (err) {
        res.render("issuehistory", {
          email: req.session.email,
          fullName: req.session.firstName + " " + req.session.lastName,
          error: "Some Error Occured",
        });
      } else if (data) {
        res.render("issuehistory", {
          isbn,
          title,
          data: data["issueHistory"],
          email: req.session.email,
          fullName: req.session.firstName + " " + req.session.lastName,
        });
      } else {
        res.render("issuehistory", {
          email: req.session.email,
          fullName: req.session.firstName + " " + req.session.lastName,
          error: "Could not find book to corresponded ISBN",
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
