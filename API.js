const express = require('express');
const Message = require('./models/Message'); 
const connectDB = require('./DB'); 
const grpc = require('@grpc/grpc-js');
const protoLoader = require("@grpc/proto-loader")
const app = express();

app.use(express.json())

const PORT = 3002;

connectDB(); 


// Load the protobuf definition
const packageDefinition = protoLoader.loadSync('user.proto');
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

// Access the UserService object from the loaded package definition
const UserService = protoDescriptor.UserService;

// Create gRPC client
const client = new UserService('localhost:50052', grpc.credentials.createInsecure());

// Define a route to fetch a user by ID
app.get('/user/:userId', (req, res) => {
  const userId = req.params.userId;
  // Make gRPC call to fetch user
  client.GetUser({ user_id: userId }, (error, response) => {
    if (error) {
      console.error('Error:', error.details);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(response.user);
    }
  });
});

//getAllUsers
app.get('/users', (req, res) => {
  client.GetUsers({}, (error, response) => {
    if (error) {
      console.error('Error:', error.details);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(response.users);
    }
  });
});


// Create a new user
app.post('/users/create', (res , req) => {
  const { name, email } = req.body;
  client.CreateUser({ name, email }, (error, response) => {
    if (error) {
      console.error('Error:', error.details);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json(response.user);
    }
  });
});

//update an existing user
app.put('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const { name, email } = req.body;
  client.UpdateUser({ user_id: userId, name, email }, (error, response) => {
    if (error) {
      console.error('Error:', error.details);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(response.user);
    }
  });
});

//delete User
app.delete('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  client.DeleteUser({ user_id: userId }, (error, response) => {
    if (error) {
      console.error('Error:', error.details);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(204).send();
    }
  });
});






//BTCprices Route
app.get('/BTCprices', async (req, res) => {
  try {
    const messages = await Message.find();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});