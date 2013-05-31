// A simple web server that generates dyanmic content based on responses from Redis

var application_root = __dirname,
    express = require("express"), //Web framework
    path = require("path"), //Utilities for dealing with file paths
    _ = require("underscore"),
    fs = require("fs"),
    winston = require("winston"),
    $ = require("jquery")
    url = require('url'),
    http = require('http');
var Buffer = require('buffer').Buffer;
var constants = require('constants');

// Set up loggin
winston.add(winston.transports.File, { filename: 'somefile.log' });

//Create server
var app = express.createServer();
// Configure server
app.configure(function () {
    app.use(express.bodyParser({downloadDir:'./tmp_downloads'})); //parses request body and populates req.body
    app.use(express.methodOverride()); //checks req.body for HTTP method overrides
    app.use(app.router); //perform route lookup based on url and HTTP method
    app.use(express.static(path.join(application_root, "public"))); //Where to serve static content
    app.set('redisdb', 2);
});
var after = "",
    DOWNLOAD_DIR = './tp_downloads/',
    openFiles = 0,
    iteration = 0,
    maxIteration = 10,
    subreddit = "gifs";

var getRedditLinks = function(subreddit, after) {
  iteration++;
  console.log("After: ", after);
  var root = "http://www.reddit.com/",
      path = subreddit === null ? root + ".json" : root + "r/" + subreddit + "/.json",
      urls = [];
  $.getJSON( path, {after: after}, function(data) {
    after = data.data.after;
    var data_end = data.data.children.length;
    for (var i = 0; i < data_end; i++) {
      var child = data.data.children[i].data;
      winston.info("URL number "+i+":\n"+ "id: " + child.id + " url: " + child.url);
      urls.push( {id: child.id, url:child.url} );
      if (i === data_end - 1) {
        followLinks(urls);
      }
    }
    if (iteration <= maxIteration) {
      getRedditLinks(subreddit, after);
    }
  });
};

var followLinks = function(urls) {
  var numUrls = urls.length;
  for (var i = 0; i < numUrls; i++) {
    if (( urls[i].url.slice(-5) ).split(".").length < 2) {
      urls[i].url += ".gif";
      console.log("New url: "+ urls[i].url);
      download_file_httpget(urls[i].url);
    } else {
      download_file_httpget(urls[i].url);
    }
  }
};
var createName = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}
// Function to download file using HTTP.get
var download_file_httpget = function(file_url) {
  console.log("Downloading "+file_url+"\n");
  var options = {
      host: url.parse(file_url).host,
      port: 80,
      path: url.parse(file_url).pathname
      };
  var file_name = createName();
  var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
  http.get(options, function(res) {
    res.on('data', function(data) {
      file.write(data);
    }).on('end', function() {
      file.end();
      console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR + "\n");
      // console.log("Checking file from: " + file_url);
      // check_file(DOWNLOAD_DIR + file_name);
    });
  }).on('error', function(err) {console.error("The following error ocurred: "+ err) });
};

var check_file = function(filename) {
  console.log("Checking file " + filename + "\n");
  fs.open(filename, 'r', function(status, fd) {
    if (status) {
      console.log(status.message);
      return;
    }
    buffer = new Buffer(3);
    fs.read(fd, buffer, 0, 3, 0, function(err, bytesRead, buffer) {
      if (err) {
        console.error("Error when checking file format.")
        fs.close(fd)
        return
      }
      if ( buffer.toString().toLowerCase() !== "gif" ) {
        console.log( filename + " was not a gif. Buffer was " + buffer.toString().toLowerCase() );
        fs.close(fd);
        fs.unlink(filename, function(ex) {
          console.error("Delete of "+filename+" failed with: "+ JSON.stringify(ex) );
        });
      } else {
        console.log(filename+ " was a gif.");
        filename.substring(filename.length - 4, filename.length) === ".gif" ? console.log("No rename") : fs.rename(filename, filename+".gif");
        fs.close(fd);
      }
    });
  });
};

(function() { getRedditLinks(subreddit, after) })();