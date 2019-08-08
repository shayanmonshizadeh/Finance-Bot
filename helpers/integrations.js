const fetch = require('node-fetch');
const dialogflow = require('dialogflow').v2beta1;

const dfProjectId = "financebot-vllhel";
const sessionId = "financebot";
const languageCode = "en-US";

const config = {
    credentials: {
        private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
        client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
    }
};

const sessionClient = new dialogflow.SessionsClient(config);
const sessionPath = sessionClient.sessionPath(dfProjectId, sessionId);
const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

const sendTextMessage = (userId, text) => {
    
    return fetch(
        `https://graph.facebook.com/v2.6/me/messages?access_token=${FB_PAGE_TOKEN}`,
        {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                messaging_type: 'RESPONSE',
                recipient: { id: userId },
                message: { text }
            })
        });
};

module.exports = (event) => {
    const senderId = event.sender.id;
    const message = event.message.text;

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: languageCode,
            },
        },
    };


    sessionClient
        .detectIntent(request)
        .then(responses => {
            console.log(responses[0].parameters)
            const result = responses[0].queryResult;
            return sendTextMessage(senderId, result.fulfillmentText);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
};