module.exports = (sequelize, Sequelize) => {
  const Share = sequelize.define("Share", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    isPublic: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    link: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    validUntil: {
      type: Sequelize.DATE,
      allowNull: true
    }
  });

  return Share;
};
