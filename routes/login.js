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
        error: "Unexpexted Error Occured",
      });
    }
  });
});

module.exports = router;
