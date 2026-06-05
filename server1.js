const express = require('express');
const multer = require('multer');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
var g_bahar = 0;
var g_andar = 0;
var number = [5,8,7,5,3,4,6,8,6,3];
var tiger_card_type;
var dragon_card_type;
const CryptoJS = require('crypto-js');
const secretKey = 'my-very-secure-key'; // Replace with your actual secret key
const upload = multer({ storage: storage });
var cut_card;
var cut_card_type;
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const mysql = require("mysql2");
const { close } = require('fs');
var userSockets = new Map();
var TPuserSockets = new Map();
const demo_andar = new Map();
const demo_bahar = new Map();
var ABuserSockets= new Map();
var g_dragon_card=0;
var g_tiger_card=0;
var demo_tiger_card;
var demo_dragon_card;
var real_action;
var ab_clear;
var ab_process;
var demo_tiger_card_type;
var demo_dragon_card_type;
var andar_side=new Map();
var bahar_side= new Map();
var ABdisconnected_socekt= new Map();
const avitor = [
    112.45, 87.23, 145.67, 23.89, 78.34, 134.56, 56.78, 101.23, 149.90, 32.12,
    67.45, 123.78, 45.67, 89.01, 137.89, 12.34, 98.76, 54.32, 129.87, 76.54
];


var ABdataToSend=["A","B","B","A","A","B","B","A","A","B"];
var demo_ABdataToSend=["A","B","B","A","A","B","B","A","A","B"];
var Disconnected_socket = new Map();
var ABDisconnected_socket = new Map();


// At the top of the file where other maps are defined
var demoUserSockets = new Map();
var andar_side = new Map();
var bahar_side = new Map();
var Tiger_side = new Map();
var Dragon_side= new Map();
const dataToSend = ["D", "D", "T","T","D","T","D","D","T","T"]; // Example data
const demo_dataToSend = ["D", "D", "T","T","D","T","D","D","T","T"]; // Example data
const cors = require('cors');
app.use(bodyParser.urlencoded({ extended: true }));
const axios = require('axios');

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname)));

// Serve the deposit.html page
app.get('/deposit', (req, res) => {
  res.sendFile(path.join(__dirname, 'deposit.html'));
});

const SECRET_KEY = 'YTBrMXM2cGlkcg==';
var A = 30;
var demo_A = 30;
var AB = 60;
var demo_AB = 60;
var C = 47023354564;
var demo_C = 47023354564;
var CB = 7895451231;
var demo_CB = 7895451231;
var delay1 = 36000;
var ABdelay1 = 60000;
let BetDragon=0;
let demo_BetDragon=0;
let BetTiger=0;
let demo_BetTiger=0;
let BetBahar=0;
let BetAndar=0;
var stock_avitor=5000;
let dragon_card=0;
let tiger_card=0;
var real_big;
var real_small;
var demo_real_small;
var demo_real_big;
var demo_dragon_card_type;
var demo_tiger_card_type;
var cardArraySend;
var cardArraytypeSend;
var demo_cut_card_type;
var demo_cardArraytypeSend;
var demo_cut_card;
var demo_cardArraySend;
var winningSide;
var demo_winningSide;
var ABwinningSide;
var demo_BetBahar;
var demo_BetAndar;
var demo_ABwinningSide;
const demo_dragon = new Map();
const demo_tiger = new Map();
var andar_side = new Map();
var bahar_side = new Map();
const con = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Rahil@1234',
  database: 'bally_casino',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}); 

// const con = mysql.createPool({
//   host: "bally-casino.clu2oakuohzj.ap-south-1.rds.amazonaws.com",
//   user: "admin",
//   password: "Rahil6126",
//   database: "bally_casino",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// Use con.getConnection to get a connection from the pool
con.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database");

  connection.query("CREATE TABLE IF NOT EXISTS customers (name VARCHAR(255), address VARCHAR(255))", function (err, _result) {
    if (err) {
      console.error("Error creating the table: " + err.message);
    } else {
      console.log("Table 'customers' created or already exists.");
    }
    connection.release(); // Release the connection back to the pool
  });
});

// server.js (Node.js with Express)
app.post('/update-balance', async (req, res) => {
  const { user_id, amount } = req.body;
  console.log(user_id,amount);
  // if (users[user_id]) {
  //   users[user_id].balance += parseFloat(amount);
  //   res.json({ message: 'Balance updated successfully', balance: users[user_id].balance });
  // } else {
  //   res.status(404).json({ error: 'User not found' });
  // }
});

// Add this endpoint to handle demo logins
// Update the /demo-login endpoint to include a redirect URL
app.post('/demo-login', (req, res) => {
  const demoUserId = `demo-${Math.random().toString(36).substring(2, 9)}`;
  const initialBalance = 2000;

  // Check if the user already exists
  if (demoUserSockets.has(demoUserId)) {
    return res.status(400).json({ error: 'Demo user already exists' });
  }

  // Create a new socket-like object to store in the map
  const demoUserSocket = {
    userId: demoUserId,
    wallet: initialBalance,
    dragon_side_bet: 0,
    tiger_side_bet: 0,
    isDemo: true
  };

  // Store the demo user's data in the map
  demoUserSockets.set(demoUserId, demoUserSocket);

  // Send response back with the demo user ID, initial balance, and a redirect URL
  return res.json({
    message: 'Demo login successful',
    userId: demoUserId,
    balance: initialBalance,
    redirectUrl: `./demo/dashboard_demo.html?userId=${demoUserId}`
  });
});


app.post('/initiate-deposit', async (req, res) => {
  const { userId, amount } = req.body;

  // Log the incoming request data
  console.log('Received initiate-deposit request with data:', { userId, amount });

  // Check if amount is valid
  if (!amount || amount < 300) {
    return res.status(400).json({ status: 'fail', message: 'Amount cannot be empty or less than 1' });
  }

  const orderId = `DEP${Date.now()}${userId}`;

  const paymentData = {
    loginid: "9845516868",
    apikey: "x4ovdf5ech",
    orderid: orderId,
    amt: amount,
    trxnote: `Deposit for user ${userId}`,
    custmobile: "", // You might want to fetch this from your user database
    redirecturl: `http://localhost:4040/payment-result`, // Directly hardcoded URL
    mcallback_url: `http://localhost:4040/payment-callback` // Directly hardcoded URL
  };

  console.log('Initiating deposit with data:', paymentData);

  try {
    const response = await axios.post('https://pg.gtelararia.in/order/create', paymentData);
    console.log('Payment gateway response:', response.data);
    if (response.data.status === 'success') {
      await storePendingDeposit(userId, amount, orderId);
      res.json({ status: 'success', gotourl: response.data.gotourl });
    } else {
      res.json({ status: 'fail', message: response.data.msg });
    }
  } catch (error) {
    console.error('Error initiating deposit:', error.response ? error.response.data : error.message);
    res.status(500).json({ status: 'fail', message: 'Internal server error' });
  }
});

