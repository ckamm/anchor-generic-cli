import * as anchor from "@project-serum/anchor";
import {
  command,
  subcommands,
  run,
  string,
  positional,
  option,
  multioption,
  extendType,
  array,
  restPositionals,
} from "cmd-ts";
import BN from "bn.js";
import * as fs from "fs";
import { Buffer } from "buffer";

function readKeypair(keypairPath: string): anchor.web3.Keypair {
  return anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")))
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

async function parseArg(typeName, value, kvArgs, programId) {
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

async function parseAccountArg(key, value, isSigner, programId) {
  if (isSigner) {
    if (!value.startsWith("KEYPAIR:")) {
      throw new Error(
        'expected "KEYPAIR:<file>" for signer account argument ' + key
      );
    }
    return readKeypair(value.substr(8));
  }
  if (value.startsWith("PDA:")) {
    const inner = value.substr(4);
    return await anchor.web3.PublicKey.createProgramAddress(
      [Buffer.from(inner)],
      programId
    );
  }
  return new anchor.web3.PublicKey(value);
}

async function handleInstruction({
  instructionName,
  programId,
  kvArgsList,
  signers,
}) {
  let kvArgs = Object.fromEntries(kvArgsList);
  const initialKvArgs = { ...kvArgs };
  const clusterUrl = "https://api.devnet.solana.com";
  const throwAway = new anchor.web3.Keypair();

  const connection = new anchor.web3.Connection(clusterUrl, "confirmed");

  const walletWrapper = new anchor.Wallet(throwAway);

  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "confirmed",
  });

  const idl = await anchor.Program.fetchIdl(programId, provider);

  const program = new anchor.Program(idl, programId, provider);
  if (!(instructionName in program.instruction)) {
    throw new Error("instruction not found in program");
  }

  const instruction = idl.instructions.find((i) => i.name === instructionName);
  if (!instruction) {
    throw new Error("instruction not found in program");
  }

  // Bind all accounts
  let accounts = {};
  for (const accountItem of instruction.accounts) {
    // TODO: deal with composite accounts, probably do "composite.accountname=foo"
    // but composites can nest...
    // The correct way to test here would need IdlAccount / IdlAccounts exported.
    // @ts-ignore
    if (accountItem.accounts) {
      throw new Error("composite fields in accounts are not supported");
    }

    const accountName = accountItem.name;
    if (!(accountName in kvArgs)) {
      throw new Error('missing argument for account "' + accountName + '"');
    }
    const value = kvArgs[accountName];
    delete kvArgs[accountName];

    // @ts-ignore
    const isSigner = accountItem.isSigner;
    accounts[accountName] = await parseAccountArg(
      accountName,
      value,
      isSigner,
      programId
    );
  }

  // Bind all fields
  let args = [];
  for (const arg of instruction.args) {
    if (!(arg.name in kvArgs)) {
      throw new Error('missing argument for argument "' + arg.name + '"');
    }
    const value = kvArgs[arg.name];
    delete kvArgs[arg.name];

    args.push(await parseArg(arg.type, value, initialKvArgs, programId));
  }

  if (kvArgs.length > 0) {
    throw new Error(
      "unexpected arguments: " + kvArgs.map((kv) => kv.key).join(", ")
    );
  }

  console.log(program.instruction[instructionName](...args, { accounts }));
}

const KvArg = extendType(string, {
  async from(str) {
    const [key, ...values] = str.split("=");
    return [key, values.join("=")];
  },
});

const PubkeyArg = extendType(string, {
  async from(str) {
    return new anchor.web3.PublicKey(str);
  },
});

const cmd_instruction = command({
  name: "instruction",
  args: {
    instructionName: positional({ type: string, displayName: "name" }),
    programId: option({ type: PubkeyArg, long: "program" }),
    signers: multioption({ type: array(string), long: "signer" }),
    kvArgsList: restPositionals({
      type: KvArg,
      displayName: "account and data args",
    }),
  },
  handler: handleInstruction,
});

const app = subcommands({
  name: "commands",
  cmds: { instruction: cmd_instruction },
});

async function main() {
  run(app, process.argv.slice(2));
}

main();
