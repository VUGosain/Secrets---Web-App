require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'This is a secret string.',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    // name: String,
    password: String,
    googleId: String
});

userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, username: user.username, name: user.name });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id, username: profile.displayName }, function (err, user) {
            // console.log(profile);
            // console.log(user);
            return cb(err, user);
        });
    }
));

app.get('/', function (req, res) {
    res.render('home', {});
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
    });

app.get('/login', function (req, res) {
    res.render('login', {});
});

app.get('/register', function (req, res) {
    res.render('register', {});
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets", {});
    }
    else {
        res.redirect('/login');
    }
});

app.post('/register', function (req, res) {

    const name = req.body.username;
    const password = req.body.password;

    User.register({ username: name }, password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        }
        else {
            passport.authenticate('local')(req, res, function () {
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

    req.login(user, function (err) {
        if (err)
            console.log(err);
        else {
            passport.authenticate('local')(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

app.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/submit', function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit", {});
    }
    else {
        res.redirect('/login');
    }
});

app.listen(3000, function () {
    console.log("Server active on port 3000");
});