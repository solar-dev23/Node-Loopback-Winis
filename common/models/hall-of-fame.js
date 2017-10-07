'use strict';

module.exports = function(HallOfFame) {
  HallOfFame.findTopScores = async function(whereQuery) {
    const UserModel =  HallOfFame.app.models.user;

    return await UserModel.find({
      where: whereQuery, limit: 20, order: 'winis DESC',
      fields: {username: true, winis: true, id: true, avatar: true},
    });
  };

  HallOfFame.getTopScores = async function() {
    return HallOfFame.findTopScores({});
  };

  HallOfFame.getFriendsTopScores = async function(options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = HallOfFame.app.models.user;

    const user = await UserModel.findById(userId);
    const friendIds = user.friendIds;

    const whereQuery = {inq: friendIds};

    return HallOfFame.findTopScores(whereQuery);
  };
};
