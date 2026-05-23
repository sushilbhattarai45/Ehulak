import ioredis from "ioredis";

 const redisConfig = new ioredis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
})
export default redisConfig;