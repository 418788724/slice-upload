'use strict';

const path = require('path');
const fs = require('fs');
const Controller = require('egg').Controller;
const { mkdirsSync } = require('../utils');
const { streamMerge } = require('split-chunk-merge');

const uploadPath = path.join(__dirname, '../../uploads');

class HomeController extends Controller {
  // hash检查
  async hashCheck() {
    const { ctx } = this;
    const { total, chunkSize, hash } = ctx.request.body;
    const chunksPath = path.join(uploadPath, hash + '-' + chunkSize, '/');
    if (fs.existsSync(chunksPath)) {
      // 判断是否上传完还是要断点续传
      const chunks = fs.readdirSync(chunksPath);
      if (chunks.length !== 0 && chunks.length === total) {
        ctx.status = 200;
        ctx.body = {
          success: true,
          msg: '检查成功，文件已存在，不用重复上传',
          data: {
            type: 2,
          },
        };
      } else {
        const index = [];
        chunks.forEach(item => {
          const chunksNameArr = item.split('-');
          index.push(chunksNameArr[chunksNameArr.length - 1]);

          ctx.status = 200;
          ctx.body = {
            success: true,
            msg: '检查成功，需要断点续传',
            data: {
              type: 1,
              index,
            },
          };
        });
      }
    } else {
      ctx.status = 200;
      ctx.body = {
        success: true,
        msg: '检查成功，请上传',
        data: {
          type: 0,
        },
      };
    }
  }

  // 分片上传
  async chunksUpload() {
    const { ctx } = this;
    const { index, chunkSize, hash } = ctx.request.body;
    // form-data
    const file = ctx.request.files[0];

    const chunksPath = path.join(uploadPath, hash + '-' + chunkSize, '/');
    if (!fs.existsSync(chunksPath)) mkdirsSync(chunksPath);
    const readStream = fs.createReadStream(file.filepath);
    const writeStream = fs.createWriteStream(chunksPath + hash + '-' + index);
    // 管道
    readStream.pipe(writeStream);
    readStream.on('end', function() {
      // 删除临时文件
      fs.unlinkSync(file.filepath);
    });
    ctx.status = 200;
    ctx.body = {
      success: true,
      msg: '上传成功',
    };
  }

  // 分片合并
  async chunksMerge() {
    // this.ctx.body = '分片合并';
    const { ctx } = this;
    const { chunkSize, name, total, hash } = ctx.request.body;
    // 根据hash获取分片文件
    const chunksPath = path.join(uploadPath, hash + '-' + chunkSize, '/');
    const filePath = path.join(uploadPath, name);
    // 读取chunks，文件名放在数组里
    const chunks = fs.readdirSync(chunksPath);
    const chunksPathList = [];
    if (chunks.length !== total || chunks.length === 0) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        msg: '切片文件数量与请求不符合，无法合并',
      };
    }
    chunks.forEach(item => {
      chunksPathList.push(path.join(chunksPath, item));
    });

    try {
      await streamMerge(chunksPathList, filePath, chunkSize);
      ctx.status = 200;
      ctx.body = {
        success: true,
        msg: '合并成功',
      };
    } catch (error) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        msg: '合并失败，请重试',
      };
    }
  }
}

module.exports = HomeController;
