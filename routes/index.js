var express = require("express");
var router = express.Router();
const path = require("path");
const multer = require("multer");
var fse = require("fs-extra");
const User = require("../models/user.modal.js");

const image_name = "image.jpg";

var base64ToImage = (req, res, next) => {
  var base64Data = req.body.image;
  require("fs").writeFile(
    // for windows development
    process.cwd() + `\\u2net\\images\\${image_name}`,

    // for linux development and final deployment
    // `u2net/images/${image_name}`,

    base64Data,
    "base64",
    function (err) {
      console.log(err);
    }
  );
  next();
};

router.get("/", (req, res) => {
  res.send("Hello again");
});

router.post("/image-segment", base64ToImage, (req, res, next) => {
  const image = req.body.image;

  if (!image) {
    return res.status(400).send({ message: "Please upload an image." });
  }

  const { spawn } = require("child_process");

  const segmentation = spawn("python", ["segment.py"]);

  segmentation.on("close", (code) => {
    // res.write(image_name.replace("jpg", "png"));
    console.log("File name sent");
    console.log(`child process close all stdio with code ${code}`);

    const classification = spawn("python", ["inference.py"]);

    classification.stdout.on("data", (data) => {
      res.send(`image.png ${data.toString()}`);
      console.log(`Retrieving the data from inference.py: ${data.toString()}`);
    });

    classification.on("close", (code) => {
      console.log("Executed");

      const images_folder = process.cwd() + "/u2net/images";
      const results_folder = process.cwd() + "/u2net/results";
      // const output_folder = process.cwd() + "/output";

      fse.emptyDir(images_folder, (err) => {
        if (err) return console.error(err);
      });

      fse.emptyDir(results_folder, (err) => {
        if (err) return console.error(err);
      });

      // fse.emptyDir(output_folder, (err) => {
      //   if (err) return console.error(err);
      // });

      // fse.readdir(output_folder, (err, files) => {
      //   if (err) {
      //     console.log(err);
      //   }

      //   files.forEach((f) => {
      //     const fileDir = path.join(output_folder, f);
      //     const image_file = file.filename.slice(0, -3) + "png";

      //     if (f !== image_file) {
      //       fse.unlinkSync(fileDir);
      //     }
      //   });
      //   console.log("Output folder cleaned");
      // });
    });
  });
});

router.post("/login", (req, res) => {
  console.log("req.body: ", req.body);

  const { email, password } = req.body;
  // find the user by email in user table

  User.findOne({ email: email }, (err, user) => {
    if (user) {
      if (password === user.password) {
        res.send({ message: "login sucess", user: user });
      } else {
        res.send({ message: "wrong credentials" });
      }
    } else {
      res.send("not register");
    }
  });
});

router.post("/register", (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  User.findOne({ email: email }, (err, user) => {
    if (user) {
      res.send({ message: "user already exist" });
    } else {
      const user = new User({ name, email, password });
      user.save((err) => {
        if (err) {
          res.send(err);
        } else {
          res.send({ message: "sucessfull" });
        }
      });
    }
  });
});

module.exports = router;
