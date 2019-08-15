var oxr = require('open-exchange-rates'),
    fx = require('money');

oxr.set({ app_id: process.env.OXR_APP_ID })

var er = [undefined];


module.exports = (currency) => {
    return new Promise(function (resolve, reject) {
        oxr.latest(function () {
            // Apply exchange rates and base rate to `fx` library object:
            fx.rates = oxr.rates;
            fx.base = oxr.base;
        
            rate = parseInt(fx(1).from('USD').to(currency)); 
            resolve(rate)
        }); 
    });
};