async function storePendingDeposit(userId, amount, orderId) {
  return new Promise((resolve, reject) => {
    con.query(
      'INSERT INTO pending_deposit (user_id, amount, transaction_id) VALUES (?, ?, ?)',
      [userId, amount, orderId],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

app.get('/payment-result', (req, res) => {
  const pgstatus = req.query.pgstatus;
  if (pgstatus === 'success') {
    res.redirect('/deposit-success.html');
  } else {
    res.redirect('/deposit-failure.html');
  }
});

app.post('/payment-callback', async (req, res) => {
  const { status, msg, data } = req.body;

  if (status === 'success') {
    try {
      const decryptedData = decryptCallbackData(data);
      const paymentDetails = new URLSearchParams(decryptedData);
      
      const orderId = paymentDetails.get('orderid');
      const amount = paymentDetails.get('amt');
      const transactionStatus = paymentDetails.get('status');

      if (transactionStatus === 'success') {
        await processSuccessfulDeposit(orderId, amount);
      }
    } catch (error) {
      console.error('Error processing callback data:', error);
    }
  } else {
    console.log('Payment callback failed:', msg);
  }

  res.sendStatus(200);
});

function decryptCallbackData(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', SECRET_KEY, null);
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


async function processSuccessfulDeposit(orderId, amount) {
  return new Promise((resolve, reject) => {
    con.beginTransaction((err) => {
      if (err) reject(err);

      con.query(
        'SELECT user_id FROM pending_deposit WHERE transaction_id = ?',
        [orderId],
        (err, results) => {
          if (err) {
            return con.rollback(() => reject(err));
          }

          if (results.length === 0) {
            return con.rollback(() => reject(new Error('Pending deposit not found')));
          }

          const userId = results[0].user_id;

          con.query(
            'UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
            [amount, userId],
            (err) => {
              if (err) {
                return con.rollback(() => reject(err));
              }

              con.query(
                'DELETE FROM pending_deposit WHERE transaction_id = ?',
                [orderId],
                (err) => {
                  if (err) {
                    return con.rollback(() => reject(err));
                  }

                  con.commit((err) => {
                    if (err) {
                      return con.rollback(() => reject(err));
                    }
                    resolve();
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

async function initiateDeposit(userId, amount) {
  try {
    const response = await fetch('/initiate-deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    });
    const data = await response.json();
    if (data.status === 'success') {
      window.location.href = data.gotourl;
    } else {
      alert('Deposit initiation failed: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

app.get('/api/pending_deposits', (req, res) => {
  console.log('Request received for pending deposits');
  const query = 'SELECT * FROM pending_deposit';
  con.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from the database: " + err.message);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    res.json(results);
  });
});

app.post('/create_account', (req, res) => {
  const { username, password, pin, gmail, mobileNumber } = req.body;

  // Check if the mobile number already exists
  const checkQuery = 'SELECT * FROM users WHERE mobile_number = ?';
  con.query(checkQuery, [mobileNumber], function (err, results) {
    if (err) {
      console.error("Error checking the mobile number: " + err.message);
      return res.status(500).json({ message: 'Error checking mobile number' });
    }
    
    if (results.length > 0) {
      // Mobile number already exists
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    // Insert the new user into the database
    const insertQuery = `
      INSERT INTO users (user_name, mobile_number, password, pin, gmail, wallet_balance)
      VALUES (?, ?, ?, ?, ?, 0)
    `;

    con.query(insertQuery, [username, mobileNumber, password, pin, gmail], function (err, result) {
      if (err) {
        console.error("Error inserting the new user: " + err.message);
        return res.status(500).json({ message: 'Error creating account' });
      }

      console.log("New user created with ID: " + result.insertId);
      res.json({ message: 'Account created successfully', userId: result.insertId });
    });
  });
});

app.post('/processWithdrawal', (req, res) => {
  const { userId, amount, ifcCode, accountNumber, accountHolderName } = req.body;

  console.log('Received withdrawal request:');
  console.log('User ID:', userId);
  console.log('Amount:', amount);
  console.log('IFC Code:', ifcCode);
  console.log('Account Number:', accountNumber);
  console.log('Account Holder Name:', accountHolderName);
  // Fetch the current account balance
  con.query("SELECT wallet_balance FROM users WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user data: " + err.message);
      return res.status(500).json({ success: false, message: 'Error fetching user data' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentBalance = results[0].wallet_balance;

    // Check if the account balance is sufficient
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    // Insert the withdrawal request into the pending_withdrawal table
    const insertQuery = `
      INSERT INTO pending_withdrawal (user_id, wallet_balance, amount, account_number, ifc_code, Accountholder_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    con.query(insertQuery, [userId, currentBalance, amount, accountNumber, ifcCode, accountHolderName], function (err, result) {
      if (err) {
        console.error("Error inserting data into the database: " + err.message);
        return res.status(500).json({ message: 'Error processing withdrawal' });
      }

      console.log("Data inserted into pending_withdrawal with ID: " + result.insertId);

      // Subtract the amount from the user's account balance and update the new value
      const newBalance = currentBalance - amount;
      const updateQuery = "UPDATE users SET wallet_balance = ? WHERE user_id = ?";

      con.query(updateQuery, [newBalance, userId], function (err, _result) {
        if (err) {
          console.error("Error updating user balance: " + err.message);
          return res.status(500).json({ message: 'Error updating user balance' });
        }

        console.log(`User ${userId} balance updated. New balance: ${newBalance}`);
        res.json({ message: 'Withdrawal request processed successfully', transactionId: result.insertId, newBalance: newBalance });
      });
    });
  });
});
app.post('/login', (req, res) => {
  const { mobileNumber, password } = req.body;
  
  // Validate input
  if (!mobileNumber || !password) {
    return res.status(400).json({ message: 'Mobile number and password are required' });
  }

  // Parameterized query to prevent SQL injection
  const loginQuery = "SELECT user_id, password FROM users WHERE mobile_number = ?";
  con.query(loginQuery, [mobileNumber], function (err, result) {
    if (err) {
      console.error("Error executing the query: " + err.message);
      return res.status(500).json({ message: 'Error executing the query' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'Mobile number not found' });
    }

    const user = result[0];
    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const responseData = {
      message: 'Login successful',
      user: user,
      redirectUrl: `user/dshboard.html?userId=${user.user_id}`
    };
    res.status(200).json(responseData);
  });
});

app.post('/updateUserWallet_demo', async (req, res) => {
  const userId = req.body.userId;
  console.log("Received user ID:", userId);

  // Use demoUserSockets map to check and retrieve the wallet balance
  if (demoUserSockets.has(userId)) {
    const userSocket = demoUserSockets.get(userId);
    console.log("User wallet balance:", userSocket.wallet);
    
    res.json({ walletBalance: userSocket.wallet });
  } else {
    console.log("Demo user not found:", userId); // Logging for debugging
    res.status(404).json({ error: 'Demo user not found' });
  }
});

app.post('/updateUserWallet', async (req, res) => {
  const userId = req.body.userId;
  // const bytes = CryptoJS.AES.decrypt(encryptedUserId, secretKey);
  // const userId = bytes.toString(CryptoJS.enc.Utf8);

  console.log("sssssssss",userId);


  con.query("SELECT wallet_balance,user_name,mobile_number FROM users WHERE user_id = ?", [userId], function (err, result) {
    if (err) {
      console.error("Error executing the query: " + err.message);
    } else {
      if (result.length > 0) {
        const user = result[0];
        const User_wallet = result[0].wallet_balance;
        const user_name = result[0].user_name;
        const mobile_number = result[0].mobile_number;
        console.log(User_wallet);
        
        var user_id=user.User_Id;
        
        res.json({ User_wallet, user_name, mobile_number });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
      
  }
       
    
  });
});
app.post('/dragonvstiger', (req, res) => {
  // Extract user ID from the request body
  const userId = req.body.user_idd;
  console.log("dragonvstiger user id:", userId);  

  // Assuming you perform any necessary operations with the user ID here

  // Construct the response data with the redirect URL
  const responseData = {
    message: 'Login successful',
    redirectUrl: `dragonVsTiger.html?userId=${userId}`
  };

  // Send the response with the combined data
  res.status(200).json(responseData);
});

app.post('/avitor', (req, res) => {
  // Extract user ID from the request body
  const userId = req.body.user_idd;
  console.log("aviator user id:", userId);  

  // Assuming you perform any necessary operations with the user ID here

  // Construct the response data with the redirect URL
  const responseData = {
    message: 'Login successful',
    redirectUrl: `avitor.html?userId=${userId}`
  };

  // Send the response with the combined data
  res.status(200).json(responseData);
});
app.post('/your-server-endpoint', (req, res) => {
  const { user_id, transaction_id, amount } = req.body;
  console.log(`Received amount: ${amount} for user_id: ${user_id} and transaction_id: ${transaction_id}`);

  // Fetch the current account balance
  con.query("SELECT wallet_balance FROM users WHERE user_id = ?", [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching user data: " + err.message);
      return res.status(500).json({ success: false, message: 'Error fetching user data' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentBalance = results[0].wallet_balance;
    const newBalance = currentBalance + parseFloat(amount);

    // Update the account balance
    con.query("UPDATE users SET wallet_balance = ? WHERE user_id = ?", [newBalance, user_id], (err, _result) => {
      if (err) {
        console.error("Error updating user balance: " + err.message);
        return res.status(500).json({ success: false, message: 'Error updating user balance' });
      }

      console.log(`Updated account balance for user_id: ${user_id}. New balance: ${newBalance}`);

      // Insert data into the successful_deposit table
      const insertQuery = `
        INSERT INTO successfull_deposit (transaction_id, user_id, amount, pic)
        VALUES (?, ?, ?, ?)
      `;
      con.query(insertQuery, [transaction_id, user_id, amount, ''], function (err, result) {
        if (err) {
          console.error("Error inserting data into successful_deposit: " + err.message);
          return res.status(500).json({ success: false, message: 'Error processing deposit' });
        }

        console.log("Data inserted into successful_deposit with ID: " + result.insertId);

        // Delete the row from the pending_deposit table
        const deleteQuery = "DELETE FROM pending_deposit WHERE transaction_id = ?";
        con.query(deleteQuery, [transaction_id], function (err, _result) {
          if (err) {
            console.error("Error deleting data from pending_deposit: " + err.message);
            return res.status(500).json({ success: false, message: 'Error deleting pending deposit' });
          }

          console.log(`Deleted pending deposit with transaction_id: ${transaction_id}`);
          res.json({ success: true, message: 'Amount added successfully', newBalance: newBalance, transactionId: transaction_id });
        });
      });
    });
  });
});




app.post('/upload', upload.single('file'), (req, res) => {
  const userId = req.body.user_id;
  const amount = req.body.amount;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  console.log('User ID:', userId);
  console.log('Amount:', amount);
  console.log('File:', file);
  // Insert data into the pending_deposit table
  const insertQuery = `
    INSERT INTO pending_deposit (user_id, wallet_balance, pic, amount)
    VALUES (?, 0, ?, ?)
  `;

  con.query(insertQuery, [userId, file.filename, amount], function (err, result) {
    if (err) {
      console.error("Error inserting data into the database: " + err.message);
      return res.status(500).json({ message: 'Error processing deposit' });
    }

    console.log("Data inserted into pending_deposit with ID: " + result.insertId);
    res.json({ message: 'Deposit processed successfully', transactionId: result.insertId });
  });
});

app.post('/arandar-vs-bahar', (req, res) => {
  // Extract user ID from the request body
  const userId = req.body.user_idd;
  console.log("arandar-vs-bahar user id:", userId);  

  // Assuming you perform any necessary operations with the user ID here

  // Construct the response data with the redirect URL
  const responseData = {
    message: 'Login successful',
    redirectUrl: `arandar-vs-bahar.html?userId=${userId}`
  };

  // Send the response with the combined data
  res.status(200).json(responseData);
});
app.post('/color', (req, res) => {
  // Extract user ID from the request body
  const userId = req.body.user_idd;
  console.log("color user id:", userId);  

  // Assuming you perform any necessary operations with the user ID here

  // Construct the response data with the redirect URL
  const responseData = {
    message: 'Login successful',
    redirectUrl: `color.html?userId=${userId}`
  };

  // Send the response with the combined data
  res.status(200).json(responseData);
});




io.on('connection', (socket) => {
  console.log('A client connected');
  io.emit("dataToClients", dataToSend);
  console.log("Initial data sent to client:", dataToSend);
  var userId1;

  // Send a message to the client when they connect
  socket.emit('message', 'Welcome to the server!');

  // Handle messages from client
  socket.on('clientMessage', (data) => {
    console.log('Received message from client:', data);
  });

  
socket.on("setUserId", (userId) => {
  
    // Decrypt the user ID
    const user_Id = userId;

    if (!user_Id) {
      throw new Error('Invalid user ID');
    }

    userId1 = user_Id;
    console.log("Checking Disconnected_socket for user_Id:", user_Id);
    if (Disconnected_socket.has(user_Id)) {
      const specificUserSocket = Disconnected_socket.get(user_Id);
      socket.dragon_side_bet = specificUserSocket.dragon_side_bet || 0;
      socket.tiger_side_bet = specificUserSocket.tiger_side_bet || 0;

      console.log(`User ${user_Id} reconnected with tiger_side_bet: ${socket.tiger_side_bet}, dragon_side_bet: ${socket.dragon_side_bet}`);
    } else {
      socket.dragon_side_bet = 0;
      socket.tiger_side_bet = 0;
    }
    userSockets.set(user_Id, socket);

    socket.wallet = 0;

    con.query("SELECT wallet_balance FROM users WHERE User_id = ?", [user_Id], function (err, result) {
      if (err) {
        console.error("Error executing the query: " + err.message);
      } else {
        if (result.length > 0) {
          const userWallet = result[0].wallet_balance;
          var dragon_side = socket.dragon_side_bet;
          var tiger_side = socket.tiger_side_bet;
          socket.wallet = userWallet;
          socket.emit('customEvent', userWallet);
          socket.emit('currentBetting', { dragon_side: dragon_side, tiger_side: tiger_side });
          console.log(`User ${user_Id} wallet: ${userWallet}`);
        } else {
          console.log(`User ${user_Id} not found.`);
        }
      }
    });

    console.log(`User ${user_Id} connected.`);

});


  
socket.on('betting', (data) => {
  try {
    // Decrypt the user ID
    const bytes = CryptoJS.AES.decrypt(data.userId, secretKey);
    const user_Id = data.userId;

    if (!user_Id) {
      throw new Error('Decryption failed');
    }

    const betAmount = parseInt(data.inputValue);
    const betSide = data.side;
    console.log("Bet:", betAmount, "on", betSide, "by", user_Id);

    if (userSockets.has(user_Id)) {
      const specificUserSocket = userSockets.get(user_Id);
      console.log("USER_BALANCE ", specificUserSocket.wallet);

      if (specificUserSocket.wallet >= betAmount) {
        const betInfo = {
          socket: specificUserSocket,
          betAmount: betAmount,
          userId: user_Id
        };

        if (betSide === 'Tiger') {
          BetTiger += betAmount;
          console.log('betting total tiger', BetTiger);
          if (Tiger_side.has(user_Id)) {
            const existingBet = Tiger_side.get(user_Id);
            existingBet.betAmount += betAmount;
            Tiger_side.set(user_Id, existingBet);
          } else {
            Tiger_side.set(user_Id, betInfo);
          }
        } else if (betSide === 'Dragon') {
          BetDragon += betAmount;
          console.log('total betting', BetDragon);
          if (Dragon_side.has(user_Id)) {
            const existingBet = Dragon_side.get(user_Id);
            existingBet.betAmount += betAmount;
            Dragon_side.set(user_Id, existingBet);
          } else {
            Dragon_side.set(user_Id, betInfo);
          }
        }

        const updatedWallet = specificUserSocket.wallet - betAmount;
        specificUserSocket.wallet = updatedWallet;

        con.query("UPDATE users SET wallet_balance = ? WHERE user_id = ?", [updatedWallet, user_Id], function (err, _result) {
          if (err) {
            console.error("Error deducting the bet amount: " + err.message);
          } else {
            console.log(`Deducted ${betAmount} from User ${user_Id}'s wallet. New wallet balance: ${updatedWallet}`);
          }

          // Emit events after database update
          emitUserEvents(user_Id, updatedWallet);
        });
      } else {
        console.log(`User ${user_Id} doesn't have sufficient balance to place the bet.`);
        specificUserSocket.emit('insuf');
      }
    } else {
      console.log(`User ${user_Id} not found in the Map.`);
      socket.emit('betError', 'User not found');
    }
  } catch (error) {
    console.error('Error decrypting user ID:', error.message);
    socket.emit('betError', 'Invalid user ID');
  }
});

  
  function emitUserEvents(userId, updatedWallet) {
    if (userSockets.has(userId)) {
      const specificUserSocket = userSockets.get(userId);
      specificUserSocket.emit('customEvent', updatedWallet);
  
      const currentBetting = {
        dragon_side: Dragon_side.has(userId) ? Dragon_side.get(userId).betAmount : 0,
        tiger_side: Tiger_side.has(userId) ? Tiger_side.get(userId).betAmount : 0
      };
      specificUserSocket.emit('currentBetting', currentBetting);
      console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
    } else {
      console.error(`Socket not found for user ${userId}`);
    }
  }


  socket.on("disconnect", () => {
    var userId=userId1;
    console.log("A client disconnected with user ID:", userId);

    // Check if the socket has betting data
    if (socket.dragon_side_bet || socket.tiger_side_bet) {
        const disconnectedUserData = {
            dragon_side_bet: socket.dragon_side_bet || 0,
            tiger_side_bet: socket.tiger_side_bet || 0
        };

        // Store the disconnected user's data in Disconnected_socket Map
        Disconnected_socket.set(userId, disconnectedUserData);
        console.log("Stored disconnected user data:", userId, disconnectedUserData);
    }
});


});
const dashboardNamespace = io.of('/dashboard');

dashboardNamespace.on('connection', (socket) => {
  console.log('A client connected to the dashboard namespace');

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A client disconnected from the dashboard namespace');
  });
});
// Example usage when the user reconnects
// Assuming you handle reconnection elsewhere in your code
// Create a namespace for demo Dragon vs Tiger
const demoDragonVsTigerNamespace = io.of('/demo-dragonvstiger');

// At the top of your file, create a map to store socket IDs for demo users
const demoUserSocketIds = new Map();

demoDragonVsTigerNamespace.on('connection', (socket) => {
  console.log('A demo client connected to Dragon vs Tiger');
  demoDragonVsTigerNamespace.emit("dataToClients", dataToSend);
  console.log("Data sent to demo clients:", dataToSend);
  let demoUserId;

  // Send a welcome message to the demo client
  socket.emit('message', 'Welcome to the demo Dragon vs Tiger game!');

  // Handle messages from demo client
  socket.on('clientMessage', (data) => {
    console.log('Received message from demo client:', data);
  });

  socket.on("setDemoUserId", (userId) => {
    demoUserId = userId;
    console.log("Demo user connected:", demoUserId);

    // Store the socket ID for this demo user
    demoUserSocketIds.set(demoUserId, socket.id);

    // Initialize demo user data if not exists
    if (!demoUserSockets.has(demoUserId)) {
      demoUserSockets.set(demoUserId, {
        userId: demoUserId,
        wallet: demoUserSockets.get(demoUserId)?.wallet || 2000, // Get wallet balance from map or use initial demo balance
        dragon_side_bet: 0,
        tiger_side_bet: 0
      });
    }

    const demoUserData = demoUserSockets.get(demoUserId);
    socket.emit('customEvent', demoUserData.wallet);
    socket.emit('currentBetting', {
      dragon_side: demoUserData.dragon_side_bet,
      tiger_side: demoUserData.tiger_side_bet
    });

    console.log(`Demo user ${demoUserId} connected with wallet: ${demoUserData.wallet}`);
  });

  socket.on('betting', (data) => {
    const userId = data.userId;
    const betAmount = parseInt(data.inputValue);
    const betSide = data.side;
    console.log("Demo Dragon vs Tiger bet:", betAmount, "on", betSide, "by", userId);

    if (demoUserSockets.has(userId)) {
      const demoUserData = demoUserSockets.get(userId);
      
      if (demoUserData.wallet >= betAmount) {
        const betInfo = {
          socket: socket,
          betAmount: betAmount,
          userId: userId
        };

        if (betSide === 'Tiger') {
          demo_BetTiger += betAmount;
          if (demo_tiger.has(userId)) {
            const existingBet = demo_tiger.get(userId);
            existingBet.betAmount += betAmount;
            demo_tiger.set(userId, existingBet);
          } else {
            demo_tiger.set(userId, betInfo);
          }
        } else if (betSide === 'Dragon') {
          demo_BetDragon += betAmount;
          if (demo_dragon.has(userId)) {
            const existingBet = demo_dragon.get(userId);
            existingBet.betAmount += betAmount;
            demo_dragon.set(userId, existingBet);
          } else {
            demo_dragon.set(userId, betInfo);
          }
        }

        demoUserData.wallet -= betAmount;
        demoUserSockets.set(userId, demoUserData);

        console.log(`Deducted ${betAmount} from Demo User ${userId}'s wallet. New wallet balance: ${demoUserData.wallet}`);
        
        socket.emit('customEvent', demoUserData.wallet);
        socket.emit('currentBetting', {
          dragonSide: demo_dragon.has(userId) ? demo_dragon.get(userId).betAmount : 0,
          tigerSide: demo_tiger.has(userId) ? demo_tiger.get(userId).betAmount : 0
        });
      } else {
        console.log(`Demo User ${userId} doesn't have sufficient balance to place the bet.`);
        socket.emit('betError', 'Insufficient balance');
      }
    } else {
      console.log(`Demo User ${userId} not found.`);
      socket.emit('betError', 'User not found');
    }
  });

  socket.on("disconnect", () => {
    console.log("A demo client disconnected:", demoUserId);
    // You might want to handle disconnection differently for demo users
    // For example, you could clear their data or keep it for a certain period
  });
});
function demo_add() {
  demo_A--;
  
  if(demo_A === 32){
    demoDragonVsTigerNamespace.emit("dataToClients", demo_dataToSend);
  }

  if (demo_A === 15) {
    demoDragonVsTigerNamespace.emit("clear_batting");
    demoDragonVsTigerNamespace.emit("disable");
    console.log("Demo: hello CCCCC");
  }

  if (demo_A === 13) {
    const seed = new Date().getTime();
    Math.random(seed);
    var demo_number1 = Math.floor(Math.random() * 13) + 1;
    var demo_number2 = Math.floor(Math.random() * 12) + 2;
    if (demo_number1 === demo_number2) {
      demo_number1 = demo_number2 - 1;
    }

    const demo_smallerNumber = Math.min(demo_number1, demo_number2);
    const demo_largerNumber = Math.max(demo_number1, demo_number2);
    demo_real_small = demo_smallerNumber;
    demo_real_big = demo_largerNumber;
    console.log(`Demo: Smaller number: ${demo_smallerNumber}`);
    console.log(`Demo: Larger number: ${demo_largerNumber}`);

    var demo_type = ["A", "B", "C", "D"];
    var demo_AR;
    var demo_BR;
    
    demo_AR = demo_type[Math.floor(Math.random() * demo_type.length)];
    var demo_remainingTypes = demo_type.filter(element => element !== demo_AR);
    demo_BR = demo_remainingTypes[Math.floor(Math.random() * demo_remainingTypes.length)];
    
    console.log("Demo A:", demo_AR);
    console.log("Demo B:", demo_BR);
    
    demo_dragon_card_type = demo_AR;
    demo_tiger_card_type = demo_BR;
  }

  if (demo_A === 10) {
    console.log("Demo:", demo_BetDragon, demo_BetTiger);
    if (demo_BetDragon > demo_BetTiger) {
      demo_tiger_card = demo_real_small;
      demo_dragon_card = demo_real_big;
      demo_winningSide = "Dragon";
    } else if (demo_BetDragon < demo_BetTiger) {
      demo_tiger_card = demo_real_big;
      demo_dragon_card = demo_real_small;
      demo_winningSide = "Tiger";
    } else {
      const demo_choice = Math.random() < 0.5 ? 'X' : 'Y';
      console.log("Demo choice:", demo_choice);
      
      if (demo_choice === 'X'){
        demo_dragon_card = demo_real_big;
        demo_tiger_card = demo_real_small;
        demo_winningSide = "Dragon";
      } else {
        demo_tiger_card = demo_real_big;
        demo_dragon_card = demo_real_small;
        demo_winningSide = "Tiger";
      }
    }
    console.log("Demo winning side:", demo_winningSide);
  }

  if (demo_A === 8) {
    var demo_D = demo_dragon_card;
    var demo_T = demo_tiger_card;
    console.log("Demo D:" + demo_D + " T:" + demo_T);
   
    demoDragonVsTigerNamespace.emit("which_card", { L: demo_D, M: demo_T, N: demo_dragon_card_type, O: demo_tiger_card_type });
  }
  if (demo_A === 2) {
    function emitUserEvents(userId, updatedWallet) {
      if (userSockets.has(userId)) {
        const specificUserSocket = userSockets.get(userId);
        specificUserSocket.emit('customEvent', updatedWallet);
    
        const currentBetting = {
          dragon_side: Dragon_side.has(userId) ? Dragon_side.get(userId).betAmount : 0,
          tiger_side: Tiger_side.has(userId) ? Tiger_side.get(userId).betAmount : 0
        };
        specificUserSocket.emit('currentBetting', currentBetting);
        console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
      } else {
        console.error(`Socket not found for user ${userId}`);
      }
    }
    console.log("Processing Demo Dragon vs Tiger results");
    console.log("Demo Users:", demoUserSockets);
    
    const processWinnings = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        if (demoUserSockets.has(userId)) {
          const demoUserData = demoUserSockets.get(userId);
          const winnings = betInfo.betAmount * 2; // Assuming 1:1 payout
          demoUserData.wallet += winnings;
          console.log(`Demo User ${userId} won ${winnings} on ${demo_winningSide}! New wallet balance: ${demoUserData.wallet}`);
          demoUserSockets.set(userId, demoUserData);
          betInfo.socket.emit('customEvent', demoUserData.wallet);
        }
      });
    };
  
    if (demo_winningSide === "Dragon") {
      processWinnings(demo_dragon);
    } else if (demo_winningSide === "Tiger") {
      processWinnings(demo_tiger);
    } else {
      console.error("Invalid winning side:", demo_winningSide);
    }
  
    // Reset bets and emit current betting (reset to 0 for all users)
    const resetBetsAndEmit = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        betInfo.socket.emit('currentBetting', {
          dragonSide: 0,
          tigerSide: 0
        });
      });
      betMap.clear();
    };
  
    resetBetsAndEmit(demo_dragon);
    resetBetsAndEmit(demo_tiger);
  
    demo_dataToSend.shift();
    console.log("Demo winning side:", demo_winningSide);
    
    // Check if demo_winningSide is a valid string before using charAt
    let demo_firstWord = '';
    if (typeof demo_winningSide === 'string' && demo_winningSide.length > 0) {
      demo_firstWord = demo_winningSide.charAt(0);
    } else {
      console.error("Invalid demo_winningSide:", demo_winningSide);
      demo_firstWord = 'X'; // Use a default value or handle this case as needed
    }
    
    demo_dataToSend.push(demo_firstWord);
    console.log("Demo data to send:", demo_dataToSend);
    demo_BetDragon = 0;
    demo_BetTiger = 0;
    demo_winningSide = ''; // Reset to an empty string instead of 0
  }
}


function emitSetTimeEvent() {
  io.emit("settime");

  function erase() {
    A =36;
    C++;
    Disconnected_socket.clear();
    BetDragon = 0;
    BetTiger = 0;
    g_dragon_card = 0;
    g_tiger_card = 0;
    io.emit("clear_batting");
  }

  setTimeout(erase, 6000);
}

function demo_emitSetTimeEvent() {
  demoDragonVsTigerNamespace.emit("settime");

  function erase() {
    demo_A = 36;
    demo_C++;
    demoUserSockets.forEach((userData, userId) => {
      userData.dragon_side_bet = 0;
      userData.tiger_side_bet = 0;
    });
    demo_BetDragon = 0;
    demo_BetTiger = 0;
    demoDragonVsTigerNamespace.emit("clear_batting");
  }
  setTimeout(erase, 6000);
}
function data() {
  
  io.emit("data", { D: A, F: C, G: g_dragon_card, H: g_tiger_card });
  
}

function demo_data() {
  demoDragonVsTigerNamespace.emit("data", { D: demo_A, F: demo_C });
}


function add() {
  A--;
  
  
  
   // If A is already a string
 // Output will be "00" Output will be "00"
  
 if(A === 32){
  io.emit("dataToClients", dataToSend);
 }
//  console.log(A)
 if (A === 15) {
   io.emit("clear_batting");
    io.emit("disable");
    console.log("hello CCCCC");
  }
  if (A === 13) {
    const seed = new Date().getTime();
    Math.random(seed);
    var number1 = Math.floor(Math.random() * 13) + 1;
    var number2 = Math.floor(Math.random() * 12) + 2;
    if (number1 === number2) {
      number1 = number2 - 1;
    }

    const smallerNumber = Math.min(number1, number2);
    const largerNumber = Math.max(number1, number2);
    real_small = smallerNumber;
    real_big = largerNumber;
    console.log(`Smaller number:rrrr ${smallerNumber}`);
    console.log(`Larger number:rrrr ${largerNumber}`);

    var type = ["A", "B", "C", "D"];
    var AR;
    var BR;
    
    // Randomly choose an element for A
    AR = type[Math.floor(Math.random() * type.length)];
    
    // Filter out the chosen element and randomly select another for B
    var remainingTypes = type.filter(element => element !== AR);
    BR = remainingTypes[Math.floor(Math.random() * remainingTypes.length)];
    
    console.log("A:", AR);
    console.log("B:", BR);
    
     dragon_card_type=AR;
     tiger_card_type=BR;
  }
  if (A === 10) {
    console.log(BetDragon,BetTiger);
    console.log("BetDragon:", BetDragon, "BetTiger:", BetTiger);
    if (BetDragon < BetTiger) {
      tiger_card = real_small;
      dragon_card = real_big;
      winningSide = "Dragon";
    } else {
      if (BetDragon > BetTiger) {
        tiger_card = real_big;
        dragon_card = real_small;
        winningSide = "Tiger";
      }
      else {
        if (BetDragon === BetTiger) {
          const choice = Math.random() < 0.5 ? 'X' : 'Y';
          console.log(choice);
          
          if (choice === 'X'){
          dragon_card = real_big;
          tiger_card = real_small;
          winningSide = "Dragon";
          }
          else{ if(choice === 'Y'){
            tiger_card = real_big;
            dragon_card = real_small;
            winningSide = "Tiger";
          }
        }
        }
      }
    }console.log("winininnnnnnn",winningSide);
  }

  if (A === 8) {
    var D = dragon_card;
    var T = tiger_card;
    console.log("D:" + D + "T" + T);
   
    io.emit("which_card", { L: T, M: D ,N:dragon_card_type, O:tiger_card_type});
  }
  if (A === 2) {
    function emitUserEvents(userId, updatedWallet) {
      if (userSockets.has(userId)) {
        const specificUserSocket = userSockets.get(userId);
        specificUserSocket.emit('customEvent', updatedWallet);
    
        const currentBetting = {
          dragon_side: Dragon_side.has(userId) ? Dragon_side.get(userId).betAmount : 0,
          tiger_side: Tiger_side.has(userId) ? Tiger_side.get(userId).betAmount : 0
        };
        specificUserSocket.emit('currentBetting', currentBetting);
        console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
      } else {
        console.error(`Socket not found for user ${userId}`);
      }
    }
    console.log("Processing Dragon vs Tiger results");
    

    
    const processWinnings = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        if (userSockets.has(userId)) {
          const specificUserSocket = userSockets.get(userId);
          const winnings = betInfo.betAmount * 2; // Assuming 1:1 payout
          specificUserSocket.wallet += winnings;
          console.log(`User ${userId} won ${winnings} on ${winningSide}! New wallet balance: ${specificUserSocket.wallet}`);
          specificUserSocket.emit('winningAmount', { amount: winnings, side: winningSide });
          con.query("UPDATE users SET wallet_balance = ? WHERE user_id = ?", [specificUserSocket.wallet, userId], function (err, _result) {
            if (err) {
              console.error("Error updating wallet after win: " + err.message);
            } else {
              console.log(`Updated wallet for User ${userId}. New balance: ${specificUserSocket.wallet}`);
            }
            
            // Emit events after database update
            emitUserEvents(userId, specificUserSocket.wallet);
          });
        }
      });
    };
  
    if (winningSide === "Dragon") {
      processWinnings(Dragon_side);
    } else if (winningSide === "Tiger") {
      processWinnings(Tiger_side);
    }
  
    // Reset bets and emit current betting (reset to 0 for all users)
    const resetBetsAndEmit = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        if (userSockets.has(userId)) {
          emitUserEvents(userId, userSockets.get(userId).wallet);
        }
      });
      betMap.clear();
    };
  
    resetBetsAndEmit(Dragon_side);
    resetBetsAndEmit(Tiger_side);
  
    dataToSend.shift();
    console.log("Winning side:sssssssssssssssssssssssssss", winningSide);
    const firstWord = winningSide.charAt(0);
    dataToSend.push(firstWord);
    console.log("Data to send:", dataToSend);
    BetDragon = 0;
    BetTiger = 0;
    winningSide = '';
  }
  }


function generateAndSendDataToServer() {
  if (A < 30 && A > 16) {
    // Generate data for the array



    const data = [];
    
    // First element as variable C
    data.push(C.toString());

    // Second element: Generate a 3-digit number along with "******"
    const randomNumber = Math.floor(100 + Math.random() * 900); // Generate 3-digit number
    const stringWithStars = "**********"+randomNumber.toString(); // Replace digits with "*"
    data.push(stringWithStars);

    // Third element: Choice between D or T
    const choice = Math.random() < 0.5 ? 'D' : 'T'; // Randomly choose between D and T
    data.push(choice);

    // Fourth element: Generate a 2-digit number and multiply it with 100
    const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90); // Generate 2-digit number
    const multipliedNumber = randomTwoDigitNumber * 10; // Multiply by 100
    data.push(multipliedNumber.toString());
    if(choice === 'D'){
      g_dragon_card += multipliedNumber;
    }
    else{
      g_tiger_card += multipliedNumber;
    }
    // Send the array to the server
    io.emit("arrayToServer", data);


   
    
  }

}

function generatewinn() {
  // Generate data for the array
  const data = [];
  
  // First element as variable C
  data.push((Math.floor(Math.random() * 4) + 1).toString());
var indianNames = [
  "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Divya", "Gaurav", "Ishaan",
  "Kavya", "Manish", "Neha", "Priya", "Rahul", "Riya", "Sanjay", "Shreya",
  "Vikram", "Zara", "Deepak", "Esha", "Farhan", "Geeta", "Harish", "Isha",
  "Jatin", "Kiran", "Lakshmi", "Mohan", "Nandini", "Omkar", "Pooja", "Rajesh",
  "Sarika", "Tanvi", "Uday", "Varun", "Yamini", "Aditya", "Bhavya", "Chetan"
];
  // Second element: Generate a 3-digit number along with "******"
  const randomName = indianNames[Math.floor(Math.random() * indianNames.length)];
  const randomAlphabet1 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomAlphabet2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const maskedName = `${randomName} ${randomAlphabet1}****${randomAlphabet2}`;
  data.push(maskedName);

  // Third element: Choice between D or T
  const gameTypes = ['dt', 'ab', 'teen', 'rollet','color','avitor'];
  const choice = gameTypes[Math.floor(Math.random() * gameTypes.length)];
  data.push(choice);2

  // Fourth element: Generate a 2-digit number and multiply it with 100
  const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90); // Generate 2-digit number
  const multipliedNumber = randomTwoDigitNumber * 100; // Multiply by 100
  data.push(multipliedNumber.toString());

 
  // Send the array to the server
  dashboardNamespace.emit("arrayToServer", data);
}



