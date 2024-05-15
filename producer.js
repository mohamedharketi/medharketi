const { Kafka } = require('kafkajs');
const axios = require('axios');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});
const producer = kafka.producer();

async function fetchBTCPrice() {
  const apiKey = '7108b7fe-44bb-4b59-bddd-ec3396870d9e';
  const endpoint = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

  const headers = {
    'X-CMC_PRO_API_KEY': apiKey
  };

  try {
    const response = await axios.get(endpoint, {
      headers,
      params: {
        symbol: 'BTC'
      }
    });
    const data = response.data.data['BTC'];
    const btcPrice = data.quote.USD.price;
    return btcPrice;
  } catch (error) {
    console.error('Error fetching BTC price:', error.message);
    return null;
  }
}

const run = async () => {
  await producer.connect();

  setInterval(async () => {
    const btcPrice = await fetchBTCPrice();
    if (btcPrice !== null) {
      try {
        await producer.send({
          topic: 'test-topic1',
          messages: [
            { value: `Current BTC price: $${btcPrice}` },
          ],
        });
        console.log('Data fetched successfully');
      } catch (err) {
        console.error("Error producing message", err);
      }
    } else {
      console.log('Failed to fetch BTC price.');
    }
  }, 1000);
};

run().catch(console.error);
