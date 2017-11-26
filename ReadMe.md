# SQS Helper
Helper project that uses FIFO queues.

# Notes
The VisibilityTimeout is super important.  You must understand how it works.

REMEMBER: SQS LIKES BIG QUEUES AND PERFORMS WEIRDLY WITH SMALL QUEUE SIZES.

http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html

http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/sqs-examples-send-receive-messages.html

# DDL
CREATE TABLE `invoice` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT '0',
  `amount` float DEFAULT '0',
  PRIMARY KEY (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
