// A simple web server that generates dyanmic content based on responses from Redis

var application_root = __dirname,
    winston = require("winston"),
    express = require("express"), //Web framework
    path = require("path"), //Utilities for dealing with file paths
    _ = require("underscore"),
    fs = require("fs"),
    gm = require("gm"),
    redis_client = require('redis').createClient();
    Buffer = require('buffer').Buffer;

// Require controllers
var Images = require('./controllers/images_controller.js');
var Tags = require('./controllers/tags_controller.js');

// Set up logging of requests
winston.add(winston.transports.File, { filename: 'requests.log' });

var logger = function(req,res,next) {
  console.log('%s %s', req.method, req.url);
  next();
};

//Create server
var app = express.createServer();
// Configure server
app.configure(function () {
    //Simple logger
    app.use(logger);
    app.use(express.bodyParser({uploadDir:'./tmp_uploads'})); //parses request body and populates req.body
    app.use(express.methodOverride()); //checks req.body for HTTP method overrides
    app.use(app.router); //perform route lookup based on url and HTTP method
    app.use(express.static(path.join(application_root, "public"))); //Where to serve static content
    app.set('redisdb', 2);
  });





// // Maximum image dimension
// var MAX_DIM = 640;
// // Whitelist for sorting criteria
// var SORTING_CRITERIA = {date:"created_at", popularity: "favourites"};
// // Pagination
// var IMAGES_PER_PAGE = 50;

// // The dir to save at
// var imageDir = __dirname + "/public/imagefolder/";

// var openImage = function(path, file, cb) {
//   fs.open(path, 'r', function(status, fd) {
//     if (status) {
//       cb({responseText: "Error opening file", status: 500});
//       return false;
//     } else {
//       validateImage(fd, file, path, cb);
//     }
//   });
// };

// // Check if image is a gif and check the size of the image
// var validateImage = function(fd, file, path, cb) {
//   var typeBuffer = new Buffer(3);
//   fs.read(fd, typeBuffer, 0, 3, 0, function(err, bytesRead, typeBuffer) {
//     if (err) {
//       console.error("Error at server.js, line 84:\n", err);
//       cb({responseText: "Error reading file", status: 500});
//       return false;
//     } else if ( typeBuffer.toString().toLowerCase() !== "gif" ) {
//       console.error(file.name + "was not a gif.");
//       cb({responseText:file.name + "was not a gif.", status: 502});
//       return false;
//     } else {
//       console.log(file.name + "was a gif.");
//       var sizeBuffer = new Buffer(4);
//       fs.read(fd, sizeBuffer, 0, 4, 6, function(err, bytesRead, sizeBuffer) {
//         if (err) {
//           console.error("Error at server.js, line 98:\n", err);
//           cb({responseText: "Error reading file", status: 500});
//           return false;
//         } else {
//           cb({responseText:"Image uploaded succesfully.", status:200});
//           // The dv is a non typed array that allows for access to heterogenous buffers while specifying endianness.
//           var dv = new DataView(sizeBuffer),
//           dim={width:"",height:""};
//           dim.width = dv.getUint16(0, true);
//           dim.height = dv.getUint16(2, true);
//           file.dim = dim;
//           if ( _.max(dim) > MAX_DIM ) {
//             resizeAndSaveImage(file, path, {resize:true});
//           } else {
//             resizeAndSaveImage(file, path, {});
//           }
//         }
//       });
//     }
//     fs.close(fd);
//   });
// };

// var resizeAndSaveImage = function (file, path, options) {
//   var filename = file.name;
//   if (options.resize === true) {
//     gm(path+"[0]").resize(MAX_DIM).write(imageDir+filename + ".png", function(err) {
//       if (err) {
//         console.error(JSON.stringify(err));
//         return false;
//       } else {
//         gm(path).write(imageDir+filename + ".gif", function(err) {
//           if (err) {
//             console.error(JSON.stringify(err));
//             return false;
//           } else {
//             _.max(file.dim, function(dimension){
//               var factor = MAX_DIM/dimension;
//               file.dim.width = file.dim.width*factor;
//               file.dim.height = file.dim.height*factor;
//               storeInRedis(file, filename);
//               client.put("/test/"+filename, {
//                 content.length:
//               })
//             });
//           }
//         });
//       }
//     });
//   } else {
//     gm(path+"[0]").write(imageDir + filename + ".png", function(err) {
//       if (err) {
//         console.error(JSON.stringify(err));
//         return false;
//       } else {
//         gm(path).write(imageDir + filename + ".gif", function(err) {
//           if (err) {
//             console.error(JSON.stringify(err));
//             return false;
//           } else {
//             storeInRedis(file, filename);
//           }
//         });
//       }
//     });
//   }
// };

