var _ = require('underscore'),
    mongoose = require('mongoose');

var tagSchema = mongoose.Schema({
  images: [String],
  name: {type: String, unique: true}
});

var MongoTag = mongoose.model('Comment', tagSchema);

module.exports = MongoTag;