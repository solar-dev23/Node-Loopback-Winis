
module.exports = function (HallOfFame) {
  HallOfFame.executeQuery = async function (sortBy, whereQuery) {
    const UserModel = HallOfFame.app.models.user;

    return await UserModel.find({
      where: whereQuery,
      limit: 20,
      order: `${sortBy} DESC`,
      fields: {
        username: true, winis: true, diamonds: true, id: true, avatar: true,
      },
    });
  };

  HallOfFame.getGlobalTop = async function (sortBy) {
    if (!sortBy) sortBy = 'winis';

    return HallOfFame.executeQuery(sortBy, {});
  };

  HallOfFame.getFriendsTop = async function (sortBy, options) {
    const token = options && options.accessToken;
    const userId = token && token.userId;
    const UserModel = HallOfFame.app.models.user;

    const user = await UserModel.findById(userId);
    const friendIds = user.friendIds;
    friendIds.push(userId);

    const whereQuery = { id: { inq: friendIds } };
    if (!sortBy) sortBy = 'winis';

    return await HallOfFame.executeQuery(sortBy, whereQuery);
  };
};
