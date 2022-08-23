const express = require("express");
const router = express.Router();

const booksSchema = require("../models/books");

const nodemailer = require("nodemailer");
const { off } = require("../models/admins");

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
        res.status(400).send("Unexpected error occured");
      } else if (data) {
        //If multiple entries of the same user check whether they have returned them or not
        //Since mongoose does not provide us with returing only updated items we need to filter out our
        //own after updating...
        const wasIssued = data.issueHistory.some((i) => {
          if (i.toEmployeeCode === employeeCode) {
            if (i.returnDate === null || i.returnDate === undefined) {
              return true;
            }
          }
        });

        if (!wasIssued) {
          res.status(400).send("Book is not issued to the user");
        } else {
          res.status(200).send("Book returned");
        }
      } else if (!data) {
        res.status(400).send("Book is not issued to the user");
      }
    }
  );
});

router.post("/editbooks/issue", (req, res) => {
  const { isbn, fullName, email, employeeCode } = req.body;

  //returns all the books the employeeCode given is "IN"
  const defaultSearch = booksSchema.find(
    {
      "issueHistory.toEmployeeCode": employeeCode,
    },
    (err, data) => {
      //Check if user has defaulted
      let isDefaulted = data.some((b) => {
        let defaulted = b.issueHistory.some((h) => {
          if (h.toEmployeeCode === employeeCode) {
            if (h.hasDefaulted === true) {
              return true;
            }
          }
        });

        if (defaulted) return true;
      });

      //Check if user has already been issued the book
      let hasBeenIssued = data.some((b) => {
        let issued = b.issueHistory.some((h) => {
          if (b.isbn === isbn) {
            if (h.toEmployeeCode === employeeCode) {
              if (
                h.issueDate !== null &&
                (h.returnDate === null || h.returnDate === undefined)
              ) {
                return true;
              }
            }
          }
        });

        if (issued) return true;
      });

      //Check if user has already been issued more than 3 books
      let issueCounter = 0;
      let mapIssueLimit = data.some((b) => {
        let issued = b.issueHistory.some((h) => {
          if (h.toEmployeeCode === employeeCode) {
            if (
              h.issueDate !== null &&
              (h.returnDate === null || h.returnDate === undefined)
            ) {
              issueCounter += 1;
            }
          }
        });
      });

      if (!isDefaulted) {
        if (!hasBeenIssued) {
          if (issueCounter < 3) {
            let issueResult = booksSchema.findOneAndUpdate(
              { isbn },
              {
                $push: {
                  issueHistory: {
                    byName: req.session.firstName + " " + req.session.lastName,
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
                  res.status(400).send("Unexpected error issuing book");
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

                  res.status(200).send("Book Issued");
                } else {
                  res.status(400).send("Could not find book");
                }
              }
            );
          } else {
            res.status(400).send("Cannot issue more than 3 books");
          }
        } else {
          res
            .status(400)
            .send("Sorry, this user has already been issued this book");
        }
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
