const { DataTypes } = require('sequelize');
const sequelize = require('./db'); // Import your sequelize instance
const Event = require('./Event'); // Import the Event model

// Define the Entry model to match your entries table
const Entry = sequelize.define('Entry', {
  entry_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Event, // Reference the Event model
      key: 'event_id', // Foreign key in the Event table
    },
  },
  contributor_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '',
    set(value) {
      this.setDataValue('contributor_name', value.trim()); // Trim whitespace
    },
  },
  contributor_nickname: {
    type: DataTypes.STRING(255),
    allowNull: true,
    set(value) {
      this.setDataValue('contributor_nickname', value.trim()); // Trim whitespace
    },
    defaultValue: 'N/A'
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isGreaterThanZero(value) {
        if (value <= 0) {
          throw new Error('Amount must be greater than 0');
        }
      }
    },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  entry_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Gift',
    set(value) {
      this.setDataValue('entry_type', value.trim()); // Trim whitespace
    },
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Automatically set timestamp
  },
}, {
  timestamps: true, // Keep automatic timestamps (createdAt, updatedAt)
});

// Establish the association
Entry.belongsTo(Event, {
  foreignKey: 'event_id',
  targetKey: 'event_id',
});

module.exports = Entry;
