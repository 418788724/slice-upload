'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }

  // 跨域
  cors: {
    enable: true,
    package: 'egg-cors',
  },

  // io
  io: {
    enable: true,
    package: 'egg-socket.io',
  },
};
