'use strict';

const path = require('path');
const fs = require('fs');
const Controller = require('egg').Controller;
const { mkdirsSync, bufferToStream } = require('../../utils');
const { streamMerge } = require('split-chunk-merge');

const uploadPath = path.join(__dirname, '../../../uploads');

class NspController extends Controller {

  // 上传
  async upload() {
    const { ctx, app } = this;
    const nsp = app.io.of('/');
    const messgae = ctx.args[0] || {};

    try {
      const { file, index, chunkSize, hash } = messgae;
      const chunksPath = path.join(uploadPath, hash + '-' + chunkSize, '/');
      if (!fs.existsSync(chunksPath)) mkdirsSync(chunksPath);
      const readStream = bufferToStream(file);
      const writeStream = fs.createWriteStream(chunksPath + hash + '-' + index);
      // 管道
      readStream.pipe(writeStream);
      readStream.on('end', function() {
        // 通知进度
        nsp.emit('uploaded', {
          success: true,
        });
      });
    } catch (error) {
      app.logger.error(error);
    }
  }

  // 合并
  async merge() {
    const { ctx, app } = this;
    const nsp = app.io.of('/');
    const messgae = ctx.args[0] || {};
    const { chunkSize, name, total, hash } = messgae;
    // 根据hash,获取分片文件
    // 创建存储文件
    // 合并
    const chunksPath = path.join(uploadPath, hash + '-' + chunkSize, '/');
    const filePath = path.join(uploadPath, name);
    // 读取chunks文件名，放在数组中
    const chunks = fs.readFileSync(chunksPath);
    const chunksPathList = [];
    if (chunks.length !== total || chunks.length === 0) {
      nsp.emit('done', {
        success: false,
        msg: '切片文件数量与请求不符合， 无法合并',
      });
    }
    chunks.forEach(item => {
      chunksPathList.push(path.join(chunksPath, item));
    });
    streamMerge(chunksPathList, filePath, chunkSize).then(() => {
      nsp.emit('done', {
        success: false,
        msg: '切片文件数量与',
      });
    }).catch(() => {
      nsp.emit('done', {
        success: false,
        msg: '合并失败，请重试',
      });
    });
  }
}

module.exports = NspController;
