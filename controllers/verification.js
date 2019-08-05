module.exports = (req, res) => {
    let VERIFY_TOKEN = "financebot"

    //Parse query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token == VERIFY_TOKEN) {
        // If match, respond with challenge token
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        // Respond with 403 if token not right
        res.status(403).end();
    }
};
