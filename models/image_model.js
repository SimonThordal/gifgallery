var fs = require("fs"),
    _ = require('underscore'),
    Buffer = require('buffer').Buffer,
    knox = require('knox'),
    gm = require('gm'),
    mongoose = require('mongoose'),
    Comment = require('./comment_model.js');

// Set up knox. Note that the keys should go in a config file.
var client = knox.createClient({
    key: 'AKIAJFHJBIVVLUCT2WLA',
    secret: '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',
    bucket: 'provingphysics.com'
});

// Maximum image dimension
var MAX_DIM = 640;
var MIN_DIM = 128;

// Pagination
var IMAGES_PER_PAGE = 50;

// Path to the folder of images
var imagePath = "tp_downloads/";
// Set up MongoDB connection
mongoose.connect('mongodb://localhost/development');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'))
// MongoDB schema and model
var imageSchema = mongoose.Schema({
  name: {type: String},
  source: String,
  created_at: {type: Date, default: Date.now()},
  favourites: {type: Number, default: 0},
  width: Number,
  height: Number,
  tags: [String],
  comments: [Comment.schema],
  verified: {type: Boolean, default: false}
});

imageSchema.pre('save', function(next) {
  var that = this;
  if ( that.isNew ) {
    try {
      extractImageInfo.apply(that, [imagePath, that.name, function() {
        validateImage(function() {
          saveFirstTime(imagePath, that.name, next);
        });
      }]);
    } catch (error) {
      next(error);
    }
  }
});

imageSchema.statics.findByName = function(name, cb, options) {
  this.findOne({name: name}, function(err, image) {
    if (err) {
      throw err;
    }
    cb(image);
  });
};

imageSchema.statics.findByTags = function(options, cb) {
  var sortBy = {},
      tags = options.tags;
  sortBy[options.sortBy] = -1;
  var startFrom = options.page * IMAGES_PER_PAGE;
  this.where('tags').in(tags).sort(sortBy).skip(startFrom).limit(IMAGES_PER_PAGE).exec(function(err, images) {
    if (err) {
      throw err;
    }
    cb(images);
  });
};

imageSchema.statics.findByDateRange = function(upperLimit, lowerLimit, cb) {
  this.where('created_at').lte(upperLimit).gte(lowerLimit).exec(function(err, images) {
    if (err) {
      throw err;
    }
    cb(images);
  });
};

imageSchema.statics.findAll = function(options, cb) {
  var sortBy = {};
  sortBy[options.sortBy] = -1;
  var startFrom = options.page * IMAGES_PER_PAGE;
  this.find().sort(sortBy).skip(startFrom).limit(IMAGES_PER_PAGE).exec(function(err, images) {
    if (err) {
      throw err;
    }
    cb(images);
  });
};

imageSchema.methods.addComment = function(body, author, cb) {
  var that = this;
  Comment.create({body: body, author: author}, function(err, comment) {
    if (err) {
      throw err;
    }
    that.update( {$push: {comments:comment}} ).exec();
  });
  cb();
};

imageSchema.methods.addTag = function(name, cb) {
  var that = this;
  if (_.contains(that.tags, name) ){
    throw new Error('Image already has that tag.');
  }
  that.update( {$addToSet: {tags:name}} ).exec();
  cb();
};

imageSchema.methods.addLink = function(address, cb) {
  that.link = address;
  that.save();
  cb();
};

imageSchema.methods.incrementFavourites = function() {
  var that = this;
  that.favourites++;
  that.save();
};

imageSchema.methods.decrementFavourites = function() {
  var that = this;
  that.favourites--;
  that.save();
};


var MongoImage = mongoose.model('Image', imageSchema);

/*******************************************
* PRIVATE METHODS
*******************************************/

/*
Basically just a wrapper for fs.open
@path: Path of the file to open
@cb:   Function to be executed on completion
*/
var openImage = function(path, cb) {
  fs.open(path, 'r', function(status, fd) {
    if (status) {
      throw status;
    } else {
      cb(fd);
    }
  });
};

var isGif = function(file, info, cb) {
  var typeBuffer = new Buffer(3);
  fs.read(file, typeBuffer, 0, 3, 0, function(err, bytesRead, typeBuffer) {
    if (err) {
      throw err;
    } else if ( typeBuffer.toString().toLowerCase() !== "gif" ) {
      throw new Error(info.name + " was not a gif.");
    } else {
      cb();
    }
  });
};

var extractImageInfo = function(path, name, cb) {
  var that = this;
  var info = {name: name};
  openImage(path + name, function(file) {
    isGif(file, info, function() {
      var sizeBuffer = new Buffer(4);
      fs.read(file, sizeBuffer, 0, 4, 6, function(err, bytesRead, sizeBuffer) {
        if (err) {
          throw err;
        } else {
          // The dv is a non typed array that allows for access to heterogenous buffers while specifying endianness.
          var dv = new DataView(sizeBuffer);
          //that.set({height: dv.getUint16(2, true), width: dv.getUint16(0, true)});
          that.height = dv.getUint16(2, true);
          that.width = dv.getUint16(0, true);
          cb();
        }
      });
    fs.close(file);
    });
  });
};

/*
Validates that the image is a gif and that it is between a set of dimensions
@path: Relative path of the gif
@name: Name of the gif
@cb: Callback function
*/
var validateImage = function(cb) {
  if ( this.height > MAX_DIM || this.height < MIN_DIM || this.width > MAX_DIM || this.width < MIN_DIM) {
    throw new Error("Image too big or too small");
  }
  cb();
};

/*
Create a PNG of the gif and upload both it and the gif to S3
@path: Relative path of the gif
@name: Name of the gif
*/
var saveFirstTime = function(path, name, cb) {
  var callback = cb || function() { return null; };
  uploadToS3(imagePath, name, "gif", function() {
    createPNG(imagePath, name, function() {
      uploadToS3(imagePath, name+".png", "png", callback);
    });
  });
};

/*
 Creates a png version of the first frame of the gif
 @path: Relative path of the gif
 @name: Name of the gif
 @cb:   Function to be executed on completion
*/
var createPNG = function(path, name, cb) {
  gm(path+name+"[0]").write(imagePath+name + ".png", function(err) {
    if (err) {
      throw err;
    }
    cb();
  });
};

/*
Upload the file to the configurated S3 bucket
@path: Relative path of the file
@name: Name of the file
@cb:   Function to be executed on completion
@type: Filetype
*/
var uploadToS3 = function(path, name, type, cb) {
  fs.readFile(path + name, function(err, buf){
    if (err) {
      throw err;
    }
    var req = client.put('/images/' + name, {
        'Content-Length': buf.length,
        'Content-Type': 'image/'+type
    });
    req.on('response', function(res){
      if (200 == res.statusCode) {
        console.log('saved to %s', req.url);
        cb();
      } else {
        throw new Error('Could not upload ' + name + '.' + type + ' to S3');
      }
    });
    req.end(buf);
  });
};

module.exports = MongoImage;