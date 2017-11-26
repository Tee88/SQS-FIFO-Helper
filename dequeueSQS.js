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
 * Dequeues at most 10 messages from SQS.
 */
function dequeueMessages(workerId) {
    return new Promise(resolve => {
        sqs.receiveMessage(params, (err, data) => {
            if (err) { console.log("Receive Error", err); } 
            if (!data.Messages) 
                return resolve(`WorkerId: ${workerId} did nothing (EMPTY QUEUE).`);

            processMessages(data).then(() => {
                resolve(`WorkerId: ${workerId} read ${data.Messages.length} messages.`);
            });
        });
    });
}

/**
 * Saves at most 10 messages to the database.
 */
function processMessages(data) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
            user     : 'sa',
            password : 'mjb3616!',
            database : 'carDB'
        });
        connection.connect();
        for (let i = 0; i < data.Messages.length; i++) { // Even though we want 10 messages (numberMessageToRead) we may get much less.                 
            const customer = JSON.parse(data.Messages[i].Body);
           
            connection.query(`insert into invoice (customer_id, amount) values (${customer.customerId}, ${calculateInvoiceForCustomer(customer.customerId)});`, (error, results, fields) => {
                if (error) { 
                    console.log(error);
                } else {
                    // Commenting this will make messages visible after the visibilityTimeout has expired!
                    deleteMessageFromSQSWithReceiptHandle(data.Messages[i].ReceiptHandle); // It's safe to delete this message from SQS.
                }
            });
        }
        connection.end();
        resolve('done');
    });
}

/**
 * TODO: Implement with real data.
 */
function calculateInvoiceForCustomer(customerId) {
   return customerId * 1.23;
}

/**
 * Removes a message from SQS.  If we do not do this, messages will be visible and available to 
 * read again by other readers after the visiblityTimeout has elapsed!
 */
function deleteMessageFromSQSWithReceiptHandle(receiptHandle) {
    var deleteParams = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle
    };
    sqs.deleteMessage(deleteParams, (err, data) => {
        if (err) {
            console.log("Delete Error", err);
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