// var imageExists = function(id, cb) {
//   redis_client.exists("image:"+id, function(err, response) {
//     if (err) {
//       cb({}, err);
//     } else if (response === 0) {
//       cb({}, "ID was not found in database.");
//     } else {
//       cb();
//     }

//   });
// };

// /* Parse the comment by matching any tags and adding them separately to the image
// @id: The ID of the image
// @comment: The comment provided by the user */
// var parseComment = function(id, comment, cb) {
//   imageExists(id, function(response, err) {
//     if (err) {
//       cb({}, err);
//     } else {
//       var pattern = /#(\w*[a-zA-Z_-]+\w*)/g;
//       var tags = comment.match(pattern);
//       if (tags !== null) {
//         addTags(id, tags, function(response, err) {
//           if (err) {
//             cb(JSON.stringify(err));
//           }
//           addComment(id, comment, cb);
//         });
//       } else {
//         addComment(id, comment, cb);
//       }
//     }
//   });
// };

// var addComment = function(id, comment, cb) {
//   redis_client.sadd(id + ":comments", comment, function(err, response) {
//     if (err) {
//       cb(JSON.stringify(err));
//     } else {
//       cb({id:id, comment:comment});
//     }
//   });
// };

// var getComments = function(images, cb) {
//   var callback = _.after(images.length, function(images) {
//     cb(images);
//   });
//   _.each(images, function(image) {
//     redis_client.smembers(image.id + ":comments", function(err, comments) {
//       image.comments = _.map(comments, function(comment) { return {body:comment}; }) || [];
//       callback(images);
//     });
//   });
// };

// var getTags = function(images, cb) {
//   var callback = _.after(images.length, function(images) {
//     cb(images);
//   });
//   _.each(images, function(image) {
//     redis_client.smembers(image.id + ":tags", function(err, tags) {
//       image.tags = tags || [];
//       callback(images);
//     });
//   });
// };

// var addTags = function(id, _tags, cb) {
//   var multi = redis_client.multi(),
//       tags  = [];
//   var addToImage = _.after(_tags.length, function() {
//     multi.sadd(id + ":tags", tags);
//   });
//   _.each(_tags, function(tag) {
//     tags.push(tag.slice(1));
//     addToImage();
//   }, this);
//   _.each(tags, function(tag) {
//     multi.sadd("tag:"+tag, id);
//     multi.scard("tag:"+tag, function(err, cardinality) {
//       if (err) {
//         console.log("Error in computing the cardinality of the tagset.");
//       } else {
//         redis_client.zadd(["tags", cardinality, tag], function() {

//         });
//       }
//     });
//   });
//   multi.exec(function(err) {
//     if (err) {
//       cb({}, err);
//     } else {
//       cb();
//     }
//   });
// };

// var getFromTags = function(tags, cb) {
//   var tagArray = [];
//   _.each(tags, function(tag) {
//     tagArray.push('tag:'+tag);
//   });
//   redis_client.sunion(tagArray, function(err, response) {
//     if (err) {
//       cb({}, err );
//     } else {
//       cb(response);
//     }
//   });
// };

// var getAll = function(cb) {
//   redis_client.lrange(["all", 0, -1], function(err, response) {
//     if (err) {
//       cb({}, err);
//     }
//     else if (response.length === 0) {
//       cb({}, "No images were found");
//     } else {
//       cb(response);
//     }
//   });
// };


// sortByCriteria = function(ids, criteria, page, cb) {
//   if (page === undefined) {
//     page = 0;
//   }
//   var offset = page * IMAGES_PER_PAGE;
//   ids.splice(0,0,["ids"]);
//   redis_client.lpush(ids, function(err, response) {
//     if (err) {
//       cb({}, "An error retrieving images.");
//     } else {
//       redis_client.sort(["ids", "by", "image:*->"+criteria, "LIMIT", offset, 50],
//         function(err, response) {
//           if (err) {
//             console.log(err);
//             cb({}, "An error retrieving images.");
//           } else {
//             cb(response, err);
//             redis_client.del("ids", function(response) {
//               console.log(response);
//             });
//           }
//         }
//       );
//     }
//   });
// };

