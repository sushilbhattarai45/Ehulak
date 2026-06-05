import crypto from "crypto";
import { kafkaConfig } from "../../config/kafkaConfig.js";
import { emailQueue } from "../../config/queueConfig.js";

async function consumer() {
  const consumer = kafkaConfig.consumer({ groupId: "consumer-group" });

  await consumer.connect();
  console.log("Consumer connected to Kafka successfully!");
  consumer.subscribe({ topic: "email", fromBeginning: true });
  let count =0;
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
     console.log(`RReceived message from Kafka topic '${topic}'`);

     console.log(`Message content: ${message.value.toString()}`);
      const parsed = JSON.parse(message.value.toString());
      const emailPayload = parsed.emailData || parsed;
      console.log("Email payload:", JSON.stringify(emailPayload));  
      if (!emailPayload.messageId) {
        emailPayload.messageId = crypto.randomUUID();
      }
      emailQueue.add(
        "sendEmail",
        {
          emailData: emailPayload,
          workerHistory: [],
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          jobId: `emailJob-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: false,
          delay: 200
        },
      );
    },
  });
}
consumer();
