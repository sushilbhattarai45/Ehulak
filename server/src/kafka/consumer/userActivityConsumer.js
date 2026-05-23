import kafkaConfig from "../../config/kafkaConfig.js";
import { userActivityQueue } from "../../config/queueConfig.js";

const consumer = kafkaConfig.consumer({ groupId: "user-activity-group" });

async function init() {
  try {
    consumer.subscribe({ topic: "userActivity", fromBeginning: true });
    console.log("User Activity Consumer connected to Kafka successfully!");
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log("Received message:", {
          topic,
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });

        userActivityQueue.add(
          "createUser",
          {
            activityData: JSON.parse(message.value.toString()),
          },
          {
            attempts: 2,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
            jobId: `userActivityJob-${Date.now()}`,
            removeOnComplete: true,
            removeOnFail: false,
          },
        );  
        // Process the user activity data here
      },
    });
  } catch (err) {
    console.error("Error initializing user activity consumer:", err);
  }
}

init();
