define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'channel',
  'text!templates/tags/tag_template.html'
  ], function($, _, Backbone, Mustache, Channel, template) {
    var TagView = Backbone.View.extend({
      template: template,

      initialize: function(options) {
        var that = this;
        if (window.tagCount === undefined ) {
          window.tagCount = 0;
        }
        window.tagCount++;
        that.count = window.tagCount;
        that.filter = false;
        if (options.filter === true) {
          that.filter = true;
        }
        that.tag = options.tag;
      },

      render: function() {
        var that = this,
            html = Mustache.render(template, { tag: that.tag, nr: that.count });
        return html;
      },

      attachUI: function() {
        var that = this,
            events = {};
        that.setElement("#tag-"+that.count);
        events["click .body"] = "handleClick";
        that.delegateEvents(events);
      },

      handleClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this;
        if (that.filter === true) {
          that.trigger("removeFilter", that.tag);
          that.remove();
        } else {
          Channel.trigger("addFilter", that.tag);
        }
      }
    });
    return TagView;
  }
);