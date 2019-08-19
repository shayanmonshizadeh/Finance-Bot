const er = require("../helpers/exchangeRate");
const sendTextMessage = require('./sendMessage.js');
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
                .then(responseMessage => {(sendTextMessage(senderID, responseMessage, undo='true'))});
        }
        if (action[1] === "changeCurrency") {
            return handleChangeCurrency(fulfillmentText, params, intent.timeStamp)
                .then(responseMessage => {(sendTextMessage(senderID, responseMessage, undo=true))});
        }
    }
};

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

    // Database format: (ID, Category, AmountLocal, LocalCurrency, AmountUSD, TimeInUnix)
    return new Promise((resolve, reject) => {
        getExchangeRate(currency).then(response => {
            dbInsert('expenses', ['NULL', `'${category}'`, amountSpent, `'${response.name}'`, amountSpent / response.rate, timeStamp / 1000]) // Insert into DB
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
            db.query(`SELECT * FROM currency ORDER BY CurrencyID DESC LIMIT 1;`, (err, result) => {
                if (err) {
                    console.log(err);
                    resolve("Something went wrong while trying to get default exchange rate. Troubleshoot or try again.");
                } else {
                    resolve({ name: result[0]['CurrencyName'], rate: result[0]['CurrencyUSDToDC'] });
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
        db.query(`INSERT INTO ${tableName} VALUES (${columns.join(',')})`, (err, results) => {
            if (err) {
                reject(err)
            } resolve();
        })
    })
}
