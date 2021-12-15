import * as anchor from "@project-serum/anchor";
import { parseAccountArg, parseArg } from "./util";

export async function handleInstruction({
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
