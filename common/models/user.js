'use strict';

const debug = require('debug')('winis:user-model');
const request = require('request-promise');
const namor = require('namor');
const util = require('util');
const fs = require('fs');
const streambuffer = require('stream-buffers');
const jimp = require('jimp');

module.exports = function(User) {
  delete User.validations.email;
  delete User.validations.password;

  User.authenticate = async function(method, credentials) {
    switch (method) {
      case 'accountkit':
        const token = credentials.token;
        const authResponse = await request({
          uri: `https://graph.accountkit.com/v1.2/me/?access_token=${token}`,
          json: true,
        });

        if (authResponse.application &&
          authResponse.application.id !== '224347058051395') {
          throw new Error('Wrong application');
        }

        const userAttributes = {
          'externalUserId': authResponse.id,
          'externalAuthMethod': method,
        };

        const phoneNumber = authResponse.phone.number;
        const [user, created] = await User.findOrCreate({where: userAttributes}, Object.assign({}, userAttributes, {
          phoneNumber: phoneNumber,
        }));

        if (!created && phoneNumber !== user.phoneNumber) {
          user.phoneNumber = phoneNumber;
          await user.save();
        }

        const accessToken = await user.createAccessToken();
        return {
          acessToken: accessToken,
          user: user,
        };
    }
  };

  User.findByPhones = async (phones) => {
    return await User.find({where: {'phoneNumber': {inq: phones}}});
  };

  User.findByUsername = async(username) => {
    const user = await User.findOne({where: {'username': username}});
    if (user === null) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  };

  User.prototype.setAvatar = async function(req, res) {
    const self = this;
    const app = User.app;
    const storage = app.models.storage;
    const containerName = app.get('container');

    const getContainerPm = util.promisify(storage.getContainer);
    const createContainerPm = util.promisify(storage.createContainer);
    const uploadPm = util.promisify(storage.upload);
    const updateAttributePm = util.promisify(this.updateAttribute.bind(self));

    const timeStamp = (new Date()).getTime();

    let uploadData;

    try {
      await getContainerPm(containerName);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await createContainerPm({name: containerName});
      }
    } finally {
      const getFilename = (fileInfo) => {
        const origFilename = fileInfo.name;
        const parts = origFilename.split('.'),
          extension = parts[parts.length-1];

        // Using a local timestamp + user id in the filename (you might want to change this)
        return `${this.id}_avatar.jpg`;
      };

      uploadData = await uploadPm(app.dataSources.Storage, req, res, {
        'container': containerName, 'getFilename': getFilename
      });
    }

    const avatarData = uploadData.files.avatar.pop();
    const userData = await updateAttributePm('avatar', timeStamp);

    return {
      success: true,
      user: userData,
      avatarData: avatarData
    };
  };

  User.returnResizedImage = function(userId, timeStamp, width, height, cb) {
    const app = User.app;
    const containerName = app.get('container');
    const storage = app.models.storage;
    const writeBuffer = new streambuffer.WritableStreamBuffer();
    const resizeWidth = parseInt(width), resizeHeight = parseInt(height);
    const defaultAvatar = 'assets/avatar/avatar.jpg';
    const next = cb;

    const fileName = `${userId}_avatar.jpg`;
    storage.getFile(containerName, fileName, (err, file) => {
      let fileStream;

      if (err && err.code === 'ENOENT') {
        fileStream = fs.createReadStream(defaultAvatar);
      } else {
        fileStream = storage.downloadStream(containerName, fileName);
      }

      fileStream.pipe(writeBuffer);
      fileStream.on('end', (err) => {
        const buffer = writeBuffer.getContents();
        jimp.read(buffer)
          .then((image) => {
            if (image.bitmap.width === resizeWidth && image.bitmap.height === resizeHeight) {
              return next(null, buffer, 'image/jpeg');
            } else {
              image
                .cover(resizeWidth, resizeHeight)
                .getBuffer(jimp.MIME_JPEG, (err, buffer) => {
                  return next(null, buffer, 'image/jpeg');
                });
            }
          });
      });
    });
  };

  User.prototype.getResizedAvatar = function(timeStamp, size, next) {
    const [ width, height ] = size.split('x');
    return User.returnResizedImage(this.id, this.avatar, width, height, next);
  };

  User.prototype.getDefaultAvatar = function(next) {
    return User.returnResizedImage(this.id, this.avatar, 250, 250, next);
  };

  User.prototype.sendWinis = async function(amount, options) {
    const token = options && options.accessToken;
    const senderId = token && token.userId;

    const recipient = this;
    const sender = await User.findById(senderId);

    debug(`Sending ${amount} winis from ${sender.id} to ${recipient.id}`);
    if (sender.winis < amount) {
      const error = new Error('Not enough winis');
      error.status = 409;
      throw error;
    }

    const updatedRecipient = await recipient.updateAttribute('winis', recipient.winis + amount);
    const updatedSender = await sender.updateAttribute('winis', sender.winis - amount);

    return {
      status: 'success',
      amount: amount,
      sender: updatedSender,
      recipient: updatedRecipient,
    };
  };

  User.observe('before save', function addRandomName(ctx, next) {
    if (ctx.instance && !ctx.instance.username) {
      ctx.instance.username = namor.generate();
    }
    next();
  });
};
