// install node
// it will install node and npm
// https://nodejs.org/en/download
// test node and npm by running node -v and npm -v in terminal
// run npm init -y to create a package.json file
// install express by running npm install

// in development mode run nodemon server.js
// install nodemon globally by running npm install -g nodemon

const express = require("express");
const app = express();
const PORT = 3000;
const expressLayouts = require("express-ejs-layouts");

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");


//expose public folder to the browser
//now we can access files in public folder directly
//http://localhost:3000/contact-us.html
// if static files are in a folder named 'public', use the following line
app.use(express.static("public"));

// app.get("/contact-us.html", (req, res) => {
//   res.send("Contact Us Page");
// });

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/menu", (req, res) => {
  res.render("menu.ejs");
});

app.get("/", (req, res) => {
  res.render("homepage")
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});