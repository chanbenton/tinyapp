var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const bcrypt = require('bcrypt');

// A function that returns a random alphanumeric 6-char string.
function generateRandomString() {
  var text = "";
  var charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 6; i++){
    text += charList.charAt(Math.floor(Math.random() * charList.length));
  }
  return text;
}

// Functions that returns relevant error messages
function unauth(res){
  res.status(401).send('Unauthorized entry. Please <a href="/login">login</a> here.');
}
function forbidden(res){
  res.status(403).send('Forbidden. You do not have permission to perform this action.');
}
function notFound(res){
  res.status(404).send('404. Item not found.');
}

var urlDatabase = {
  "abcdef": {url: "http://www.lighthouselabs.ca", userID: "ababab"},
  "9sm5xK": {url: "http://www.google.com", userID: "ababab"}
};

const users = { 
  "ababab": {
    id: "ababab", 
    email: "user@example.com", 
    password: bcrypt.hashSync("a", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("b", 10)
  }
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Home directory; Directs to URLs index (logged in) or login page (not logged in)
app.get("/", (req, res) => {
  if (req.session.user_Id){
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

// Creates new tinyLink  
app.get("/urls/new", (req, res) => {
  if (!req.session.user_Id){
    unauth(res);
  } else {
    let templateVars = { 
      username: users[req.session.user_Id].email
    };
    res.render("urls_new", templateVars);  
  }
});

// Allows logged in user to read/update/delete personal tinyLink
app.get("/urls/:id", (req, res) => {
  var alias = req.params.id
  if (!(alias in urlDatabase)){
    notFound(res);
  } else if (!req.session.user_Id){
    unauth(res);
  } else if (req.session.user_Id !== urlDatabase[alias].userID){
    forbidden(res);
  } else {
      let templateVars = { 
        shortURL: req.params.id,
        url: urlDatabase[req.params.id].url,
        username: users[req.session.user_Id].email
      };
      res.render("urls_show", templateVars);
  }
});

// Lists all URLs under current user
app.get("/urls", (req, res) => {
  if (!req.session.user_Id){
    unauth(res);
    return;
  }
  else {
    let templateVars = { 
      urls: urlDatabase,
      username: users[req.session.user_Id].email,
      user: users[req.session.user_Id].id
    };
  res.render("urls_index", templateVars);  
  }
});

// Creates new tinyLink
app.post("/urls", (req, res) => {
  if (!req.session.user_Id){
    unauth(res);
  } else {
    var randKey = generateRandomString();
    urlDatabase[randKey] = {};
    urlDatabase[randKey].url = req.body.longURL;
    urlDatabase[randKey].userID = users[req.session.user_Id].id;
    res.redirect(`/urls/${randKey}`);  
  }
});

// Redirects tinyLink to full link
app.get("/u/:shortURL", (req, res) => {
  var alias = req.params.shortURL;
  if (!(alias in urlDatabase)){
    notFound(res);
  } else {
  let longURL = urlDatabase[alias].url;
  res.redirect(longURL);
  }
});

// Deletes user's own tinyLink
app.post("/urls/:id/delete", (req, res) => {
  var alias = req.params.id;
  if (req.session.user_Id === urlDatabase[alias].userID){
    delete urlDatabase[alias];
    res.redirect('/urls');
  } else {
    forbidden(res);
  }
});

// Updates user's own tinyLink
app.post("/urls/:id", (req, res) => {
  var alias = req.params.id;
  if (!(alias in urlDatabase)){
    notFound(res);
  } else if (!req.session.user_Id){
    unauth(res);
  } else if (req.session.user_Id !== urlDatabase[alias].userID){
    forbidden(res);
  } else {
      urlDatabase[alias].url = req.body.newLink;
      res.redirect("/urls");
  }
});

// Login verification
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
        req.session.user_Id = id;
        res.redirect("/");
        return;
      }
      else {
        unauth(res);
        return;
      }
    }
  };
  unauth(res);
});

// Accesses login page
app.get("/login", (req, res) => {
  if (req.session.user_Id){
    res.redirect('/');
  } else{
      res.render("login");
  }
});

// Logs out current user
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

// Registration page
app.get("/register", (req, res) => {
  res.render("urls_register"); 
});

// Creating new user
app.post("/register", (req, res) => { 
  var emailInput = req.body.email;
  var pwInput = req.body.password;

  // Notifies user of missing input in text fields
  if (!(emailInput && pwInput)){
    res.status(400).send('Please complete input on all fields as required.');
    return;
  }

  // Verifies that email is not already taken
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
  
  req.session.user_Id = randKey;
  res.redirect("/");

});