// Call the function periodically
setInterval(generateAndSendDataToServer,500); // Adjust the interval as needed
setInterval(generateAndSendDataToServer,500); // Adjust the interval as needed
setInterval(generatewinn,1000); // Adjust the interval as needed



setInterval(data, 1000);
setInterval(add, 1000);
setInterval(emitSetTimeEvent, delay1);
setInterval(demo_data, 1000);
setInterval(demo_add, 1000);
setInterval(demo_emitSetTimeEvent, delay1);





const PORT = process.env.PORT || 4040;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
//////////  andar bahar logic 

const andarVsBaharNamespace = io.of('/andarvsbahar');

andarVsBaharNamespace.on('connection', (socket) => {
  if(AB < 57 && AB >32)
    {  andarVsBaharNamespace.emit("main_card",{ L: cut_card, M: cut_card_type});
};

  console.log('A client connected to Andar vs Bahar namespace');
  let userId1;
 
  andarVsBaharNamespace.emit("ABdataToClients", ABdataToSend);
  console.log(ABdataToSend)
  andarVsBaharNamespace.emit('message', 'Welcome to the Andar vs Bahar game!');

  socket.on("setUserId", (userId) => {
    var user_Id = userId;
    socket.userId = user_Id;
    console.log("Checking for user_Id:", user_Id);

    // Set or update the user socket in the map


    if (ABDisconnected_socket.has(user_Id)) {
        const disconnectedData = ABDisconnected_socket.get(user_Id);
        // Apply the disconnected data to the current socket
        socket.andarSideBet = disconnectedData.andarSideBet || 0;
        socket.baharSideBet = disconnectedData.baharSideBet || 0;
    } else {
        // Initialize bets to zero if no disconnected data is found
        socket.andarSideBet = 0;
        socket.baharSideBet = 0;
    }
    ABuserSockets.set(user_Id, socket);
    // Emit current betting state to the client
    socket.emit('currentBetting', {andarSide: socket.andarSideBet, baharSide: socket.baharSideBet});
    console.log(`User ${user_Id} connected with andarSideBet: ${socket.andarSideBet}, baharSideBet: ${socket.baharSideBet}`);

    // Initialize wallet to zero and query for the actual value
    socket.wallet = 0;
    con.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to the database: " + err.stack);
        return;
      }
      connection.query("SELECT wallet_balance FROM users WHERE user_id = ?", [user_Id], function (err, result) {
        if (err) {
          console.error("Error executing the query: " + err.message);
        } else if (result.length > 0) {
          const userWallet = result[0].wallet_balance;
          socket.wallet = userWallet;
          socket.emit('customEvent', userWallet);
          console.log(`User ${user_Id} wallet: ${userWallet}`);
        } else {
          console.log(`User ${user_Id} not found.`);
        }
        connection.release(); // Release the connection back to the pool
      });
    });
  });

  function emitUserEvents(userId, updatedWallet) {
    console.log("sdfhasdfasdjk");
    if (ABuserSockets.has(userId)) {
      const specificUserSocket = ABuserSockets.get(userId);
      specificUserSocket.emit('customEvent', updatedWallet);
      const currentBetting = {
        baharSide: bahar_side.has(userId) ? bahar_side.get(userId).betAmount : 0,
        andarSide: andar_side.has(userId) ? andar_side.get(userId).betAmount : 0
      };
      console.log("currentBettingg", currentBetting);
      specificUserSocket.emit('currentBetting', currentBetting);
      console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
    } else {
      console.error(`Socket not found for user ${userId}`);
    }
  }
  socket.on('betting', (data) => {
    const userId = data.userId;
    const betAmount = parseInt(data.inputValue);
    const betSide = data.side;
    console.log("Bet:", betAmount, "on", betSide, "by", userId);
  
   
  
    if (ABuserSockets.has(userId)) {
      const specificUserSocket = ABuserSockets.get(userId);
      console.log('USER_BALANCE ', specificUserSocket.wallet);
      
      if (specificUserSocket.wallet >= betAmount) {
        const betInfo = {
          socket: socket,
          betAmount: betAmount,
          userId: userId
        };
  
        if (betSide === 'Bahar') {
          BetBahar += betAmount;
          if (bahar_side.has(userId)) {
            const existingBet = bahar_side.get(userId);
            existingBet.betAmount += betAmount;
            bahar_side.set(userId, existingBet);
          } else {
            bahar_side.set(userId, betInfo);
          }
        } else if (betSide === 'Andar') {
          BetAndar += betAmount;
          if (andar_side.has(userId)) {
            const existingBet = andar_side.get(userId);
            existingBet.betAmount += betAmount;
            andar_side.set(userId, existingBet);
          } else {
            andar_side.set(userId, betInfo);
          }
        }
  
        const updatedWallet = specificUserSocket.wallet - betAmount;
        specificUserSocket.wallet = updatedWallet;
  
        con.getConnection((err, connection) => {
          if (err) {
            console.error("Error connecting to the database: " + err.stack);
            return;
          }
          connection.query('UPDATE users SET wallet_balance = ? WHERE user_id = ?', [updatedWallet, userId], function (err, _result) {
            if (err) {
              console.error('Error deducting the bet amount: ' + err.message);
            } else {
              console.log(`Deducted ${betAmount} from User ${userId}'s wallet. New wallet balance: ${updatedWallet}`);
            }
            connection.release(); // Release the connection back to the pool
            
            // Emit events after database update
            emitUserEvents(userId, updatedWallet);
          });
        });
      } else {
        console.log(`User ${userId} doesn't have sufficient balance to place the bet.`);
        socket.emit('betError', 'Insufficient balance');
      }
    } else {
      console.log(`User ${userId} not found in the Map.`);
      socket.emit('betError', 'User not found');
    }
  });
  
 

  socket.on('disconnect', () => {
    const userId = socket.userId; 
    if (ABuserSockets.has(userId)) {
      const specificUserSocket = ABuserSockets.get(userId);
      if (specificUserSocket.andarSideBet || specificUserSocket.baharSideBet) {
        const disconnectedUserData = {
          andarSideBet: specificUserSocket.andarSideBet || 0,
          baharSideBet: specificUserSocket.baharSideBet || 0
        };
        ABDisconnected_socket.set(userId, disconnectedUserData);
        console.log('Stored disconnected user data:', userId, disconnectedUserData);
      }
    }
    console.log('A client disconnected with user ID:', userId);

   
  });
});
function ABdata() {
  if(AB > 29 ){
  var AZ= AB - 30;
  andarVsBaharNamespace.emit("data", { D: AZ, F: CB, l:g_bahar, m:g_andar });
  }
}

