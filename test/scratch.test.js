const { expect } = require('chai');
const mute = require('mute');
const app = require('../server/server');
const request = require('supertest')(app);

describe('Scratch', () => {
  let accessToken;
  let strangerAccessToken;
  let UserModel;
  let ScratchModel;
  let ownerUser;
  let strangerUser;

  beforeEach(async() => {
    UserModel = app.models.user;
    ScratchModel = app.models.scratch;

    await UserModel.deleteAll();
    [ownerUser, strangerUser] = await UserModel.create([
      {
        winis: 0,
        spins: 0,
        scratches: 1,
      }, {},
    ]);
    accessToken = await ownerUser.createAccessToken();
    strangerAccessToken = await strangerUser.createAccessToken();
  });

  after(async() => {
    await app.dataSources.db.connector.disconnect();
  });

  describe('Creation', () => {
    it('should create new scratch', (done) => {
      request
        .post('/api/scratches/')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.body.board.length).to.be.equal(6);
          const prize = ScratchModel.determinePrize(res.body.board);
          expect(res.body.prize).to.be.equal(prize);
          done();
        });
    });

    it('should reveal prize', (done) => {
      request
        .post('/api/scratches/')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          return request
            .post(`/api/scratches/${res.body.id}/reveal`)
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.body.success).to.be.equal(true);
          done();
        });
    });

    it('should refuse to create new scratch because user has no scratches left', (done) => {
      const unmute = mute();
      request
        .post('/api/scratches/')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          return request
            .post(`/api/scratches/${res.body.id}/reveal`)
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(200);
          return request
            .post('/api/scratches/')
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/)
            .send();
        })
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });

    it('should refuse to reveal prize for anothe user', (done) => {
      const unmute = mute();
      request
        .post('/api/scratches/')
        .set('Authorization', accessToken.id)
        .expect('Content-Type', /json/)
        .send()
        .then(res => request
          .post(`/api/scratches/${res.body.id}/reveal`)
          .set('Authorization', strangerAccessToken.id)
          .expect('Content-Type', /json/)
          .send())
        .then((res) => {
          expect(res.statusCode).to.be.equal(409);
          unmute();
          done();
        });
    });
  });

  describe('Prizes', () => {
    const board = [
      ['winis', 'winis', 'winis', 'winis', 'spin', 'spin'],
      ['diamond', 'winis', 'diamond', 'diamond', 'spin', 'spin'],
      ['scratch', 'winis', 'winis', 'scratch', 'scratch', 'scratch'],
      ['winis', 'spin', 'spin', 'winis', 'spin', 'spin'],
      ['present', 'present', 'winis', 'winis', 'spin', 'spin'],
      ['winis', 'present', 'present', 'present', 'present', 'spin'],
    ];

    app.models.scratch.calculateRandomWinis = function() {
      return 30;
    };

    board.forEach((board) => {
      const prize = app.models.scratch.determinePrize(board);
      it(`it should update a user when the user scratches ${prize}`, (done) => {
        let id;
        request
          .post('/api/scratches/')
          .set('Authorization', accessToken.id)
          .expect('Content-Type', /json/)
          .send()
          .then((res) => {
            id = res.body.id;
            return ScratchModel.findById(id);
          })
          .then(scratch => Promise.all([
            scratch.updateAttribute('board', board),
            scratch.updateAttribute('prize', prize),
          ]))
          .then(res => request
            .post(`/api/scratches/${id}/reveal/`)
            .set('Authorization', accessToken.id)
            .expect('Content-Type', /json/))
          .then((res) => {
            expect(res.statusCode).to.be.equal(200);
            expect(res.body.success).to.be.equal(true);
            expect(res.body.prize).to.be.equal(prize);

            const prizeDetails = res.body.prizeDetails;

            switch (prize) {
              case 'empty':
                break;
              case 'diamond':
                expect(prizeDetails.diamond).to.be.equal(1); break;
              case 'winis':
                expect(prizeDetails.winis).to.be.equal(30); break;
              case 'scratch':
                expect(prizeDetails.scratch).to.be.equal(1); break;
              case 'spin':
                expect(prizeDetails.spin).to.be.equal(1); break;
              case 'present':
                expect(prizeDetails.diamond).to.be.equal(1);
                expect(prizeDetails.scratch).to.be.equal(1);
                expect(prizeDetails.spin).to.be.equal(1);
                expect(prizeDetails.winis).to.be.equal(30);
                break;
            }

            return UserModel.findById(accessToken.userId);
          })
          .then((user) => {
            switch (prize) {
              case 'empty':
                break;
              case 'diamond':
                expect(user.diamonds).to.be.equal(1); break;
              case 'winis':
                expect(user.winis).to.be.equal(30); break;
              case 'scratch':
                expect(user.scratches).to.be.equal(1); break;
              case 'spin':
                expect(user.spins).to.be.equal(1); break;
              case 'present':
                expect(user.diamonds).to.be.equal(1);
                expect(user.scratches).to.be.equal(1);
                expect(user.spins).to.be.equal(1);
                expect(user.winis).to.be.equal(30);
                break;
            }
            done();
          });
      });
    });
  });
});
