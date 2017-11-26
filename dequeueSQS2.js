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
const visibilityTimeout = 30;   // The number of seconds we have to process these messages before we can read these messages again from the queue.
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

function readTenMessages(workerId) {
    const connection = mysql.createConnection({
        host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
        user     : 'sa',
        password : 'mjb3616!',
        database : 'carDB'
    });

    return new Promise(resolve => {
        sqs.receiveMessage(params, (err, data) => {
            if (err) { console.log("Receive Error", err); } 
            connection.connect();
            if (data.Messages) {
                for (let i = 0; i < numberMessageToRead; i++) {
                    if (data.Messages[i] === undefined) {
                        //console.log('Body is undefined');
                    } else {
                        const jsonObject = JSON.parse(data.Messages[i].Body);
                        connection.query(`insert into invoice (customer_id, amount) values (${jsonObject.customerId}, 13.11);`, (error, results, fields) => {
                            if (error) throw error;
                         });
                        deleteMessageWithReceiptHandle(data.Messages[i].ReceiptHandle); // Commenting this makes messages visible after the visibilityTimeout has expired;
                    }
                }
                connection.end();
                resolve(`${workerId} is done.`);
            } else {
                //console.log("Queue is empty.");
                connection.end();
                resolve(`Queue is empty.`);
            }
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

for (let i = 1; i < 15; i++) {
    readTenMessages(i).then(res => {
        console.log(res);
    });
}
