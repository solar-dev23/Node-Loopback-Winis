
const Ivoire = require('ivoire');

module.exports = function (Scratch) {
  Scratch.beforeRemote('create', async (context, modelInstance, next) => {
    const token = context.req.accessToken;
    const userId = token && token.userId;
    const UserModel = Scratch.app.models.user;

    const user = await UserModel.findById(userId);
    if (user.scratches === 0) {
      const error = new Error('User has no more scratches');
      error.status = 409;
      throw error;
    }

    context.req.body.board = Scratch.calculateScratchBoard();
    context.req.body.prize = Scratch.determinePrize(context.req.body.board);
    context.req.body.userId = userId;
  });

  Scratch.prototype.reveal = async function (options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Scratch.app.models.user;

    if (this.userId != userId) {
      const error = new Error('You cannot revive someone else\'s scratch');
      error.status = 409;
      throw error;
    }

    const user = await UserModel.findById(userId);
    const updatedUser = await user.updateAttribute('scratches', user.scratches - 1);
    let prizeDetails = {};
    let randomWinis = 0;

    switch (this.prize) {
      case 'empty':
        break;

      case 'diamond':
        await updatedUser.updateAttribute('diamonds', updatedUser.diamonds + 1);
        prizeDetails.diamond = 1;
        break;

      case 'winis':
        randomWinis = Scratch.calculateRandomWinis();
        await updatedUser.updateAttribute('winis', updatedUser.winis + randomWinis);
        prizeDetails.winis = randomWinis;
        break;

      case 'scratch':
        await updatedUser.updateAttribute('scratches', updatedUser.scratches + 1);
        prizeDetails.scratch = 1;
        break;

      case 'present':
        randomWinis = Scratch.calculateRandomWinis();

        await updatedUser.updateAttributes({
          diamonds: updatedUser.diamonds + 1,
          winis: updatedUser.winis + randomWinis,
          scratches: updatedUser.scratches + 1,
          spins: updatedUser.spins + 1,
        });

        prizeDetails = {
          diamond: 1,
          winis: randomWinis,
          scratch: 1,
          spin: 1,
        };

        break;
      case 'spin':
        await updatedUser.updateAttribute('spins', updatedUser.spins + 1);
        prizeDetails.spin = 1;
        break;
    }

    return {
      success: true,
      prize: this.prize,
      prizeDetails,
      user: updatedUser,
    };
  };

  Scratch.calculateRandomWinis = () => {
    const ivoire = new Ivoire();
    return ivoire.integer({ min: 20, max: 100 });
  };

  Scratch.determinePrize = (board) => {
    let prize;

    const prizeVariants = {
      diamond: 0,
      winis: 0,
      scratch: 0,
      present: 0,
      spin: 0,
    };

    board.forEach((element) => {
      switch (element) {
        case 'diamond': prizeVariants.diamond++; break;
        case 'winis': prizeVariants.winis++; break;
        case 'scratch': prizeVariants.scratch++; break;
        case 'present': prizeVariants.present++; break;
        case 'spin': prizeVariants.spin++; break;
      }
    });

    if (Object.values(prizeVariants).reduce((a, b) => (a > b ? a : b)) < 3) {
      return 'empty';
    }

    return Object.keys(prizeVariants).reduce((a, b) => (prizeVariants[a] > prizeVariants[b] ? a : b));
  };

  Scratch.calculateScratchBoard = () => {
    let board = [];
    const prizeVariants = {
      diamond: 0,
      winis: 0,
      scratch: 0,
      present: 0,
      spin: 0,
    };
    for (let i = 0; i < 6; i++) {
      let tempCell;
      const generatedRandomNumber = Math.random();
      if (generatedRandomNumber < 0.15) {
        tempCell = 'diamond';
        prizeVariants.diamond++;
      } else if (generatedRandomNumber < 0.65) {
        tempCell = 'winis';
        prizeVariants.winis++;
      } else if (generatedRandomNumber < 0.8) {
        tempCell = 'scratch';
        prizeVariants.scratch++;
      } else if (generatedRandomNumber < 0.85) {
        tempCell = 'present';
        prizeVariants.present++;
      } else {
        tempCell = 'spin';
        prizeVariants.spin++;
      }
      board.push(tempCell);
    }
    const verifier = Object.values(prizeVariants).filter(element => element >= 3);
    if (verifier.length == 2) {
      board = Scratch.calculateScratchBoard();
    }
    return board;
  };
};
