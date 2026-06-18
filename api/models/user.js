const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    // We use the EXACT same ID that Supabase generates for the user
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "User's mobile money number (e.g., for M-Pesa/Paystack)"
    },
walletAddress: {
  type: DataTypes.STRING,
  allowNull: true,
  unique: true, 
  set(val) {
    if (val) this.setDataValue('walletAddress', val.toLowerCase());
  }
}
  }, {
    tableName: 'users',
    timestamps: true, 
  });

  return User;
}; 