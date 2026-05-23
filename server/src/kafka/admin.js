import kafkaConfig from "../config/kafkaConfig.js";

async function init() {
  try {
    const admin = kafkaConfig.admin();
    await admin.connect();
    console.log("Connected to Kafka successfully!");

    const topics = await admin.listTopics();
    console.log("Existing topics:", JSON.stringify(topics, null, 2));

    const created = await admin.createTopics({
      topics: [
        { topic: "email", numPartitions: 5 },
        { topic: "email-retry", numPartitions: 5 },
        { topic: "email-dead-letter", numPartitions: 5 },
        { topic: "apiKey", numPartitions: 5 },
        {
          topic: "userActivity",
          numPartitions: 5,
        },
      ],
    });

    console.log("Topics created:", created);

    await admin.disconnect();
    console.log("Admin disconnected successfully.");
  } catch (error) {
    console.error("Error connecting to Kafka:", error);
  }
}

init();
