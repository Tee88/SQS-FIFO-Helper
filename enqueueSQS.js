//
// Name: enqueue.js
// Auth: Martin Burolla
// Date: 11/25/2017
// Desc:
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

//const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customerId.fifo";
const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customer";

function enqueue(params) {
    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}

for (let i = 0; i < 10; i++) {
    let params = {
        MessageAttributes: {},
        MessageBody: `{ customerId: ${String(i)} }`,
        QueueUrl: queueURL
        //,
        //MessageGroupId: String(i), // NOTE: This greatly affects how messages are viewed with the visiblity timeout feature.
        //MessageGroupId: "CustomerId",
        //MessageDeduplicationId: String(i)
    };
    enqueue(params);
}
