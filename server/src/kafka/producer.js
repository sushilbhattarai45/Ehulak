import { kafkaConfig } from "../config/kafkaConfig.js";

export async function producer(data) {
  const producer = kafkaConfig.producer();
  await producer.connect();
  console.log("Producer connected to Kafka successfully!");

  console.log(data.type);

  await producer.send({
    topic: data.type,
    acks: -1, 
    messages: [
      {
        key: `email-${Date.now()}`,

        value: JSON.stringify(data),
        action: data.action,
      },
    ],
  });

  await producer.disconnect();
}