function ABadd(){

  AB--;
  if(AB === 58){
    andarVsBaharNamespace.emit("ABdataToClients", ABdataToSend);
    function getRandomCombination() {
      // Define the array A
      const A = ["A", "B", "C", "D"];
    const C =[1,2,3,4,5,6,7,8,9,10,11,12,13];
      // Generate a random number between 0 and 13
      const randomNumber = C[Math.floor(Math.random() * 13)];
    
      // Select a random item from array A
      const randomItem = A[Math.floor(Math.random() * A.length)];
    
      // Combine the random number and the random item
      cut_card = randomNumber;
      cut_card_type=randomItem;
    
      // Return the result
      
    }

    
    // Example usage
    getRandomCombination()
    console.log('CUT ACAR',cut_card);
    // andarVsBaharNamespace.emit("main_card",{ L: cut_card, M: cut_card_type});
   }
   if(AB === 57){
    
    andarVsBaharNamespace.emit("main_card",{ L: cut_card, M: cut_card_type});
   
   }
  
  
  // Call the function periodically; // Adjust the interval as needed
   if (AB === 45) {
    // Define the set of numbers as an array
    const numberSet = [5, 6, 7, 8, 9,10];
  
    // Select a random number from the set
    const randomIndex = Math.floor(Math.random() * numberSet.length);
    const selectedNumber = parseInt(numberSet[randomIndex]);
  
    // Multiply the selected number by 2
    const cardLength = selectedNumber * 2;
  
    // Define the array to choose items from
    const itemSetc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    // Remove the cut_card from the itemSetc and store the result in itemSet
    const itemSet = itemSetc.filter(item => item !== cut_card);

  
    // Create an array of length cardLength
    const cardArray = new Array(cardLength);
    const cardArraytype=new Array(cardLength);
  
    // Fill the cardArray with random items from itemSet
    for (let i = 0; i < cardArray.length; i++) {
      const randomItemIndex = Math.floor(Math.random() * itemSet.length);
      cardArray[i] = itemSet[randomItemIndex];
    }
    const card_type_list = ["A", "B", "C", "D"];
    const usedTypesForCardValue = {};  // Object to store used types for each card value
    
    for (let i = 0; i < cardArray.length; i++) {
        let selectedType;
        let attempts = 0;
    
        do {
            let randomItemIndex = Math.floor(Math.random() * card_type_list.length);
            selectedType = card_type_list[randomItemIndex];
    
            // Initialize the set for this card value if it doesn't exist
            if (!usedTypesForCardValue[cardArray[i]]) {
                usedTypesForCardValue[cardArray[i]] = new Set();
            }
    
            // If all types have been used, reset to allow reuse
            if (usedTypesForCardValue[cardArray[i]].size >= card_type_list.length) {
                usedTypesForCardValue[cardArray[i]].clear();
            }
    
            attempts++;
            // Ensure we don't enter an infinite loop
            if (attempts > 100) {
                throw new Error("Too many attempts to find a unique card type");
            }
        } while (usedTypesForCardValue[cardArray[i]].has(selectedType));
    
        // Assign the selected type to the current card and update the used types for this card value
        cardArraytype[i] = selectedType;
        usedTypesForCardValue[cardArray[i]].add(selectedType);  // Store the used type for this card value
    }
// Output the result
console.log('Card Types:', cardArraytype);
for (let i = 0; i < cardArray.length; i++) {
  // console.log(`Card Value: ${cardArray[i]}, Card Type: ${cardArraytype[i]}`);
}
    console.log('Card cardArraytype:', cardArraytype);
    cardArraytypeSend=cardArraytype;
    console.log('Card Length:', cardLength);
    console.log('Card Array:', cardArray);
    cardArraySend=cardArray;
    console.log('Cut Card:', cut_card);
  }

   if (AB === 36) {
    andarVsBaharNamespace.emit("clear_batting");
    andarVsBaharNamespace.emit("disable");
     console.log("hello CCCCC");
   }
   if (AB === 34) {
    console.log(BetAndar, BetBahar);
    if (BetAndar > BetBahar) {
         // Assuming real_big is a variable you've defined elsewhere
      ABwinningSide = "Bahar";
  
      // Assuming CardArraySend is already defined and populated
      if (cardArraySend.length > 0) {
        cardArraytypeSend.pop();
        cardArraySend.pop(); // Remove the last item from the original array
      }
  
      // Create a new array or modify an existing one
      let newArray = [...cardArraySend]; // Copying the existing CardArraySend for modification
      if (newArray.length > 0) {
          newArray[newArray.length - 1] = cut_card; // Replace the last item with cut_card
      }
  
      // Update CardArraySend with the modified array
      cardArraySend = newArray;
  
      console.log("Updated CardArraySend:", cardArraySend);
  } else if (BetAndar < BetBahar) {
    let newArray = [...cardArraySend]; // Copying the existing CardArraySend for modification
    if (newArray.length > 0) {
        newArray[newArray.length - 1] = cut_card; // Replace the last item with cut_card
    }

    // Update CardArraySend with the modified array
    cardArraySend = newArray;

    console.log("Updated CardArraySend:", cardArraySend);
    ABwinningSide = "Andar";
    } else { // BetAndar === BetBahar
        const choice = Math.random() < 0.5 ? 'X' : 'Y';
        console.log(choice);

        if (choice === 'X') {
          let newArray = [...cardArraySend]; // Copying the existing CardArraySend for modification
          if (newArray.length > 0) {
              newArray[newArray.length - 1] = cut_card; // Replace the last item with cut_card
          }
      
          // Update CardArraySend with the modified array
          cardArraySend = newArray;
      
          console.log("Updated CardArraySend:", cardArraySend);
          ABwinningSide = "Andar";
        } else { // choice === 'Y'
          if (cardArraySend.length > 0) {
            cardArraySend.pop()
            cardArraytypeSend.pop(); // Remove the last item from the original array
        }
    
        // Create a new array or modify an existing one
        let newArray = [...cardArraySend]; // Copying the existing CardArraySend for modification
        if (newArray.length > 0) {
            newArray[newArray.length - 1] = cut_card; // Replace the last item with cut_card
        }
    
        // Update CardArraySend with the modified array
        cardArraySend = newArray;
    
        console.log("Updated CardArraySend:", cardArraySend);
        ABwinningSide = "Bahar";
        }
    }
    console.log(`ABwinningSide side: ${ABwinningSide}`);
}
   
  
  
   if (AB===32){
    console.log("cards list ",cardArraySend,cardArraySend.length)
    andarVsBaharNamespace.emit("card_delecer",{ L: cardArraySend, M: cardArraytypeSend});
    // setInterval(function(){ andarVsBaharNamespace.emit("card_delecer",{ L: cardArraySend, M: cardArraytypeSend});},20000);
    
   }
   if(AB === 30){
    console.log("card cardArraySend00 ",cardArraySend);
    andarVsBaharNamespace.emit("move",{L:cardArraySend});
    real_action=(2 * (cardArraySend.length)) + 5; 
   
    ab_clear=(30 - real_action );
    ab_process=(30 - (real_action - 2));
  
   }
 
if (AB === ab_process) {
  function emitUserEvents(userId, updatedWallet) {
    if (userSockets.has(userId)) {
      const specificUserSocket = userSockets.get(userId);
      specificUserSocket.emit('customEvent', updatedWallet);
  
      const currentBetting = {
        dragon_side: Dragon_side.has(userId) ? Dragon_side.get(userId).betAmount : 0,
        tiger_side: Tiger_side.has(userId) ? Tiger_side.get(userId).betAmount : 0
      };
      specificUserSocket.emit('currentBetting', currentBetting);
      console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
    } else {
      console.error(`Socket not found for user ${userId}`);
    }
  }
  console.log("Processing Andar Bahar results");
  
  const processWinnings = (betMap) => {
    betMap.forEach((betInfo, userId) => {
      if (ABuserSockets.has(userId)) {
        const specificUserSocket = ABuserSockets.get(userId);
        const winnings = betInfo.betAmount * 2; // Assuming 1:1 payout
        specificUserSocket.wallet += winnings;
        console.log(`User ${userId} won ${winnings} on ${ABwinningSide}! New wallet balance: ${specificUserSocket.wallet}`);
        specificUserSocket.emit('winningAmount', { amount: winnings, side: ABwinningSide });
        con.getConnection((err, connection) => {
          if (err) {
            console.error("Error connecting to the database: " + err.stack);
            return;
          }
          connection.query("UPDATE users SET wallet_balance = ? WHERE user_id = ?", [specificUserSocket.wallet, userId], function (err, _result) {
            if (err) {
              console.error("Error updating wallet after win: " + err.message);
            } else {
              console.log(`Updated wallet for User ${userId}. New balance: ${specificUserSocket.wallet}`);
            }
            connection.release(); // Release the connection back to the pool
            
            // Emit events after database update
            emitUserEvents(userId, specificUserSocket.wallet);
          });
        });
      }
    });
  };

  if (ABwinningSide === "Andar") {
    processWinnings(andar_side);
  } else if (ABwinningSide === "Bahar") {
    processWinnings(bahar_side);
  }

  // Reset bets and emit current betting (reset to 0 for all users)
  const resetBetsAndEmit = (betMap) => {
    betMap.forEach((betInfo, userId) => {
      emitUserEvents(userId, ABuserSockets.get(userId).wallet);
    });
    betMap.clear();
  };

  resetBetsAndEmit(andar_side);
  resetBetsAndEmit(bahar_side);

  ABdataToSend.shift();
  console.log("Winning side:", ABwinningSide);
  const firstWord = ABwinningSide.charAt(0);
  ABdataToSend.push(firstWord);
  console.log("Data to send:", ABdataToSend);
  BetAndar = 0;
  BetBahar = 0;
  ABwinningSide = 0;
}
   if (AB === ab_clear ){
    console.log("sdasdfasda")
    andarVsBaharNamespace.emit("remove_ab_cards",{L:cardArraySend});
    andarVsBaharNamespace.emit("");

    function erase() {
      AB =60;
      g_andar = 0;
      g_bahar = 0;
      CB++;
      ABDisconnected_socket.clear();
      BetBahar = 0;
      BetAndar = 0;
      andarVsBaharNamespace.emit("clear_batting");
    }
   erase();
   }

}
function generateAndSendABDataToServer() {
  // Adjust the condition based on your game's logic
   // Generate data for the array
if (AB > 36) {
// First element as variable C
const ABdata = [];
ABdata.push(CB.toString());

// Second element: Generate a 3-digit number along with "******"
const randomNumber = Math.floor(100 + Math.random() * 900); // Generate 3-digit number
const stringWithStars = "****"+randomNumber.toString(); // Replace digits with "*"
ABdata.push(stringWithStars);

// Third element: Choice between D or T
const choice = Math.random() < 0.5 ? 'A' : 'B'; // Randomly choose between D and T
ABdata.push(choice);

// Fourth element: Generate a 2-digit number and multiply it with 100
const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90); // Generate 2-digit number
const multipliedNumber = randomTwoDigitNumber * 100; // Multiply by 100
if(choice === 'A'){
 g_andar += multipliedNumber;
}
else{
 g_bahar += multipliedNumber;
}
ABdata.push(multipliedNumber.toString());



// First element as variable CB


// Second element: Generate a 2-digit number

// Third element: Choice between Andar or Bahar


// Fourth element: Generate a random card type

   setTimeout(function(){andarVsBaharNamespace.emit("ABarrayToServer", ABdata);},2000);
// Send the array to the Andar Bahar namespace
}
   // andarVsBaharNamespace.emit("ABarrayToServer", ABdata);
   // andarVsBaharNamespace.emit("ABarrayToServer", ABdata);

}
setInterval(ABadd, 1000);
setInterval(generateAndSendABDataToServer, 500);
setInterval(ABdata, 1000);
// setInterval(ABemitSetTimeEvent, ABdelay1);

