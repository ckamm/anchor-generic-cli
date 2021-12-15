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

export async function parseArg(typeName, value, kvArgs, programId) {
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
    const seed = accountVal.substr(4);
    const addrAndBump = await anchor.web3.PublicKey.createProgramAddress(
      [Buffer.from(seed)],
      programId
    );
    return addrAndBump[1];
  }
  return toIdlType(typeName, value);
}

export async function parseAccountArg(
  key,
  value,
  isSigner,
  programId
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
    const inner = value.substr(4);
    return [
      await anchor.web3.PublicKey.createProgramAddress(
        [Buffer.from(inner)],
        programId
      ),
      undefined,
    ];
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
