const fetch = require('node-fetch');

const autoReplies = {
    "undoReply": {
        "content_type": "text",
        "title": "Undo",
        "payload": "<POSTBACK_PAYLOAD>",
    },
    "todayReply": {
        "content_type": "text",
        "title": "Today",
        "payload": "<POSTBACK_PAYLOAD>",
    },
    "thisWeekReply": {
        "content_type": "text",
        "title": "This Week",
        "payload": "<POSTBACK_PAYLOAD>",
    }
};

// Replies is an array with potential automatic replies
module.exports = (userId, text, replies) => {
    const FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    quick_replies = [];

    if (replies) {
        for (reply of replies) {
            console.log(autoReplies[reply]);
            quick_replies.push(autoReplies[reply]);
        }
        console.log(quick_replies[0]);

        message = { 
            text : text,
            quick_replies: quick_replies
        }
    } else {
        message = {
            text: text
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