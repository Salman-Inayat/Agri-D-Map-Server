var express = require("express");
var router = express.Router();
const path = require("path");
const multer = require("multer");
var fse = require("fs-extra");
const User = require("../models/user.modal.js");

const makeid = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

var base64ToImage = (req, res, next) => {
  const image_name = `${makeid(10)}.jpg`;

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

  req.body.image_name = image_name;
  next();
};

router.get("/", (req, res) => {
  res.send("Hello again");
});

router.post("/image-segment", base64ToImage, (req, res, next) => {
  // const image = req.body.image;
  // const image_name = req.body.image_name;

  const { image, image_name, model } = req.body;

  let pythonFileToRun = "";

  switch (model) {
    case "resnet18":
      pythonFileToRun = "inference_resnet18.py";
      break;
    case "alexnet":
      pythonFileToRun = "inference_alexnet.py";
      break;
    case "resnet50":
      pythonFileToRun = "inference_resnet50.py";
      break;

    default:
      pythonFileToRun = "inference_resnet18.py";
  }

  if (!image) {
    return res.status(400).send({ message: "Please upload an image." });
  }

  const { spawn } = require("child_process");

  const segmentation = spawn("python", ["segment.py"]);

  segmentation.on("close", (code) => {
    const classification = spawn("python", [pythonFileToRun]);

    classification.stdout.on("data", (data) => {
      res.send(`${image_name} ${data.toString()}`);
      console.log(`Retrieving the data from inference.py: ${data.toString()}`);
    });

    classification.on("close", (code) => {
      console.log("Executed");

      const images_folder = process.cwd() + "/u2net/images";
      const results_folder = process.cwd() + "/u2net/results";
      const output_folder = process.cwd() + "/output";

      fse.emptyDir(images_folder, (err) => {
        if (err) return console.error(err);
      });

      fse.emptyDir(results_folder, (err) => {
        if (err) return console.error(err);
      });

      fse.readdir(output_folder, (err, files) => {
        if (err) {
          console.log(err);
        }

        files.forEach((f) => {
          const fileDir = path.join(output_folder, f);
          const image_file = image_name.slice(0, -3) + "png";

          if (f !== image_file) {
            fse.unlinkSync(fileDir);
          }
        });
      });
    });
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email, password: password });

    if (!user) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong" });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const user = await User.findOne({ email: email });

  if (user) {
    return res.status(400).send({ message: "User already exists" });
  }

  const newUser = await new User({
    name: name,
    email: email,
    password: password,
  });

  newUser.save((err) => {
    if (err) {
      console.log(err);
      return res.status(400).send({ message: "Something went wrong" });
    }

    return res.send(newUser);
  });
});

module.exports = router;
