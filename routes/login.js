const express = require("express");
const router = express.Router();

const nodemailer = require("nodemailer");
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

var generator = require("generate-password");

router.post("/login/forgotpassword/", (req, res) => {
  let { email } = req.body;
  const result = adminSchema.findOne({ email }, (err, data) => {
    if (err) {
      res.status(400).send("Unexpected Error Occured");
    } else if (data) {
      const newPassword = generator.generate({ length: 10, numbers: true });
      const searchResult = adminSchema.findOneAndUpdate(
        { email },
        { password: newPassword },
        (err, data) => {
          if (err) {
            res.status(400).send("Unexpected Error Occurred");
          } else if (data) {
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
              subject: "Newly Generated Password",
              text: "Password: " + newPassword,
            };

            //sending the mail
            transporter.sendMail(mailOptions, (err, info) => {
              if (info) {
                res.status(200).send("Email sent to " + email);
              } else if (err) {
                res.status(400).send("Try Again");
              }
            });
          } else {
            res.status(400).send("Could not find this email in DB to update");
          }
        }
      );
    } else {
      res.status(400).send("Could not find this email in DB");
    }
  });
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
