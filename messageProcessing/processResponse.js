module.exports = (intent) => {
    action = intent.action.split('.');
    const fulfillmentText = intent.fulfillmentText;
    if (action[0] !== "financebot") return fulfillmentText;
    
    const params = intent.params;
    if (action[0] === "financebot") {
        if (action[1] === "addExpense") {
            return handleAddExpense(fulfillmentText, params);
        }
    }
};

function handleAddExpense(text, params) {
    const category = params.category.stringValue;
    const amountSpent = parseInt(params.number.stringValue);
    const currencyParams = params["unit-currency"];

    
    if (!category) return "No category was specified. Please try again with a category.";
    if (!amountSpent) {
        amountSpent = currency.amount;
        const currency = currencyParams.currency;

    }
    
}
