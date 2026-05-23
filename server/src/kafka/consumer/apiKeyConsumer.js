import { kafkaConfig } from "../../config/kafkaConfig.js";

import { apiKeyQueue } from "../../config/queueConfig.js";

async function apiKeyConsumer() {
  const consumer = kafkaConfig.consumer({ groupId: "apiKey-consumer-group" });
  // Connect the consumer to Kafka
  await consumer.connect();
  console.log("API Key Consumer connected to Kafka successfully!");
  consumer.subscribe({ topic: "apiKey", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received API key job from Kafka topic '${topic}'`);
      const jobData = JSON.parse(message.value.toString());
      console.log("Job data:", jobData);
      apiKeyQueue.add(
        "createApiKey",
        {
          userId: jobData.data.userId,
          keyHash: jobData.data.keyHash,
        },
        {
          attempts: 2,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          jobId: `apiKeyJob-${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    },
  });
}

apiKeyConsumer();
