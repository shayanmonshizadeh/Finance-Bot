const fetch = require('node-fetch');

module.exports = (userId, text, undo) => {
    const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    var messagge;
    if (!undo) {
        message = { text }
    }
    else {
        message = {
            text: text,
            quick_replies: [{
                "content_type": "text",
                "title": "Undo",
                "payload": "<POSTBACK_PAYLOAD>",
            }]
        };
    }


    return fetch(
        `https://graph.facebook.com/v2.6/me/messages?access_token=${FB_PAGE_TOKEN}`,
        {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                messaging_type: 'RESPONSE',
                recipient: { id: userId },
                message: message
            })
        });
} 