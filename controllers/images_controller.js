var assert = require('assert'),
    winston = require('winston'),
    Image = require('../models/image_model.js');

// Whitelist for sorting criteria
var SORTING_CRITERIA = {date:"created_at", popularity: "favourites"};

module.exports.addComment = function(req, res) {
  try {
    assert(req.body.comment, "No comment provided.");
    assert.equals(typeof(req.body.comment), String, "Comment were not a string");
    assert(req.params.id, "No image-id provided");
    var comment = req.body.comment;
    var image = req.params.id;
    Image.findByName(image, function(image) {
      image.addComment(comment, function() {
        res.send(200);
      });
    });
  } catch (err) {
    winston.error(err);
    res.send(500);
  }
};

module.exports.addTag = function(req, res) {
  try {
    assert(req.body.tags, "No tags provided.");
    assert.strictEqual(typeof(req.body.tags), "string", "Tags were not a string");
    assert(req.params.id, "No image-id provided");
    var tags = req.body.tags;
    var image = req.params.id;
    Image.findByName(image, function(image) {
      try {

        image.addTag(tags, function() {
          res.send(200);
        });
      } catch (err) {
        winston.error(err);
        res.send(500);
      }
    }, {});
  } catch (err) {
    winston.error(err);
    res.send(500);
  }
};

module.exports.getImage = function(req, res) {

};

module.exports.deleteImage = function(req, res) {

};

module.exports.getImages = function(req, res) {
  try {
    var parameters = {
      tags: req.query.tags || [],
      sortBy: SORTING_CRITERIA[req.query.sortBy] || "date",
      page: parseInt(req.query.page, 10) || 0
    };
    if (parameters.tags.length > 0){
      Image.findByTags(parameters, function(images) {
        if (!images || images.length < 1) {
          res.send(404);
        } else {
          res.send(images);
        }
      });
    } else {
      Image.findAll(parameters, function(images) {
        if (!images || images.length < 1) {
          res.send(404);
        } else {
          res.send(images);
        }
      });
    }
  } catch (err) {
    winston.error(err);
    res.send(500);
  }
};

module.exports.toggleFavourites = function(req, res) {
  assert(req.params.id, "No image-id provided");
  assert.strictEqual(typeof(req.body.action), "boolean", "Action must be true of false");
  Image.findByName(req.params.id, function(image) {
    image.toggleFavourite(req.body.action, function() {
      res.send(200);
    });
  });
};

module.exports.addLink = function(req, res) {

};

module.exports.addImage = function(req, res) {

};