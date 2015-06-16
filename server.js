var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var Slackey = require('slackey');
var MongoStore = require('connect-mongo')(session);

var SlackStrategy = require('passport-slack').Strategy;
//TODO: get these from environment vars
var SLACK_SECRETS = require('./secrets/slack.json');
var SESSION_SECRET = require('./secrets/session.json').secret;

var slackAPI = new Slackey({
  clientID: SLACK_SECRETS.id,
  clientSecret: SLACK_SECRETS.secret
});

var app = express();

app.use(session({
  secret: SESSION_SECRET,
  store: new MongoStore({
    url: 'mongodb://localhost/huddle-session'
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
    res.redirect('/');//TODO: send them to a meeting if they were trying to join one
});

app.get('/logout', function(req, res){
  req.logout();
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

function ensureAuthenticated(req, res, next) {
  if(process.env.NODE_ENV !== 'production') {
    //return next();
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
  if (req.isAuthenticated()) { return next(); }
  res.status(401).end();//unauthorized
}

app.get('/api/whoami', ensureAuthenticatedAPI, function(req, res){
  response.send(200, req.user);
});

//proxying api calls to slack
app.get('/api/team/list', ensureAuthenticatedAPI, function(req, res){

  var slack = slackAPI.getClient(req.user.slackAccessToken);

  slack.api('users.list', function(err, response) {
    if (err) {
      res.status(500);
    } else {
      res.send(200, response.members);
    }
  });
});

//meeting api
app.post('/api/meetings/new', ensureAuthenticatedAPI, function(req, res){
  console.log('creating new meeting for:', req.body)
  //send out invites

  res.send(201,{
    id: '77777'
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
  res.send(200,{
    data: 123
  });
});

//start the server
app.listen(8000);
