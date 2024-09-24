const { DataTypes } = require('sequelize');
const sequelize = require('./db'); // Import your sequelize instance
const User = require('./User'); // Import the User model

// Define the Event model to match your events table
const Event = sequelize.define('Event', {
  event_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  event_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    set(value) {
      this.setDataValue('event_name', value.trim()); // Trim whitespace
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    set(value) {
      this.setDataValue('description', value.trim()); // Trim whitespace
    },
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    set(value) {
      this.setDataValue('location', value.trim()); // Trim whitespace
    },
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User, // Referencing the User model
      key: 'user_id', // Foreign key in the Users table
    },
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Automatically set timestamp
  },
}, {
  timestamps: true, // Keep automatic timestamps (createdAt, updatedAt)
});

// Establish the association
Event.belongsTo(User, {
  foreignKey: 'created_by',
  targetKey: 'user_id',
});

module.exports = Event;
