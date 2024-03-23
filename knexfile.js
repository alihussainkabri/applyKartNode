require("dotenv").config();
const moment = require("moment");
module.exports = {
    development: {
        client: process.env.CLIENT,
        connection: {
            host: process.env.DB_HOSTNAME,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            charset: 'utf8mb4',
            timezone: 'GMT+5.30',
            typeCast: function (field, next) {
                if (field.type == 'DATETIME') {
                    return moment(field.string()).format('YYYY-MM-DD HH:mm:ss');
                }

                if (field.type == 'DATE') {
                    return moment(field.string()).format('YYYY-MM-DD');
                }

                return next();
            },
        },
        migrations: {
            directory: __dirname + '/db/migrations'
        },
        seeds: {
            directory: __dirname + '/db/seeds'
        },
        pool: {
            min: 2,
            max: 10,
            afterCreate: function (conn, cb) {
                conn.query('SET sql_mode="NO_ENGINE_SUBSTITUTION";',
                    function (err) {
                        cb(err, conn);
                    });
            }
        }
    },
    production: {
        client: process.env.CLIENT,
        connection: {
            host: process.env.DB_HOSTNAME,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            charset: 'utf8mb4',
            timezone: 'GMT+5.30',
            typeCast: function (field, next) {
                if (field.type == 'DATETIME') {
                    return moment(field.string()).format('YYYY-MM-DD HH:mm:ss');
                }

                if (field.type == 'DATE') {
                    return moment(field.string()).format('YYYY-MM-DD');
                }

                return next();
            }
        },
        migrations: {
            directory: __dirname + '/db/migrations'
        },
        seeds: {
            directory: __dirname + '/db/seeds'
        },
        pool: {
            min: 2,
            max: 10,
            afterCreate: function (conn, cb) {
                conn.query('SET sql_mode="NO_ENGINE_SUBSTITUTION";',
                    function (err) {
                        cb(err, conn);
                    });
            }
        }
    }
}