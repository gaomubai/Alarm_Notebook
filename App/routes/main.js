const express = require('express');
const schedule = require('node-schedule');
const Datastore = require('nedb');

const router = express.Router();

const reminder = new Datastore({ filename: '../db/reminder.db', autoload: true });

var reminderCach = {};

const isAuthenticated = function (req, res, next) {
    if (!req.session._id) return res.status(401).end("access denied");
    next();
};

const writeToDb = function (req, res, object) {
    const text = req.body.text;
    const repeat = req.body.repeat;
    const datetime = new Date(req.body.datetime);
    const _id = req.session._id;
    var index = -1;
    const users = req.app.locals.users;
    users.findOne({ _id: req.session._id }, function (err, user) {
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        if (_id in reminderCach) {
            var i = 0;
            for (; i < reminderCach[_id].length; i ++) {
                if (reminderCach[_id][i] == -1) {
                    reminderCach[_id][i] == object;
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
        reminder.insert({ user_id: _id, text: text, repeat: repeat, datetime: datetime, index: index}, function (err) {
            if (err) return res.status(500).end(err);
            var updateingValue = user["numOfReminder"] + 1;
            users.update({ _id: req.session._id }, { $set: { "numOfReminder": updateingValue } }, { multi: false }, function (err, num) { 
                if (err) return res.status(500).end(err);
            });
            console.log("Reminder adding success");
        });
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
    
    if (repeat == 'none') {
        var j = schedule.scheduleJob(datetime, function () {
            console.log("text: " + text);
            console.log(new Date());
        });
        writeToDb(req, res, j);
    }
    else if (repeat == 'daily') {
        var rule = new schedule.RecurrenceRule()
        rule.hour = datetime.getHours();
        rule.minute = datetime.getMinutes();
        var j = schedule.scheduleJob(rule, function () {
            console.log("text: " + text);
            console.log(new Date());
        });
        writeToDb(req, res, j);
    }
    else if (repeat == 'weekly') {
        var rule = new schedule.RecurrenceRule()
        rule.hour = datetime.getHours();
        rule.minute = datetime.getMinutes();
        rule.dayOfWeek = datetime.getDay();
        var j = schedule.scheduleJob(rule, function () {
            console.log("text: " + text);
            console.log(new Date());
        });
        writeToDb(req, res, j);
    }
    else if (repeat == 'monthly') {
        var rule = new schedule.RecurrenceRule()
        rule.hour = datetime.getHours();
        rule.minute = datetime.getMinutes();
        rule.date = datetime.getDate();
        var j = schedule.scheduleJob(rule, function () {
            console.log("text: " + text);
            console.log(new Date());
        });
        writeToDb(req, res, j);
    }
    else {
        return res.status(300).end('Repeation does not correct');
    }
});

/* Get reminder. */
router.get("/reminder/", isAuthenticated, function (req, res, next) { 
    reminder.find({ user_id: req.session._id }).sort({ datetime: -1 }).exec(function (err, docs) {
        if (err) return res.status(500).end(err);
        return res.json(docs);
    });
});

/* Delete reminder. */
router.delete("/reminder/:id/", isAuthenticated, function (req, res, next) {
    reminder.findOne({ _id: req.params.id }, function (err, doc) { 
        if (err) return res.status(500).end(err);
        if (!doc) return res.status(404).end("Reminder id #" + req.params.id + " does not exists");
        if (doc.user_id !== req.session._id) return res.status(403).end("forbidden");
        let i = doc.index;
        reminderCach[req.session._id][i] = -1;
        reminder.remove({ _id: req.params.id }, { multi: false }, function (err, num) { 
            if (err) return res.status(500).end(err);
        });
     });
});

module.exports = router;
