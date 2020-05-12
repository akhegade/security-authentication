//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs =require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption")
const md5 = require("md5");

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false});

const userSchema =new mongoose.Schema({
  email:String,
  password:String
})

// console.log(process.env.SECRET);
// userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);
// const Account = new mongoose.model("Account",{name:String})
//
// const pro = new Account({name:"anil"})
// pro.save();

app.get("/",(req,res)=>{
  res.render("home")
})

app.get("/login",(req,res)=>{
  res.render("login")
})

app.post("/login",(req,res)=>{
  const username =req.body.username
  const password =md5(req.body.password);
  User.findOne({email:username},(err,foundUser) =>{
    if(!err){
      if(foundUser.password==password)
      res.render("secrets")
      else
       res.redirect("/login")
    }
    else{res.redirect("/login")}
  });
});


app.route("/register")
.get((req,res)=>{
  res.render("register")
})
.post((req,res)=>{
  const email =req.body.username;
  const password = md5(req.body.password);

   const user = new User(
      {
        email:email,
        password:password
      }
    )
   user.save((err)=>{
     if(!err){
       res.render("secrets")
     }
     else{res.redirect("/register")}
   })

});

app.get("/logout",(req,res)=>{
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
