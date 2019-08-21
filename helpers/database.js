const pool = require('../index.js').pool;


exports.dbDeleteLastRow = dbDeleteLastRow;


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
