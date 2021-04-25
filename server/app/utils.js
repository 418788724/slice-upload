'use strict';

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const mkdirsSync = dirname => {
  if (fs.existsSync(dirname)) {
    return false;
  }
  if (mkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }
};

const bufferToStream = binary => {
  const rendableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return rendableInstanceStream;
};

module.exports = {
  mkdirsSync,
  bufferToStream,
};
