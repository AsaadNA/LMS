const express = require("express");
const router = express.Router();

const adminSchema = require("../models/admins");

router.get("/login", (req, res) => {
  if (req.session.email !== undefined) {
    res.redirect("/");
  } else {
    res.render("login", {
      email: req.session.email,
    });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.put("/login/password", (req, res) => {
  const { email, newPassword } = req.body;
  const result = adminSchema.findOneAndUpdate(
    { email },
    { password: newPassword },
    (err, data) => {
      if (err) {
        res.status(400).send("Unexpected error occured");
      } else if (data) {
        res.status(200).send("Password has been changed");
      } else {
        res.status(400).send("Could not find user with the email");
      }
    }
  );
});

router.post("/register", (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const result = adminSchema.findOne({ email }, (err, data) => {
    if (err) {
      res.status(400).send("Unexpected Error Occured");
    } else if (data === null || data.length === 0) {
      const newAdmin = new adminSchema({
        firstName,
        lastName,
        email,
        password,
      }).save((err, data) => {
        if (data) {
          res.status(200).send("New Administration registered");
        } else if (err) {
          res.status(400).send("Unexpected Error Occured");
        } else {
          res.status(400).send("Unexpected Error Occured");
        }
      });
    } else {
      res.status(400).send("Administration with email already registered");
    }
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const result = adminSchema.findOne({ email }, (err, user) => {
    if (!err) {
      if (user) {
        if (user.password === password) {
          req.session.email = email;
          req.session.firstName = user.firstName;
          req.session.lastName = user.lastName;
          res.status(200).send({
            message: "Loggedin",
          });
        } else {
          res.status(400).send({
            error: "Invalid Password",
          });
        }
      } else {
        res.status(400).send({
          error: "Invalid Email Address",
        });
      }
    } else {
      res.status(400).send({
        error:
          "Error: Connection interrupted or server not connected to database",
      });
    }
  });
});

module.exports = router;
