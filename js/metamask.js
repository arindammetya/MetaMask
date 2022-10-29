angular.module('codeBaseAdminApp')
        .controller('metamask', function ($scope, $templateCache, $compile, Toast, $http, $location, $mdDialog, Dialog, $rootScope, Toast) {

            $scope.stepCampaignIdMap = function(){
                return {
                    'step_id' : '', 
                    'campaign_id' : '' 
                };
              };
            
            if(angular.isUndefined($scope.extension.metamask_campaigns)) {
                $scope.extension.metamask_campaigns = [];
                $scope.extension.metamask_campaigns.push($scope.stepCampaignIdMap());
              }
              
              $scope.addStepListid = function(index){

                if($scope.extension.metamask_campaigns[index].step_id == '' || $scope.extension.metamask_campaigns[index].campaign_id == '') {
                    Toast.showToast('Step ID and Campaign ID need to be provide.');
                    return;
                }

                $scope.extension.metamask_campaigns.push($scope.stepCampaignIdMap());
              }

              $scope.removeStepListid = function(index){
                $scope.extension.metamask_campaigns.splice(index, 1);
              }
              
        });