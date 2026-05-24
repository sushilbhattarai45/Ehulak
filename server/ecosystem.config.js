export default {
    apps: [
      // ================= API SERVER =================
      {
        name: "api",
        script: "index.js",
        watch: false,
      },
  
      // ================= KAFKA PRODUCER =================
      {
        name: "producer",
        script: "./src/kafka/producer.js",
        watch: false,
      },
  
      // ================= EMAIL =================
      {
        name: "email-consumer",
        script: "./src/kafka/consumer/emailConsumer.js",
        watch: false,
      },
      {
        name: "email-worker",
        script: "./src/workers/emailWorker.js",
        watch: false,
      },
  
      // ================= API KEY =================
      {
        name: "apikey-consumer",
        script: "./src/kafka/consumer/apiKeyConsumer.js",
        watch: false,
      },
      {
        name: "apikey-worker",
        script: "./src/workers/apiKeyWorker.js",
        watch: false,
      },
  
      // ================= USER ACTIVITY =================
      {
        name: "user-consumer",
        script: "./src/kafka/consumer/userActivityConsumer.js",
        watch: false,
      },
      {
        name: "user-worker",
        script: "./src/workers/userActivityWorker.js",
        watch: false,
      },
  
      // ================= DLQ =================
      {
        name: "dlq-worker",
        script: "./src/workers/dlqWorker.js",
        watch: false,
      },
  
      // ================= SENT EMAIL =================
      {
        name: "sent-email-worker",
        script: "./src/workers/sentEmailWorker.js",
        watch: false,
      },
    ],
  };