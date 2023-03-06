require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'This is a secret string.',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    name: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function (req, res) {
    res.render('home', {});
});

app.get('/login', function (req, res) {
    res.render('login', {});
});

app.get('/register', function (req, res) {
    res.render('register', {});
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else
    {
        res.redirect('/login');
    }
});

app.post('/register', function (req, res) {

    const name = req.body.username;
    const password = req.body.password;

    User.register({username: name}, password, function(err,user){
        if(err)
        {
            console.log(err);
            res.redirect('/register');
        }
        else
        {
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.post('/login', function (req, res) {

    const user = new User({
        name: req.body.username,
        password: req.body.password
    });

    req.login(user,function(err){
        if(err)
            console.log(err);
        else
        {
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.get('/logout',function(req,res){
    req.logout();
    res.redirect('/');
});

app.get('/submit', function (req, res) {
    res.render('submit', {});
});

app.listen(process.env.PORT, function () {
    console.log("Server active on port 3000");
});