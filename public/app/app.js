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

});
