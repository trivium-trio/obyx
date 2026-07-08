// =============================================================================
// MODEL REGISTRY
// Single source of truth for Sequelize instance and all models.
// Uses the shared database config with proper SSL handling.
// =============================================================================
import sequelize from '../config/database.js';
import defineUser from './user.js';
import defineTransaction from './transaction.js';

const User = defineUser(sequelize);
const Transaction = defineTransaction(sequelize);

// ---------------------------------------------------------------------------
// Relationships
// A User has many Transactions; each Transaction belongs to one User.
// ---------------------------------------------------------------------------
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Transaction };