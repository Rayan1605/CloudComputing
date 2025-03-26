const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const shopRoutes = require('./routes/shop');
app.use(express.json()); // Won't parse JSON data sent to server without this
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Change this to a secure random string
    resave: false,
    saveUninitialized: false,
}));

app.use('/', shopRoutes); // Use shop routes

mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/db')
    .then(() => {
        app.listen(3000, () => {
            console.log('Server is running on http://localhost:3000');
        });
    })
    .catch(err => {
        console.log('Mongoose connection error: ' + err);
    });
