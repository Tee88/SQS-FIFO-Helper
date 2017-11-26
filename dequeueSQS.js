//
// Name: dequeueSQS.js
// Auth: Martin Burolla
// Date: 11/26/2017
// Desc: Calculates and invoice for every customer in SQS.
//

'use strict';

const AWS = require('aws-sdk');
const mysql = require('mysql');
AWS.config.update({region: 'us-east-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const numberMessageToRead = 10; // The number of messages to read in one batch (max is 10). Even though are requesting 10 messages from a worker, we may get much less. 
const visibilityTimeout = 30;   // The number of seconds we have to process a batch of messages before they are visible on the queue again.
const queueURL = "https://sqs.us-east-1.amazonaws.com/103346953322/customer"; 

const params = {
    AttributeNames: ["SentTimestamp"],
    MaxNumberOfMessages: numberMessageToRead,
    MessageAttributeNames: ["All"],
    QueueUrl: queueURL,
    VisibilityTimeout: visibilityTimeout,  // 30 seconds is the default.
    WaitTimeSeconds: 0
};

const connection = mysql.createConnection({ // Our one and only database connection shared with all the writers.
    host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
    user     : 'sa',
    password : 'mjb3616!',
    database : 'carDB'
});

/**
 * Dequeues at most 10 messages from SQS.
 */
function dequeueMessages(workerId) {
    return new Promise(resolve => {
        sqs.receiveMessage(params, (err, data) => {
            if (err) { console.log("Receive Error", err); } 
            if (!data.Messages) {
                console.log('EMPTY QUEUE');
                return resolve('done');
            }

            console.log(`WorkerId: ${workerId} processing ${data.Messages.length} messages.`);
            processMessages(data).then((numMessages) => {
                resolve('done');
            });
        });
    });
}

/**
 * Calculates invoices for at most 10 customers, saves the invoices to the database, and
 * deletes messages from SQS.
 */
function processMessages(data) {
    return new Promise((resolve, reject) => {
        let promiseArray = [];
        for (let i = 0; i < data.Messages.length; i++) {        
            promiseArray.push(processCustomer(data.Messages[i]));      
        }
        Promise.all(promiseArray).then(() => {
            resolve(data.Messages.length);
        });
    });
}

/**
 * Calculates one invoice for a single customer, saves the invoice to the database, and 
 * deletes one message from SQS.
 */
function processCustomer(message) {
    return new Promise(resolve => {
        const customer = JSON.parse(message.Body);
        calculateInvoiceForCustomer(customer.customerId)
            .then(invoiceAmount => {
                return insertIntoDatabase(customer.customerId, invoiceAmount)
            })
            .then(() => {
                return deleteMessageFromSQSWithReceiptHandle(message.ReceiptHandle);
            })
            .then(() => {
                resolve('done');
            })
    });
}

/**
 * Inserts a unique customerId for an invoice amount into the invoice table.
 */
function insertIntoDatabase(customerId, invoiceAmount) {
    return new Promise((resolve, reject) => {
        const query = `insert into invoice (customer_id, amount) values (${customerId}, ${invoiceAmount});`
        connection.query(query, (error, results, fields) => {
            if (error) { console.log(error); }
            resolve('done');
        });
    });
}

/**
 * Removes a message from SQS.  If we do not do this, messages will be visible and available to 
 * read again by other readers after the visiblityTimeout (seconds) has elapsed.
 */
function deleteMessageFromSQSWithReceiptHandle(receiptHandle) {
    return new Promise((resolve, reject) => {
        var deleteParams = {
            QueueUrl: queueURL,
            ReceiptHandle: receiptHandle
        };
        sqs.deleteMessage(deleteParams, (err, data) => {
            if (err) { console.log("Delete Error", err); } 
            resolve('done');
        });
    });
}

/**
 * Calculates the invoice for a customer.
 */
function calculateInvoiceForCustomer(customerId) {
    return new Promise((resolve, reject) => {
        // TODO: Make some network calls, call some database tables, etc.
        resolve(customerId * 1.23);
    });
 }

//////////////////////////////////////////////////////////////////////////////////////////////
// Main
//////////////////////////////////////////////////////////////////////////////////////////////

connection.connect(); // Create our one and only connection to the database.

let promiseReaders = [];
for (let i = 1; i < 20; i++) { 
    promiseReaders.push(dequeueMessages(i));
}
Promise.all(promiseReaders).then(() => {
    console.log('Finished');
    connection.end(); // Kill our one and only connection to the database.
});