const demo_andarVsBaharNamespace = io.of('/demo-andarvsbahar');

demo_andarVsBaharNamespace.on('connection', (socket) => {
  console.log('A demo client connected to Andar vs Bahar namespace');
  let demoUserId;

  if(demo_AB < 57 && demo_AB > 32) {
    demo_andarVsBaharNamespace.emit("main_card", { L: demo_cut_card, M: demo_cut_card_type });
  }

  demo_andarVsBaharNamespace.emit("ABdataToClients", demo_ABdataToSend);
  console.log("Demo ABdataToSend:", demo_ABdataToSend);
  demo_andarVsBaharNamespace.emit('message', 'Welcome to the Demo Andar vs Bahar game!');

  socket.on("setDemoUserId", (userId) => {
    demoUserId = userId;
    socket.demoUserId = demoUserId;
    console.log("Demo user connected:", demoUserId);

    // Initialize or retrieve demo user data
    if (!demoUserSockets.has(demoUserId)) {
      demoUserSockets.set(demoUserId, {
        wallet: 2000, // Initial demo balance
        andar_side_bet: 0,
        bahar_side_bet: 0
      });
    }

    const demoUserData = demoUserSockets.get(demoUserId);

    // Emit current betting state to the client
    socket.emit('currentBetting', {
      andarSide: demoUserData.andar_side_bet,
      baharSide: demoUserData.bahar_side_bet
    });
    console.log(`Demo User ${demoUserId} connected with andarSideBet: ${demoUserData.andar_side_bet}, baharSideBet: ${demoUserData.bahar_side_bet}`);

    // Emit wallet balance to the client
    socket.emit('customEvent', demoUserData.wallet);
    console.log(`Demo User ${demoUserId} wallet: ${demoUserData.wallet}`);
  });

  socket.on('betting', (data) => {
    const userId = data.userId;
    const betAmount = parseInt(data.inputValue);
    const betSide = data.side;
    console.log("Demo bet:", betAmount, "on", betSide, "by", userId);

    if (demoUserSockets.has(userId)) {
      const demoUserData = demoUserSockets.get(userId);
      
      if (demoUserData.wallet >= betAmount) {
        const betInfo = {
          socket: socket,
          betAmount: betAmount,
          userId: userId
        };
  
        if (betSide === 'Bahar') {
          demo_BetBahar += betAmount;
          if (demo_bahar.has(userId)) {
            const existingBet = demo_bahar.get(userId);
            existingBet.betAmount += betAmount;
            demo_bahar.set(userId, existingBet);
          } else {
            demo_bahar.set(userId, betInfo);
          }
        } else if (betSide === 'Andar') {
          demo_BetAndar += betAmount;
          if (demo_andar.has(userId)) {
            const existingBet = demo_andar.get(userId);
            existingBet.betAmount += betAmount;
            demo_andar.set(userId, existingBet);
          } else {
            demo_andar.set(userId, betInfo);
          }
        }
        demoUserData.wallet -= betAmount;
        demoUserSockets.set(userId, demoUserData);
  
        console.log(`Deducted ${betAmount} from Demo User ${userId}'s wallet. New wallet balance: ${demoUserData.wallet}`);
        
        socket.emit('customEvent', demoUserData.wallet);
        socket.emit('currentBetting', {
          andarSide: demo_andar.has(userId) ? demo_andar.get(userId).betAmount : 0,
          baharSide: demo_bahar.has(userId) ? demo_bahar.get(userId).betAmount : 0
        });
      } else {
        console.log(`Demo User ${userId} doesn't have sufficient balance to place the bet.`);
        socket.emit('betError', 'Insufficient balance');
      }
    } else {
      console.log(`Demo User ${userId} not found.`);
      socket.emit('betError', 'User not found');
    }
  });

  socket.on('disconnect', () => {
    console.log('A demo client disconnected from Andar vs Bahar:', demoUserId);
    // For demo users, we might want to keep their data for a while or clear it immediately
    // depending on your requirements. Here, we'll keep it.
  });
});
function demo_ABadd() {
  demo_AB--;

  if (demo_AB === 58) {
    demoDragonVsTigerNamespace.emit("ABdataToClients", demo_ABdataToSend);
    function getRandomCombination() {
      const A = ["A", "B", "C", "D"];
      const C = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      const randomNumber = C[Math.floor(Math.random() * 13)];
      const randomItem = A[Math.floor(Math.random() * A.length)];
      demo_cut_card = randomNumber;
      demo_cut_card_type = randomItem;
    }

    getRandomCombination();
    console.log('DEMO CUT CARD', demo_cut_card);
  }

  if (demo_AB === 57) {
    demo_andarVsBaharNamespace.emit("main_card", { L: demo_cut_card, M: demo_cut_card_type });
    setTimeout(demo_generateAndSendABDataToServer, 2000);
  }

  function demo_generateAndSendABDataToServer() {
    for (let i = 0; i < 30; i++) {
      const demo_ABdata = [];
      demo_ABdata.push(demo_CB.toString());
      const randomNumber = Math.floor(100 + Math.random() * 900);
      const stringWithStars = "****" + randomNumber.toString();
      demo_ABdata.push(stringWithStars);
      const choice = Math.random() < 0.5 ? 'A' : 'B';
      demo_ABdata.push(choice);
      const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90);
      const multipliedNumber = randomTwoDigitNumber * 100;
      demo_ABdata.push(multipliedNumber.toString());

      setTimeout(function() {
        demoDragonVsTigerNamespace.emit("ABarrayToServer", demo_ABdata);
      }, 2000);
    }
  }

  if (demo_AB === 45) {
    const numberSet = [5, 6, 7, 8, 9, 10];
    const selectedNumber = parseInt(numberSet[Math.floor(Math.random() * numberSet.length)]);
    const demo_cardLength = selectedNumber * 2;
    const itemSetc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const itemSet = itemSetc.filter(item => item !== demo_cut_card);
    const demo_cardArray = new Array(demo_cardLength);
    const demo_cardArraytype = new Array(demo_cardLength);

    for (let i = 0; i < demo_cardArray.length; i++) {
      demo_cardArray[i] = itemSet[Math.floor(Math.random() * itemSet.length)];
    }

    const card_type_list = ["A", "B", "C", "D"];
    const usedTypesForCardValue = {};

    for (let i = 0; i < demo_cardArray.length; i++) {
      let selectedType;
      let attempts = 0;

      do {
        selectedType = card_type_list[Math.floor(Math.random() * card_type_list.length)];
        if (!usedTypesForCardValue[demo_cardArray[i]]) {
          usedTypesForCardValue[demo_cardArray[i]] = new Set();
        }
        if (usedTypesForCardValue[demo_cardArray[i]].size >= card_type_list.length) {
          usedTypesForCardValue[demo_cardArray[i]].clear();
        }
        attempts++;
        if (attempts > 100) {
          throw new Error("Too many attempts to find a unique card type");
        }
      } while (usedTypesForCardValue[demo_cardArray[i]].has(selectedType));

      demo_cardArraytype[i] = selectedType;
      usedTypesForCardValue[demo_cardArray[i]].add(selectedType);
    }

    console.log('Demo Card Types:', demo_cardArraytype);
    console.log('Demo Card Length:', demo_cardLength);
    console.log('Demo Card Array:', demo_cardArray);
    demo_cardArraySend = demo_cardArray;
    demo_cardArraytypeSend = demo_cardArraytype;
    console.log('Demo Cut Card:', demo_cut_card);
  }

  if (demo_AB === 36) {
    demo_andarVsBaharNamespace.emit("clear_batting");
    demo_andarVsBaharNamespace.emit("disable");
    console.log("Demo: hello CCCCC");
  }
  if (demo_AB === 34) {
    console.log("dfaskldaskldjklasjdklasjdklsj",demo_BetAndar, demo_BetBahar);
    if (demo_BetAndar < demo_BetBahar) {
      demo_ABwinningSide = "Bahar";
      if (demo_cardArraySend.length > 0) {
        demo_cardArraytypeSend.pop();
        demo_cardArraySend.pop();
      }
      let newArray = [...demo_cardArraySend];
      if (newArray.length > 0) {
        newArray[newArray.length - 1] = demo_cut_card;
      }
      demo_cardArraySend = newArray;
      console.log("Updated Demo CardArraySend:", demo_cardArraySend);
    } else if (demo_BetAndar > demo_BetBahar) {
      let newArray = [...demo_cardArraySend];
      if (newArray.length > 0) {
        newArray[newArray.length - 1] = demo_cut_card;
      }
      demo_cardArraySend = newArray;
      console.log("Updated Demo CardArraySend:", demo_cardArraySend);
      demo_ABwinningSide = "Andar";
    } else {
      const choice = Math.random() < 0.5 ? 'X' : 'Y';
      console.log("Demo choice:", choice);
      if (choice === 'X') {
        let newArray = [...demo_cardArraySend];
        if (newArray.length > 0) {
          newArray[newArray.length - 1] = demo_cut_card;
        }
        demo_cardArraySend = newArray;
        console.log("Updated Demo CardArraySend:", demo_cardArraySend);
        demo_ABwinningSide = "Andar";
      } else {
        if (demo_cardArraySend.length > 0) {
          demo_cardArraySend.pop();
          demo_cardArraytypeSend.pop();
        }
        let newArray = [...demo_cardArraySend];
        if (newArray.length > 0) {
          newArray[newArray.length - 1] = demo_cut_card;
        }
        demo_cardArraySend = newArray;
        console.log("Updated Demo CardArraySend:", demo_cardArraySend);
        demo_ABwinningSide = "Bahar";
      }
    }
    console.log(`Demo ABwinningSide: ${demo_ABwinningSide}`);
  }

  if (demo_AB === 32) {
    console.log("Demo cards list ", demo_cardArraySend, demo_cardArraySend.length);
    demo_andarVsBaharNamespace.emit("card_delecer", { L: demo_cardArraySend, M: demo_cardArraytypeSend });
  }

  if (demo_AB === 30) {
    console.log("Demo card cardArraySend00 ", demo_cardArraySend);
    demo_andarVsBaharNamespace.emit("move", { L: demo_cardArraySend });
  }

  if (demo_AB === 2) {
    console.log("Processing Demo Andar Bahar results");
    console.log("Demo Users:", demoUserSockets);
    
    const processWinnings = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        if (demoUserSockets.has(userId)) {
          const demoUserData = demoUserSockets.get(userId);
          const winnings = betInfo.betAmount * 2; // Assuming 1:1 payout
          demoUserData.wallet += winnings;
          console.log(`Demo User ${userId} won ${winnings} on ${demo_ABwinningSide}! New wallet balance: ${demoUserData.wallet}`);
          demoUserSockets.set(userId, demoUserData);
          betInfo.socket.emit('customEvent', demoUserData.wallet);
        }
      });
    };
  
    if (demo_ABwinningSide === "Andar") {
      processWinnings(demo_andar);
    } else if (demo_ABwinningSide === "Bahar") {
      processWinnings(demo_bahar);
    }
  
    // Reset bets and emit current betting (reset to 0 for all users)
    const resetBetsAndEmit = (betMap) => {
      betMap.forEach((betInfo, userId) => {
        betInfo.socket.emit('currentBetting', {
          andarSide: 0,
          baharSide: 0
        });
      });
      betMap.clear();
    };
  
    resetBetsAndEmit(demo_andar);
    resetBetsAndEmit(demo_bahar);
  
    demo_ABdataToSend.shift();
    console.log("Demo winning side:", demo_ABwinningSide);
    const demo_firstWord = demo_ABwinningSide.charAt(0);
    demo_ABdataToSend.push(demo_firstWord);
    console.log("Demo data to send:", demo_ABdataToSend);
    demo_BetAndar = 0;
    demo_BetBahar = 0;
    demo_ABwinningSide = 0;
  }

  if (demo_AB === 2) {
    console.log("remove card ", demo_cardArraySend);
    demo_andarVsBaharNamespace.emit("ABdataToClients", demo_ABdataToSend);
    demo_andarVsBaharNamespace.emit("remove_ab_cards", { L: demo_cardArraySend });
  }
}
function demo_ABdata() {
  demo_andarVsBaharNamespace.emit("data", { D: demo_AB, F: demo_CB });
  
}
function demo_ABemitSetTimeEvent() {
  console.log("Emitting settime event to demo_andarVsBaharNamespace");
  demo_andarVsBaharNamespace.emit("settime", { timestamp: Date.now() });

  function erase() {
    demo_AB = 60;
    demo_CB++;

    demo_BetBahar = 0;
    demo_BetAndar = 0;
    console.log("Emitting clear_batting event to demo_andarVsBaharNamespace");
    demo_andarVsBaharNamespace.emit("clear_batting");
  }
  erase();
}

