// Knex.js configuration for SQLite database migrations

const path = require('path');

module.exports = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: path.join(__dirname, 'database.sqlite')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(__dirname, 'migrations'),
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: path.join(__dirname, 'seeds')
        },
        pool: {
            afterCreate: (conn, cb) => {
                conn.run('PRAGMA foreign_keys = ON', cb);
            }
        }
    },

    production: {
        client: 'sqlite3',
        connection: {
            filename: process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite')
        },
        useNullAsDefault: true,
        migrations: {
            directory: path.join(__dirname, 'migrations'),
            tableName: 'knex_migrations'
        },
        pool: {
            min: 2,
            max: 10,
            afterCreate: (conn, cb) => {
                conn.run('PRAGMA foreign_keys = ON', cb);
            }
        }
    }
};
