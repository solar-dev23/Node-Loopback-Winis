'use strict';

const Ivoire = require('ivoire-weighted-choice');
const PrizeManager = require('../services/prize');

const spinOptions = [
  'diamond', 'winis', 'scratch', 'present', 'spin',
];

const spinWeights = [
  15, 50, 15, 5, 15,
];

module.exports = function(Scratch) {
  Scratch.determinePrize = (board) => {
    let prize;
    let prizeVariants = {
      diamond: 0,
      winis: 0,
      scratch: 0,
      present: 0,
      spin: 0,
    };
    board.forEach(element => {
      switch (element) {
        case 'diamond': prizeVariants.diamond++; break;
        case 'winis': prizeVariants.winis++; break;
        case 'scratch': prizeVariants.scratch++; break;
        case 'present': prizeVariants.present++; break;
        case 'spin': prizeVariants.spin++; break;
      }
    });

    if (Object.values(prizeVariants).reduce((a, b) => a > b ? a : b) < 3) {
      return 'empty';
    }

    return Object.keys(prizeVariants).reduce((a, b) => prizeVariants[a] > prizeVariants[b] ? a : b);
  };
    
  Scratch.calculateScratchBoard = () => {
    let board = [];
    let prizeVariants = {
      diamond: 0,
      winis: 0,
      scratch: 0,
      present: 0,
      spin: 0,
    };
    for (let i = 0; i < 6; i++) {
      let tempCell; 
      let generatedRandomNumber = Math.random();
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
    let verifier = Object.values(prizeVariants).filter(element => { return element >= 3; });
    if (verifier.length == 2) {
      board = Scratch.calculateScratchBoard();
    }
    return board; 
  };
  
  Scratch.scratch = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Scratch.app.models.user;

    const user = await UserModel.findById(userId);
    if (user.scratches === 0) {
      const error = new Error('User has no more scratches');
      error.status = 409;
      throw error;
    }

    const scratchBoard = Scratch.calculateScratchBoard();

    const prize = Scratch.determinePrize(scratchBoard);

    const scratch = await Scratch.create({
      board: scratchBoard,
      userId: user.id,
      prize: prize,
    });

    return {
      success: true,
      boardId: scratch.id,
      board: scratch.board,
    };
  };

  Scratch.prototype.reveal = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = Scratch.app.models.user;

    if (this.userId != userId) {
      const error = new Error('You cannot revive someone else\'s scratch');
      error.status = 409;
      throw error;
    }
    const user = await UserModel.findById(userId);
    const uppdatedUser = await user.updateAttribute('scratches', user.scratches - 1);
    return {
      success: true,
      prize: this.prize,
      user: uppdatedUser,
    };
  };
};