// var getFromIDs = function(ids, cb) {
//   var modelArray = [];
//   if (ids === undefined || ids.length === 0) {
//     cb({}, "No images found");
//   } else {
//     var callback = _.after(ids.length, function() {
//       if (modelArray.length === 0) {
//         cb({}, "No images found");
//       } else {
//         getComments(modelArray, function(models) {
//           getTags(models, cb);
//         });
//       }
//     });
//     _.each(ids, function(id) {
//       redis_client.hgetall("image:"+id, function(err, response) {
//         if (response !== null) {
//           modelArray.push(
//             {
//               id:id,
//               created_at:response.created_at,
//               width:response.width,
//               height:response.height
//             }
//           );
//           if (response.approved === "true" && response.link) {
//             modelArray[modelArray.length-1].link = link;
//           }
//         }
//         callback();
//       });
//     });
//   }
// };

// var deleteImage = function(filename, cb) {
//   fs.unlink(__dirname + imageDir + filename, cb(err));
// };

// var incrementFav = function(id, cb) {
//   imageExists(id, function() {
//     redis_client.incr("favourites:"+id, function(err, response) {
//       if (err) {
//         cb({}, err);
//       } else {
//         cb();
//       }
//     });
//   });
// };

// var decrementFav = function(id, cb) {
//   imageExists(id, function() {
//     redis_client.decr("favourites:"+id, function(err, response) {
//       if (err) {
//         cb({}, err);
//       } else {
//         cb();
//       }
//     });
//   });
// };

// var addLink = function(id, link, cb) {
//   imageExists(id, function() {
//     redis_client.hmset(["image:"+id, "link", link, "approved", false], function(err, response) {
//       if (err) {
//         console.error(err);
//         cb({}, err);
//       } else {
//         winston.info(id + " has the following unverified link:\n"+link);
//         cb();
//       }
//     });
//   });
// };

// var createName = function(object, cb) {
//   var filename = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
//     return v.toString(16);
//   });
// };

// var storeInRedis = function(file, filename) {
//   var timestamp =  Date.now();
//   var multi = redis_client.multi();
//   multi.hmset( "image:" + filename, { "created_at": timestamp,
//                                       "width": file.dim.width,
//                                       "height": file.dim.height,
//                                       "favourites": 0
//                                     }
//              );
//   multi.lpush("all", filename);
//   multi.exec( function(err, responses) {
//     if (err) {
//       console.log( JSON.stringify(err) );
//     }
//   });
// };

// var indexTags = function(cb) {
//   redis_client.zrevrange(["tags", 0, 400], function(err, response) {
//     if (err) {
//       cb({}, "Error retrieving tags");
//       console.error(err);
//     } else {
//       if (response.length > 0) {
//         var popularTags = [];
//         var callback = _.after(response.length, function() {
//           cb(popularTags);
//         });
//         _.each(response, function(item) {
//           popularTags.push(item);
//           callback(popularTags);
//         });
//       }
//     }
//   });
// };

app.post('/images', Images.addImage);

app.get('/images/:id', Images.getImage);

app.delete('/images/:id', Images.deleteImage);

app.get('/images', Images.getImages);

app.post('/images/:id/tag', Images.addTag);

app.post('/images/:id/comment', Images.addComment);

app.put('/images/:id/fav', Images.toggleFavourite);

app.put('/images/:id/link', Images.addLink);

app.get('/tags', Tags.index);


// Define some routes (should probably be in another file, but w/e

// app.post("/images", function(req, res) {
//   that = this;
//   file = req.files.image;
//   openImage("./" + file.path, file, function(response) {
//     res.send(response);
//     res.end();
//   });
// });

// app.get( "/images/:id", function(req, res) {
//   getFromIDs(req.params.id, function(response, err){
//     if (err) {
//       res.send(500, 'An error occurred while fetching the image.');
//       console.error("Error getting image: ", JSON.stringify(err));
//     } else {
//       res.send(response);
//     }
//   });
// });

