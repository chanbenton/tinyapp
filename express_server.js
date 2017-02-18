var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieparser = require('cookie-parser');
app.use(cookieparser());

const bcrypt = require('bcrypt');

function generateRandomString() {
    var text = "";
    var charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < 6; i++){
        text += charList.charAt(Math.floor(Math.random() * charList.length));
    }
    return text;
}

var urlDatabase = {
  "abcdef": {url: "http://www.lighthouselabs.ca", userID: "ababab"},
  "9sm5xK": {url: "http://www.google.com", userID: "ababab"}
};

const users = { 
  "ababab": {
    id: "ababab", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}

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
  if (req.cookies.user_Id){
    let templateVars = { 
      username: users[req.cookies.user_Id].email
    };
    res.render("urls_new", templateVars);  
  }
  else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { 
    shortURL: req.params.id,
    url: urlDatabase[req.params.id].url,
    username: users[req.cookies.user_Id].email
  };
  res.render("urls_show", templateVars);
});

// Lists all URLs
app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    username: users[req.cookies.user_Id].email,
    user: users[req.cookies.user_Id].id
   };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.cookies.user_Id){
  var randKey = generateRandomString();
  urlDatabase[randKey] = {};
  urlDatabase[randKey].url = req.body.longURL;
  urlDatabase[randKey].userID = users[req.cookies.user_Id].id;
  res.redirect(`/urls/${randKey}`);
  }
  else {
    res.sendStatus(403);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  var alias = req.params.id;
  if (req.cookies.user_Id === urlDatabase[alias].userID){
    delete urlDatabase[alias];
    res.redirect('/urls');
  }
  else {
    res.sendStatus(403);
  }
});

app.post("/urls/:id", (req, res) => {
  var alias = req.params.id;
  if (req.cookies.user_Id === urlDatabase[alias].userID){
    urlDatabase[alias].url = req.body.newLink;
    res.redirect("urls_index");
  }
  else {
    res.sendStatus(403);
  }
});

app.post("/login", (req, res) => {
  var emailInput = req.body.email;
  var pwInput = req.body.password;

  if (!(emailInput && pwInput)){
    res.status(400).send('Please complete input on all fields as required.');
    return;
  }
  for (id in users){
    if (users[id].email === emailInput){
      if (bcrypt.compareSync(pwInput, users[id].password)){
        res.cookie('user_Id', id);
        res.redirect("/");
        return;
      }
      else{
        res.sendStatus(403);      
        return;
      }
    }
  };
  res.sendStatus(403);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_Id');
  res.redirect('/');
});

app.get("/register", (req, res) => {
  res.render("urls_register.ejs"); //, templateVars
});

app.post("/register", (req, res) => { 
  
  var emailInput = req.body.email;
  var pwInput = req.body.password;

  if (!(emailInput && pwInput)){
    res.status(400).send('Please complete input on all fields as required.');
    return;
  }

  // cycle through each object, if email equals, then 400 and return duplicate response.
  for (each in users){
    if (users[each].email === emailInput){
      res.status(400).send('Email already exists.');
      return;
    }
  }
  var randKey = generateRandomString();
  users[randKey] = {
    id: randKey,
    email: emailInput,
    password: bcrypt.hashSync(pwInput, 10)
  };    
  res.cookie('user_Id', randKey);
  res.redirect("/");