node-thumbnail
==============

[![npm version](https://badge.fury.io/js/node-thumbnail.svg)](https://badge.fury.io/js/node-thumbnail) [![Build Status](https://travis-ci.org/honza/node-thumbnail.svg?branch=master)](https://travis-ci.org/honza/node-thumbnail)

thumbnail all the things

node-thumbnail creates a queue of images and converts them asynchronously into
thumbnails.  node-thumbnail has no binary dependencies --- only javascript.

Command-line usage
------------------

    thumb [options] source/path dest/path

options:

    -h, --help
    -v, --version

    -s SUFFIX, --suffix SUFFIX
    -p PREFIX, --prefix PREFIX
    -d, --digest
    -t TYPE, --hashing-type TYPE

    -w, --width

    -c NUM, --concurrency NUM

    -o, --overwrite
    -s, --skip
    -i, --ignore
    -q, --quiet

API
---

You can use this library with callbacks, or with promises.

### callbacks

```js
var thumb = require('node-thumbnail').thumb;

// thumb(options, callback);

thumb({
  source: 'source/path', // could be a filename: dest/path/image.jpg
  destination: 'dest/path',
  concurrency: 4
}, function(files, err, stdout, stderr) {
  console.log('All done!');
});
```

default options:

```js
defaults = {
  prefix: '',
  suffix: '_thumb',
  digest: false,
  hashingType: 'sha1', // 'sha1', 'md5', 'sha256', 'sha512'
  width: 800,
  concurrency: <num of cpus>,
  quiet: false, // if set to 'true', console.log status messages will be supressed
  overwrite: false,
  skip: false, // Skip generation of existing thumbnails
  basename: undefined, // basename of the thumbnail. If unset, the name of the source file is used as basename.
  ignore: false, // Ignore unsupported files in "dest"
  logger: function(message) {
    console.log(message);
  }
};
```

**Note** you must specify at least `source` and `destination`

### promises

The options that you can pass in are the same as above.

```js
thumb({
  source: 'src',
  destination: 'dest'
}).then(function() {
  console.log('Success');
}).catch(function(e) {
  console.log('Error', e.toString());
});
```

Installation
------------

    $ npm install node-thumbnail

License
-------

BSD, short and sweet
