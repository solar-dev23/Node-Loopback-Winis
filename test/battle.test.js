const expect = require('chai').expect;
const mute = require('mute');
const async = require('async');
const app = require('../server/server');
const request = require('supertest')(app);

describe('Battle', () => {
  let UserModel,
    BattleModel;
  let challengerUser,
    opponentUser,
    thirdUser;
  let challengerAccessToken,
    opponentAccessToken,
    thirdUserAccessToken;

  beforeEach(async () => {
    UserModel = app.models.user;
    BattleModel = app.models.battle;
    await UserModel.deleteAll();
    await BattleModel.deleteAll();
    [challengerUser, opponentUser, thirdUser] = await UserModel.create([
      {
        winis: 50,
      }, {
        winis: 50,
      }, {
        winis: 50,
      },
    ]);
    challengerAccessToken = await challengerUser.createAccessToken();
    opponentAccessToken = await opponentUser.createAccessToken();
    thirdUserAccessToken = await thirdUser.createAccessToken();
  });

  after(async () => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Creation', () => {
    it('should create a new pending battle', (done) => {
      request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('pending');
          expect(res.body.result).to.be.equal('unset');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');

          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(20);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(20);
          done();
        });
    });

    it('should reject duplicate battle betweek the same actors', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          return request
            .post('/api/battles/challenge/')
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send({
              game: 'test-game',
              opponentId: opponentUser.id.toString(),
              stake: 20,
            });
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail create a new pending battle bacause stake is to high', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 60,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail create a new pending battle bacause amount of staked funds + stake is to high', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 40,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(40);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(40);
          return request
            .post('/api/battles/challenge/')
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send({
              game: 'test-game',
              opponentId: opponentUser.id.toString(),
              stake: 40,
            });
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail to create a new pending battle with non exisitng user', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/challenge')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: '100',
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(404);
          unmute();
          done();
        });
    });

    it('should fail to create a new pending battle with himself', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/challenge')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: challengerUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });

  describe('Acception', () => {
    let freshBattle;
    beforeEach(async () => {
      await request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('pending');
          expect(res.body.result).to.be.equal('unset');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');
          freshBattle = res.body;
        });
    });

    it('should accept pending battle', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/accept`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          done();
        });
    });

    it('should accept pending battle after rejecting previous', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/reject`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('rejected');
          return request
            .post('/api/battles/challenge/')
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send({
              game: 'test-game',
              opponentId: opponentUser.id.toString(),
              stake: 20,
            })
            .then((res) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.challengerId).to.be.equal(challengerUser.id);
              expect(res.body.opponentId).to.be.equal(opponentUser.id);
              expect(res.body.status).to.be.equal('pending');
              expect(res.body.result).to.be.equal('unset');
              expect(res.body.game).to.be.equal('test-game');
              expect(res.body.opponentStatus).to.be.equal('unset');
              expect(res.body.challengerStatus).to.be.equal('unset');
              return request
                .post(`/api/battles/${res.body.id}/accept`)
                .set('Authorization', opponentAccessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.status).to.be.equal('accepted');
              done();
            });
        });
    });

    it('should fail to accept someone else\'s pending battle', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/accept`)
        .set('Authorization', thirdUserAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail to accept non existing battle', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id + 1}/accept`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(404);
          unmute();
          done();
        });
    });

    it('should fail to accept pending battle challenged by himself', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/accept`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });

  describe('Rejection', () => {
    let freshBattle;

    beforeEach(async () => {
      await request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('pending');
          expect(res.body.result).to.be.equal('unset');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');
          freshBattle = res.body;
        });
    });

    it('should reject pending battle', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/reject`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('rejected');
          expect(res.body.result).to.be.equal('finished');
          return UserModel.findById(challengerUser.id);
        })
        .then((res) => {
          expect(res.staked).to.be.equal(0);
          return UserModel.findById(opponentUser.id);
        })
        .then((res) => {
          expect(res.staked).to.be.equal(0);
          done();
        });
    });

    it('should reject pending battle after rejecting previous', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/reject`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('rejected');
          return request
            .post('/api/battles/challenge/')
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send({
              game: 'test-game',
              opponentId: opponentUser.id.toString(),
              stake: 20,
            })
            .then((res) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.challengerId).to.be.equal(challengerUser.id);
              expect(res.body.opponentId).to.be.equal(opponentUser.id);
              expect(res.body.status).to.be.equal('pending');
              expect(res.body.result).to.be.equal('unset');
              expect(res.body.game).to.be.equal('test-game');
              expect(res.body.opponentStatus).to.be.equal('unset');
              expect(res.body.challengerStatus).to.be.equal('unset');
              return request
                .post(`/api/battles/${res.body.id}/reject`)
                .set('Authorization', opponentAccessToken.id)
                .expect('Content-Type', /json/)
                .send();
            })
            .then((res) => {
              expect(res.statusCode).to.be.equal(200);
              expect(res.body.status).to.be.equal('rejected');
              done();
            });
        });
    });

    it('should fail to reject someone else\'s pending battle', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/reject`)
        .set('Authorization', thirdUserAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail to reject non existing battle', (done) => {
      const unmute = mute();
      request
        .post('/api/battles/500/reject')
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(404);
          unmute();
          done();
        });
    });

    it('should fail to reject pending battle challenged by himself', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/reject`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });

  describe('Finishing', () => {
    let freshBattle;
    beforeEach(async () => {
      await request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('pending');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');
          return request
            .post(`/api/battles/${res.body.id}/accept`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          freshBattle = res.body;
        });
    });

    it('should finish battle with win/lose configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('opponent won');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(30);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(70);
          done();
        });
    });

    it('should finish battle with win/lose configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('opponent won');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(30);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(70);
          done();
        });
    });

    it('should finish battle with lose/win configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('challenger won');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(70);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(30);
          done();
        });
    });
    it('should finish battle with lose/win configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('challenger won');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(70);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(30);
          done();
        });
    });

    it('should finish battle with draw/draw configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('both draw');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with draw/draw configuration. challender opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('both draw');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with win/win error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with win/win error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with lose/lose error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with lose/lose error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with win/draw error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with win/draw error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with draw/win error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('won');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with draw/win error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with lose/draw error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with lose/draw error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with draw/lose error configuration. opponent challenger', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', challengerAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerStatus).to.be.equal('lost');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should finish battle with draw/lose error configuration. challenger opponent', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.challengerStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.opponentStatus).to.be.equal('draw');
          expect(res.body.status).to.be.equal('finished');
          expect(res.body.result).to.be.equal('error state');
          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          expect(challenger.winis).to.be.equal(50);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          expect(opponent.winis).to.be.equal(50);
          done();
        });
    });

    it('should fail to send won status 2 times', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/won`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('won');
          return request
            .post(`/api/battles/${freshBattle.id}/won`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail to send lost status 2 times', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/lost`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('lost');
          return request
            .post(`/api/battles/${freshBattle.id}/lost`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should fail to send draw status 2 times', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/draw`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.status).to.be.equal('accepted');
          expect(res.body.opponentStatus).to.be.equal('draw');
          return request
            .post(`/api/battles/${freshBattle.id}/draw`)
            .set('Authorization', opponentAccessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });

  describe('Cancellation', () => {
    let freshBattle;

    beforeEach(async () => {
      await request
        .post('/api/battles/challenge/')
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send({
          game: 'test-game',
          opponentId: opponentUser.id.toString(),
          stake: 20,
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('pending');
          expect(res.body.result).to.be.equal('unset');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');
          freshBattle = res.body;
        });
    });

    it('should cancel a pending battle and return the staked winis', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/cancel`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('cancelled');
          expect(res.body.result).to.be.equal('finished');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');

          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          done();
        });
    });

    it('should cancel a battle started more than 3 hours ago', (done) => {
      request
        .post(`/api/battles/${freshBattle.id}/cancel`)
        .set('Authorization', challengerAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.challengerId).to.be.equal(challengerUser.id);
          expect(res.body.opponentId).to.be.equal(opponentUser.id);
          expect(res.body.status).to.be.equal('cancelled');
          expect(res.body.result).to.be.equal('finished');
          expect(res.body.game).to.be.equal('test-game');
          expect(res.body.opponentStatus).to.be.equal('unset');
          expect(res.body.challengerStatus).to.be.equal('unset');

          return UserModel.findById(challengerUser.id);
        })
        .then((challenger) => {
          expect(challenger.staked).to.be.equal(0);
          return UserModel.findById(opponentUser.id);
        })
        .then((opponent) => {
          expect(opponent.staked).to.be.equal(0);
          done();
        });
    });

    it('shouldn\'t allow to cancel somebody elses challenge', (done) => {
      const unmute = mute();
      request
        .post(`/api/battles/${freshBattle.id}/cancel`)
        .set('Authorization', opponentAccessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });
});
