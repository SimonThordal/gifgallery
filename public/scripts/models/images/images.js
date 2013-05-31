define([
  "underscore",
  "backbone",
  "models/images/image"
  ], function(_, Backbone, Image, Comments) {
    var Images = Backbone.Collection.extend({
      model: Image,
      url: "/images/",

      initialize: function() {
        this.nextPage = 0;
        this.pageLength = 50;
        this.tags = [];
        this.sortingCritera = ["date", "popularity"];
        this.sortBy = "date";
      },

      update: function(callbacks, options) {
        var that = this,
            tags = that.tags;
        if (options && options.tags) {
          tags = that.tags.concat(options.tags);
        }
        var parameters = _.extend({
          page: that.nextPage,
          tags: tags,
          sortBy: that.sortBy
        }, options);
        that.fetch({
                    data:parameters,
                    success: callbacks.success,
                    error: callbacks.error
                  });
      },

      addTagFilter: function(tags, callbacks, options) {
        var that = this;
        var success = callbacks.success;
        if (tags !== "") {
          _.extend(callbacks,
              { success: function() {
                  that.tags.unshift(tags);
                  success();
                }
              }
            );
          options.tags = that.tags.concat([tags]);
          that.update(callbacks, options);
        }
      },

      removeTagFilter: function(tags, callbacks, options) {
        this.tags = _.without( this.tags, tags );
        this.update(callbacks, options);
      },

      sort: function(sortBy, callbacks) {
        var that = this;
        if (_.any(that.sortingCritera, function(criteria) {
                  return criteria === sortBy;
                })
          ) {
          that.sortBy = sortBy;
          that.update(callbacks);
        }
      },

      resetPagination: function() {
        this.nextPage = 1;
      }

    });
    return Images;
  });