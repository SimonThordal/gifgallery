define([
  'jquery',
  'underscore',
  'backbone',
  'mustache',
  'isotope',
  'toastr',
  'models/images/image',
  'views/comments/comment_view',
  'text!templates/images/image_template.html'
  ], function($, _, Backbone, Mustache, Isotope, toastr, ImageModel, CommentView, ImageTemplate) {
    var ImageView = Backbone.View.extend({
      template: ImageTemplate,

      initialize: function(options) {
        this.id = options.id;
        this.idEl = "#img-"+this.id;
        this.containers = {
          quarter: {className: "quarter", width:302, height:302},
          tallHalf: {className: "tallHalf", width:302, height:610},
          wideHalf: {className: "wideHalf", width:610, height:302},
          full: {className: "full", width:610, height:610}
        };
      },

      render: function() {
        var that = this,
            height = that.model.get("height"),
            width = that.model.get("width");
        // Figure out what container to use
        var container = _.find(that.containers, function(container) {
          return (container.width - width >= 0 && container.height - height >= 0);
        });

        if (typeof(container) !== "undefined") {
          var linked = that.model.link ? "linked" : "";
          var link = that.model.link ? that.model.link : "";
          var $html = $(Mustache.render(that.template, {
              path: that.model.pngLocation(),
              id:that.id,
              topOffset:-height/2,
              rightOffset:-width/2,
              container:container.className,
              linked: linked,
              link: link
            }));
          $("#image-container").append( $html ).isotope('appended', $html);
          that.containerHeight = container.height;
          that.model.get('comments').each(function(comment) {
            that.addComment(comment);
          });
        }
      },

      attachUI: function() {
        var that = this,
            events = {};
        that.setElement(that.idEl);
        if ( that.model.get('favourited') ) {
          that.$el.addClass('favourited');
        }
        events['click #submit-comment-'+that.id] = 'postComment';
        events['click #source-button'] = 'postSource';
        events['mouseenter .wrapper'] = 'animate';
        events['mouseleave .wrapper'] = 'unAnimate';
        events['click a.hash'] = "handleCommentClick";
        events['click a.star'] = "handleFavClick";
        if (that.model.get("link") === undefined ) {
          events['click a.link'] = "handleLinkClick";
        }
        that.delegateEvents(events);
      },

      handleCommentClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this;
        that.resize(e.currentTarget.parentElement,
                    that.containerHeight,
                    $(e.currentTarget.parentElement).data('tab'),
                    function() {
                      that.$('.comments-container').height(that.computedCommentHeight());
                    });
      },

      handleLinkClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this;
        that.resize(e.currentTarget.parentElement,
                    that.containerHeight,
                    $(e.currentTarget.parentElement).data('tab'),
                    function(){});
      },

      handleFavClick: function(e) {
        var that = this;
        e.preventDefault();
        e.stopPropagation();
        this.model.favourite(function(err) {
          if (err) {
            toastr.error(err);
          } else {
            that.$el.toggleClass('favourited');
          }
        });
      },

      postComment: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this,
            comment = {comment: $(e.currentTarget.previousElementSibling).val() };
        this.model.postComment(comment, function(comment, err) {
          if(err) {
            toastr.error("Oops, we found an error:\n"+err.message);
          } else {
            that.addComment(comment);
            toastr.success("Comment was posted, all is good.");
          }
        });
      },

      postSource: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this,
            $input = that.$(".link-input");
        var link = $input.val();
        $input.val("");
        that.model.postSource(link, function(link, err) {
          if (err) {
            toastr.error(err);
          } else {
            that.$("a.link").attr("href", link);
            that.$el.addClass("linked");
            that.$el.undelegate('a.link', 'click');
            that.resize(that.$("a.link").parent()[0]);
          }
        });
      },

      addComment: function(comment) {
        var that = this,
            commentContainer = "#comments-container-"+this.id,
            commentView = new CommentView({model:comment, parent:commentContainer});
        commentView.render();
      },

      computedCommentHeight: function() {
        var that = this;
        var formHeight = that.$(".comments-container").position().top;
        var tabHeight = that.$(".comments").height();
        return tabHeight - formHeight;
      },

      // Expand or collapse the image box when clicking a menu item
      resize: function(element, size, tab, cb) {
        var that     = this,
            imgClass = $(that.idEl).attr('class'),
            liClass  = element.className;
        if ( imgClass.match("collapsed") !== null && liClass.match("collapsed") !== null ) {
          that.openNavtab(that.idEl, tab, size, function(image, height) {
              cb();
              that.expandImageBox(image, height);
            });
          that.expandListItem(that.idEl, element);
          $("#image-container").isotope('reLayout');
        } else if ( imgClass.match("expanded") !== null && liClass.match('collapsed') !== null ) {
          that.expandListItem(that.idEl, element);
          that.openNavtab(that.idEl, tab, size, function(image, height) {
            cb();
            that.expandImageBox(image, height);
          });
          $("#image-container").isotope('reLayout');
        } else if ( imgClass.match("expanded") !== null && liClass.match('expanded') !== null ) {
          that.collapseImageBox(that.idEl, this.containerHeight);
          that.collapseListItem(that.idEl, element);
          $("#image-container").isotope('reLayout');
        }
      },

      expandImageBox: function(image, newHeight) {
        $(image).height(newHeight);
        $(image).removeClass("collapsed").addClass("expanded");
      },

      expandListItem: function(image, listItem) {
        if ( listItem.className.match("middle") ) {
          this.$(".canvas.left").addClass("expanded-neighbor");
        } else {
          this.$(".expanded-neighbor").removeClass("expanded-neighbor");
        }
        $(image + " nav.toolbar li.expanded").removeClass("expanded").addClass("collapsed");
        $(listItem).removeClass("collapsed expanded-neighbor").addClass("expanded");
        $(image + " nav.toolbar li.collapsed").addClass("expanded-neighbor");
        this.setBorder(listItem.className);
      },
      collapseImageBox: function(image, oldHeight) {
        $(image).css("height","");
        $(image).removeClass("expanded").addClass("collapsed");
        $(image + " .navtab").addClass('hide');
      },

      collapseListItem: function(image, listItem) {
        this.$(".expanded-neighbor").removeClass("expanded-neighbor");
        $(image + " nav.toolbar ul.expanded").removeClass("expaded").addClass("collapsed");
        $(image + " nav.toolbar li.expanded").removeClass("expanded").addClass("collapsed");
        $(listItem).removeClass("expanded").addClass("collapsed");
        this.setBorder(listItem.className);
      },

      openNavtab: function(image, tab, imageHeight, cb) {
        $(image + " .navtab").addClass('hide');
        $(image + " .navtab." + tab).removeClass('hide');
        // Horrible magic number 20 is to compensate for borders
        cb(image, $(image + " .navtab." + tab).height()-20 + imageHeight);
      },

      setBorder: function(listClass) {
        var that = this;
        if ( listClass.match('left') ) {
          $(that.idEl + " nav.toolbar ul").removeClass("right").addClass("left");
        } else if ( listClass.match('right') ) {
          $(that.idEl + " nav.toolbar ul").removeClass("left").addClass("right");
        } else {
          $(that.idEl + " nav.toolbar ul").removeClass("left right");
        }
      },

      animate: function(e) {
        e.preventDefault();
        e.stopPropagation();
        var that = this;
        $("#img-"+that.id+" img").attr("src", that.model.gifLocation() );
      },

      unAnimate: function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Unanimating");
        var that = this;
        $("#img-"+that.id+" img").attr("src", that.model.pngLocation() );
      }

    });

    return ImageView;
  });