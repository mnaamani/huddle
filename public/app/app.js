angular.module('huddle', [
  'ngRoute',
])
.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/templates/home.html',
      controller: 'HomeController'
    })
    .when('/meeting', {
      templateUrl: 'app/templates/meeting.html',
      controller: 'MeetingController'
    })
    .when('/create', {
      templateUrl: 'app/templates/new-meeting.html',
      controller: 'NewMeetingController'
    })
    .when('/groups', {
      templateUrl: 'app/templates/groups.html',
      controller: 'GroupsController'
    })
    // default for unknown routes
    .otherwise({redirectTo: '/'});
});
