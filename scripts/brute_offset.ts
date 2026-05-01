import { getMempoolAccAddress } from "@arcium-hq/client";

const TARGET = "Ex7BD8o8PK1y2eXDd38Jgujj93uHygrZeWXDeGAHmHtN";
for (let i = 0; i < 100; i++) {
    if (getMempoolAccAddress(i).toBase58() === TARGET) {
        console.log("FOUND OFFSET:", i);
        process.exit(0);
    }
}
console.log("NOT FOUND IN FIRST 100");