function demo_ABdata() {
  demo_andarVsBaharNamespace.emit("data", { D: demo_AB, F: demo_CB });
}

setInterval(demo_ABadd, 1000);
setInterval(demo_ABemitSetTimeEvent, ABdelay1);
setInterval(demo_ABdata, 1000);
// ... existing code ...
var TP_A = 60;
var TP_B = 60;
var TP_cut_card;
var TP_cut_card_type;
var TP_cardArraySend;
var TP_cardArraytypeSend;
var TP_winningSide;
var TP_BetA = 0;
var TP_BetB = 0;
var TT_A = [];
var TT_B = [];
var TPuserSockets = new Map();
var TPDisconnected_socket = new Map();
var TPdataToSend = ["A", "B", "B", "A", "A", "B", "B", "A", "A", "B"];
// ... existing code ...

const teenPateeNamespace = io.of('/teenpatee');

teenPateeNamespace.on('connection', (socket) => {
  if (TP_A < 57 && TP_A > 32) {
    teenPateeNamespace.emit("main_card", { L: TP_cut_card, M: TP_cut_card_type });
  }

  console.log('A client connected to Teen Patee namespace');
  let userId1;

  teenPateeNamespace.emit("TPdataToClients", TPdataToSend);
  console.log(TPdataToSend);
  teenPateeNamespace.emit('message', 'Welcome to the Teen Patee game!');

  socket.on("setUserId", (userId) => {
    var user_Id = userId;
    socket.userId = user_Id;
    console.log("Checking for user_Id:", user_Id);

    if (TPDisconnected_socket.has(user_Id)) {
      const disconnectedData = TPDisconnected_socket.get(user_Id);
      socket.ASideBet = disconnectedData.ASideBet || 0;
      socket.BSideBet = disconnectedData.BSideBet || 0;
    } else {
      socket.ASideBet = 0;
      socket.BSideBet = 0;
    }
    TPuserSockets.set(user_Id, socket);
    socket.emit('currentBetting', { ASide: socket.ASideBet, BSide: socket.BSideBet });
    console.log(`User ${user_Id} connected with ASideBet: ${socket.ASideBet}, BSideBet: ${socket.BSideBet}`);

    socket.wallet = 0;
    con.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to the database: " + err.stack);
        return;
      }
      connection.query("SELECT wallet_balance FROM users WHERE user_id = ?", [user_Id], function (err, result) {
        if (err) {
          console.error("Error executing the query: " + err.message);
        } else if (result.length > 0) {
          const userWallet = result[0].wallet_balance;
          socket.wallet = userWallet;
          socket.emit('customEvent', userWallet);
          console.log(`User ${user_Id} wallet: ${userWallet}`);
        } else {
          console.log(`User ${user_Id} not found.`);
        }
        connection.release();
      });
    });
  });

  function emitUserEvents(userId, updatedWallet) {
    if (TPuserSockets.has(userId)) {
      const specificUserSocket = TPuserSockets.get(userId);
      specificUserSocket.emit('customEvent', updatedWallet);
      const currentBetting = {
        ASide: TPuserSockets.has(userId) ? TPuserSockets.get(userId).ASideBet : 0,
        BSide: TPuserSockets.has(userId) ? TPuserSockets.get(userId).BSideBet : 0
      };
      specificUserSocket.emit('currentBetting', currentBetting);
      console.log(`Emitted currentBetting to ${userId}:`, currentBetting);
    } else {
      console.error(`Socket not found for user ${userId}`);
    }
  }

  socket.on('betting', (data) => {
    const userId = data.userId;
    const betAmount = parseInt(data.inputValue);
    const betSide = data.side;
    console.log("Bet:", betAmount, "on", betSide, "by", userId);

    if (TPuserSockets.has(userId)) {
      const specificUserSocket = TPuserSockets.get(userId);
      console.log('USER_BALANCE ', specificUserSocket.wallet);

      if (specificUserSocket.wallet >= betAmount) {
        const betInfo = {
          socket: socket,
          betAmount: betAmount,
          userId: userId
        };

        if (betSide === 'B') {
          TP_BetB += betAmount;
          if (TPuserSockets.has(userId)) {
            const existingBet = TPuserSockets.get(userId);
            existingBet.BSideBet += betAmount;
            TPuserSockets.set(userId, existingBet);
          } else {
            TPuserSockets.set(userId, betInfo);
          }
        } else if (betSide === 'A') {
          TP_BetA += betAmount;
          if (TPuserSockets.has(userId)) {
            const existingBet = TPuserSockets.get(userId);
            existingBet.ASideBet += betAmount;
            TPuserSockets.set(userId, existingBet);
          } else {
            TPuserSockets.set(userId, betInfo);
          }
        }

        const updatedWallet = specificUserSocket.wallet - betAmount;
        specificUserSocket.wallet = updatedWallet;

        con.getConnection((err, connection) => {
          if (err) {
            console.error("Error connecting to the database: " + err.stack);
            return;
          }
          connection.query('UPDATE users SET wallet_balance = ? WHERE user_id = ?', [updatedWallet, userId], function (err, _result) {
            if (err) {
              console.error('Error deducting the bet amount: ' + err.message);
            } else {
              console.log(`Deducted ${betAmount} from User ${userId}'s wallet. New wallet balance: ${updatedWallet}`);
            }
            connection.release();
            emitUserEvents(userId, updatedWallet);
          });
        });
      } else {
        console.log(`User ${userId} doesn't have sufficient balance to place the bet.`);
        socket.emit('betError', 'Insufficient balance');
      }
    } else {
      console.log(`User ${userId} not found in the Map.`);
      socket.emit('betError', 'User not found');
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (TPuserSockets.has(userId)) {
      const specificUserSocket = TPuserSockets.get(userId);
      if (specificUserSocket.ASideBet || specificUserSocket.BSideBet) {
        const disconnectedUserData = {
          ASideBet: specificUserSocket.ASideBet || 0,
          BSideBet: specificUserSocket.BSideBet || 0
        };
        TPDisconnected_socket.set(userId, disconnectedUserData);
        console.log('Stored disconnected user data:', userId, disconnectedUserData);
      }
    }
    console.log('A client disconnected with user ID:', userId);
  });
});

function TPdata() {
  if (TP_A > 25) {
    var AZ = TP_A - 35;
    teenPateeNamespace.emit("data", { D: AZ, F: CB });
  }
}

