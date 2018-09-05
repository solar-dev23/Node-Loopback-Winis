const moment = require('moment-timezone');
const SendBirdService = require('../services/SendBirdService');

module.exports = Message => {
  Message.storeSendbirdHook = async req => {
    // if (
    //   req.headers['x-signature'] !==
    //   SendBirdService.createSignature(JSON.stringify(req.body))
    // ) {
    //   const error = new Error(
    //     `Invalid signature: ${req.headers['x-signature']}`
    //   );
    //   error.status = 403;
    //   throw error;
    // }

    const { body } = req;
    if (body.category !== 'group_channel:message_send') {
      return false;
    }

    // parse payload
    const { payload } = body;
    let data;
    try {
      data = JSON.parse(payload.data);
    } catch (e) {
      data = {};
    }

    // store message
    const message = await Message.create({
      channelUrl: body.channel && body.channel.channel_url,
      payload: {
        ...payload,
        data,
      },
      members: body.members.map(item => item.user_id),
      isChallenge:
        payload.custom_type === 'gameAction' && data.type === 'challenge',
    });

    // update active game
    const availableTypes = [
      'turn',
      'firstRoundEnd',
      'secondRoundBegin',
      'backgammonTurn',
    ];
    if (
      payload.custom_type == 'gameAction' &&
      availableTypes.includes(data.type)
    ) {
      // find challenge action to get serverBattleId
      const challengeAction = await Message.findOne({
        where: {
          channelUrl: message.channelUrl,
          isChallenge: true,
        },
      });
      if (challengeAction) {
        const battle = await Message.app.models.Battle.findById(
          challengeAction.payload.data.body.serverBattleId
        );
        if (battle) {
          await battle.updateAttribute(
            'lastMove',
            new Date(payload.created_at)
          );
        }
      }
    }

    return message;
  };
};
