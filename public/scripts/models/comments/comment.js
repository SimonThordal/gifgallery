define([
  "underscore",
  "backbone"
  ], function(_, Backbone) {
    var Comment = Backbone.Model.extend({
      initialize:function(options){
        this.set("domHeight", "40");
      }
    });
    return Comment;
  });