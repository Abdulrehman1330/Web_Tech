var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var app = express();
const Product = require("./models/Product");
var bodyParser = require("body-parser");
const multer = require("multer");

app.use(bodyParser.json());
// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
var config = require("config");
app.use(
  session({
    secret: config.get("sessionSecret"),
    cookie: { maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
  })
);
// const { startCronJobs } = require("./croneJobs/index");
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.get("/Burgers/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.render("Burgers/products/list.ejs", { products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/", (req, res) => {
  res.render("Burgers/homepage")
})
app.get("/contact", (req, res) => {
  res.render("Burgers/contact.ejs");
});

app.get("/about", (req, res) => {
  res.render("Burgers/about.ejs");
});

app.get("/menu", (req, res) => {
  res.render("Burgers/menu.ejs");
});

app.get("/buy-now", async (req, res) => {
    try {
    const products = await Product.find();
    res.render("Burgers/shop", { products: products });
    } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching products.");
    }
    });
    
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/uploaded");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.get("/Burgers/products/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    res.render("Burgers/products/edit", { product });
  } catch (err) {
    console.error("Error fetching product for edit:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/products/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, type, description } = req.body;
    const updateData = { name, price, type, description };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/Burgers/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Failed to update product");
  }
});
app.get("/Burgers/products/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/Burgers/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Failed to delete product");
  }
});

app.get("/Burgers/products/create", (req, res) => {
  res.render("Burgers/products/create");
});

app.post("/Burgers/products/create", upload.single("image"), async (req, res) => {
  try {
    const { name, price, type, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const newProduct = new Product({
      name,
      price,
      type,
      description,
      image,
    });

    await newProduct.save();
    res.redirect("/Burgers/products");
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).send("Failed to create product");
  }
});

app.use("/api/public/products", require("./routes/api/public/products"));
app.use("/api/products", require("./routes/api/public/products"));
app.get("/admin", async (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "build", "index.html"));
});
app.get("/admin/*", async (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "build", "index.html"));
});
app.use(express.static(path.join(__dirname, "admin", "build")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
// startCronJobs();
module.exports = app;
