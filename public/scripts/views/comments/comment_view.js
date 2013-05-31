define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'text!templates/comments/comment_template.html',
  'views/tags/tag_view'
  ], function($, _, Backbone, Mustache, template, TagView) {
    var CommentView = Backbone.View.extend({
      template: template,

      initialize: function(options) {
        this.setElement(options.parent);
      },

      render: function() {
        var that = this,
            pattern = /#(\w*[a-zA-Z_-]+\w*)/g,
            body = that.model.get("body"),
            tags = body.match(pattern),
            html = Mustache.render(template, { comment: that.model.get('body') });
        if (tags !== null ) {
          var callback = _.after(tags.length, function(html) {
            that.$el.prepend(html);
          });
          _.each(tags, function(tag) {
            var view = new TagView({tag: tag.slice(1)});
            html = html.replace( tag, view.render() );
            callback(html);
            view.attachUI();
          });
        } else {
          that.$el.prepend(html);
        }
      }
    });
    return CommentView;
  }
);