// app.delete( "/images/:name", function (req, res) {
//   redis_client.hget( ["image:" + req.params.name, "created_at"], function(timestamp, err) {
//     if (!err) {
//       var multi = redis_client.multi();
//       multi.zrem(["images:timestamp", timestamp]);
//       multi.del("image:"+req.params.name);
//       multi.exec( function(err, responses) {
//         if (!err) {
//           deleteImage(req.params.name, function(err) {
//             if (err) {
//               redis_client.lpush(["delete:failed", req.params.name]);
//             } else {
//               res.status(200).send();
//             }
//           });
//         } else {
//           res.send({
//             status: 500,
//             message: JSON.stringify(err)
//           });
//         }
//       });
//     }
//   });
// });

// app.get('/images', function(req, res) {
//   var tags = req.query.tags;
//   var sortingCriteria = req.query.sortBy || "date";
//   var page = parseInt(req.query.page, 10) || 0;
//   if (tags !== undefined && tags.length > 0 && SORTING_CRITERIA[sortingCriteria] !== undefined) {
//     getFromTags(tags, function(images, err) {
//       if (err) {
//         res.send(500, {message: "An error occurred when retrieving images."});
//         console.error(err);
//       } else if (images.length === 0) {
//         res.send(404, {message: "No images were found."});
//       } else {
//         sortByCriteria(images, SORTING_CRITERIA[sortingCriteria], page, function(ids, err) {
//           if (err) {
//             res.send(500, {
//               message: err
//             });
//           } else {
//             getFromIDs(ids, function(images, err) {
//               if (err) {
//                 res.send(500, {
//                   message: err
//                 });
//               } else {
//                 res.send(images);
//               }
//             });
//           }
//         });
//       }
//     });
//   } else {
//     getAll(function(images, err) {
//       if (err) {
//         res.send(500, {message: "There was an error retrieving the images"});
//       } else if (images.length === 0) {
//         res.send(404, {message: "No images were found"});
//       } else {
//         sortByCriteria(images, sortingCriteria, page, function(images, err) {
//           if (err) {
//             res.send(500, {message: "There was an error retrieving the images"});
//             console.error(err);
//           } else {
//             getFromIDs(images, function(response, err) {
//               if (err) {
//                 res.send(500, {message: "There was an error retrieving the images"});
//               } else {
//                 res.send(response);
//               }
//             });
//           }
//         });
//       }
//     });
//   }
// });

// app.put('/images/:id', function(req, res) {
//   if (req.body.link) {
//     addLink(req.params.id, req.body.link, function(err) {
//       if (err) {
//         console.error(err);
//         res.send(500, {message: "An error occurred adding a link to the image"});
//       } else {
//         res.send(200);
//       }
//     });
//   }
//   else if (req.body.unfavourite === "true" ) {
//     decrementFav(req.params.id, function(err) {
//       if (err) {
//         res.send(500, {message: "An error occurred favouriting the image"});
//       } else {
//         res.send(200);
//       }
//     });
//     return;
//   }
//   else if (req.body.unfavourite === "false" ) {
//     incrementFav(req.params.id, function(err) {
//       if (err) {
//         res.send(500, {message: "An error occurred favouriting the image"});
//       } else {
//         res.send(200);
//       }
//     });
//     return;
//   }
//   else {
//     res.send(404);
//   }
// });


// app.post('/images/:id/tag', function(req, res) {
//   if (req.body.tags !== undefined) {
//     var tags = req.body.tags;
//     var id = req.params.id;
//     addTags(id, tags, function(response, err) {
//       if (err) {
//         res.send({
//           status: 500,
//           message: JSON.stringify(err)
//         });
//       } else {
//         res.send({
//           status: 200,
//           message: response
//         });
//       }
//     });
//   } else {
//     res.send(500, {message: "Incomplete or faulty request"});
//   }
// });

// app.post('/images/:id/comment', function(req, res) {
// if (req.body.comment !== undefined) {
//     var id = req.params.id;
//     parseComment(id, req.body.comment, function(response, err) {
//       if (err) {
//         res.send(500, err);
//       } else {
//         res.send({id:response.id, comment:response.comment});
//       }
//     });
//   }
// });

// app.get('/tags', function(req, res) {
//   indexTags(function(response, err) {
//       if (err) {
//         res.send(500, err);
//       } else {
//         res.send(response);
//       }
//   });
// });

//Start server
app.listen(4711, function () {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
