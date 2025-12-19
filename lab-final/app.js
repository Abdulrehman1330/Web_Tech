var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var app = express();
const Order = require("./models/Order");
const Product = require("./models/Product");
var bodyParser = require("body-parser");
const multer = require("multer");

app.use(bodyParser.json());
// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
const adminOnly = require("./middlewares/adminOnly");
const checkCartNotEmpty = require("./middlewares/checkCartNotEmpty");
var config = require("config");
app.use(
  session({
    secret: config.get("sessionSecret"),
    cookie: { maxAge: 3600000 },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});
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


app.get("/Burgers/products", adminOnly, async (req, res) => {
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
app.get("/cart", (req, res) => {
  let cart = req.session.cart ? req.session.cart : [];
  res.render("Burgers/cart", { cart });
});

app.post("/cart/add", async (req, res) => {
  const productId = req.body.productId;
  let cart = req.session.cart ? req.session.cart : [];

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const productIndex = cart.findIndex((item) => item._id.toString() === productId);

    if (productIndex > -1) {
      cart[productIndex].quantity += 1;
    } else {
      cart.push({ ...product.toObject(), quantity: 1, price: parseFloat(product.price) });
    }

    req.session.cart = cart;
    res.redirect("/buy-now");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.get("/cart/remove/:id", (req, res) => {
  const productId = req.params.id;
  let cart = req.session.cart ? req.session.cart : [];

  const productIndex = cart.findIndex((item) => item._id.toString() === productId);

  if (productIndex > -1) {
    cart.splice(productIndex, 1);
  }

  req.session.cart = cart;
  res.redirect("/cart");
});

app.post("/cart/update", (req, res) => {
  const { productId, quantity } = req.body;
  let cart = req.session.cart ? req.session.cart : [];

  const productIndex = cart.findIndex((item) => item._id.toString() === productId);

  if (productIndex > -1) {
    cart[productIndex].quantity = parseInt(quantity, 10);
  }

  req.session.cart = cart;
  res.redirect("/cart");
});

app.get("/checkout", checkCartNotEmpty, (req, res) => {
  let cart = req.session.cart ? req.session.cart : [];
  res.render("Burgers/checkout", { cart });
});

// This route handles the submission of a new order.
// It first checks if the cart is empty and if the customer name and email are provided.
// It then recalculates the total price of the order on the server-side to prevent tampering.
// Finally, it creates a new order, saves it to the database, clears the cart from the session,
// and renders the order confirmation page.
app.post("/order", async (req, res) => {
  let cart = req.session.cart ? req.session.cart : [];
  if (cart.length === 0) {
    return res.redirect("/cart");
  }

  const { customerName, email } = req.body;

  if (!customerName || !email) {
    return res.render("Burgers/checkout", {
      cart,
      error: "Name and email are required.",
    });
  }

  let total = 0;
  const items = [];
  for (const cartItem of cart) {
    const product = await Product.findById(cartItem._id);
    if (product) {
      total += product.price * cartItem.quantity;
      items.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price,
      });
    }
  }


  const order = new Order({
    customerName,
    email,
    items,
    total,
  });

  try {
    const savedOrder = await order.save();
    req.session.cart = [];
    res.render("Burgers/order-confirmation", { order: savedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while placing the order.");
  }
});


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

app.get("/Burgers/products/edit/:id", adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    res.render("Burgers/products/edit", { product });
  } catch (err) {
    console.error("Error fetching product for edit:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/products/edit/:id", adminOnly, upload.single("image"), async (req, res) => {
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
app.get("/Burgers/products/delete/:id", adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect("/Burgers/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Failed to delete product");
  }
});

app.get("/Burgers/products/create", adminOnly, (req, res) => {
  res.render("Burgers/products/create");
});

app.post("/Burgers/products/create", adminOnly, upload.single("image"), async (req, res) => {
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

app.get("/login", (req, res) => {
  res.render("Burgers/login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@shop.com" && password === "password") {
    req.session.email = email;
    res.redirect("/Burgers/products");
  } else {
    res.redirect("/login");
  }
});

app.use("/api/public/products", require("./routes/api/public/products"));
app.use("/api/products", require("./routes/api/public/products"));
app.get("/admin/orders", adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render("Burgers/admin/orders", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching orders.");
  }
});

app.get("/admin/orders/confirm/:id", adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: "Confirmed" });
    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while confirming the order.");
  }
});

app.get("/admin/orders/cancel/:id", adminOnly, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while cancelling the order.");
  }
});

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
