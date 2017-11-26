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
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `ix_cus` (`customer_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

# Database Connections
Database connections are PRECIOUS.  You MUST conserve them.

http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/AuroraMySQL.Managing.html#AuroraMySQL.Managing.MaxConnections

Instance Class	max_connections Default Value
db.t2.small 45
db.t2.medium 90
db.r3.large 1000 *Huge jump
db.r3.xlarge 2000
db.r3.2xlarge 3000
db.r3.4xlarge 4000
db.r3.8xlarge 5000
