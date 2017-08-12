// node-thumbnail
// (c) 2012-2017 Honza Pokorny
// Licensed under BSD
// https://github.com/honza/node-thumbnail

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var os = require('os');

var jimp = require('jimp');
var async = require('async');
var _ = require('lodash');

var options, queue, defaults, done, extensions, createQueue, run, resizer, isValidFilename;


defaults = {
  prefix : '',
  suffix: '_thumb',
  digest: false,
  hashingType: 'sha1',
  width: 800,
  concurrency: os.cpus().length,
  quiet: false,
  overwrite: false,
  ignore: false, // Ignore unsupported format
  logger: function(message) {
    console.log(message); // eslint-disable-line no-console
  }
};


extensions = [
  '.jpg',
  '.jpeg',
  '.png'
];


resizer = function(options, callback) {
  jimp.read(options.srcPath, function(err, file) {
    if (err) {
      throw err;
    }

    file.resize(options.width, jimp.AUTO);
    file.write(options.dstPath, callback);

  });
};

isValidFilename = function(file) {
  return _.indexOf(extensions, path.extname(file).toLowerCase()) > -1;
};

createQueue = function(settings, resolve, reject) {

  var finished = [];

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

        if (settings.overwrite || !fs.existsSync(task.options.dstPath)) {
          resizer(task.options, function() {
            finished.push(task.options);
            callback();
          });
        }

      });

    } else {
      var name = task.options.srcPath;
      var ext = path.extname(name);
      var base = task.options.basename || path.basename(name, ext);

      task.options.dstPath = settings.destination + '/' + settings.prefix + base +
        settings.suffix + ext;

      if (settings.overwrite || !fs.existsSync(task.options.dstPath)) {
        resizer(task.options, function() {
          finished.push(task.options);
          callback();
        });
      }
    }

  }, settings.concurrency);

  queue.drain = function(hi) {
    if (done) {
      done(finished, null);
    }

    resolve(finished, null);

    if (!settings.quiet) {
      settings.logger('All items have been processed.');
    }
  };
};


run = function(settings, resolve, reject) {
  var images;

  if (fs.statSync(settings.source).isFile()) {
    images = [path.basename(settings.source)];
    settings.source = path.dirname(settings.source);
  } else {
    images = fs.readdirSync(settings.source);
  }

  var containsInvalidFilenames = _.some(images, _.negate(isValidFilename));

  if (containsInvalidFilenames && !settings.ignore) {
    throw new Error('Unsupported file format.');
  }

  createQueue(settings, resolve, reject);

  _.each(images, function(image) {

    if (!isValidFilename(image) && !settings.ignore) {
      return true;
    }

    options = {
      srcPath: settings.source + '/' + image,
      width: settings.width,
      basename: settings.basename
    };

    queue.push({options: options}, function() {
      if (!settings.quiet) {
        settings.logger(image);
      }
    });

  });
};


exports.thumb = function(options, callback) {
  return new Promise(function(resolve, reject) {
    var settings = _.defaults(options, defaults);

    // options.args is present if run through the command line
    if (options.args) {

      if (options.args.length !== 2) {
        options.logger('Please provide a source and destination directories.');
        return;
      }

      options.source = options.args[0];
      options.destination = options.args[1];
    }

    settings.width = parseInt(settings.width, 10);

    var sourceExists = fs.existsSync(options.source);
    var destExists = fs.existsSync(options.destination);
    var errorMessage;

    if (sourceExists && !destExists) {
      errorMessage = 'Destination \'' + options.destination + '\' does not exist.';
    } else if (destExists && !sourceExists) {
      errorMessage = 'Source \'' + options.source + '\' does not exist.';
    } else if (!sourceExists && !destExists) {
      errorMessage = 'Source \'' + options.source + '\' and destination \'' +
        options.destination + '\' do not exist.';
    }

    if (errorMessage) {
      options.logger(errorMessage);

      if (callback) {
        callback(null, new Error(errorMessage));
      }

      reject(null, new Error(errorMessage));
    }

    if (callback) {
      done = callback;
    }

    run(settings, resolve, reject);
  });
};
