// node-thumbnail
// (c) 2012-2017 Honza Pokorny
// Licensed under BSD
// https://github.com/honza/node-thumbnail

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const jimp = require('jimp');
const async = require('async');
const _ = require('lodash');

let options,
  queue,
  defaults,
  done,
  extensions,
  createQueue,
  run,
  resizer,
  isValidFilename,
  thumb;

defaults = {
  prefix: '',
  suffix: '_thumb',
  digest: false,
  hashingType: 'sha1',
  width: 800,
  concurrency: os.cpus().length,
  quiet: false,
  overwrite: false,
  skip: false,
  ignore: false, // Ignore unsupported format
  logger: message => console.log(message) // eslint-disable-line no-console
};

extensions = ['.jpg', '.jpeg', '.png'];

resizer = (options, callback) =>
  jimp.read(options.srcPath, (err, file) => {
    if (err) {
      let message = err.message + options.srcPath;
      return callback(null, message);
    }

    file.resize(options.width, jimp.AUTO);
    file.write(options.dstPath, callback);
  });

isValidFilename = file => extensions.includes(path.extname(file).toLowerCase());

evalCustomExtension = (customExtension, srcPath) => {
  if (extensions.includes(customExtension)) {
    return customExtension;
  }

  return path.extname(srcPath);
};

createQueue = (settings, resolve, reject) => {
  const finished = [];

  queue = async.queue((task, callback) => {
    if (settings.digest) {
      const hash = crypto.createHash(settings.hashingType);
      const stream = fs.ReadStream(task.options.srcPath);

      stream.on('data', d => hash.update(d));

      stream.on('end', () => {
        const d = hash.digest('hex');

        task.options.dstPath = path.join(
          settings.destination,
          d +
            '_' +
            settings.width +
            evalCustomExtension(settings.extension, task.options.srcPath)
        );

        const fileExists = fs.existsSync(task.options.dstPath);
        if (settings.skip && fileExists) {
          finished.push(task.options);
          callback();
        } else if (settings.overwrite || !fileExists) {
          resizer(task.options, (_, err) => {
            if (err) {
              callback(err);
              return reject(err);
            }
            finished.push(task.options);
            callback();
          });
        }
      });
    } else {
      const name = task.options.srcPath;
      const ext = path.extname(name);
      const base = task.options.basename || path.basename(name, ext);

      task.options.dstPath = path.join(
        settings.destination,
        settings.prefix +
          base +
          settings.suffix +
          evalCustomExtension(settings.extension, name)
      );

      const fileExists = fs.existsSync(task.options.dstPath);
      if (settings.skip && fileExists) {
        finished.push(task.options);
        callback();
      } else if (settings.overwrite || !fileExists) {
        resizer(task.options, (_, err) => {
          if (err) {
            callback(err);
            return reject(err);
          }
          finished.push(task.options);
          callback();
        });
      }
    }
  }, settings.concurrency);

  queue.drain = () => {
    if (done) {
      done(finished, null);
    }

    resolve(finished, null);

    if (!settings.quiet) {
      settings.logger('All items have been processed.');
    }
  };
};

run = (settings, resolve, reject) => {
  let images;

  if (fs.statSync(settings.source).isFile()) {
    images = [path.basename(settings.source)];
    settings.source = path.dirname(settings.source);
  } else {
    images = fs.readdirSync(settings.source);
  }

  const invalidFilenames = _.filter(images, _.negate(isValidFilename));
  const containsInvalidFilenames = _.some(invalidFilenames);

  if (containsInvalidFilenames && !settings.ignore) {
    const files = invalidFilenames.join(', ');
    return reject('Your source directory contains unsupported files: ' + files);
  }

  createQueue(settings, resolve, reject);

  _.each(images, image => {
    if (isValidFilename(image)) {
      options = {
        srcPath: path.join(settings.source, image),
        width: settings.width,
        basename: settings.basename
      };
      queue.push({ options: options }, () => {
        if (!settings.quiet) {
          settings.logger('Processing ' + image);
        }
      });
    }
  });
};

thumb = (options, callback) =>
  new Promise((resolve, reject) => {
    const settings = _.defaults(options, defaults);

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

    const sourceExists = fs.existsSync(options.source);
    const destExists = fs.existsSync(options.destination);
    let errorMessage;

    if (sourceExists && !destExists) {
      errorMessage =
        "Destination '" + options.destination + "' does not exist.";
    } else if (destExists && !sourceExists) {
      errorMessage = "Source '" + options.source + "' does not exist.";
    } else if (!sourceExists && !destExists) {
      errorMessage =
        "Source '" +
        options.source +
        "' and destination '" +
        options.destination +
        "' do not exist.";
    }

    if (errorMessage) {
      options.logger(errorMessage);

      if (callback) {
        callback(null, new Error(errorMessage));
      }

      reject(new Error(errorMessage));
    }

    if (callback) {
      done = callback;
    }

    run(settings, resolve, reject);
  });

exports.cli = options => {
  thumb(options).catch(error => {
    options.logger('ERROR: ' + error);
    process.exit(1);
  });
};

exports.thumb = thumb;
