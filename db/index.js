const {Recipe} = require('./Recipe');
const {User} = require('./User');
const {sequelize, Sequelize} = require('./db');

Recipe.belongsTo(User, {foreignKey: 'cookId'}); // Cupcake table, there will be an ownerId <- FK
User.hasMany(Recipe);

module.exports = {
    Recipe,
    User,
    sequelize,
    Sequelize
};

