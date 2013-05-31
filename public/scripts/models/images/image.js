define([
  "underscore",
  "backbone",
  'parseURI',
  "models/comments/comment",
  "models/comments/comments"
  ], function(_, Backbone, parseURI, Comment, Comments) {
    var Image = Backbone.Model.extend({
      initialize:function(){
        var that = this,
            _comments = that.get('comments');
        that.set('comments', new Comments());
        that.set('root', 'http://provingphysics.com.s3-website-us-east-1.amazonaws.com/images/')
        that.set("favourited", false);
        if ( Storage !== undefined ) {
          var temp = localStorage[that.get('id')] || "{}";
          var favourited = JSON.parse( temp ).favourited || false;
          that.set("favourited", favourited);
        }
        that.get('comments').add(_comments);
      },
      pngLocation: function(){
        return this.get('root') + this.get("name") + ".png";
      },
      gifLocation: function(){
        return this.get('root') + this.get("name");
      },
      postComment: function(data, cb) {
        var that = this;
        if (!data.comment || data.comment === "") {
          cb({}, {message: "You can't post empty comments."});
        } else {
          $.post(that.url()+'/comment',
            {comment:data.comment},
            function(data, textStatus, jqXHR) {
              var comment = new Comment({body: data.comment});
              cb(comment);
            }
          ).fail(function(data) {
            cb({}, {message: 'Looks like the post failed.'});
          });
        }
      },
      favourite: function(cb){
        var that = this;
        if ( that.get("favourited") ) {
          $.ajax({
            url: that.url(),
            data: {unfavourite:true},
            type: 'PUT',
            success: function() {
                      that.set("favourited", false);
                      if (Storage !== undefined) {
                        var temp = localStorage[that.get('id')] || "{}";
                        localStorage[that.get('id')] = JSON.stringify(_.extend(JSON.parse( temp ), {favourited: false} ));
                      }
                      cb();
                    }
                }).fail(function(data) {
            cb({message: 'Looks like there was an error favouriting the image'});
          });
        } else {
          $.ajax({
            url: that.url(),
            data: {unfavourite:false},
            type: 'PUT',
            success: function() {
                      that.set("favourited", true);
                      if (Storage !== undefined) {
                        var temp = localStorage[that.get('id')] || "{}";
                        localStorage[that.get('id')] = JSON.stringify(_.extend(JSON.parse( temp ), {favourited: true} ));
                      }
                      cb();
                    }
                }).fail(function(data) {
            cb({message: 'Looks like there was an error favouriting the image'});
          });
        }
      },
      postSource: function(_link, cb) {
        var that = this;
        if ( parseUri(_link).host.split(".").length < 2 ) {
          cb("The provided link seemed to be of a wrong format.");
        } else {
          var link = _link;
          if (parseUri(_link).protocol === "") {
            link = "http://".concat(_link);
          }
          $.ajax({
            url: that.url(),
            data: { link: link },
            type: 'PUT',
            success: function() {
              that.set('link', link);
              cb(link);
            }
          }).fail(function() {
            cb({}, "There was an error posting the source to the image");
          });
        }
      }
    });
    return Image;
  });