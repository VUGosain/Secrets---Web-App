require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    name: String,
    password: String
});


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



    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err)
            console.log(err);
        else {
            const newUser = new User({
                name: req.body.username,
                password: hash
            });

            newUser.save().then(function () {
                res.render("secrets");
            }).catch(function (err) {
                console.log(err);
            })
        }
    });
});

app.post('/login', function (req, res) {

    const name = req.body.username;
    const password = req.body.password;

    User.findOne({ name: name }).then(function (person) {

        if (!person) {
            res.send("User not found");
        }
        else {
            bcrypt.compare(req.body.password, person.password, function (err, result) {
                if(err)
                    console.log(err);
                else
                {
                    if(result)
                        res.render('secrets');
                    else
                        res.send("Incorrect password !!");
                }
            });
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