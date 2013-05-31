define([
  "underscore",
  "backbone",
  "models/comments/comment"
  ], function(_, Backbone, Comment) {
    var Comments = Backbone.Collection.extend({
      model: Comment,

      initialize: function() {
      },

      getHeight: function() {
        return this.length()*this.model.get('domHeight');
      }

    });
    return Comments;
  });