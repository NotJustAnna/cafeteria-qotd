import { createLogger } from '@tokenlab/logger-js';
import { CronJob } from 'cron';
import * as fs from 'fs/promises';
import axios from 'axios';

const logger = createLogger('Application');
const url = process.env.WEBHOOK_URL!;

async function sendQotdWebhook(qotd: string) {
  const data = {
    "content": null,
    "embeds": [
      {
        "title": "Question of the Day",
        "description": qotd,
        "color": 16751360,
        "timestamp": new Date().toISOString(),
      }
    ],
    "attachments": []
  };

  await axios.post(url, data);
}

async function job() {
  try {
    const qotd = await fs.readFile(`qotd/${new Date().toISOString().split("T")[0]}.txt`, "utf-8");
    await sendQotdWebhook(qotd);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return;
    }
    logger.error('Error while trying to send QOTD webhook', { error });
  }
}

async function main() {
  if (!url) {
    logger.error('WEBHOOK_URL is not defined');
    process.exit(1);
  }

  const cron = new CronJob("0 12 * * *", job, null, true, "America/Sao_Paulo");
  cron.start();
}

main().catch((error) => {
  logger.error('Error during application start-up', { error });
});
