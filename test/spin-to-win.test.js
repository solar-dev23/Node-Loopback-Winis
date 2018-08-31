const { expect } = require('chai');
const mute = require('mute');
const app = require('../server/server');
const request = require('supertest')(app);

let accessToken,
  UserModel;

describe('Spin To Win', () => {
  beforeEach(async() => {
    UserModel = app.models.user;
    await UserModel.deleteAll();
    const user = await UserModel.create({
      winis: 500,
      scratches: 0,
      spins: 1,
      diamonds: 0,
    });
    accessToken = await user.createAccessToken();
  });

  after(async() => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Logic', () => {
    it('should substract the amount of spins for the user', (done) => {
      app.models.spinToWin.calculateSpin = () => '5_winis';

      request
        .post('/api/spinsToWin/spin')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end(async(err, res) => {
          UserModel.findById(accessToken.userId)
            .then((storedUser) => {
              const resultUser = res.body.user;

              expect(res.statusCode).to.be.equal(200);
              expect(storedUser.spins).to.be.equal(resultUser.spins);
              expect(resultUser.spins).to.be.equal(0);
              done();
            })
            .catch(done);
        });
    });

    it('should keep the returned user and stored users in sync', (done) => {
      app.models.spinToWin.calculateSpin = () => '100_winis';

      request
        .post('/api/spinsToWin/spin')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          UserModel.findById(accessToken.userId)
            .then((storedUser) => {
              const resultUser = res.body.user;

              expect(res.statusCode).to.be.equal(200);
              expect(storedUser.winis).to.be.equal(600);
              expect(resultUser.winis).to.be.equal(600);
              done();
            })
            .catch(done);
        });
    });

    it('should refuse to spin if the user has no spins left', (done) => {
      const unmute = mute();

      UserModel.findById(accessToken.userId)
        .then(user => user.updateAttribute('spins', 0))
        .then(() => {
          request
            .post('/api/spinsToWin/spin')
            .set('Authorization', accessToken.id)
            .end((err, res) => {
              expect(res.statusCode).to.be.equal(409);
              expect(res.body.error).to.not.be.a('null');
              unmute();
              done();
            });
        });
    });
  });

  describe('Prizes', () => {
    const prizes = [
      { prize: 'diamond', result: { diamonds: 1 } },
      { prize: 'double_spin', result: { spins: 2 } },
      { prize: '100_winis', result: { winis: 600 } },
      { prize: 'double_diamond', result: { diamonds: 2 } },
      { prize: 'empty', result: {} },
      { prize: '50_winis', result: { winis: 550 } },
      { prize: 'double_scratch', result: { scratches: 2 } },
      { prize: 'scratch', result: { scratches: 1 } },
      { prize: 'spin', result: { spins: 1 } },
    ];

    prizes.forEach((roll) => {
      // eslint-disable-next-line
      it(`it should update a user when the user rolls ${roll.prize}`, function updateUserOnRoll(done) {
        app.models.spinToWin.calculateSpin = function calculateSpin() {
          return roll.prize;
        };

        request
          .post('/api/spinsToWin/spin')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .then((res) => {
            const { spinResult, user } = res.body;
            const { result } = roll;

            expect(res.statusCode).to.be.equal(200);
            expect(spinResult).to.be.equal(roll.prize);
            expect(user).to.include(result);
            done();
          });
      });
    });
  });
});
