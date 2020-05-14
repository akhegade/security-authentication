//jshint esversion:6
require("dotenv").config()
const express = require("express");
const ejs =require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption")
// const md5 = require("md5");

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require("express-session");
const passport = require("passport");
const passportLoalMongoose = require("passport-local-mongoose");

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

var findOrCreate = require('mongoose-findorcreate')



const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
  secret:"our little secret.",
  resave:false,
  saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false});
mongoose.set('useCreateIndex', true);

const userSchema =new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  facebookId:String,
  secret:String
})

userSchema.plugin(passportLoalMongoose);
userSchema.plugin(findOrCreate);

// console.log(process.env.SECRET);
// userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);
// const Account = new mongoose.model("Account",{name:String})
//
// const pro = new Account({name:"anil"})
// pro.save();


passport.use(User.createStrategy());
//provided by passport-local-mongoose package
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// provided by the passport package
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets/"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("facebook: ",profile);

    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/",(req,res)=>{
  res.render("home")
})

app.get("/auth/google",
passport.authenticate("google", { scope: ["profile"] })
);



app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });


  app.get("/auth/facebook",
  passport.authenticate("facebook")
  );

  app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect secrets.
      res.redirect("/secrets");
    });


app.get("/login",(req,res)=>{
  res.render("login")
})

app.post("/login",(req,res)=>{
  const username =req.body.username
  const password =req.body.password;

  const user = new User({
    username:req.body.username,
    password:req.body.password
  })
 req.login(user,function(err){
   if(err){
     console.log(err);
     res.redirect("/login")
   }
   else{
     passport.authenticate("local")(req,res,function(){
       res.redirect("/secrets")
     })
   }
 })

});


app.get("/register",(req,res)=>{
  res.render("register")
});

app.post("/register",(req,res)=>{
//using passport local mongoose

User.register({username:req.body.username},req.body.password,function(err,user){
  if(err){
    console.log(err);
   res.redirect("/register")
  }
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets")
    })
  }
})
});



app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
    // res.render("secrets")
    User.find({"secret":{$ne:null}},function(err,foundUsers){
     if(err){
       console.log(err);
     }else{
       res.render("secrets",{userSecrets:foundUsers})
     }
   });
  // }
  // else{
  //   res.redirect("/login")
  // }
});


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit")
  }
  else{
    res.redirect("/login")
  }
})

app.post("/submit",function(req,res){
  const submittedSecret=req.body.secret;
User.findById(req.user.id,function(err,foundUser){
  if(err){
    console.log(err);
  }else {
    if(foundUser){
      foundUser.secret=submittedSecret;
      foundUser.save(function(){
        res.redirect("/secrets");
      })
    }
  }
});
});



app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/")
})

let port = process.env.PORT;
// console.log("port :"+port);
if(port==null || port == "")
{
  port=3000
}
app.listen(port,()=>{
  console.log("App is running on :"+ port);
})
