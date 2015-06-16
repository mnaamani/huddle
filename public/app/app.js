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
  var cache;

  function info(){
    return $http({
      method: 'GET',
      url: '/api/team/list',
      cache: true
    }).then(function(response){
      cache = response.data;
      return response.data;

    }).catch(function(err){
      console.log(err)
    });
  }

  function userInfo(id){
    return _.find(cache, function(user){
      return user.id === id;
    });
  };

  return {
    info: info,
    userInfo: userInfo
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

  //call continuously to get updated meeting information
  var meetingInfo = function(id){
    return $http({
      method: 'GET',
      url: '/api/meetings/info/'+id,
    }).then(function(response){
      return response.data;
    });
  }

  return {
    create: create,
    list: list,
    info: meetingInfo
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
  };

  $scope.addEveryone = function(){
    while($scope.notinvited.length) {
      $scope.invited.push($scope.notinvited.pop());
    }
  };

})
.controller('MeetingController', function($scope,$routeParams, Meetings, Team){
  $scope.info = {};

  $scope.users = [];

  $scope.meetingId = $routeParams.id;

  var updateInterval;

  Meetings.info($scope.meetingId).then(function(info){
    Team.info().then(function(){
      info.invited.forEach(function(id){
        var user = Team.userInfo(id);
        if(user) {
          $scope.users.push(user);
        }
      });

      updateInterval = setInterval(refresh, 5000);
      refresh();

      var webrtc = new SimpleWebRTC({
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: 'remotesVideos',
        // immediately ask for camera access
        autoRequestMedia: true
      });


      // we have to wait until it's ready
      webrtc.on('readyToCall', function () {
        // you can name it anything
        webrtc.joinRoom("huddle"+$scope.meetingId);
      });

    });
  });

  function refresh(){
    Meetings.info($scope.meetingId).then(function(info){
      $scope.info = info;
      $scope.users.forEach(function(user){
        if(_.contains(info.joined, user.id )){
          user.present = true;
        }
      });
    });
  }

  $scope.$on("$destroy", function(){
    clearInterval(updateInterval);
  });
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
