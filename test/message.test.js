const chai = require('chai');
const mute = require('mute');
const app = require('../server/server');
const request = require('supertest')(app);
const deepAssign = require('object-assign-deep');
const SendBirdService = require('../common/services/SendBirdService');
const gameAcceptedJson = require('./fixtures/messages/game-accepted.json');
const gameActionJson = require('./fixtures/messages/game-action.json');
const gameChallengeJson = require('./fixtures/messages/game-challenge.json');
const messageJson = require('./fixtures/messages/message.json');

const { expect } = chai;

chai.use(require('chai-shallow-deep-equal'));

describe('Message', async () => {
  let battle;

  beforeEach(async () => {
    await app.models.Message.deleteAll();

    // create battle
    battle = await app.models.Battle.create({
      challengerId: '5a96cbbbfc4a7d5a8b57f0e1',
      opponentId: '5a96cbbbfc4a7d5a8b57f0e1',
      status: 'pending',
      game: 'baseball',
      stake: 30,
      challengerStatus: 'unset',
      opponentStatus: 'unset',
      result: 'unset',
    });
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  // it('should reject webhook if x-signature is not valid', done => {
  //   const unmute = mute();
  //   const data = { test: 'okay' };

  //   request
  //     .post('/api/messages/sb-webhook')
  //     .expect('Content-Type', /json/)
  //     .send({ test: 'okay' })
  //     .then(res => {
  //       expect(res.statusCode).to.be.equal(403);
  //       unmute();
  //       done();
  //     });
  // });

  it('should reject webhook if category is not equal to group_channel:message_send', done => {
    const data = { test: 'okay' };
    request
      .post('/api/messages/sb-webhook')
      .expect('Content-Type', /json/)
      .send(data)
      .set('x-signature', SendBirdService.createSignature(JSON.stringify(data)))
      .then(res => {
        expect(res.body).to.be.equal(false);
        done();
      });
  });

  it('should store message without problem from sendbird webhook', done => {
    request
      .post('/api/messages/sb-webhook')
      .expect('Content-Type', /json/)
      .send(messageJson)
      .set(
        'x-signature',
        SendBirdService.createSignature(JSON.stringify(messageJson))
      )
      .then(res => {
        expect(res.body.channelUrl).to.be.equal(
          messageJson.channel.channel_url
        );
        expect(res.body.payload).to.be.shallowDeepEqual({
          ...messageJson.payload,
          data: {},
        });
        expect(res.body.members).to.have.members([
          messageJson.members[0].user_id,
          messageJson.members[1].user_id,
        ]);

        done();
      });
  });

  it('should update last battle move from sendbird webhook', async () => {
    const data = JSON.parse(gameChallengeJson.payload.data);
    data.body.serverBattleId = battle.id;

    const challengeJson = deepAssign({}, gameChallengeJson);
    challengeJson.payload.data = JSON.stringify(data);

    return request
      .post('/api/messages/sb-webhook')
      .expect('Content-Type', /json/)
      .send(challengeJson)
      .set(
        'x-signature',
        SendBirdService.createSignature(JSON.stringify(challengeJson))
      )
      .then(res => {
        return request
          .post('/api/messages/sb-webhook')
          .expect('Content-Type', /json/)
          .set(
            'x-signature',
            SendBirdService.createSignature(JSON.stringify(gameAcceptedJson))
          )
          .send(gameAcceptedJson);
      })
      .then(res => {
        return request
          .post('/api/messages/sb-webhook')
          .expect('Content-Type', /json/)
          .set(
            'x-signature',
            SendBirdService.createSignature(JSON.stringify(gameActionJson))
          )
          .send(gameActionJson);
      })
      .then(async res => {
        battle = await app.models.Battle.findById(battle.id);
        expect(battle.lastMove.toString()).to.be.equal(
          new Date(gameActionJson.payload.created_at).toString()
        );
      });
  });
});
