module.exports = (sequelize, Sequelize) => {
  const Example = sequelize.define("example", {
    //String
    type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    //Nombre
    age: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    //Booleen
    isOK: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    // Fichier
    data: {
      type: Sequelize.BLOB("long"),
      allowNull: true,
    },
    //Date
    date_of_death: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    // Fields calcules - on les utilise pour faire des liens entre les tables
    // Pour les dates, on peut utiliser luxons ou dayjs pour faire des calculs
    url: {
      type: Sequelize.VIRTUAL,
      get() {
        return `/catalog/genre/${this.id}`;
      }
    }
  });

  return Example;
};
