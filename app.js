const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
var cors = require("cors");
const schedule = require("node-schedule");

const loginRoutes = require("./routes/login");
const editbooksRoutes = require("./routes/editbooks");

const booksSchema = require("./models/books");

dotenv.config();

const app = express();

app.set("view engine", "vash");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const cronJob29 = () => {
  const result = booksSchema.find(
    { "issueHistory.returnDate": null },
    (err, data) => {
      if (data) {
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

        data.map((b) => {
          b.issueHistory.map((user) => {
            if (user.returnDate === null) {
              const current = new Date();
              const daysDIFF = Math.round(
                (current - user.issueDate) / (1000 * 60 * 60 * 24)
              );
              if (daysDIFF === 29) {
                //Sending warning mail here
                let mailOptions = {
                  from: "process.env.SYSTEM_EMAIL",
                  to: user.toEmail,
                  subject: "WARNING : Kindly return book '" + b.title + "'",
                  text: "Return book by tomorrow or be defaulted in our system",
                };
                //sending the mail
                transporter.sendMail(mailOptions, (err, info) => {
                  if (info) {
                    console.log(
                      "Warning mail sent to " + user.toEmail + " | " + b.title
                    );
                  } else if (err) {
                    console.log("Error sending mail");
                  }
                });
              }
            }
          });
        });
      }
    }
  );
};

const cronJob30 = () => {
  const bookResult = booksSchema.find({}, (err, bookResult) => {
    if (err) {
      console.log("Book Result: ", err.message);
    } else if (bookResult) {
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
      const bookMap = bookResult.map((b) => {
        const issueMap = b.issueHistory.map((i) => {
          if (
            (i.returnDate === null || i.returnDate === undefined) &&
            (i.hasDefaulted === false ||
              i.hasDefaulted === null ||
              i.hasDefaulted === undefined)
          ) {
            const dayDiff = Math.round(
              (new Date() - i.issueDate) / (1000 * 60 * 60 * 24)
            );

            if (dayDiff > 30) {
              const book = booksSchema.updateMany(
                {
                  isbn: b.isbn,
                  "issueHistory.toEmployeeCode": i.toEmployeeCode,
                },
                {
                  $set: {
                    "issueHistory.$[el].hasDefaulted": true,
                  },
                },
                {
                  arrayFilters: [{ "el.toEmployeeCode": i.toEmployeeCode }],
                },
                (err, data) => {
                  if (err) {
                    console.log("Update Error: " + err.message);
                  } else {
                    console.log(
                      "Defaulter Set:  " + i.toEmployeeCode + " | " + b.title
                    );

                    //Sending warning mail here
                    let mailOptions = {
                      from: "process.env.SYSTEM_EMAIL",
                      to: i.toEmail,
                      subject: "IMPORTANT : You Have Been Defaulted",
                      text:
                        "You have been defaulted for not returning '" +
                        b.title +
                        "'",
                    };
                    //sending the mail
                    transporter.sendMail(mailOptions, (err, info) => {
                      if (info) {
                        console.log(
                          "Defaulted mail sent to " +
                            i.toEmployeeCode +
                            " | " +
                            b.title
                        );
                      } else if (err) {
                        console.log("Error sending mail");
                      }
                    });
                  }
                }
              );
            }
          }
        });
      });
    }
  });
};

//Currently running every minute
const job29 = schedule.scheduleJob("0 8 * * *", function () {
  return cronJob29();
});

const job30 = schedule.scheduleJob("0 8 * * *", function () {
  return cronJob30();
});

app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "helloworld",
  })
);

app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/jquery/dist"))
);

app.use("/static", express.static(__dirname + "/public"));

app.use(loginRoutes);
app.use(editbooksRoutes);

app.get("/", async (req, res) => {
  const result = await booksSchema.find({}).lean();
  //Returns Available stock using whether returnDate is null or not
  let availableStock = [];
  const resMap = result.map((book) => {
    let filteredArr = book.issueHistory.filter((h) => {
      return h.returnDate === null;
    });
    availableStock.push(book.stock - filteredArr.length);
  });
  if (req.session.email !== undefined) {
    res.render("editbooks", {
      data: result,
      availableStock,
      email: req.session.email,
      fullName: req.session.firstName + " " + req.session.lastName,
    });
  } else {
    res.render("viewbooks", {
      data: result,
      availableStock,
    });
  }
});

app.get("*", (req, res) => {
  res.render("404", {
    email: req.session.email,
    fullName: req.session.firstName + " " + req.session.lastName,
  });
});

app.listen(process.env.API_PORT, (err) => {
  if (err) {
    console.error("Error occured while connecting to server", err);
  } else {
    console.log("Connected to LMS @ Port 4000 !");
    mongoose.connect(process.env.DB_CONNECTION_STRING, (dbError) => {
      if (dbError) {
        console.error("Error Occured while connecting to database");
      } else {
        console.log("Connected to LMS Database Successfully");
      }
    });
  }
});
