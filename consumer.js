const { Kafka } = require('kafkajs');
const Message = require('./models/Message'); // Import Mongoose model
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mohamedharketi03:XIaMcxHNiV2KaeOE@cluster0.jr7omng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'test-topic1', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value.toString();
        const newMessage = new Message({ value });
        await newMessage.save();
        console.log('Message saved to database:', value);
      } catch (error) {
        console.error('Error saving message to database:', error);
      }
    },
  });
};

run().catch(console.error);