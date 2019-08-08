const processMessage = require('../messageProcessing/processMessage');
module.exports = (req, res) => {
   
    // Check if event from a page subscription
    if (req.body.object === 'page') {
        
        // Iterates over each entry
        req.body.entry.forEach(entry => {


            entry.messaging.forEach(event => {
                if (event.message && event.message.text) {
                    console.log(event)
                    processMessage(event);
                }
            });
        });
        res.status(200).end();
    }
};
