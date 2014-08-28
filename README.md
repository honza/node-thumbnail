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
    -p PREFIX, --prefix PREFIX
    -d, --digest
    -t TYPE, --hashing-type TYPE

    -w, --width

    -c NUM, --concurrency NUM

    -o, --overwrite
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
}, function(err) {
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
  overwrite: false
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
