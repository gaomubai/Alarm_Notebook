const express = require('express');
const schedule = require('node-schedule');
const Datastore = require('nedb');

const router = express.Router();

const reg = /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/;

const reminder = new Datastore({ filename: '../db/reminder.db', autoload: true });

var reminderCach = {};

const isAuthenticated = function (req, res, next) {
    // if (!req.session._id) return res.status(401).end("access denied");
    next();
};

const sendNotification = function (user, req, res) {
    var email = user.email;
    if (email.match(reg) == null){
        return res.status(400).end('Please entre the correct email');
    }
    var mail_content = {
        from: '<' + req.app.locals.mailconfig.auth.user + '>',
        subject: 'Notification From Alarm Notebook',
        to: email,
        text: req.body.text
    };
    req.app.locals.transporter.sendMail(mail_content, function (err, info) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("mail sent" + info.response);
        }
    })
}

const writeToDb = function (text, repeat, datetime, res, user, object) {
    const _id = user._id;
    var index = -1;
    if (_id in reminderCach) {
        var i = 0;
        for (; i < reminderCach[_id].length; i++) {
            if (reminderCach[_id][i] == -1) {
                reminderCach[_id][i] = object;
                index = i;
                break;
            }
        }
        if (i >= reminderCach[_id].length) {
            index = reminderCach[_id].length
            reminderCach[_id].push(object);
        }
    }
    else {
        index = 0;
        reminderCach[_id] = [object];
    }
    console.log(reminderCach);
    reminder.insert({ user_id: _id, text: text, repeat: repeat, datetime: datetime, index: index }, function (err) {
        if (err) return res.status(500).end(err);
        console.log("Reminder adding success");
    });
}

router.use(express.static('../static/main.html'))

/* GET home page. */
router.get('/', isAuthenticated, function (req, res, next) {
    res.type('html');
    res.render('main', { tittle: 'express' });
});

/* Add reminder. */
router.post('/reminder/', isAuthenticated, function (req, res, next) { 
    if (!('text' in req.body)) {
        return res.status(400).end('Text is missing');
    }
    if (!('repeat' in req.body)) {
        return res.status(400).end('Repeat is missing');
    }
    if (!('datetime' in req.body)) {
        return res.status(400).end('Datetime is missing');
    }
    const text = req.body.text;
    const repeat = req.body.repeat;
    const datetime = new Date(req.body.datetime);
    const users = req.app.locals.users;
    // const _id = req.session._id;
    users.findOne({ _id: _id }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        if (repeat == 'none') {
            var j = schedule.scheduleJob(datetime, function () {
                console.log("text: " + text);
                sendNotification(user, req, res);
            });
            reminder.insert({ user_id: _id, text: text, repeat: repeat, datetime: datetime, index: -1}, function (err) {
                if (err) return res.status(500).end(err);
                console.log("Reminder adding success");
            });
        }
        else if (repeat == 'daily') {
            var rule = new schedule.RecurrenceRule()
            rule.hour = datetime.getHours();
            rule.minute = datetime.getMinutes();
            var j = schedule.scheduleJob(rule, function () {
                console.log("text: " + text);
                sendNotification(user, req, res);
            });
            writeToDb(text, repeat, datetime, res, user, j);
        }
        else if (repeat == 'weekly') {
            var rule = new schedule.RecurrenceRule()
            rule.hour = datetime.getHours();
            rule.minute = datetime.getMinutes();
            rule.dayOfWeek = datetime.getDay();
            var j = schedule.scheduleJob(rule, function () {
                console.log("text: " + text);
                sendNotification(user, req, res);
            });
            writeToDb(text, repeat, datetime, res, user, j);
        }
        else if (repeat == 'monthly') {
            var rule = new schedule.RecurrenceRule()
            rule.hour = datetime.getHours();
            rule.minute = datetime.getMinutes();
            rule.date = datetime.getDate();
            var j = schedule.scheduleJob(rule, function () {
                console.log("text: " + text);
                sendNotification(user, req, res);
            });
            writeToDb(text, repeat, datetime, res, user, j);
        }
        else {
            return res.status(300).end('Repeation does not correct');
        }
    });
});

/* Get reminder. */
router.get("/reminder/", isAuthenticated, function (req, res, next) { 
    // reminder.find({ user_id: req.session._id }).sort({ datetime: -1 }).exec(function (err, docs) {
        if (err) return res.status(500).end(err);
        return res.json(docs);
    });
});

/* Delete reminder. */
router.delete("/reminder/:id/", isAuthenticated, function (req, res, next) {
    reminder.findOne({ _id: req.params.id }, function (err, doc) { 
        if (err) return res.status(500).end(err);
        if (!doc) return res.status(404).end("Reminder id #" + req.params.id + " does not exists");
        // if (doc.user_id !== req.session._id) return res.status(403).end("forbidden");
        var i = doc.index;
        if (i != -1) {
            // reminderCach[req.session._id][i].cancel();
            // reminderCach[req.session._id][i] = -1;
            console.log(reminderCach);
        }
        reminder.remove({ _id: req.params.id }, { multi: false }, function (err, num) { 
            if (err) return res.status(500).end(err);
        });
     });
});

module.exports = router;
