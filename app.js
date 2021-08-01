const path = require('path');

const express = require("express");
const mongoose = require('mongoose');
const debug = require("debug")('web-project');
const dotEnv = require("dotenv");
const passport = require('passport');
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require('connect-mongo')
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');

const connectDb = require('./config/db')
const indexRoutes = require("./routes/index");
const userRoutes = require("./routes/user");
const winston = require('./config/winston');

const app = express();

//* Database Config
connectDb()

//* dotEnv Config
dotEnv.config({ path: "./config/config.env" });

//* Config Passport
require('./config/passport');

//* BodyParser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Express-FileUpload
app.use(fileUpload())

//* Session
app.use(session({
  secret: process.env.SESSION_SECRECT,
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/User_db'})
}))

//* Passport
app.use(passport.initialize())
app.use(passport.session())

//* Flash
app.use(flash())

//* View Engine
app.set('view engine', 'ejs')
app.set('views', 'views')

//* Morgan
if(process.env.NODE_ENV === "development") {
  debug('Morgan enable')
  app.use(morgan('combined', {stream: winston.stream}))
}

//* Static
app.use(express.static(path.join(__dirname, "public")));

//* Routes
app.use(indexRoutes);
app.use('/user', userRoutes);
app.use('/dashboard', require('./routes/dashboard'));

//*404
app.use((req, res) => {
  res.render("errors/404", { pageTitle: "404", path: '/404' });
});
app.use((req, res) => {
  res.render("errors/500", { pageTitle: "404", path: '/500' });
});


const PORT = process.env.PORT || 3000;
app.listen(
  PORT,
  console.log(
    `Server is running in mode ${process.env.NODE_ENV} on Port: ${PORT}`
  )
);
