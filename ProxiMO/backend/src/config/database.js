require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',        // Use mysql em vez de mariadb
    dialectModule: require('mysql2'),
    logging: console.log
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'tacacs_ldap_radius_test',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PROD || 'tacacs_ldap_radius_prod',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    logging: false
  }
};
