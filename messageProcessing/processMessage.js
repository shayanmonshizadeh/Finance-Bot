const fetch = require('node-fetch');
const dialogflow = require('dialogflow').v2beta1;
const processResponse = require('./processResponse');

// DF variables
const dfProjectId = "financebot-vllhel";
const sessionId = "financebot";
const languageCode = "en-US";
const config = {
    credentials: {
        private_key: process.env.DIALOGFLOW_PRIVATE_KEY,
        client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
    }
};
const sessionClient = new dialogflow.SessionsClient(config); // Main client
const sessionPath = sessionClient.sessionPath(dfProjectId, sessionId); // Path

// Generates request to be sent to Dialog Flow based on incoming message (event)
function generateDFRequest(event) {
    return {
        session: sessionPath,
        queryInput: {
            text: {
                text: event.message.text,
                languageCode: languageCode,
            },
        },
    };
}


/**
 * 1. Detects intent based on request (incoming message) and forms result object
 *    with action, params, and fulfillment text
 * @param {*} request: Incoming message is request
 */
function processMessage(event) {
    const senderId = event.sender.id;
    const message = event.message.text;

    const request = generateDFRequest(event);
    
    sessionClient
    .detectIntent(request)
    .then(responses => {
        const response = responses[0];

        intent = {
            action: response.queryResult.action,
            params: response.queryResult.parameters.fields,
            fulfillmentText: response.queryResult.fulfillmentText
        };
        console.log(intent);

        const responseMessage = processResponse(intent);

        console.log("Response formulated: " + responseMessage);

        return sendTextMessage(senderId, responseMessage);

    })
    .catch(err => {
        console.error('ERROR detecting intent:', err);
    });
}


// Forms response based on intent object
function formResponse(intent) {
    const action = intent.action;
    const fulfillmentText = intent.fulfillmentText;
    if (action === "input.unknown") return fulfillmentText;
    const params = intent.params;
}


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
        processMessage(event);
    };