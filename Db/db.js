require('dotenv').config();
const { Sequelize } = require('sequelize');

// PostgreSQL connection setup using Sequelize
const sequelize = new Sequelize('postgresql://nusarat_user:IaxubBquVa3TYjGNoTwYQ18pf6YnDI8X@dpg-ct7vm1pu0jms73at1u60-a/nusarat', {
  dialect: 'postgres', // Specify that we're using PostgreSQL

  dialectOptions: {
    ssl: {
      require: true, // Ensure SSL is required
      rejectUnauthorized: false, // Set this to true in production for security
    },
  },
});

module.exports = sequelize;

