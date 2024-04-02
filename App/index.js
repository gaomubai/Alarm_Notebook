const express = require('express')
const cookie = require('cookie');
// const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const Datastore = require('nedb');
const nodemailer = require('nodemailer');

const app = express()
const port = 3000

app.use(express.static('static'));

app.use(bodyParser.json());

// app.use(session({
//   secret: '123-456-7890',
//   resave: false,
//   saveUninitialized: true,
//   // cookie: {
//   //   httpOnly: false,
//   //   secure: false,
//   //   sameSite: false,
//   //   maxAge: 60 * 60 * 24
//   // }
// }));

app.use(function (req, res, next){
    let cookies = cookie.parse(req.headers.cookie || '');
    req.email = (cookies.email)? cookies.email : null;
    console.log("HTTP request", req.email, req.method, req.url, req.body);
    next();
});

app.set('views', path.join(__dirname, 'static'));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

const users = new Datastore({ filename: '../db/users.db', autoload: true });
app.locals.users = users;

const mailconfig = {
  host: 'smtp.163.com',
  port: 465,
  auth: {
    user:'alarm_notebook@163.com',
    pass: 'FULUTHMYVXMORRKW'
  }
};
app.locals.mailconfig = mailconfig;

const transporter = nodemailer.createTransport(mailconfig);
app.locals.transporter = transporter;

const usersRouter = require('./routes/users');
const mainRouter = require('./routes/main');

app.use('/main', mainRouter);
app.use('/users', usersRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})