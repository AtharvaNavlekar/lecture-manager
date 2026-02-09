const { db } = require('../config/db');
const { promisify } = require('util');

/**
 * Promisified database utilities for cleaner async/await code
 * Wraps sqlite3 callback-based methods in Promises
 */

const dbAsync = {
    /**
     * Execute a query that returns a single row
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Object|undefined>}
     */
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    /**
     * Execute a query that returns multiple rows
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<Array>}
     */
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    /**
     * Execute a query that modifies data (INSERT, UPDATE, DELETE)
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },

    /**
     * Execute multiple statements in a transaction
     * @param {Function} callback - Async function that performs DB operations
     * @returns {Promise<any>}
     */
    transaction: async (callback) => {
        try {
            await dbAsync.run('BEGIN TRANSACTION');
            const result = await callback(dbAsync);
            await dbAsync.run('COMMIT');
            return result;
        } catch (error) {
            await dbAsync.run('ROLLBACK');
            throw error;
        }
    },

    /**
     * Access to underlying db for advanced operations
     */
    raw: db
};

module.exports = dbAsync;
