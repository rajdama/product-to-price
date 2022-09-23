
// ALL IMPORT FILES
const express = require("express");
const app = express();
const fs = require("fs");
const { parse } = require("csv-parse");
const axios = require("axios");
const Papa = require("papaparse");
const multer = require("multer");

// DEFINING MIDDLEWARE FOR PARSING INCOMING REQUEST.
app.use(express.json());

// DEFINING PATH FOR STORING UPOADED FILE TEMPORARILY
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, "save_" + file.originalname);
  },
});

// GLOBAL VARIABLE ASSIGNMENTS
const uploadDirectory = "./upload";
const upload = multer({ storage });
let productDetails = [];

// ENDPOINT
app.post("/getPrice", upload.single("productList"), (req, res) => {

  // GETTING NAME OF UPLOADED FILE
  let fileName = fs.readdirSync(uploadDirectory);

  // READING AND STORING DATA FROM UPLOADED CSV FILE
  fs.createReadStream(`${uploadDirectory}/${fileName}`)
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      productDetails.push(row);
    })
    .on("end", function () {
      console.log("finished");
    })
    .on("error", function (error) {
      console.log(error.message);
    });

  // WAITING FOR SOMETIME AS fs.createReadStream IS ASYNCHRONOUS
  setTimeout(() => {

    // PERFORMING API REQUEST FOR ALL PRODUCTS
    Promise.all(

      // MAPPING THROUGH EACH PRODUCT
      productDetails.map(async (val) => {
        let productData = await axios.get(
          `https://api.storerestapi.com/products/${val[0]}`
        );
        return [val[0], productData.data.data.price];
       })
      )
      .then((products) => {
       
      // STORING product_code AND price RECIEVED FROM API REQUESTS
      products = [["product_code", "price"], ...products];

      // CONVERTING JSON DATA TO CSV DATA
      var csv = Papa.unparse(products);

      // SENDING UPDATED CSV DATA IN RESPONSE
      res.send(csv);

      // SETTING productDetails TO EMPTY ARRAY SO IT COULD STORE DATA FROM NEXT REQUEST 
      productDetails = []

      // DELETING UPLOADED FILE FROM UPLOADS DIRECTORY
      fs.unlinkSync(`${uploadDirectory}/${fileName}`, function (err) {
        if (err) return console.log(err);
        console.log("file deleted successfully");
      });
      
    });

  }, 1000);
});

// STARTING THE SERVER
app.listen("20", () => {
  console.log("listening on port 20");
});
