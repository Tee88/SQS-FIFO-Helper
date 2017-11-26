'use strict';

const mysql = require('mysql');

const connection = mysql.createConnection({
  host     : 'lambda-db.civ85ykin3rg.us-east-1.rds.amazonaws.com',
  user     : 'sa',
  password : 'mjb3616!',
  database : 'carDB'
});
 
connection.connect();
 
connection.query('insert into invoice (customer_id, amount) values (1, 13.11);', (error, results, fields) => {
  if (error) throw error;
  console.log(results);
});
 
connection.end();
