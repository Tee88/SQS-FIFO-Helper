//
// Name: dequeue.js
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
const visibilityTimeout = 10;   // The number of seconds we have to process these messages before we can read these messages again from the queue.
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

const connection = mysql.createConnection({
  host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
  user     : 'sa',
  password : 'mjb3616!',
  database : 'carDB'
});
 
sqs.receiveMessage(params, (err, data) => {
    if (err) { console.log("Receive Error", err); } 
    connection.connect();
    if (data.Messages) {
        for (let i = 0; i < numberMessageToRead; i++) {
            if (data.Messages[i] === undefined) {
                console.log('Body is undefined');
            } else {
                const jsonObject = JSON.parse(data.Messages[i].Body);
                console.log(jsonObject);
                
                connection.query(`insert into invoice (customer_id, amount) values (${jsonObject.customerId}, 13.11);`, (error, results, fields) => {
                    if (error) throw error;
                    
                 });
                deleteMessageWithReceiptHandle(data.Messages[i].ReceiptHandle); // Commenting this makes messages visible after the visibilityTimeout has expired;
            }
        }
        connection.end();
    } else {
        console.log("Nothing dequeued.");
        connection.end();
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
