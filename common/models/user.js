'use strict';

const debug = require('debug')('winis:user-model');
const request = require('request-promise-native');
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

  User.findByUsername = async (username) => {
    const user = await User.findOne({where: {'username': {regexp: `/^${username}$/i`}}});
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
          extension = parts[parts.length - 1];

        // Using a local timestamp + user id in the filename (you might want to change this)
        return `${this.id}_avatar.jpg`;
      };

      uploadData = await uploadPm(app.dataSources.Storage, req, res, {
        'container': containerName, 'getFilename': getFilename,
      });
    }

    const avatarData = uploadData.files.avatar.pop();
    const userData = await updateAttributePm('avatar', timeStamp);

    return {
      success: true,
      user: userData,
      avatarData: avatarData,
    };
  };

  User.returnResizedImage = function(userId, timeStamp, width, height, cb) {
    const app = User.app;
    const containerName = app.get('container');
    const storage = app.models.storage;
    const writeBuffer = new streambuffer.WritableStreamBuffer();
    const resizeWidth = parseInt(width), resizeHeight = parseInt(height);
    const defaultAvatar = `${__dirname}/../../assets/avatar/avatar.jpg`;
    const next = cb;

    const fileName = `${userId}_avatar.jpg`;
    storage.getFile(containerName, fileName, (err) => {
      let fileStream;

      if (err && (err.code === 'ENOENT' || err.code === 404)) {
        fileStream = fs.createReadStream(defaultAvatar);
      } else {
        fileStream = storage.downloadStream(containerName, fileName);
      }

      fileStream.pipe(writeBuffer);
      fileStream.on('end', (err) => {
        if (err) {
          const error = new Error('Failed fetching a avatar');
          error.status = 409;
          throw error;
        }

        const buffer = writeBuffer.getContents();
        jimp.read(buffer)
          .then((image) => {
            if (image.bitmap.width === resizeWidth && image.bitmap.height === resizeHeight) {
              return next(null, buffer, 'image/jpeg', 'public, max-age=315360000');
            } else {
              image
                .cover(resizeWidth, resizeHeight)
                .quality(70)
                .getBuffer(jimp.MIME_JPEG, (err, buffer) => {
                  return next(null, buffer, 'image/jpeg', 'public, max-age=315360000');
                });
            }
          });
      });
    });
  };

  User.prototype.getResizedAvatar = function(timeStamp, size, next) {
    const [width, height] = size.split('x');
    return User.returnResizedImage(this.id, this.avatar, width, height, next);
  };

  User.prototype.getDefaultResizedAvatar = function(size, next) {
    const [width, height] = size.split('x');
    return User.returnResizedImage(this.id, this.avatar, width, height, next);
  };

  User.prototype.getDefaultAvatar = function(next) {
    return User.returnResizedImage(this.id, this.avatar, 250, 250, next);
  };

  User.measureText = function(font, text) {
    let x = 0;
    for (let i = 0; i < text.length; i++) {
      if (font.chars[text[i]]) {
        x += font.chars[text[i]].xoffset +
          (font.kernings[text[i]] && font.kernings[text[i]][text[i + 1]] ? font.kernings[text[i]][text[i + 1]] : 0) +
          (font.chars[text[i]].xadvance || 0);
      }
    }
    return x;
  };

  User.generateShareImage = async function(type, userId, userName, avatarBuffer, game) {
    const backgroundImage = `${__dirname}/../../assets/share/${type}/smm_background.png`;
    const starsOverlayImage = `${__dirname}/../../assets/share/${type}/stars_overlay.png`;
    const topStarsOverlayImage = `${__dirname}/../../assets/share/${type}/topstar_overlay.png`;
    const avatarMaskImage = `${__dirname}/../../assets/share/${type}/avatar_mask.png`;
    const gameImage = `${__dirname}/../../assets/games/${game}.png`;
    const titleFont = `${__dirname}/../../assets/fonts/LondonTwo_74.fnt`;

    const background = await jimp.read(backgroundImage);
    const starsOverlay = await jimp.read(starsOverlayImage);
    const avatarOverlay = await jimp.read(avatarBuffer);
    const avatarMaskOverlay = await jimp.read(avatarMaskImage);
    const gameIconOverlay = await jimp.read(gameImage);
    const topStarsOverlay = await jimp.read(topStarsOverlayImage);

    const font = await jimp.loadFont(titleFont);

    const winnerText = `${userName.toUpperCase()} ROCKS AGAIN!`;
    const textWidth = User.measureText(font, winnerText);
    const textPosition = Math.floor((background.bitmap.width / 2) - (textWidth / 2) * 0.85);

    if (type == 'instagram') {
      avatarOverlay.cover(355, 355);
      avatarOverlay.mask(avatarMaskOverlay, 0, 0);
      background.composite(avatarOverlay, 715, 880);
      background.composite(starsOverlay, 250, 783);
      background.composite(gameIconOverlay, 794, 78);
      background.composite(topStarsOverlay, 718, 90);
      background.print(font, textPosition, 320, winnerText);
    } else {
      avatarOverlay.cover(265, 265);
      avatarOverlay.mask(avatarMaskOverlay, 0, 0);
      background.composite(avatarOverlay, 765, 580);
      background.composite(starsOverlay, 414, 504);
      background.composite(gameIconOverlay, 790, 12);
      background.composite(topStarsOverlay, 539, 0);
      background.print(font, textPosition, 215, winnerText);
    }

    return background;
  };

  User.prototype.getShareImage = function(type, game, cb) {
    const app = User.app;
    const containerName = app.get('container');
    const storage = app.models.storage;
    const writeBuffer = new streambuffer.WritableStreamBuffer();
    const defaultAvatar = `${__dirname}/../../assets/avatar/avatar.jpg`;
    const next = cb;
    const userId = this.id;
    const userName = this.username;

    if (type == 'ig') {
      type = 'instagram';
    } else {
      type = 'general';
    }

    const fileName = `${userId}_avatar.jpg`;
    storage.getFile(containerName, fileName, (err) => {
      let fileStream;

      if (err && (err.code === 'ENOENT' || err.code === 404)) {
        fileStream = fs.createReadStream(defaultAvatar);
      } else {
        fileStream = storage.downloadStream(containerName, fileName);
      }

      fileStream.pipe(writeBuffer);
      fileStream.on('end', (err) => {
        if (err) {
          const error = new Error('Failed fetching a avatar');
          error.status = 409;
          throw error;
        }

        const buffer = writeBuffer.getContents();
        User.generateShareImage(type, userId, userName, buffer, game)
          .then((finalImage) => {
            finalImage.quality(60);
            finalImage.getBuffer(jimp.MIME_JPEG, (err, buffer) => {
              return next(null, buffer, 'image/jpeg', 'public, max-age=315360000');
            });
          });
      });
    });
  };

  User.transferFunds = async function(amount, sender, recipient) {
    debug(`Sending ${amount} winis from ${sender.id} to ${recipient.id}`);
    if (sender.winis - sender.staked < amount) {
      const error = new Error('Not enough winis');
      error.status = 409;
      throw error;
    }

    const updatedRecipient = await recipient.updateAttribute('winis', recipient.winis + amount);
    const updatedSender = await sender.updateAttribute('winis', sender.winis - amount);

    await User.app.models.transactionLog.create({
      attribute: 'winis',
      amount: amount,
      operationType: 'transfer',
      firstActor: updatedRecipient.id,
      secondActor: updatedSender.id,
    });
    return {
      amount: amount,
      updatedSender: updatedSender,
      updatedRecipient: updatedRecipient,
    };
  };

  User.prototype.sendWinis = async function(amount, options) {
    const token = options && options.accessToken;
    const senderId = token && token.userId;

    const recipient = this;
    const sender = await User.findById(senderId);

    const {updatedSender, updatedRecipient} = await User.transferFunds(amount, sender, recipient);

    return {
      status: 'success',
      amount: amount,
      sender: updatedSender,
      recipient: updatedRecipient,
    };
  };

  User.prototype.grantWinis = async function(amount) {
    if (amount <= 0) {
      throw new Error('INVALID_WINIS_AMOUNT');
    }

    const updatedRecipient = await this.updateAttribute('winis', this.winis + parseInt(amount));

    return updatedRecipient;
  };

  User.prototype.stakeFunds = async function(amount) {
    const user = this;
    debug(`Staking ${amount} winis`);

    if (this.winis < amount) {
      const error = new Error('Not enough winis');
      error.status = 409;
      throw error;
    }

    if ((this.winis - this.staked) < amount) {
      const error = new Error('Amount of staked winis is to big');
      error.status = 409;
      throw error;
    }

    const stakedAmount = user.staked + amount;
    await user.updateAttribute('staked', stakedAmount);
    await User.app.models.transactionLog.create({
      attribute: 'winis',
      amount: amount,
      operationType: 'stake',
      firstActor: this.id,
    });
  };

  User.prototype.releaseFunds = async function(amount) {
    if (this.staked < amount) {
      const error = new Error('Not enough staked winis');
      error.status = 409;
      throw error;
    }

    await this.updateAttribute('staked', this.staked - amount);
    await User.app.models.transactionLog.create({
      attribute: 'winis',
      amount: amount,
      operationType: 'release',
      firstActor: this.id,
    });
  };

  User.prototype.transferStakedFunds = async function(amount, recipient) {
    if (this.staked < amount) {
      const error = new Error('Not enough staked winis');
      error.status = 409;
      throw error;
    }

    await this.releaseFunds(amount);
    const {updatedSender, updatedRecipient} = await User.transferFunds(amount, this, recipient);

    return {
      amount: amount,
      updatedSender: updatedSender,
      updatedRecipient: updatedRecipient,
    };
  };

  User.beforeRemote('prototype.__link__blocked', async (ctx) => {
    const user = ctx.instance;
    const blockedId = ctx.args.fk;

    await user.friends.remove(blockedId);
    await user.pending.remove(blockedId);
  });

  User.afterRemote('prototype.__unlink__blocked', async (ctx) => {
    const user = ctx.instance;
    const unblockedId = ctx.args.fk;

    await user.friends.add(unblockedId);
  });

  User.afterRemote('prototype.__link__friends', async (ctx) => {
    const user = ctx.instance;
    const userId = user.id;
    const friendId = ctx.args.fk;
    const friend = await User.findById(friendId);

    await user.pending.remove(friendId);
    await friend.pending.add(userId);
  });

  User.prototype.freeSpins = async function(options) {
    const token = options && options.accessToken;
    const senderId = token && token.userId;
    const currentUser = await User.findById(senderId);
    if (!currentUser.lastDailySpinGrantingDate) {
      await currentUser.updateAttribute('lastDailySpinGrantingDate', Date.now() - 24 * 60 * 60 * 1000 - 1);
    }
    if ((Date.now() - currentUser.lastDailySpinGrantingDate.getTime()) > 24 * 60 * 60 * 1000) {
      await Promise.all([
        currentUser.updateAttribute('spins', currentUser.spins + 1),
        currentUser.updateAttribute('lastDailySpinGrantingDate', Date.now()),
        User.app.models.transactionLog.create({
          attribute: 'spins',
          amount: 1,
          operationType: 'dailySpin',
          firstActor: currentUser.id,
        }),
      ]);
    }
    return currentUser;
  };

  User.observe('before save', function addRandomName(ctx, next) {
    if (ctx.instance && !ctx.instance.username) {
      ctx.instance.username = namor.generate();
    }
    next();
  });
};
