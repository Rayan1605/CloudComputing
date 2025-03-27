// Import required modules
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Import route handlers
const shopRoutes = require('./routes/shop');

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse form data (from HTML forms)
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Setup session management (stores user sessions using cookies)
app.use(session({
    secret: 'Kw2y4FpZ3J8A6Fv5fzX6Ccz+13T+2Ho+zVGRDdT8M1HaElZJuTLZ5vPp78avKfXogdD08oK0LbfWZTPYZOnU5A==',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // change to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Use routes defined in shop.js
app.use('/', shopRoutes);

// Connect to MongoDB and start the server
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
