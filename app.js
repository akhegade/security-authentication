//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs =require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption")
// const md5 = require("md5");

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require('express-session');
const passport = require("passport");
const passportLoalMongoose = require("passport-local-mongoose");

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
  password:String
})

userSchema.plugin(passportLoalMongoose);

// console.log(process.env.SECRET);
// userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);
// const Account = new mongoose.model("Account",{name:String})
//
// const pro = new Account({name:"anil"})
// pro.save();


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{
  res.render("home")
})

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
  if(req.isAuthenticated()){
    res.render("secrets")
  }
  else{
    res.redirect("/login")
  }
})

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
