const er = require("../helpers/exchangeRate");
const sendTextMessage = require('./sendMessage.js');
const pool = require('../index.js').pool;
const db = require('../helpers/database');
var senderID;

module.exports = (intent) => {
    action = intent.action.split('.');
    var senderID = intent.sender;
    console.log(intent);
    const fulfillmentText = intent.fulfillmentText;
    if (action[0] !== "financebot") return (sendTextMessage(senderID, fulfillmentText));

    const params = intent.params;
    if (action[0] === "financebot") {
        if (action[1] === "addExpense") {
            handleAddExpense(fulfillmentText, params, intent.timeStamp)
                .then(responseMessage => { (sendTextMessage(senderID, responseMessage, ["undoReply", "todayReply"])) })
                .catch(errorMessage => { 
                    console.log(errorMessage);
                    sendTextMessage(senderID, errorMessage) 
                });
        }
        if (action[1] === "changeCurrency") {
            handleChangeCurrency(fulfillmentText, params, intent.timeStamp)
                .then(responseMessage => { (sendTextMessage(senderID, responseMessage)) });
        }
        if (action[1] === 'undo') {
            handleUndoAddExpense()
                .then(responseMessage => { (sendTextMessage(senderID, responseMessage)) })
                .catch(errorMessage => { sendTextMessage(senderID, errorMessage) })
            checkDayExpenses({"date" : {"stringValue": ""}})
                .then(responseMessage => { (sendTextMessage(senderID, responseMessage, ["undoReply"])) })
                .catch(errorMessage => { sendTextMessage(senderID, errorMessage) })
        }
        if (action[1] === 'checkDayExpenses') {
            checkDayExpenses(params)
                .then(responseMessage => { (sendTextMessage(senderID, responseMessage, ["undoReply"])) })
                .catch(errorMessage => { sendTextMessage(senderID, errorMessage) })
        }

    }
};


function checkExpenses(dateRange) {

}

function checkWeekExpenses(params) {
    
}

function checkDayExpenses(params) {
    var today = params.date.stringValue;
    if (!today) today = new Date(new Date(new Date().toDateString())).getTime();
    else {
        today = new Date(new Date(today).toDateString()).getTime();
        if (today > new Date().getTime()) {
            today = today - (86400000 * 365); //A year
        }
    }

    var nextDay = today + 86400000; //A day
    console.log(today + "  ---  " + nextDay);

    return new Promise((resolve, reject) => {
        
        db.queryDateRange('expenses', "ExpensesDate", today / 1000, nextDay / 1000, "yse", "no")
            .then(rows => {
                if (rows.length === 0) {
                    resolve("No expenses today. Nice.");}
                else {


                    const totalDayExpenses = rows.reduce((acc, current) => {
                        return acc + parseFloat(current.ExpensesAmountInUSD);
                    }, 0);

                    
                    const top5Expenses = rows.slice(-5).reduce((acc, current) => {
                        var date = new Date(current.ExpensesDate*1000);
                        
                        var minutes = date.getMinutes();
                        if (minutes < 10) minutes = '0' + minutes;
                        var time = `${date.getHours()}:${minutes}`;
                        
                        return acc + `${upperFirstLetter(current.ExpensesCategory)} | ${current.ExpensesAmountInLocalCurrency} ${current.ExpensesLocalCurrency} | ${time}\n`;
                    }, "")

                    const returnString = `Last 5 Expenses\n\n${top5Expenses}\nTotal Spent $${Math.round(totalDayExpenses)}`;

                
                    db.getDefaultER()
                    .then(rate => {
                        console.log(rate);
                        const returnString = `Last 5 Expenses\n\n${top5Expenses}\nTotal Spent: $${Math.round(totalDayExpenses)} (${Math.round(rate.rate*totalDayExpenses)} ${rate.name})`;
                        resolve(returnString);
                    })
                    .catch(err => {
                        console.log(err);
                        reject(err);
                    });
                
                }
            })
            .catch(err => {
                console.log(err);
                reject(err)
            });
    })

}



function upperFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function handleUndoAddExpense() {
    return db.dbDeleteLastRow('expenses',
        'Something went wrong trying to delete the last expense.',
        'Deleted last expense.')
}

