const dialogflow = require('dialogflow').v2beta1;
const processResponse = require('./processResponse');
const sendTextMessage = require('./sendMessage.js');


// DF variables
const dfProjectId = "financebot-vllhel";
const sessionId = "financebot";
const languageCode = "en-US";
const config = {
    credentials: {
        private_key: /*JSON.parse*/(process.env.DIALOGFLOW_PRIVATE_KEY),
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
    const timeStamp = event.timestamp;

    
    const request = generateDFRequest(event);

    sessionClient
        .detectIntent(request)
        .then(responses => {
            const response = responses[0];

            intent = {
                action: response.queryResult.action,
                params: response.queryResult.parameters.fields,
                fulfillmentText: response.queryResult.fulfillmentText,
                timeStamp: timeStamp,
                sender: senderId
            };
            console.log(intent);

            return processResponse(intent);
        })
        .catch(err => {
            console.error('ERROR detecting intent:', err);
        });
}



module.exports = (event) => {
    processMessage(event);
};