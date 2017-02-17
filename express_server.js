var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieparser = require('cookie-parser');
app.use(cookieparser());

function generateRandomString() {
    var text = "";
    var charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 6; i++){
        text += charList.charAt(Math.floor(Math.random() * charList.length));
    }
    return text;
}

var urlDatabase = {
  "abcdef": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Do I need this?
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    username: req.cookies.username
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    url: urlDatabase[req.params.id],
    username: req.cookies.username
  };
  res.render("urls_show", templateVars);
});

// Lists all URLs
app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    username: req.cookies.username
   };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  var randKey = generateRandomString();
  urlDatabase[randKey] = req.body.longURL;
  res.redirect(`/urls/${randKey}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].full;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  var alias = req.params.id;
  urlDatabase[alias] = req.body.newLink;
  res.redirect("urls_index");
});

app.post("/login", (req, res) => {
  var username = req.body.username;
  res.cookie('username', username);
  res.redirect('/');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});