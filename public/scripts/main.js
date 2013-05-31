// Configure require.js to alias paths to globals
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    underscore: 'libs/underscore/underscore',
    backbone: 'libs/backbone/backbone',
    isotope: 'libs/isotope/isotope',
    mustache: 'libs/mustache/mustache',
    masonry: 'libs/masonry/jquery.masonry.min',
    toastr: 'libs/toastr/toastr',
    parseURI: 'libs/parseURI/parseURI',
    typeahead: 'libs/typeahead/typeahead',
    templates: "templates/",
    channel: "helpers/channel"
  },
  shim: {
          'backbone': {
          //These script dependencies should be loaded before loading
          //backbone.js
          deps: ['underscore', 'jquery'],
          //Once loaded, use the global 'Backbone' as the
          //module value.
          exports: 'Backbone'
        },
          'underscore': {
              exports: '_'
        }
  }
});
require([
  'app'
  ], function(App) {
    App.initialize();
  });