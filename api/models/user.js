import { DataTypes } from 'sequelize';

export default (sequelize) => {
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
      comment: "User's mobile money number (e.g., for M-Pesa/Paystack)"
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      set(val) {
        if (val) this.setDataValue('walletAddress', val.toLowerCase());
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['phoneNumber']
      },
      {
        unique: true,
        fields: ['walletAddress']
      }
    ]
  });

  return User;
};