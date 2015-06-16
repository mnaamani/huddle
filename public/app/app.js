angular.module('huddle', [
  'ngRoute',
])
.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'app/templates/home.html',
      controller: 'HomeController'
    })
    .when('/meeting/:id', {
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
    .when('/team', {
      templateUrl: 'app/templates/team.html',
      controller: 'TeamController'
    })
    // default for unknown routes
    .otherwise({redirectTo: '/'});
})
.factory('Team', function($http, $q){

  function info(){
    return $http({
      method: 'GET',
      url: '/api/team/list',
      cache: true
    }).then(function(response){

      return response.data;

    }).catch(function(err){
      console.log(err)
    });
  }

  return {
    info: info
  };

})
.controller('TeamController', function($scope, Team){
  $scope.team = {};

  Team.info().then(function(data){
    $scope.team = data;
  });

})
.factory('Meetings', function($http) {

  var create = function(users){
    return $http({
      method: 'POST',
      url: '/api/meetings/new',
      data: users
    }).then(function(response){
      console.log('got response to meeting', response.data);
      return response.data;
    });
  }

  var list = function(){
    return $http({
      method: 'GET',
      url: '/api/meetings/list'
    }).then(function(response){
      console.log('got list of huddles', response.data);
      return response.data;
    });
  }

  return {
    create: create,
    list: list
  };

})
.controller('NewMeetingController', function($scope, $location, Team, Meetings){
  $scope.notinvited = [];
  $scope.invited = [];

  Team.info().then(function(data){
    $scope.notinvited = data.slice();
  });

  $scope.reset = function(){
    $scope.search = '';
    $scope.invited.forEach(function(value){
      $scope.notinvited.push(value);
    });
    $scope.invited.length = 0;
  };

  $scope.invite = function(id) {
    $scope.search = '';
    var ix = _.findIndex($scope.notinvited, function(user){
      return user.id === id;
    });
    var user = $scope.notinvited.splice(ix,1)[0];
    $scope.invited.push(user);
  }

  $scope.uninvite = function(id) {
    $scope.search = '';
    var ix = _.findIndex($scope.invited, function(user){
      return user.id === id;
    });
    var user = $scope.invited.splice(ix,1)[0];
    $scope.notinvited.push(user);
  };

  $scope.createMeeting = function(){
    Meetings.create({
      title: $scope.title,
      invited: _.pluck($scope.invited,"id")
    })
      .then(function(meeting){
        $location.path("/meeting/"+meeting._id);
      });
  }

})
.controller('MeetingController', function($scope){

})
.controller('HomeController', function($scope, Meetings){
  //show all Meetings
  $scope.huddles = [];

  Meetings.list().then(function(huddles){
    $scope.huddles = huddles;
  });

})
.controller('GroupsController', function($scope){

});
