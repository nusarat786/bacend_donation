const { Sequelize } = require('sequelize');

// PostgreSQL connection setup using Sequelize
const sequelize = new Sequelize('flutter_project_free', 'flutter_project_free_user', 'tzHimRqBFpUsCWJ3eEzTMiMyhDxyEWjY', {
  host: 'dpg-crmi1rdumphs739enq10-a.oregon-postgres.render.com', // or your server address
  dialect: 'postgres', // Specify that we're using PostgreSQL

  dialectOptions: {
    ssl: {
      require: true, // This will ensure SSL is required
      rejectUnauthorized: false, // Set this to true in production for security
    },
  },
});

module.exports = sequelize;
