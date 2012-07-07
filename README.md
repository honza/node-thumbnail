node-thumbnail
==============

thumbnail all the things

node-thumbnail creates a queue of images and converts them asynchronously using
imagemagick - it's super fast

command-line usage
------------------

    thumb [options] source/path dest/path

options:

    -h, --help
    -v, --version

    -s SUFFIX, --suffix SUFFIX
    -d, --digest
    -t TYPE, --hashing-type TYPE

    -w, --width

    -c NUM, --concurrency NUM

    -q, --quiet

api
---

```js
var thumb = require('node-thumbnail').thumb;

// thumb(options, callback);

thumb({
  source: 'source/path',
  destination: 'dest/path',
  concurrency: 4
}, function() {
  console.log('All done!');
});
```

default options:

```js
defaults = {
  suffix: '_thumb',
  digest: false,
  hashingType: 'sha1', // 'sha1', 'md5', 'sha256', 'sha512'
  width: 800,
  concurrency: 2
};
```

**Note** you must specify at least `source` and `destination`

installation
------------

    $ brew install imagemagick
    $ npm install node-thumbnail

license
-------

BSD, short and sweet
