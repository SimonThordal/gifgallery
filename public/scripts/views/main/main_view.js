define([
  'jquery',
  'underscore',
  'backbone',
  'app',
  'isotope',
  'mustache',
  'typeahead',
  'channel',
  'toastr',
  'views/images/image_view',
  'models/images/images',
  'views/tags/tag_view'
  ], function($, _, Backbone, App, Isotope, Mustache, Typeahead, Channel, toastr, ImageView, Images, TagView) {
    var MainView = Backbone.View.extend({
      el: $("#main-window"),

      events: {
        "keyup #searchfield" : "evalSearchKey",
        "click .criteria p" : "switchSortingCriteria"
      },

      initialize: function() {
        var that = this;
        that.sortingCriteria = ["popularity", "date"];
        that.subviews = [];
        that.detectBackground();
        _.bindAll(this,"scrolling");
        $(window).scroll(that.scrolling);
        that.collection = new Images();
        that.render();
        Channel.on('addFilter', function(tag) {
          that.addTag(tag);
        });
      },

      render: function() {
        var that = this;
        $("#image-container").isotope({
          itemSelector: '.img-box',
          masonry: {
            columnWidth: 310
          }
        });
        $("#searchfield.typeahead").typeahead({
          name: "searchfield",
          prefetch: {url: "../tags", ttl:0}
        });
        that.collection.update({
          success: function(collection, response, options) {
            that.collection.nextPage++;
            that.imagesRender(collection.models);
          },
          error: function(collection, response, options) {
            console.log(response);
          }
        });
        that.initializeTags();
      },

      initializeTags: function() {
        var i,
            that = this;
        $.get("/tags", function(response) {
          $("#searchfield.typeahead").typeahead({
            name: "searchfield",
            locals: response
          });
          // Add the first 10 tags to popular tags
          for (i = 0; i < response.length && i < 10; i++) {
            var tagView = new TagView({tag: response[i]});
            $("#popular-tags").append( tagView.render() );
            tagView.attachUI();
          }
        });
      },

      imageRender: function(image, id) {
        var that = this;
        var imageView = new ImageView( {model:image, id:id} );
        that.subviews.push(imageView);
        imageView.render();
        imageView.attachUI();
      },

      imagesRender: function(images) {
        var that = this,
            html = "";
        _.each(images, function(image, index) {
          var id = index + (that.collection.nextPage-1)*that.collection.pageLength;
          that.imageRender(image, id);
        }, this);
        $(that.el).imagesLoaded(function() {
          $(that.el).isotope('reLayout');
        });
      },

      removeImages: function(cb) {
        var that = this;
        $("#image-container").isotope('remove', $('.img-box'), function() {
            var callback = _.after(that.subviews.length, function() {
              that.subviews = [];
              cb();
              }
            );
            _.each(that.subviews, function(view, index, list) {
              view.remove();
              callback();
              }
            );
          }
        );
      },

      evalSearchKey: function(e) {
        var that = this;
        if (e.keyCode === 13 || e.keyCode === 32 || e.keyCode === 18) {
          var tag = $(e.currentTarget).val().toLowerCase().trim();
          that.addTag(tag);
          $(e.currentTarget).val("");
          $(e.currentTarget).typeahead('setQuery', '');
        }
        else if (e.keyCode === 8) {
          var index = that.collection.tags.length;
          if (index > 0) {
            var tag = that.collection.tags[index-1];
            that.removeTag(tag);
          }
        }
      },

      addTag: function(tag) {
        var that = this;
        if ( !_.contains(that.collection.tags, tag) ) {
          that.collection.addTagFilter(tag, {
            success: function() {
              var tagView = new TagView({tag: tag, filter: true});
              $("#applied-tags").prepend(tagView.render());
              tagView.attachUI();
              that.listenToOnce(tagView, "removeFilter", that.removeTag);
              that.collection.resetPagination();
              that.removeImages(function() {
                that.imagesRender(that.collection.models);
              });
            },
            error: function() {
              toastr.error("No images with that tag exist");
            }
          }, {page: 0});
        }
      },

      removeClickedTag: function(e) {
        var that = this;
        var tag = $(e.currentTarget).val();
        that.removeTag(tag);
      },

      removeTag: function(tag) {
        var that = this;
        that.collection.removeTagFilter(tag, {
          success: function() {
            $(".searchfield ." + tag).remove();
            that.collection.resetPagination();
            that.removeImages(function() {
                that.imagesRender(that.collection.models);
            });
          },
          error: function() {

          }
        }, {page: 0});
      },

      scrolling: function() {
        var that = this;
        var loadHeight = $( document ).height( ) - $( window ).height( );
         if( $( window ).scrollTop( ) >= loadHeight ) {
          that.collection.update({
            success: function(collection, response, options) {
              that.collection.nextPage++;
              that.imagesRender(collection.models);
            }
           });
         }
      },

      switchSortingCriteria: function(e) {
        var that = this;
        var sortBy = $(e.currentTarget).data().criteria;
        if (that.collection.sortBy === sortBy) {
          return false;
        }
        that.collection.sort(sortBy, {
          success: function(collection, response, options) {
            that.collection.resetPagination();
            that.removeImages(function() {
                that.imagesRender(that.collection.models);
            });
          }
        });
      },

      detectBackground: function() {
        var available = [
          1024, 1280, 1366,
          1400, 1680, 1920,
          2560, 3840, 4860],
            i;
        var screenWidth = $(window).width();
        var chosen = _.find(available, function(item) {
          return item - screenWidth >= 0;
        });
        $("#main-window").addClass('size-'+chosen.toString());
      }
    });

    return MainView;
  })