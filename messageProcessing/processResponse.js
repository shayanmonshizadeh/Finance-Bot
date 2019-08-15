const er = require("../helpers/exchangeRate");

module.exports = (intent) => {
    action = intent.action.split('.');
    const fulfillmentText = intent.fulfillmentText;
    if (action[0] !== "financebot") return fulfillmentText;
    
    const params = intent.params;
    if (action[0] === "financebot") {
        if (action[1] === "addExpense") {
            return handleAddExpense(fulfillmentText, params);
        }
        if (action[1] === "changeCurrency") {
            handleChangeCurrency(fulfillmentText, params).then(response => {console.log("asdfasd" + response)});
            return handleChangeCurrency(fulfillmentText, params);
        }
    }
};

function handleAddExpense(text, params) {
    const category = params.category.stringValue;
    if (!category) return "No category was specified. Please try again with a category.";
    
    var amountSpent = params.number;
    const currencyParams = params["unit-currency"];
    var currency = currencyParams.currency; //get from DB originally
    
    if (amountSpent.numberValue) amountSpent = amountSpent.numberValue;
    else {
        amountSpent = currencyParams.structValue.fields.amount.numberValue;
        currency = currencyParams.structValue.fields.currency.stringValue;
    }

    db.query("SELECT NOW()", async (err, result) => {
        if (err) {
            console.log(err);
        } else {
            console.log(result[0]);
            rows = await result[0];
        }
    });
   
   
    return `${amountSpent} ${currency} spent on ${category} was added to your expenses.`    
}

function handleChangeCurrency(text, params) {
    const newCurrency = params['currency-name'].stringValue;
    if (!newCurrency || newCurrency.length !== 3) return Promise.resolve("Didn't enter a valid currency, try again!");

    // set default currency to newCurrency in database
    oldCurrency = "USD";
    
    const fulfillmentText = "Currency was changed from " + oldCurrency + " to " + newCurrency + ". Rate is 1 USD to ";
    if (params.number.kind === 'numberValue') return Promise.resolve(fulfillmentText + params.number.numberValue + " " + newCurrency + ".");
    return er(newCurrency).then(response => {
        return fulfillmentText + response + " " + newCurrency + ".";
    });
    
}
