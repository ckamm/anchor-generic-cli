import * as anchor from "@project-serum/anchor";
import { Buffer } from "buffer";
import fs from "fs";
import BN from "bn.js";
import expandTilde from "expand-tilde";
import { extendType, string } from "cmd-ts";

export function readKeypair(keypairPath: string): anchor.web3.Keypair {
  const path = expandTilde(keypairPath);
  return anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(path, "utf-8")))
  );
}

function toIdlType(typeName, value) {
  // TODO: Possibly something could be done with anchor's TypeMap and DecodeType here

  // @ts-ignore
  if (typeName.option) {
    if (value === undefined) return undefined;
    return toIdlType(typeName.option, value);
  }

  switch (typeName) {
    case "u8":
    case "i8":
    case "u16":
    case "i16":
    case "u32":
    case "i32":
      return +value;
    case "u64":
    case "i64":
    case "u128":
    case "i128":
      return new BN(value);
    case "bool":
      return value == "true"; // TODO
    case "string":
      return value;
    case "publicKey":
      return new anchor.web3.PublicKey(value);
  }
  // vectors, options etc.
  throw new Error("unknown type: " + typeName);
}

async function pdaKeysToSeeds(keys: string): Promise<Buffer[]> {
  // TODO: deal with ; in quoted strings
  return keys.split(";").map((k) => {
    if (k.startsWith('"') && k.endsWith('"')) {
      return Buffer.from(k.substr(1, k.length - 2));
    }
    // TODO: possibly allow account backreferences
    return new anchor.web3.PublicKey(k).toBuffer();
  });
}

export async function parseArg(
  typeName,
  value: string,
  kvArgs: Object,
  programId: anchor.web3.PublicKey
) {
  if (typeName == "u8" && value.startsWith("BUMP:")) {
    const accountRef = value.substr(5);
    if (!(accountRef in kvArgs)) {
      throw new Error("bad account reference in: " + value);
    }
    const accountVal = kvArgs[accountRef];
    if (!accountVal.startsWith("PDA:")) {
      throw new Error(
        "referenced account is not a PDA: " + value + ";" + accountVal
      );
    }
    const seeds = await pdaKeysToSeeds(accountVal.substr(4));
    const addrAndBump = await anchor.web3.PublicKey.findProgramAddress(
      seeds,
      programId
    );
    return addrAndBump[1];
  }
  return toIdlType(typeName, value);
}

export async function parseAccountArg(
  key: string,
  value: string,
  isSigner: boolean,
  programId: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, anchor.web3.Keypair | undefined]> {
  if (isSigner) {
    if (!value.startsWith("KEYPAIR:")) {
      throw new Error(
        'expected "KEYPAIR:<file>" for signer account argument ' + key
      );
    }
    const keypair = readKeypair(value.substr(8));
    return [keypair.publicKey, keypair];
  }
  if (value.startsWith("PDA:")) {
    const seeds = await pdaKeysToSeeds(value.substr(4));
    const addrAndBump = await anchor.web3.PublicKey.findProgramAddress(
      seeds,
      programId
    );
    console.log("PDA", key, addrAndBump[0].toBase58());
    return [addrAndBump[0], undefined];
  }
  return [new anchor.web3.PublicKey(value), undefined];
}

export const KvArg = extendType(string, {
  async from(str) {
    const [key, ...values] = str.split("=");
    return [key, values.join("=")];
  },
});

export const PubkeyArg = extendType(string, {
  async from(str) {
    return new anchor.web3.PublicKey(str);
  },
});