function TPadd() {
  TP_A--;
  if (TP_A === 58) {
    teenPateeNamespace.emit("TPdataToClients", TPdataToSend);
    // function getRandomCombination() {
    //   const A = ["A", "B", "C", "D"];
    //   const C = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    //   const randomNumber = C[Math.floor(Math.random() * 13)];
    //   const randomItem = A[Math.floor(Math.random() * A.length)];
    //   TP_cut_card = randomNumber;
    //   TP_cut_card_type = randomItem;
    // }

    // getRandomCombination();
    // console.log('TP CUT CARD', TP_cut_card);
  }
  if (TP_A === 57) {
    // teenPateeNamespace.emit("main_card", { L: TP_cut_card, M: TP_cut_card_type });
    setTimeout(generateAndSendTPDataToServer, 2000);
  }

  function generateAndSendTPDataToServer() {
    for (let i = 0; i < 30; i++) {
      const TPdata = [];
      TPdata.push(CB.toString());
      const randomNumber = Math.floor(100 + Math.random() * 900);
      const stringWithStars = "****" + randomNumber.toString();
      TPdata.push(stringWithStars);
      const choice = Math.random() < 0.5 ? 'A' : 'B';
      TPdata.push(choice);
      const randomTwoDigitNumber = Math.floor(10 + Math.random() * 90);
      const multipliedNumber = randomTwoDigitNumber * 100;
      TPdata.push(multipliedNumber.toString());

      setTimeout(function () {
        teenPateeNamespace.emit("TParrayToServer", TPdata);
      }, 2000);
    }
  }

  if (TP_A === 45) {
    const cardLength = 6; // Fixed card length
    const itemSetc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const cardArray = new Array(cardLength);
    const cardArraytype = new Array(cardLength);

    for (let i = 0; i < cardArray.length; i++) {
      const randomItemIndex = Math.floor(Math.random() * itemSetc.length);
      cardArray[i] = itemSetc[randomItemIndex];
      // Remove the selected number from itemSetc
      itemSetc.splice(randomItemIndex, 1);
    }
    const card_type_list = ["A", "B", "C", "D"];
    const usedTypesForCardValue = {};

    for (let i = 0; i < cardArray.length; i++) {
      let selectedType;
      let attempts = 0;

      do {
        let randomItemIndex = Math.floor(Math.random() * card_type_list.length);
        selectedType = card_type_list[randomItemIndex];

        if (!usedTypesForCardValue[cardArray[i]]) {
          usedTypesForCardValue[cardArray[i]] = new Set();
        }

        if (usedTypesForCardValue[cardArray[i]].size >= card_type_list.length) {
          usedTypesForCardValue[cardArray[i]].clear();
        }

        attempts++;
        if (attempts > 100) {
          throw new Error("Too many attempts to find a unique card type");
        }
      } while (usedTypesForCardValue[cardArray[i]].has(selectedType));

      cardArraytype[i] = selectedType;
      usedTypesForCardValue[cardArray[i]].add(selectedType);
    }

    // Calculate the sum of the first 3 cards and the remaining 3 cards
    const firstSetSum = cardArray.slice(0, 3).reduce((sum, card) => sum + card, 0);
    const secondSetSum = cardArray.slice(3).reduce((sum, card) => sum + card, 0);

    console.log('Card Types:', cardArraytype);
    TP_cardArraytypeSend = cardArraytype;
    console.log('Card Length:', cardLength);
    console.log('Card Array:', cardArray);
    TP_cardArraySend = cardArray;
    const firstThreeCards = cardArray.slice(0, 3);
    const lastThreeCards = cardArray.slice(3);
    // Determine which set has the higher sum
    const higherSumSet = firstSetSum > secondSetSum ? firstThreeCards : lastThreeCards;
    const lowerSumSet = firstSetSum > secondSetSum ? lastThreeCards : firstThreeCards;

    // Sort the sets in descending order
    const sortedHigherSet = [...higherSumSet].sort((a, b) => b - a);
    const sortedLowerSet = [...lowerSumSet].sort((a, b) => b - a);

    console.log('Higher Sum Set (sorted):', sortedHigherSet);
    console.log('Lower Sum Set (sorted):', sortedLowerSet);

    // Combine the sorted sets
    const sortedCardArray = [...sortedHigherSet, ...sortedLowerSet];

    // Update the TP_cardArraySend with the new sorted array
    TP_cardArraySend = sortedCardArray;

    // Adjust the TP_cardArraytypeSend to match the new order
    const newCardArraytype = sortedCardArray.map(card => {
      const originalIndex = cardArray.indexOf(card);
      return cardArraytype[originalIndex];
    });
    TP_cardArraytypeSend = newCardArraytype;

    console.log('Sorted Card Array:', TP_cardArraySend);
    console.log('Updated Card Types:', TP_cardArraytypeSend);
    console.log('First Three Cards:', firstThreeCards);
    console.log('Last Three Cards:', lastThreeCards);
    console.log('First Set Sum:', firstSetSum);
    console.log('Second Set Sum:', secondSetSum);
  }

  if (TP_A === 36) {
    teenPateeNamespace.emit("clear_batting");
    teenPateeNamespace.emit("disable");
    console.log("hello CCCCC");
  }
  if (TP_A === 34) {
    console.log(TP_BetA, TP_BetB);
    if (TP_BetA > TP_BetB) {
      TP_winningSide = "A";
      // Assign the smaller numbers set to the winning side (A)
      TT_A = TP_cardArraySend.slice(3);
      TT_B = TP_cardArraySend.slice(0, 3);
      TP_cardArraytypeSend = TP_cardArraytypeSend.slice(3);
    } else if (TP_BetA < TP_BetB) {
      TP_winningSide = "B";
      // Assign the smaller numbers set to the winning side (B)
      TT_B = TP_cardArraySend.slice(3);
      TT_A = TP_cardArraySend.slice(0, 3);
    } else {
      const choice = Math.random() < 0.5 ? 'X' : 'Y';
      console.log("TP choice:", choice);
      if (choice === 'X') {
        TT_B = TP_cardArraySend.slice(3);
        TT_A = TP_cardArraySend.slice(0, 3);
        TP_winningSide = "A";
        console.log("TT_A",TT_A);
        console.log("TT_B",TT_B);
        console.log("TP_winningSide",TP_winningSide);
      } else {
       
          TT_B = TP_cardArraySend.slice(3);
          TT_A = TP_cardArraySend.slice(0, 3);
          TP_winningSide = "B";
          console.log("TT_A",TT_A);
          console.log("TT_B",TT_B);
          console.log("TP_winningSide",TP_winningSide);
        } 
        
      }
    }

  if (TP_A === 32) {
    console.log("TP cards list ", TP_cardArraySend, TP_cardArraySend.length);
    teenPateeNamespace.emit("card_delecer", { L: TP_cardArraySend, M: TP_cardArraytypeSend });
  }

  if (TP_A === 30) {
    console.log("TP card cardArraySend00 ", TP_cardArraySend);
    teenPateeNamespace.emit("move", { L: TT_A, M: TT_B, cardType: TP_cardArraytypeSend });
  }
  if(TP_A === 25){
    TP_A = 60;
    TP_BetA = 0;
    TP_BetB = 0;
    TP_winningSide = 0;
    TP_cardArraySend = [];
    TP_cardArraytypeSend = [];
    TP_cut_card = 0;
    TP_cut_card_type = 0;
   }

}

setInterval(TPdata, 1000);
setInterval(TPadd, 1000);
// ... existing code ...
// ... existing code ...
var aviatorVariable = 100000;
var aviatorTotalBet = 0;
var ps = 0;
var aviatorUserSockets = new Map();
var aviatorDisconnectedSockets = new Map();
var aviatorMultiplier = 1;
var aviatorCrashPoint = 2; // Plane crashes at 2x if total betting amount reaches 50,000
// ... existing code ...

const aviatorNamespace = io.of('/avitor');

aviatorNamespace.on('connection', (socket) => {
  console.log('A client connected to Aviator namespace');
  let userId;
  socket.emit('aviatorData', avitor);

  socket.on("setUserId", (userId) => {
    socket.userId = userId;
    console.log("Aviator user connected:", userId);

    if (aviatorDisconnectedSockets.has(userId)) {
      const disconnectedData = aviatorDisconnectedSockets.get(userId);
      socket.totalBet = disconnectedData.totalBet || 0;
      // socket.state = disconnectedData.state;
    } else {
      socket.totalBet = 0;
      // socket.state = disconnectedData.state;
    }
    aviatorUserSockets.set(userId, socket);
    console.log('avitor socket is setted ');
    socket.emit('currentBetting', { totalBet: socket.totalBet });
    console.log(`User ${userId}  avitor connected with totalBet: ${socket.totalBet}`);

    socket.wallet = 0;
    socket.state="ntc";
    con.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to the database: " + err.stack);
        return;
      }
      connection.query("SELECT wallet_balance FROM users WHERE user_id = ?", [userId], function (err, result) {
        if (err) {
          console.error("Error executing the query: " + err.message);
        } else if (result.length > 0) {
          const userWallet = result[0].wallet_balance;
          socket.wallet = userWallet;
          socket.emit('customEvent', userWallet);
          console.log(`User  ${userId}  aviator balance walletsssssssssssssssssssssssssssssssssssss: ${userWallet}`);
        } else {
          console.log(`User ${userId} not found.`);
        }
        connection.release();
      });
    });
  });
  socket.on('betting', (data) => {
    if (ps === 1) {
    const userId = data.userId;
    const betAmount = parseInt(data.inputValue);
    console.log("Bet:", betAmount, "by", userId);

    if (aviatorUserSockets.has(userId)) {
      const specificUserSocket = aviatorUserSockets.get(userId);
      con.getConnection((err, connection) => {
        if (err) {
          console.error("Error connecting to the database: " + err.stack);
          return;
        }
        connection.query("SELECT wallet_balance FROM users WHERE user_id = ?", [userId], function (err, result) {
          if (err) {
            console.error("Error executing the query: " + err.message);
          } else if (result.length > 0) {
            const userWallet = result[0].wallet_balance;
            specificUserSocket.wallet = userWallet;
            console.log('USER_BALANCE ', userWallet);
          } else {
            console.log(`User ${userId} not found.`);
          }
          connection.release();
        });
      });



      if (specificUserSocket.wallet >= betAmount) {
        aviatorTotalBet += betAmount;
        console.log("Aviator Total Bet:", aviatorTotalBet);
        specificUserSocket.totalBet += betAmount;
        const updatedWallet = specificUserSocket.wallet - betAmount;
        specificUserSocket.wallet = updatedWallet;
        con.getConnection((err, connection) => {
          if (err) {
            console.error("Error connecting to the database: " + err.stack);
            return;
          }
          connection.query('UPDATE users SET wallet_balance = ? WHERE user_id = ?', [updatedWallet, userId], function (err, _result) {
            if (err) {
              console.error('Error deducting the bet amount: ' + err.message);
            } else {
              console.log(`Deducted ${betAmount} from User ${userId}'s wallet. New wallet balance: ${updatedWallet}`);
            }
            connection.release();
            socket.emit('customEvent', updatedWallet);
            socket.emit('confirmBet', { totalBet: specificUserSocket.totalBet });
          });
        });
      } else {
        console.log(`User ${userId} doesn't have sufficient balance to place the bet.`);
        socket.emit('betError', 'Insufficient balance');
      }
    } else {
      console.log(`User ${userId} not found in the Map.`);
      socket.emit('betError', 'User not found');
    }
  };
  });


  socket.on('cashout', (data) => {


    const userId = data.userId;
    console.log('Cashout request received from user:', userId);
    if (aviatorUserSockets.has(userId)) {
      const specificUserSocket = aviatorUserSockets.get(userId);
        // Process the cashout only if the state is "ntc" (not cashed out)
        const winnings_deciaml = specificUserSocket.totalBet * aviatorMultiplier;
      const winnings = Math.floor(winnings_deciaml);
      console.log("winningsssss",winnings);
      socket.emit('win', winnings);
      specificUserSocket.wallet += winnings;

      con.getConnection((err, connection) => {
        if (err) {
          console.error("Error connecting to the database: " + err.stack);
          return;
        }
        connection.query('UPDATE users SET wallet_balance = ? WHERE user_id = ?', [specificUserSocket.wallet, userId], function (err, _result) {
          if (err) {
            console.error('Error updating the wallet after cashout: ' + err.message);
          } else {
            console.log(`User ${userId} cashed out with winnings: ${winnings}. New wallet balance: ${specificUserSocket.wallet}`);
          }
          connection.release();
          socket.emit('customEvent', specificUserSocket.wallet);
          // Change the state to "collected" and reset the betting amount
          specificUserSocket.state = "c";
          specificUserSocket.totalBet = 0;
          console.log(`User ${userId} state changed to collected and bet amount reset to 0`);
          // socket.emit('stateUpdate', { state: 'collected', totalBet: 0 });
        });
      });
    }
  });

  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (aviatorUserSockets.has(userId)) {
      const specificUserSocket = aviatorUserSockets.get(userId);
      if (specificUserSocket.totalBet) {
        const disconnectedUserData = {
          totalBet: specificUserSocket.totalBet || 0
        };
        aviatorDisconnectedSockets.set(userId, disconnectedUserData);
        console.log('Stored disconnected user data:', userId, disconnectedUserData);
      }
    }
    console.log('A client disconnected with user ID:', userId);
  });
});

// function aviatorGameLoop() {
//   console.log(aviatorMultiplier);
//   aviatorMultiplier += 0.1; // Increase multiplier over time
//   // console.log("aviatorMultiplier", aviatorMultiplier);
//   if (aviatorTotalBet >= 50000 && aviatorMultiplier >= aviatorCrashPoint) {

//     aviatorNamespace.emit('crash', { multiplier: aviatorMultiplier });
//     console.log('Plane crashed at multiplier:', aviatorMultiplier);

//     // Reset game state
//     aviatorMultiplier = 1;
//     aviatorTotalBet = 0;
//     aviatorUserSockets.forEach((socket) => {
//       socket.totalBet = 0;
//       socket.emit('currentBetting', { totalBet: 0 });
//     });
//   } else {
//     aviatorNamespace.emit('multiplier', { multiplier: aviatorMultiplier });
//   }
// }

