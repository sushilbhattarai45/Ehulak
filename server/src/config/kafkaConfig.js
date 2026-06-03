import { Kafka } from "kafkajs";
export const kafkaConfig = new Kafka({
    clientId: "email-system",
    brokers: ["kafka:9092"]
})

export default kafkaConfig;