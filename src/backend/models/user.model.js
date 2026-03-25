module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM("viewer", "agent", "admin"),
      allowNull: false,
      defaultValue: "viewer",
    },
  });

  return User;
};