module.exports = (sequelize, Sequelize) => {
  const Ticket = sequelize.define("ticket", {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM("open", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    requester: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "anonymous",
    },
    assigneeId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Ticket;
};
