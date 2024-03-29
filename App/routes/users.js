const express = require('express');
const router = express.Router();
const redis = require('redis');
const { check } = require('express-validator');
const bcrypt = require('bcrypt');
const cookie = require('cookie');

const client = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
});

client.on('error', err => console.log('Redis Client Error', err));

client.connect();

const reg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;

// const mailconfig = {
//   host: 'smtp.163.com',
//   port: 465,
//   auth: {
//     user:'alarm_notebook@163.com',
//     pass: 'FULUTHMYVXMORRKW'
//   }
// };

// const transporter = nodemailer.createTransport(mailconfig);

var send_verify = function (req, mail) {
  req.app.locals.transporter.sendMail(mail, function (err, info) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("mail sent" + info.response);
    }
  })
};

/* Send verify code to email. */
router.post('/send_verify_code/', [check('email').isEmail().trim().escape()], function (req, res, next) {
  if (!('email' in req.body)) {
    return res.status(400).end('Email is missing');
  }
  var email = req.body.email;
  if (email.match(reg) == null){
    return res.status(400).end('Please entre the correct email');
  }
  var code = Math.random().toFixed(6).slice(-6);
  client.set(email, code);
  client.expire(email, 300);
  console.log(req.app.locals.mailconfig);
  var mail_content = {
    from: '<' + req.app.locals.mailconfig.auth.user + '>',
    subject: 'code',
    to: email,
    text: code
  };
  send_verify(req, mail_content);
});

/* Sign up. */
router.post('/signup/', [check('email').isEmail().trim().escape(), check('password').trim().escape()], function (req, res, next) {
  if (!('email' in req.body)) {
    return res.status(400).end('Email is missing');
  }
  if (!('code' in req.body)) {
    return res.status(400).end('Verify code is missing');
  }
  if (!('password' in req.body)) {
    return res.status(400).end('password is missing');
  }
  var email = req.body.email;
  if (email.match(reg) == null) {
    return res.status(400).end('Please entre the correct email');
  }
  var code = req.body.code;
  var password = req.body.password;
  client.get(email).then(v_code => {
    if (v_code != code) {
      return res.status(400).end('Verify code does not match');
    }
    const users = req.app.locals.users;
    users.findOne({ email: email }, function (err, user) {
      if (err) return res.status(500).end(err);
      if (user) return res.status(409).end("email " + email + " already registered");
      // generate a new salt and hash
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
          // insert new user into the database
          users.insert({ email: email, hash: hash, numOfReminder: 0 }, function (err) {
            if (err) return res.status(500).end(err);
            console.log("Sign up success\n");
            return res.json(email);
          });
        });
      });
    });
  });
});

/* Login */
router.post('/login/', [check('email').isEmail().trim().escape(), check('password').trim().escape()], function (req, res, next) {
  if (!('email' in req.body)) {
    return res.status(400).end('Email is missing');
  }
  if (!('password' in req.body)) {
    return res.status(400).end('password is missing');
  }
  var email = req.body.email;
  var password = req.body.password;
  const users = req.app.locals.users;
  users.findOne({ email: email }, function (err, user) {
    if (err) return res.status(500).end(err);
    if (!user) return res.status(401).end("access denied");
    bcrypt.compare(password, user.hash, function (err, valid) {
      if (err) return res.status(500).end(err);
      if (!valid) return res.status(401).end("access denied");
      // start a session
      req.session._id = user._id;
      res.setHeader('Set-Cookie', cookie.serialize('_id', user._id, {
        path : '/', 
        maxAge: 60 * 60 * 24 // 1 day in number of seconds
      }));
      console.log(user);
      return res.json(email);
    });
  });
});

/* Signout */
router.get('/signout/', function (req, res, next) {
  req.session.destroy();
  res.setHeader('Set-Cookie', cookie.serialize('_id', '', {
          path : '/', 
          maxAge: 60 * 60 * 24 // 1 week in number of seconds
    }));
  return res.redirect("/");
});

module.exports = router;
