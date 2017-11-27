//
// Name: enqueue.js
// Auth: Martin Burolla
// Date: 11/25/2017
// Desc:
//

'use strict';

const AWS = require('aws-sdk');
const config = require('./config');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const numMessages = 100;
const queueURL = config.queueURL;

function enqueue(params) {
    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}

for (let i = 0; i < numMessages; i++) {
    let params = {
        MessageBody: `{ "customerId": ${String(i)} }`,
        QueueUrl: queueURL
    };
    enqueue(params);
}