function multiplier() {
  const initialTotalBet = aviatorTotalBet; // Store the initial total bet amount


  const interval = setInterval(() => {
    ps =1;
    aviatorMultiplier += 0.1; // Increase multiplier over time
    aviatorTotalBet = initialTotalBet * aviatorMultiplier; // Multiply initial total bet with multiplier
    aviatorNamespace.emit('crash', { multiplier: parseFloat(aviatorMultiplier.toFixed(2)) });
    // console.log('Aviator Multiplier:', aviatorMultiplier);
    // console.log('Aviator Total Bet:', aviatorTotalBet);

    const maxMultiplier = Math.random() * (180 - 230) + 180; // Random number between 100 and 200
    if (aviatorTotalBet >= stock_avitor || aviatorMultiplier >= maxMultiplier) {
      // Reset the aviatorDisconnectedSockets mapd
      aviatorDisconnectedSockets.clear();
      console.log('Cleared aviatorDisconnectedSockets');
      // Push the current aviatorMultiplier to the avitor array
      // Add the current multiplier to the beginning of the avitor array
      avitor.unshift(parseFloat(aviatorMultiplier.toFixed(2)));
      
      // Keep only the last 20 elements in the avitor array
      if (avitor.length > 20) {
        avitor.pop(); // Remove the oldest element (last element)
      }

      // Emit the updated avitor array to all connected clients
      console.log('Updated avitor array:', avitor);
      
      // Emit the updated avitor array to all connected clients
      aviatorNamespace.emit('aviatorData', avitor);
      console.log('Plane crashed at multiplier:', aviatorMultiplier);
      // Send the final multiplier value to all connected users
      aviatorNamespace.emit('finalMultiplier', { multiplier: aviatorMultiplier });
      console.log('Final multiplier sent to users:', aviatorMultiplier);

      // Reset game state
      aviatorMultiplier = 1;
      aviatorTotalBet = 0;
      aviatorUserSockets.forEach((socket) => {
        socket.totalBet = 0;
        socket.emit('currentBetting', { totalBet: 0 });
      });
      setTimeout(() => {
        multiplier();
      }, 10000);
      clearInterval(interval); // Exit the function
    }
  }, 100); // Execute every 0.1 seconds
}
// Start the multiplier function after a 10-second delay
setTimeout(() => {
  multiplier();
}, 10000);

// Start the multiplier function
// ... existing code ...
// Color game variables
let colorGameState = {
  currentColor: null,
  timeRemaining:30,
  round : 569897871323,
  bets: {
    red: new Map(),
    violet: new Map(),
    green: new Map(),
  0: new Map(),
  1: new Map(),
  2: new Map(),
  3: new Map(),
  4: new Map(),
  5: new Map(),
  6: new Map(),
  7: new Map(),
  8: new Map(),
  9: new Map()
  },
  totalBets: {
    red: 0,
    violet: 0,
    green: 0,
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0
  },
  timeRemaining: 30, // 30 seconds for betting
  isSpinning: false
};

const colorNamespace = io.of('/color');

colorNamespace.on('connection', (socket) => {
  colorNamespace.emit('numberArray', number);
  console.log('A client connected to Color game namespace');

  // socket.emit('gameState', colorGameState);

  socket.on('setUserId', (userId) => {
    socket.userId = userId;
    console.log("Color game user connected:", userId);

    // Initialize user's wallet
    con.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to the database: " + err.stack);
        return;
      }
      connection.query("SELECT wallet_balance FROM users WHERE user_id = ?", [userId], function (err, result) {
        if (err) {
          console.error("Error executing the query: " + err.message);
        } else if (result.length > 0) {
          const userWallet = result[0].wallet_balance;
          socket.wallet = userWallet;
          socket.emit('updateWallet', userWallet);
          console.log(`User ${userId} color game wallet: ${userWallet}`);
        } else {
          console.log(`User ${userId} not found.`);
        }
        connection.release();
      });
    });
  });

  socket.on('placeBet', (data) => {
    const { color, amount } = data;
    if (colorGameState.isSpinning) {
      socket.emit('betError', 'Cannot place bet while wheel is spinning');
      return;
    }
  
    const userId = socket.userId;
    console.log(`User ${userId} placed bet: ${amount} on ${color}`);
  
    con.getConnection((err, connection) => {
      if (err) {
        console.error("Error connecting to the database: " + err.stack);
        return;
      }
  
      connection.query(
        "SELECT wallet_balance FROM users WHERE user_id = ?",
        [userId],
        function (err, result) {
          if (err) {
            console.error("Error fetching user balance: " + err.message);
            connection.release();
            return;
          }
  
          if (result.length > 0) {
            const userBalance = result[0].wallet_balance;
            console.log(`User ${userId} current balance: ${userBalance}`);
  
            if (userBalance < amount) {
              socket.emit('betError', 'Insufficient funds');
              console.log("balance less than the bet color game");
              connection.release();
              return;
            }
  
            // Ensure the color is valid
            if (!['red', 'violet', 'green', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(color)) {
              socket.emit('betError', 'Invalid color');
              console.log("errror wrong thing");
              connection.release();
              return;
            }
  
            // Place the bet
            colorGameState.bets[color].set(userId, (colorGameState.bets[color].get(userId) || 0) + amount);
            colorGameState.totalBets[color] += amount;
            console.log(`Total bets forsssssssssssssssssssssssssssssss ${color}: ${colorGameState.totalBets[color]}`);
            socket.wallet -= amount;
  
            connection.query(
              "UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?",
              [amount, userId],
              function (err, result) {
                if (err) {
                  console.error("Error updating user wallet: " + err.message);
                } else {
                  console.log(`User ${userId} wallet updated. Deducted ${amount}`);
                }
                connection.release();
              }
            );
  
            // Update client
            socket.emit('betPlaced', { color, amount });
            socket.emit('updateWallet', socket.wallet);
            colorNamespace.emit('updateTotalBets', colorGameState.totalBets);
          } else {
            console.log(`User ${userId} not found.`);
            connection.release();
          }
        }
      );
    });
  });
});

function startColorGame() {
  colorGameState.round++;
  // Send the number array to the client
  colorNamespace.emit('numberArray', number);
  colorGameState.timeRemaining = 30;
  colorGameState.isSpinning = false;
  colorNamespace.emit('bettingOpen');
  var period = colorGameState.round;
  const timer = setInterval(() => {
    // Generate an array of 10 random game results
    const gameResults = Array.from({ length: 3 }, () => {
      const userId = Math.floor(Math.random() * 10000000000); // 10-digit user ID
      const number = Math.floor(Math.random() * 10);
      const color = ['green', 'red', 'violet'][Math.floor(Math.random() * 3)];
      const bet = Math.random() < 0.5 ? color : number.toString();
      const amount = (Math.floor(Math.random() * 50) + 900) * 10  ; // Random 3-digit number

      return {period, userId, bet, amount };
    });

    // Log the generated array
    // console.log('Generated game results:', gameResults);

    // Emit the generated results, round, and time update to clients
    colorNamespace.emit('gameResultsArray', { gameResults });
    colorGameState.timeRemaining--;
    colorNamespace.emit('timeUpdate', { timeRemaining: colorGameState.timeRemaining, round: colorGameState.round });
    if (colorGameState.timeRemaining <= 0) {
      clearInterval(timer);
      spinWheel();
    }
  }, 1000);
}

function spinWheel() {
  colorGameState.isSpinning = true;
  colorNamespace.emit('wheelSpinning');

  const result = determineWinningColor();
  colorGameState.currentColor = result;
  processWinnings(result);
  setTimeout(() => {
   
    
    colorNamespace.emit('gameResult', result);    // Process winnings and reset game state
    setTimeout(() => {
      resetGameState();
    }, 1000);
      console.log("sssssssssssssssssssssssssssssssssssssssssssssssssssssssss",result);
    // Start next round after a delay
    setTimeout(startColorGame, 5000);
    }, 2000); // Simulate 5 seconds of wheel spinning
}
  function determineWinningColor() {
    const totalBets = colorGameState.totalBets;
    console.log("Total bets:", totalBets);
    console.log("Red bets:", totalBets.red);
    console.log("Violet bets:", totalBets.violet);
    console.log("Green bets:", totalBets.green);
  
    // Log the individual bets for each color
    console.log("Individual Red bets:", Array.from(colorGameState.bets.red.entries()));
    console.log("Individual Violet bets:", Array.from(colorGameState.bets.violet.entries()));
    console.log("Individual Green bets:", Array.from(colorGameState.bets.green.entries()));
  
    // Map numbers to their respective colors
    const numberToColor = {
      0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red',
      5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green'
    };
  
    // Calculplaced betate the potential payout for each number
    const totalBetsByNumber = Array(10).fill(0);
    const potentialPayouts = Array(10).fill(0);
  
    for (let i = 0; i < 10; i++) {
      // Sum the bets for each number
      totalBetsByNumber[i] = Array.from(colorGameState.bets[i.toString()].values()).reduce((a, b) => a + b, 0);
  
      // Calculate the potential payout
      if (i === 0) {
        potentialPayouts[i] = (totalBetsByNumber[i] * 10) + (totalBets.violet * 5) + (totalBets.red * 0.5);
      } else if (i === 5) {
        potentialPayouts[i] = (totalBetsByNumber[i] * 10) + (totalBets.violet * 5) + (totalBets.green * 0.5);
      } else {
        const numberMultiplier =  10;
        const colorMultiplier = (numberToColor[i] === 'violet') ? 5 : 2;
        potentialPayouts[i] = (totalBetsByNumber[i] * numberMultiplier) + (totalBets[numberToColor[i]] * colorMultiplier);
      }
  
      console.log(`Number ${i} potential payout: ${potentialPayouts[i]}`);
    }
  
    // Find the number with the smallest potential payout
    const minPayout = Math.min(...potentialPayouts);
    const numbersWithMinPayout = potentialPayouts.map((payout, index) => payout === minPayout ? index : -1).filter(index => index !== -1);
  
    console.log("Numbers with minimum potential payout:", numbersWithMinPayout);
  
    // Randomly select one of the numbers with the minimum payout
    const randomIndex = Math.floor(Math.random() * numbersWithMinPayout.length);
    const winningNumber = numbersWithMinPayout[randomIndex];
    const winningColor = numberToColor[winningNumber];
  
    console.log("Winning number:", winningNumber);
    console.log("Winning color:", winningColor);
  
    number.shift();

  // Add the winningNumber to the end of the number array
    number.push(winningNumber);

    
    console.log("Updated number array:", number);
    return winningNumber;
  // Pop the first element of the number array
    
  }


  function processWinnings(winningNumber) {
   
    const numberToColor = {
      0: 'violet', 1: 'green', 2: 'red', 3: 'green', 4: 'red',
      5: 'violet', 6: 'red', 7: 'green', 8: 'red', 9: 'green'
    };
  
    const winningColor = numberToColor[winningNumber];
  
    // Process winnings for the winning number
    colorGameState.bets[winningNumber.toString()].forEach((betAmount, userId) => {
      
      const numberMultiplier = (winningNumber === 0 || winningNumber === 5) ? 5 : 10;
      const actualWinnings = betAmount * numberMultiplier;
  
      const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
      if (userSocket) {
        userSocket.emit('winResult', {
          number: winningNumber,
          betAmount: betAmount,
          winnings: actualWinnings
        });
      }
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",winningNumber,betAmount,actualWinnings)
      updateUserWallet(userId, actualWinnings);
    });
  
    // Process winnings for the winning color
    colorGameState.bets[winningColor].forEach((betAmount, userId) => {
      const colorMultiplier = (winningColor === 'violet') ? 5 : 2;
      const actualWinnings = betAmount * colorMultiplier;
      const userSocket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
      if (userSocket) {
        userSocket.emit('winResult', {
          color: winningColor,
          betAmount: betAmount,
          winnings: actualWinnings
        });
      }
  
      updateUserWallet(userId, actualWinnings);
    });
  
    // Process losses for other numbers and colors
    Object.keys(colorGameState.bets).forEach(key => {
      if (key !== winningNumber.toString() && key !== winningColor) {
        colorGameState.bets[key].forEach((betAmount, userId) => {
          updateUserWallet(userId, -betAmount);
        });
      }
    });
  }

function updateUserWallet(userId, amount) {
  con.getConnection((err, connection) => {
    if (err) {
      console.error("Error connecting to the database: " + err.stack);
      return;
    }
    connection.query(
      "UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?",
      [amount, userId],
      function (err, result) {
        if (err) {
          console.error("Error updating user wallet: " + err.message);
        } else {
          const socket = Array.from(colorNamespace.sockets.values()).find(s => s.userId === userId);
          // console.log(socket)
          if (socket) {
            socket.wallet += amount;
            socket.emit('updateWallet', socket.wallet);
          }
        }
        connection.release();
      }
    );
  });
}

function resetGameState() {
  colorGameState.bets = {
    '0': new Map(), '1': new Map(), '2': new Map(), '3': new Map(), '4': new Map(),
    '5': new Map(), '6': new Map(), '7': new Map(), '8': new Map(), '9': new Map(),
    red: new Map(), violet: new Map(), green: new Map()
  };
  colorGameState.totalBets = {
    red: 0,
    violet: 0,
    green: 0
  };
  for (let i = 0; i <= 9; i++) {
    colorGameState.bets[i] = new Map();
    colorGameState.totalBets[i] = 0;
  };
  // colorNamespace.emit('updateTotalBets', colorGameState.totalBets);
}

// Start the color game loop
startColorGame();