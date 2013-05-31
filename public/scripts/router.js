define([
  'jquery',
  'underscore',
  'backbone',
  'views/main/main_view'
  ], function( $, _, Backbone, MainView ){
    var AppRouter = Backbone.Router.extend({
      routes: {
        "*actions":"catchAll"
      },

      main: function(){

      },

      catchAll: function(){
        var mainView = new MainView();
      }
    });

    var initialize = function() {
      var iwRouter = new AppRouter();
      Backbone.history.start();
    };
    return {
      initialize : initialize
    };
  });