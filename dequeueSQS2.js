//
// Name: dequeueSQS2.js
// Auth: Martin Burolla
// Date: 11/25/2017
// Desc:
//

'use strict';

const AWS = require('aws-sdk');
const mysql = require('mysql');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const numberMessageToRead = 10; // The number of messages to read in one batch (max is 10).
const visibilityTimeout = 30;   // The number of seconds we have to process a batch of messages before they are visible on the queue again.
//const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customerId.fifo";
const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customer";

const params = {
    AttributeNames: ["SentTimestamp"],
    MaxNumberOfMessages: numberMessageToRead,
    MessageAttributeNames: ["All"],
    QueueUrl: queueURL,
    VisibilityTimeout: visibilityTimeout,  // If we don't specify this 30 seconds is the default.
    WaitTimeSeconds: 0
};

/**
 * Dequeues at most 10 messages from SQS and saves each message to a database.
 * @param {*} workerId 
 */
function dequeueMessages(workerId) {
    const connection = mysql.createConnection({
        host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
        user     : 'sa',
        password : 'mjb3616!',
        database : 'carDB'
    });

    return new Promise(resolve => {
        sqs.receiveMessage(params, (err, data) => {
            if (err) { console.log("Receive Error", err); } 
            if (!data.Messages) 
                return resolve(`WorkerId: ${workerId} did nothing (empty queue).`);

            connection.connect();
            for (let i = 0; i < data.Messages.length; i++) { // Even though we want 10 messages (numberMessageToRead) we may get much less.                 
                const customer = JSON.parse(data.Messages[i].Body);
                connection.query(`insert into invoice (customer_id, amount) values (${customer.customerId}, 13.11);`, (error, results, fields) => {
                    if (error) { 
                        console.log(error);
                    } else {
                        // Commenting this will make messages visible after the visibilityTimeout has expired!
                        deleteMessageWithReceiptHandle(data.Messages[i].ReceiptHandle); // It's safe to delete this message from SQS.
                    }
                });
            }
            connection.end();
            resolve(`WorkerId: ${workerId} read ${data.Messages.length} messages.`);
        });
    });
}

function deleteMessageWithReceiptHandle(receiptHandle) {
    var deleteParams = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle
    };

    sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) {
            //console.log("Delete Error", err);
        } else {
            //console.log("Message Deleted", data);
        }
    });
}

//
// Run our workers.
//

for (let i = 1; i < 15; i++) { // Even though we want 10 messages from a worker, we may get much less. 
    dequeueMessages(i).then(res => {
        console.log(res);
    });
}
