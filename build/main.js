var app = angular.module('app', []);

app.controller('DocsCtrl', ['$scope', '$http',
  function($scope, $http) {
    $scope.categories = [];
    $scope.subCategories = {};
    $scope.blocks = {};
    $http.get('docs.json').success(function(data){
      $scope.data = data;
      // Loop through the "files" in the docs.json
      for(key in $scope.data){

        // Loop through all the comments blocks
        for(var i = 0; i < $scope.data[key].length; i++){
          var comment = $scope.data[key][i];
          // console.log(comment.category);

          // Generate all the categories by taking them from all the comment
          // Only uniques
          if($scope.categories.indexOf(comment.category) === -1 && comment.category){
            $scope.categories.push(comment.category);
            // Make ready for subcategories
            $scope.subCategories[comment.category] = [];
          }

          // If is has the category property, the name should be a listed under a category
          if(comment.hasOwnProperty('category')){
            $scope.subCategories[comment.category].push(comment.name);
            // Make ready for the blocks which is essential all the comments
            $scope.blocks[comment.name] = [];
          }

          // If it has the property comp, means it is a component of a something
          // and should be put under that name instead
          if(comment.hasOwnProperty('comp')){
            $scope.blocks[comment.comp].push(comment);
          } else {
            $scope.blocks[comment.name].push(comment);
          }
        }
      }

    }).error(function(){
      alert('You need to generate the docs first!\n\nconsole: grunt api');
    });
    $scope.show = function(category) {
      $scope.current = category;
    };
  }
]);