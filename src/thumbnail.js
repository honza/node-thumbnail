// node-thumbnail
// (c) 2012 Honza Pokorny
// Licensed under BSD
// https://github.com/honza/node-thumbnail

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var im = require('imagemagick');
var async = require('async');
var _ = require('underscore');

var options, queue, defaults, done, extensions, createQueue, run;


defaults = {
  suffix: '_thumb',
  digest: false,
  hashingType: 'sha1',
  width: 800,
  concurrency: 2,
  quiet: false
};


extensions = [
  '.jpg',
  '.jpeg',
  '.JPG',
  '.JPEG',
  '.png',
  '.PNG'
];


createQueue = function(settings) {

  queue = async.queue(function(task, callback) {

    if (settings.digest) {

      var hash = crypto.createHash(settings.hashingType);
      var stream = fs.ReadStream(task.options.srcPath);

      stream.on('data', function(d) {
        hash.update(d);
      });

      stream.on('end', function() {
        var d = hash.digest('hex');

        task.options.dstPath = settings.destination + '/' + d + '_' +
          settings.width + path.extname(task.options.srcPath);

        im.resize(task.options, function(err, stdout, stderr) {
          callback();
        });

      });

    } else {
      var name = task.options.srcPath;
      var ext = path.extname(name);
      var base = path.basename(name, ext);

      task.options.dstPath = settings.destination + '/' + base +
        settings.suffix + ext;

      im.resize(task.options, function(err, stdout, stderr) {
        callback();
      });
    }

  }, settings.concurrency);

  queue.drain = function() {
    if (done) {
      done();
    } else {
      if (!settings.quiet) {
        console.log('all items have been processed');
      }
    }
  };
};


run = function(settings) {
  var images = fs.readdirSync(settings.source);
  images = _.reject(images, function(file) {
    return _.indexOf(extensions, path.extname(file)) === -1;
  });

  createQueue(settings);

  _.each(images, function(image) {

    options = {
      srcPath: settings.source + '/' + image,
      width: settings.width
    };

    queue.push({options: options}, function() {
      if (!settings.quiet) {
        console.log(image);
      }
    });

  });
};


exports.thumb = function(options, callback) {
  var settings;

  if (options.args) {

    if (options.args.length != 2) {
      console.log('Please provide a source and destination directories.');
      return;
    }

    options.source = options.args[0];
    options.destination = options.args[1];

  }

  if (fs.existsSync(options.source) && fs.existsSync(options.destination)) {
    settings = _.defaults(options, defaults);
  } else {
    console.log("Origin or destination doesn't exist.");
    return;
  }

  if (callback) {
    done = callback;
  }

  run(settings);

};
