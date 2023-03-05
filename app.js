require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    name: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields: ['password']});

const User = new mongoose.model('user', userSchema);

app.get('/', function (req, res) {
    res.render('home', {});
});

app.get('/login', function (req, res) {
    res.render('login', {});
});

app.get('/register', function (req, res) {
    res.render('register', {});
});

app.post('/register', function (req, res) {

    const newUser = new User({
        name: req.body.username,
        password: req.body.password
    });

    newUser.save().then(function () {
        res.render("secrets");
    }).catch(function (err) {
        console.log(err);
    })

});

app.post('/login', function (req, res) {

    const name = req.body.username;
    const password = req.body.password;

    User.findOne({ name: name }).then(function (person) {
        if (!person) {
            res.send("User not found");
        }
        else if(person.password === password) {
            res.render('secrets');
        }
        else{
            res.send("Incorrect password !!");
        }
    }).catch(function (err) {
        console.log(err);
    });
});

app.get('/submit', function (req, res) {
    res.render('submit', {});
});

app.listen(process.env.PORT, function () {
    console.log("Server active on port 3000");
});