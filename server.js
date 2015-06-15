var express = require('express');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');

var SlackStrategy = require('passport-slack').Strategy;
var SLACK_SECRETS = require('./secrets/slack.json');
var SESSION_SECRET = require('./secrets/session.json').secret;

var app = express();

app.use(session({
  secret: SESSION_SECRET
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new SlackStrategy({
    clientID: SLACK_SECRETS.id,
    clientSecret: SLACK_SECRETS.secret,
    //callbackURL: "http://localhost:8000/auth/slack/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      /*
      User.findOrCreate({ SlackId: profile.id }, function (err, user) {
        return done(err, user);
      });
      */
      console.log(profile);
      //console.log("access token:", accessToken);
      return done(null, profile);
    });
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
  res.render('index', {user:JSON.stringify(req.user)});
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/auth/slack',
  passport.authenticate('slack', { scope: [ 'identify','client' ] }));

app.get('/auth/slack/callback',
  passport.authenticate('slack', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  if(req.method === 'GET') {
    res.redirect('/login')
  } else{
    res.status(401).end();//unauthorized
  }
}


app.listen(8000);
