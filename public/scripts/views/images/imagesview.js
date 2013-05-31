define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'models/images/image',
  'text!templates/images/image_template.html'
  ], function($, _, Backbone, Mustache,ImageModel,ImageTemplate) {
    var ImageView = Backbone.View.extend({
      el: "#image-container",
      template: ImageTemplate,

      initialize: function() {
      },

      render: function() {
        html = Mustache.render(this.template, {path: this.model.url()});
        return $(this.el).append(html);
      },

    });

    return ImageView;
  })