import { getCompDefAccOffset } from "@arcium-hq/client";

console.log("init_market_state:", Buffer.from(getCompDefAccOffset("init_market_state")).readUInt32LE());
console.log("place_bet:", Buffer.from(getCompDefAccOffset("place_bet")).readUInt32LE());
console.log("resolve_prediction_market:", Buffer.from(getCompDefAccOffset("resolve_prediction_market")).readUInt32LE());
console.log("resolve_opinion_market:", Buffer.from(getCompDefAccOffset("resolve_opinion_market")).readUInt32LE());
