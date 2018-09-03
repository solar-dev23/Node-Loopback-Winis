const chai = require('chai');
const mute = require('mute');
const moment = require('moment-timezone');
const app = require('../server/server');
const request = require('supertest')(app);
const deepAssign = require('object-assign-deep');
const SendBirdService = require('../common/services/SendBirdService');
const { expect } = chai;

chai.use(require('chai-shallow-deep-equal'));

describe('Message', async () => {
  beforeEach(async () => {
    await app.models.Message.deleteAll();
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  it('should encount error if x-signature is not valid', done => {
    const unmute = mute();

    request
      .post('/api/messages/sb-webhook')
      .expect('Content-Type', /json/)
      .send({ test: 'okay' })
      .then(res => {
        expect(res.statusCode).to.be.equal(401);
        unmute();
        done();
      });
  });

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
    let messageJson = require('./fixtures/messages/message.json');
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
        expect(res.body.members).to.be.shallowDeepEqual([
          messageJson.members[0].user_id,
          messageJson.members[1].user_id,
        ]);

        done();
      });
  });

  it('should update last battle move from sendbird webhook', async () => {
    const challengeJson = require('./fixtures/messages/game-challenge.json');
    let {
      payload: { data },
    } = challengeJson;
    data = JSON.parse(data);

    // create battle
    let battle = await app.models.Battle.create({
      challengerId: '5a96cbbbfc4a7d5a8b57f0e1',
      opponentId: '5a96cbbbfc4a7        d5a8b57f0e1',
      status: 'pending',
      game: 'baseball',
      stake: 30,
      challengerStatus: 'unset',
      opponentStatus: 'unset',
      result: 'unset',
    });
    data.body.serverBattleId = battle.id;
    challengeJson.payload.data = JSON.stringify(data);

    let actionJson = require('./fixtures/messages/game-action.json');
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
            SendBirdService.createSignature(
              JSON.stringify(require('./fixtures/messages/game-accepted.json'))
            )
          )
          .send(require('./fixtures/messages/game-accepted.json'));
      })
      .then(res => {
        return request
          .post('/api/messages/sb-webhook')
          .expect('Content-Type', /json/)
          .set(
            'x-signature',
            SendBirdService.createSignature(
              JSON.stringify(require('./fixtures/messages/game-action.json'))
            )
          )
          .send(require('./fixtures/messages/game-action.json'));
      })
      .then(res => {
        return request
          .post('/api/messages/sb-webhook')
          .expect('Content-Type', /json/)
          .set(
            'x-signature',
            SendBirdService.createSignature(
              JSON.stringify(require('./fixtures/messages/message.json'))
            )
          )
          .send(require('./fixtures/messages/message.json'));
      })
      .then(async res => {
        battle = await app.models.Battle.findById(battle.id);
        expect(battle.lastMove.toString()).to.be.equal(
          new Date(actionJson.payload.created_at).toString()
        );
      });
  });
});