function handleAddExpense(text, params, timeStamp) {
    const category = params.category.stringValue;
    if (!category) return Promise.resolve("No category was specified. Please try again with a category.");

    var amountSpent = params.number;
    const currencyParams = params["unit-currency"];
    var currency = currencyParams.currency; //get from DB originally
    if (amountSpent.numberValue) amountSpent = amountSpent.numberValue;
    else {
        amountSpent = currencyParams.structValue.fields.amount.numberValue;
        currency = currencyParams.structValue.fields.currency.stringValue;
    }

    var date = params.date.stringValue;
    if (!date) date = timeStamp/1000;
    else date = new Date(date).getTime() / 1000;

    // Database format: (ID, Category, AmountLocal, LocalCurrency, AmountUSD, TimeInUnix)
    return new Promise((resolve, reject) => {
        getExchangeRate(currency).then(response => {
            dbInsert('expenses', ['NULL', `'${category}'`, amountSpent, `'${response.name}'`, amountSpent / response.rate, date]) // Insert into DB
                .catch(err => {
                    console.log(err);
                    resolve("Something went wrong while adding expense to database. Troubleshoot or try again.");
                });
            resolve(`${amountSpent} ${response.name} spent on ${category} was added to your expenses.`);
        });
    })
}

function getExchangeRate(newCurrency) {
    return new Promise((resolve, reject) => {
        if (!newCurrency) {
            pool.getConnection(function (err, db) {
                try {
                    if (err) {
                        console.log(err);
                        resolve("Something went wrong while trying to get establish connection to the database. Troubleshoot or try again.");
                    }
                    db.query(`SELECT * FROM currency ORDER BY CurrencyID DESC LIMIT 1;`, (err, result) => {
                        if (err) {
                            console.log(err);
                            resolve("Something went wrong while trying to get default exchange rate. Troubleshoot or try again.");
                        } else {
                            resolve({ name: result[0]['CurrencyName'], rate: result[0]['CurrencyUSDToDC'] });
                        }
                    });
                } finally {
                    db.release();
                }
            })
        }
        // Not the default currency
        else {
            er(newCurrency)
                .then(response => { resolve({ name: newCurrency, rate: response }) });
        }
    });
}

function handleChangeCurrency(text, params, timeStamp) {
    const newCurrency = params['currency-name'].stringValue;
    if (!newCurrency || newCurrency.length !== 3) return Promise.resolve("Didn't enter a valid currency, try again!");



    // set default currency to newCurrency in database
    return new Promise((resolve, reject) => {
        // Get old currency first
        pool.getConnection((err, db) => {
            try {
                if (err) {
                    console.log(err);
                    resolve("Something went wrong while trying to get establish connection to the database. Troubleshoot or try again.");
                }
                db.query(`SELECT * FROM currency ORDER BY CurrencyID DESC LIMIT 1;`, (err, result) => {
                    if (err) {
                        console.log(err);
                        resolve("Something went wrong while trying to change default currency. Troubleshoot or try again.");
                    } else {
                        // Get old currency from DB
                        var oldCurrency = (result[0]['CurrencyName']);
                        const fulfillmentText = "Currency was changed from " + oldCurrency + " to " + newCurrency + ". Rate is 1 USD to ";

                        //if user entered an exhange rate use that one
                        if (params.number.kind === 'numberValue') {
                            resolve(insertNewCurrency(fulfillmentText, newCurrency, params.number.numberValue, timeStamp));
                        }
                        else {
                            resolve(er(newCurrency).then(response => {
                                return insertNewCurrency(fulfillmentText, newCurrency, response, timeStamp);;
                            }));
                        }
                    }
                })
            } finally {
                db.release();
            }
        })
    })

    function insertNewCurrency(fulfillmentText, currencyName, currencyValue, timeStamp) {
        return new Promise((resolve, reject) => {
            dbInsert('currency', ['NULL', `'${currencyName}'`, currencyValue, timeStamp / 1000]) // Insert into DB
                .then(response => {
                    resolve(fulfillmentText + currencyValue + " " + currencyName + ".");
                })
                .catch(err => {
                    console.log(err);
                    resolve("Something went wrong trying to change the currency. Troubleshoot or try again");
                });
        })
    }

}




// Inserts into given table of database financebot given columns in the form of an array
function dbInsert(tableName, columns) {
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
