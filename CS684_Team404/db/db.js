//var mysql = require("mysql");
var mysql2 = require('mysql2/promise');

var pool  = mysql2.createPool({
  connectionLimit : 10,
  host            : 'us-east.connect.psdb.cloud',
  user            : 'evf9sx5vuplnvljp2i65',
  password        : 'pscale_pw_pyiXZG4J2b6sJF5ad17ExOnjlPkVU8J9LIuaoMjPisr',
  database        : 'cs_631_project',
  ssl : {
      rejectUnauthorized: true
  }
  
});

module.exports = pool;