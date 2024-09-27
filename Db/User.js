
const { DataTypes } = require('sequelize');
const sequelize = require('./db'); // Import your sequelize instance

// Define the User model to match your Users table
const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    set(value) {
      this.setDataValue('name', value.trim()); // Trim whitespace
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Basic email format check
    },
    set(value) {
      this.setDataValue('email', value.trim()); // Trim whitespace
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true, // Optional
    unique: true,
    validate: {
      isNumeric: {
        msg: "Phone number must contain only digits."
      },
      len: {
        args: [10, 10],
        msg: "Phone number must be exactly 10 digits."
      }
    },
    set(value) {
      this.setDataValue('phone', value.trim()); // Trim whitespace
    },
  },
  Otp: {
    type: DataTypes.STRING(255),
    allowNull: true, // Optional
    defaultValue: null,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Automatically set timestamp
  },
}, {
  tableName: 'Users', // Exact table name
  timestamps: true, // Keep automatic timestamps (createdAt, updatedAt)
});

module.exports = User;


// const { DataTypes } = require('sequelize');
// const sequelize = require('./db'); // Import your sequelize instance

// // Define the User model to match your Users table
// const User = sequelize.define('User', {
//   user_id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
    
//   },
//   name: {
//     type: DataTypes.STRING(100),
//     allowNull: false,
//   },
//   email: {
//     type: DataTypes.STRING(100),
//     allowNull: false,
//     unique: true,
//     validate: {
//       isEmail: true, // Basic email format check
//     },
//   },
//   password: {
//     type: DataTypes.STRING(255),
//     allowNull: false,   
//   },
//   phone: {
//     type: DataTypes.STRING(15),
//     allowNull: true, // Optional
//     unique:true,
//     validate: {
//         isNumeric: {
//             msg: "Phone number must contain only digits."
//         },
//         len: {
//             args: [10, 10],
//             msg: "Phone number must be exactly 10 digits."
//         }
//     }
//   },
//   profile_image: {
//     type: DataTypes.STRING(255),
//     allowNull: true, // Optional
//     defaultValue: null,
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW, // Automatically set timestamp
//   },
// }, {
//   tableName: 'Users', // Exact table name
//   timestamps: true,  // Disable automatic timestamps (createdAt, updatedAt)
// });

// module.exports = User;
