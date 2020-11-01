/*global angular */
/*
 Directive for jQuery UI timepicker (http://jonthornton.github.io/jquery-timepicker/)

 */
var m = angular.module('ui.timepicker', []);


m.value('uiTimepickerConfig', {
    'step': 15
});

m.directive('uiTimepicker', ['uiTimepickerConfig', '$parse', '$window', function(uiTimepickerConfig, $parse, $window) {
    var moment = $window.moment;

    var isAMoment = function(date) {
        return moment !== undefined && moment.isMoment(date) && date.isValid();
    };
    var isDateOrMoment = function(date) {
        return date !== null && (angular.isDate(date) || isAMoment(date));
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            ngModel: '=',
            baseDate: '=',
            uiTimepicker: '=',
            timeZone: '='
        },
        priority: 1,
        link: function(scope, element, attrs, ngModel) {
            'use strict';
            var config = angular.copy(uiTimepickerConfig);
            var asMoment = config.asMoment || false;
            delete config.asMoment;
            var timeZone = scope.timeZone;

            ngModel.$render = function() {
                var date = ngModel.$modelValue;
                if (!angular.isDefined(date)) {
                    return;
                }
                if (date !== null && date !== '' && !isDateOrMoment(date)) {
                    throw new Error('ng-Model value must be a Date or Moment object - currently it is a ' + typeof date + '.');
                }
                if (isAMoment(date)) {
                    date = date.toDate();
                    if(timeZone) {
                        // javascript Date is stored in UTC. Default behaviour of moment.toDate() is to ignore timezone.
                        // our requirement is to show calendar in facility timezone rathen than local timezone. 
                        // used toLocaleString function to get date and time for the given timezone
                        // removing the timezone part to generate the same time in local time
                        // e.g Oct 01, 2020 12PM CDT (date in timezone) will be Oct 01, 2020 12PM PKT (local date)
                        date = new Date(date.toLocaleString('en-US', {
                            timeZone: timeZone, 
                            month: 'short', 
                            weekday: 'short', 
                            day: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit',
                            sec: '2-digit'
                        }));
                    }
                    console.log("Date: ", date);
                }
                if (!element.is(':focus') && !invalidInput()) {
                    element.timepicker('setTime', date);
                }
                if(date === null){
                    resetInput();
                }
            };

            scope.$watch('ngModel', function() {
                ngModel.$render();
            }, true);

            scope.$watch('uiTimepicker', function() {
                element.timepicker(
                    'option',
                    angular.extend(
                        config, scope.uiTimepicker ?
                        scope.uiTimepicker :
                        {}
                    )
                );
                ngModel.$render();
            }, true);

            config.appendTo = config.appendTo || element.parent();

            element.timepicker(
                angular.extend(
                    config, scope.uiTimepicker ?
                        scope.uiTimepicker :
                        {}
                )
            );

            var resetInput = function(){
                element.timepicker('setTime', null);
            };

            var userInput = function() {
                return element.val().trim();
            };

            var invalidInput = function() {
                return userInput() && ngModel.$modelValue === null;
            };

            element.on('$destroy', function() {
                element.timepicker('remove');
            });

            var asDate = function() {
                var baseDate = ngModel.$modelValue ? ngModel.$modelValue : scope.baseDate;
                return isAMoment(baseDate) ? baseDate.toDate() : baseDate;
            };

            var asMomentOrDate = function(date) {
                return asMoment ? moment(date) : date;
            };

            if (element.is('input')) {
                ngModel.$parsers.unshift(function(viewValue) {
                    var date = element.timepicker('getTime', asDate());
                    return date ? asMomentOrDate(date) : date;
                });
                ngModel.$validators.time = function(modelValue) {
                    return (!attrs.required && !userInput()) ? true : isDateOrMoment(modelValue);
                };
            } else {
                element.on('changeTime', function() {
                    scope.$evalAsync(function() {
                        var date = element.timepicker('getTime', asDate());
                        ngModel.$setViewValue(date);
                    });
                });
            }
        }
    };
}]);
