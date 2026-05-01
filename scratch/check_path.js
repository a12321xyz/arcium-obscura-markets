const { Keypair } = require("@solana/web3.js");
const bip39 = require("bip39");
const { derivePath } = require("ed25519-hd-key");

async function main() {
    const mnemonic = "pelican bus analyst treat pupil wait agree card record office spare host";
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    const paths = ["m/44'/501'/0'", "m/44'/501'/0'/0'"];
    
    for (const path of paths) {
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const keypair = Keypair.fromSeed(derivedSeed);
        console.log(`Path ${path}: ${keypair.publicKey.toBase58()}`);
    }
}

main();
