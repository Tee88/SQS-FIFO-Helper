# SQS Helper
Helper project that uses FIFO queues.

# Getting Started
- `enqueueSQS.js` inserts `{ customer: id}` into the SQS where id is a positive integer
- `dequeueSQS.js` pulls messages from the queue using the `numReaders`
- The queue behaves crappily when it is small (<1000) and even worse when there is a dozen messages
- The dequeue script may need to be called again to fully empty the queue: `WorkerId: 12 EMPTY QUEUE`

# Notes
The VisibilityTimeout is super important.  You must understand how it works.

http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html

http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sqs-examples-send-receive-messages.html

Use long polling to search all the SQS servers and to guarentee a response:

http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-long-polling.html

`WaitTimeSeconds: 1`

# DDL
- Legacy SQS queues DO NOT guarentee uniqueness.  The unique constraint on the customer id guarentees
that a duplicate invoice for a customer cannot be inserted into the table.

```
CREATE TABLE `invoice` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT '0',
  `amount` float DEFAULT '0',
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `ix_cus` (`customer_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

# Database Connections
Database connections are PRECIOUS.  You MUST conserve them.

http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/AuroraMySQL.Managing.html#AuroraMySQL.Managing.MaxConnections

Instance Class	max_connections Default Value
```
db.t2.small 45
db.t2.medium 90
db.r3.large 1000 *Huge jump
db.r3.xlarge 2000
db.r3.2xlarge 3000
db.r3.4xlarge 4000
db.r3.8xlarge 5000
```

# FIFO Queues Kinda Suck
I had a hard time creating multiple readers using FIFO queues.  For whatever reason, the visiblity timeout
prevents other readers from seeing ANY other messages in the same message group.  It feels like the 
visibility Timeout MUST be set to zero in order to use multiple readers with FIFO queues???

```
    let params = {
        MessageAttributes: {},
        MessageBody: `{ "customerId": ${String(i)} }`,
        QueueUrl: queueURL, 
        MessageGroupId: String(i), // NOTE: This greatly affects how messages are viewed with the visiblity timeout feature.
        MessageGroupId: "CustomerId",
        MessageDeduplicationId: String(i)
    };
```
