import { createLogger } from '@tokenlab/logger-js';
import { CronJob } from 'cron';
import * as fs from 'fs/promises';
import axios from 'axios';

const logger = createLogger('Application');
const url = process.env.WEBHOOK_URL!;
const adminUrl = process.env.WEBHOOK_ADMIN_URL!;

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

async function adminJob() {
  if (!adminUrl) {
    return;
  }

  let date = new Date().toISOString().split("T")[0];
  try {
    await fs.access(`qotd/${date}.txt`);
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      const data = {
        "content": null,
        "embeds": [
          {
            "title": "Warning - Question of the Day",
            "description": `There's no question of the day for today (${date}).\n(The file \`qotd/${date}.txt\` does not exist.)`,
            "color": 16751360,
            "timestamp": new Date().toISOString(),
          }
        ],
        "attachments": []
      };

      await axios.post(adminUrl, data);
    }
  }
}

async function main() {
  if (!url) {
    logger.error('WEBHOOK_URL is not defined');
    process.exit(1);
  }

  const cron = new CronJob("0 12 * * *", job, null, true, "America/Sao_Paulo");
  cron.start();

  if (adminUrl) {
    const adminCron = new CronJob("0 8 * * *", adminJob, null, true, "America/Sao_Paulo");
    adminCron.start();
  }
}

main().catch((error) => {
  logger.error('Error during application start-up', { error });
});
