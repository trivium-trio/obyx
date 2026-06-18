const { Sequelize } = require('sequelize');

// Load environment variables (Make sure to put your Supabase connection string in .env)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see raw SQL queries
});

// Import models
const User = require('./User')(sequelize);
const Transaction = require('./Transaction')(sequelize);

// Define Relationships
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export everything so your Express routes can use them
module.exports = {
  sequelize,
  User,
  Transaction
};