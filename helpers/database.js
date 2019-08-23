const pool = require('../index.js').pool;


exports.dbDeleteLastRow = dbDeleteLastRow;
exports.queryDateRange = queryDateRange;
exports.getDefaultER = getDefaultER;

function dbDeleteLastRow(table, errorMessage, resolveMessage) {
    return new Promise((resolve, reject) => {
        
        pool.getConnection((err, db) => {
            if (err) {
                console.log(err);
                reject(`${errorMessage} Troubleshoot or try again.`)
            } 
            try {
                var ID = table.charAt(0).toUpperCase() + table.slice(1) + "ID";
                db.query(`delete from ${table} order by ${ID} desc limit 1`, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(`${errorMessage} Troubleshoot or try again.`);
                    } 
                    resolve(resolveMessage);
                })
            } finally {
                db.release();
            }
        });
    });
}

function queryDateRange(table, columnName, startTime, endTime, errorMessage, resolveMessage) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, db) => {
            if (err) {
                console.log(err);
                reject(`${errorMessage} Troubleshoot or try again.`)
            } 
            try {
                var ID = table.charAt(0).toUpperCase() + table.slice(1) + "ID";
                db.query(`SELECT * FROM ${table} WHERE (${columnName} BETWEEN ${startTime} AND ${endTime})`, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(`${errorMessage} Troubleshoot or try again.`);
                    } 
                    resolve(result);
                })
            } finally {
                db.release();
            }
        });
    });
}

/**
 * Returns default exchange rate = (name, USDtoDCRate)
 */
function getDefaultER() {
    console.log("hello");
    return new Promise((resolve, reject) => {
        pool.getConnection((err, db) => {
            if (err) {
                console.log(err);
                reject(`Troubleshoot or try again.`)
            } 
            try {
                db.query(`SELECT * FROM currency ORDER BY CurrencyID DESC LIMIT 1;`, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject("Something went wrong while trying to get default exchange rate. Troubleshoot or try again.");
                    } else {
                        resolve({ name: result[0]['CurrencyName'], rate: result[0]['CurrencyUSDToDC'] });
                    }
                });
            } finally {
                db.release();
            }
        });
    });
}

exports.dbInsert = function dbInsert(tableName, columns) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, db) => {
            try {
                if (err) {
                    console.log(err);
                    resolve("Something went wrong while trying to get establish connection to the database. Troubleshoot or try again.");
                }
                db.query(`INSERT INTO ${tableName} VALUES (${columns.join(',')})`, (err, results) => {
                    if (err) {
                        reject(err)
                    } resolve();
                })
            } finally {
                db.release();
            }

        })
    })
}
