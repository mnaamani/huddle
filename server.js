var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var Slackey = require('slackey');
var MongoStore = require('connect-mongo')(session);
var mongoose    = require('mongoose');
var _ = require('underscore');

var Meeting = require('./backend/meeting');

mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost/huddle');

var SlackStrategy = require('passport-slack').Strategy;

var SLACK_SECRETS;
var SESSION_SECRET;

if(process.env.NODE_ENV === 'production' ) {
  SLACK_SECRETS = {
    id: process.env.SLACK_APP_ID,
    secret: process.env.SLACK_APP_SECRET
  };
  SESSION_SECRET = process.env.SESSION_SECRET;
} else {

  SLACK_SECRETS = require('./secrets/slack.json');
  SESSION_SECRET = require('./secrets/session.json').secret;

}

var slackAPI = new Slackey({
  clientID: SLACK_SECRETS.id,
  clientSecret: SLACK_SECRETS.secret
});

var app = express();

app.use(session({
  secret: SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URL || 'mongodb://localhost/huddle'
  })
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new SlackStrategy({
    clientID: SLACK_SECRETS.id,
    clientSecret: SLACK_SECRETS.secret
  },
  function(accessToken, refreshToken, profile, done) {
    profile.slackAccessToken = accessToken;
    return done(null, profile);
  }
));



app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

app.get('/', ensureAuthenticated, function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/auth/slack',
  passport.authenticate('slack', { scope: [ 'identify','client' ] }));

app.get('/auth/slack/callback',
  passport.authenticate('slack', { failureRedirect: '/login' }),
  function(req, res) {
    if(req.session._join_meeting){
      res.redirect('/join/'+req.session._join_meeting);
    }else {
      res.redirect('/');
    }
});

app.get('/logout', function(req, res){
  req.logout();
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

app.get('/join/:id', function(req, res){
  if(req.isAuthenticated()){
    res.redirect("/#/meeting/"+req.params.id);
  } else{
    req.session._join_meeting = req.params.id;
    res.redirect('/login');
  }
});

function ensureAuthenticated(req, res, next) {
  if(process.env.NODE_ENV !== 'production'){
    return next();
  }

  if (req.isAuthenticated()) { return next(); }

  if(req.method === 'GET') {
    //TODO remember if user was trying to join a specific meeting, to send them to
    //it when they authenticate successfully
    res.redirect('/login');
  } else{
    res.status(401).end();//unauthorized
  }
}

function ensureAuthenticatedAPI(req, res, next) {
  if(process.env.NODE_ENV !== 'production'){
    return next();
  }

  if (req.isAuthenticated()) { return next(); }
  res.status(401).end();//unauthorized
}

app.get('/api/whoami', ensureAuthenticatedAPI, function(req, res){
  response.send(200, req.user);
});

//proxying api calls to slack
app.get('/api/team/list', ensureAuthenticatedAPI, function(req, res){

  var token = process.env.NODE_ENV === 'production' ? req.user.slackAccessToken : SLACK_SECRETS.token;
  var slack = slackAPI.getClient(token);

  slack.api('users.list', function(err, response) {
    if (err) {
      res.status(500);
    } else {
      res.send(200, response.members);
    }
  });
});

//meeting api
function sendInvites(users, meetingId, channelId) {
  //for now send a message to a channel (in future send DMs to individual users)
  //channel id
  //user name array
  //url to meeting
  //title

  var token = process.env.NODE_ENV === 'production' ? req.user.slackAccessToken : SLACK_SECRETS.token;
  var slack = slackAPI.getClient(token);

  slack.api('users.list', function(err, response) {
    if (err) {
      res.status(500);
    } else {

      var names = response.members.filter(function(user){
        return _.contains(users, user.id);
      }).map(function(user){
        return "@"+user.name;
      }).join(" ");

      message = names + " Huddle Up! >> http://huddleup.azurewebsites.net/#/meeting/"+meetingId;
/*
      slack.api('chat.postMessage', {
          channel: 'C04GY38CA', //HRR6 channel
          text: message,
          as_user: true,
          link_names: true,
          //parse: 'full'
      },function(){
        console.log("invites sent");
      });
*/
      console.log('sending invite message:', message);
    }
  });
}

app.post('/api/meetings/new', ensureAuthenticatedAPI, function(req, res){
  console.log('creating new meeting for:', req.body)

  //todo make sure to include creator in invited array
  var userId = process.env.NODE_ENV === 'production' ? req.user.id : "U04NHL8BZ";

  Meeting.create({
    title: req.body.title,
    admin: userId,
    invited: req.body.invited,
    ended: false
  }, function(err, huddle) {
    if(err) {
      console.log(err);
      res.send(500);
    } else {

      sendInvites(req.body.invited, huddle._id);
      res.send(201, huddle);
    }
  });

});

app.get('/api/meetings/list', ensureAuthenticatedAPI, function(req, res){

  var userId = process.env.NODE_ENV === 'production' ? req.user.id : "U04NHL8BZ";

  Meeting.find({'invited': userId })
    .exec(function(err, results) {
      if(err) {
        res.send(500);
      } else {
        res.send(200, results);
      }
    });

});

app.post('/api/meetings/control/:id', ensureAuthenticatedAPI, function(req, res){
  //verify owner of meeting is issueing control commands
  res.send(201,{
    id: '77777'
  });
});

app.get('/api/meetings/info/:id', ensureAuthenticatedAPI, function(req, res){
  //retreive meeting info from database
  //verify that user is authorised
  //set user presence 'in meeting'
  //send back latest meeting status info
  var userId = process.env.NODE_ENV === 'production' ? req.user.id : "U04NHL8BZ";
  var meetingId = req.params.id;

  Meeting.findOne({_id: meetingId})
    .exec(function(err, meeting){
      if(err) {
        res.send(404);
      } else {

        if(!_.contains(meeting.invited, userId ) && meeting.admin !== userId ){
          return res.send(401);//access denied
        }
        if(!_.contains(meeting.joined, userId)){
          meeting.joined.push(userId);
          meeting.save(function(err, meeting){
            res.send(meeting);
          });
        } else {
          res.send(meeting);
        }


      }
    });

});

//start the server
app.listen(process.env.PORT || 8000);
