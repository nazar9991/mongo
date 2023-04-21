const https = require('https');
const zlib = require('zlib');
const readline = require('readline');
const { MongoClient } = require('mongodb');



// URL для завантаження архіву файлу з даними про фільми
const url = 'https://popwatch-staging.s3.us-east-2.amazonaws.com/movies_1.gz';

// З'єднання з базою даних MongoDB
const client = new MongoClient('mongodb://localhost:27017/movies_db', { useUnifiedTopology: true });

// Асинхронна функція для завантаження файлу, розпакування та збереження даних в MongoDB
async function loadMovies() {
  // Завантаження архіву файлу з даними про фільми
  const gunzip = zlib.createGunzip();
  const request = https.get(url, (response) => {
    response.pipe(gunzip);

    // Розбиття отриманого файлу на окремі JSON-об'єкти
    const rl = readline.createInterface({
      input: gunzip,
      crlfDelay: Infinity
    });

    // Обробка кожного JSON-об'єкта та додавання його до колекції MongoDB
    rl.on('line', (line) => {
      const movie = JSON.parse(line);

      client.connect(async (err) => {
        if (err) throw err;
        const collection = client.db('movies_db').collection('movies_collection');
        await collection.insertOne(movie);
        console.log(`Added movie: ${movie.title}`);
      });
    });
  });

  request.on('error', (error) => {
    console.error(error);
  });
}

loadMovies();
