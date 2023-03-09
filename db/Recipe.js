const {Sequelize, sequelize} = require('./db');

const Recipe = sequelize.define('recipe', {
  title: Sequelize.STRING,
  flavor: Sequelize.STRING,
  ingredients: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] ,
  cost:Sequelize.INTEGER
});

module.exports = { Recipe };
