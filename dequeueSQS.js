//
// Name: dequeue.js
// Auth: Martin Burolla
// Date: 11/25/2017
// Desc:
//

'use strict';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const numberMessageToRead = 3; // The number of messages to read in one batch (max is 10).
const visibilityTimeout = 5;   // The number of seconds we have to process these messages before we can read these messages again from the queue.
//const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customerId.fifo";
const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customer";

var params = {
    AttributeNames: ["SentTimestamp"],
    MaxNumberOfMessages: numberMessageToRead,
    MessageAttributeNames: ["All"],
    QueueUrl: queueURL,
    VisibilityTimeout: visibilityTimeout,  // If we don't specify this 30 seconds is the default.
    WaitTimeSeconds: 0
};

sqs.receiveMessage(params, (err, data) => {
    if (err) {
        console.log("Receive Error", err);
    } 
  
    if (data.Messages) {
        for (let i = 0; i < numberMessageToRead; i++) {
            if (data.Messages[i] === undefined) {
                console.log('Body is undefined');
            } else {
                console.log(data.Messages[i].Body);
                //deleteMessageWithReceiptHandle(data.Messages[i].ReceiptHandle); // Commenting this makes messages visible after the visibilityTimeout has expired;
            }
        }
    } else {
        console.log("Nothing dequeued.");
    }
});

function deleteMessageWithReceiptHandle(receiptHandle) {
    var deleteParams = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle
    };

    sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) {
            console.log("Delete Error", err);
        } else {
            console.log("Message Deleted", data);
        }
    });
}
