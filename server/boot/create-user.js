
module.exports = function(app) {
  if (process.env.NODE_ENV !== 'docker') return;

  console.log('Creating a sample admin');

  app.models.user.create({
    username: 'admin',
    password: '123456',
    isAdmin: true,
  });
};
