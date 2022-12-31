import fs from 'fs';
import csv from 'csv-parser';

fs.createReadStream('qotd.csv')
  .pipe(csv())
  .on('data', ({ date, value }) => {
    fs.writeFile(`qotd/${date}.txt`, value, (err) => {
      if (err) console.error(err);
    });
  });
