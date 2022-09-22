
const express = require("express");
const app = express();
const fs = require("fs");
const { parse } = require("csv-parse");
const axios = require("axios");
const Papa = require("papaparse");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/");
  },
  filename: function (req, file, cb) {
    cb(null, "save_" + file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());

let csvdata = [];

app.post("/getPrice", upload.single("productList"), (req, res) => {

  fs.createReadStream("./upload/save_product_list_info.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      csvdata.push(row);
    })
    .on("end", function () {
      console.log("finished");
    })
    .on("error", function (error) {
      console.log(error.message);
    });

  setTimeout(() => {
    Promise.all(
      csvdata.map(async (val) => {
        let productData = await axios.get(
          `https://api.storerestapi.com/products/${val[0]}`
        );
        return [val[0], productData.data.data.price];
      })
    ).then((res) => {
      res = [["product_code", "price"], ...res];
      var csv = Papa.unparse(res);
      fs.writeFileSync("./upload/save_product_list_info.csv", csv);
    });
  }, 1000);

  res.send("Connenction successful");
  
});

app.listen("20", () => {
  console.log("listening on port 20");
});
