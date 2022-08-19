const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

const loginRoutes = require("./routes/login");
const editbooksRoutes = require("./routes/editbooks");

const booksSchema = require("./models/books");

const app = express();

dotenv.config();

app.set("view engine", "vash");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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

app.use(express.static(path.join(__dirname, "public")));

app.use(loginRoutes);
app.use(editbooksRoutes);

app.get("/", async (req, res) => {
  const result = await booksSchema.find({});
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
