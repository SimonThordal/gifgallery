var Image = require('./models/image_model.js'),
    fs = require('fs')
    exec = require('child_process').exec,
    winston = require('winston'),
    domain = require('domain'),
    async = require('async'),
    redis = require('redis').createClient();

winston.add(winston.transports.File, { filename: 'uploader.log' });

var mdom = domain.create();
var imdom = domain.create();
var tempDir = 'tp_downloads/';
var chunkSize = 10;

fs.readdir(tempDir, function(err, files) {
  if (err) {
    winston.error(err);
  } else {
    var tasks = [],
        i;
    async.each(files, function(file, callback) {
      if (file[0] !== ".") {
        tasks.push(function(callback) {
          try {
            cksum(tempDir + file, function(sum) {
              exists(sum, function(err) {
                if (err) {
                  winston.error('{path:'+file+',code:500,message: "Duplicate image exists"}');
                  callback();
                } else {
                  imdom.on('error', function(err) {
                    this.removeAllListeners();
                    callback();
                    winston.error(err);
                  });
                  imdom.run(function() {
                    Image.create({name: file}, imdom.intercept(function(image) {
                      imdom.removeAllListeners();
                      callback();
                    }));
                  });
                }
              })
            });
          } catch (err) {
            callback();
            winston.error(err);
          }
        });
      }
      callback()
  });
  async.series(tasks, function(err, results) {
    if(err) {
      console.error("**** ERROR ****");
    } else {
      console.log("***** ALL ITEMS HAVE BEEN CALLED WITHOUT ERROR ****");
    }
    redis.quit();
    process.exit();
  });
  }
});

var cksum = function(path, cb) {
  exec('cksum '+path, function(err, stdout, stderr) {
    if (err) {
      throw new Error('Error code: '+ err.code+'\n'+'Signal received: '+err.signal+'\n'+err.stack);
    }
    var sum = stdout.split(' ')[0];
    cb(sum);
  });
};

var exists = function(sum, cb) {
  redis.sadd('images:cksums', sum, function(err, response) {
    if (err) {
      throw err;
    }
    if (response === 0) {
      cb("Image already uploaded");
    } else if (response === 1) {
      cb();
    }
  });
}