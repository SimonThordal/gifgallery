var _ = require('underscore'),
    mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
  created_at: {type: Date, default: Date.now()},
  body: {type: String, required: true},
  author: {type: String, required: true},
  comments: [commentSchema]
});

var MongoComment = mongoose.model('Comment', commentSchema);

commentSchema.methods.addComment = function(body, author) {
  var that = this;
  Comment.create({body: body, author: author}, function(err, comment) {
    if (err) {
      throw err;
    }
    that.comments.push(comment);
  });
  that.save();
};

module.exports = MongoComment;