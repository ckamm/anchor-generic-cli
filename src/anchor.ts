import * as anchor from "@project-serum/anchor";
import { parseAccountArg, parseArg, readKeypair } from "./util";

export async function anchorSetup(
  rpcUrl: string,
  programId: anchor.web3.PublicKey,
  feePayerPath: string
): Promise<[anchor.Idl, anchor.Program]> {
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  const feePayer = readKeypair(feePayerPath);
  const walletWrapper = new anchor.Wallet(feePayer);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "confirmed",
  });

  const idl = await anchor.Program.fetchIdl(programId, provider);
  const program = new anchor.Program(idl, programId, provider);
  return [idl, program];
}

export async function buildInstruction(
  idl: anchor.Idl,
  instructionName: string,
  kvArgsList: [string, string][],
  programId: anchor.web3.PublicKey
): Promise<[any[], Object]> {
  let kvArgs = Object.fromEntries(kvArgsList);
  const initialKvArgs = { ...kvArgs };

  const instruction = idl.instructions.find((i) => i.name === instructionName);
  if (!instruction) {
    throw new Error("instruction not found in program");
  }

  // Bind all accounts
  let accounts = {};
  let signers = [];
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
    const [account, signer] = await parseAccountArg(
      accountName,
      value,
      isSigner,
      programId
    );

    //console.log(accountName, account.toBase58());
    accounts[accountName] = account;
    if (signer) {
      signers.push(signer);
    }
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

  // Accept remainingAccounts
  // TODO: Allow signers/writables
  let remainingAccounts = undefined;
  if (kvArgs.remainingAccount) {
    remainingAccounts = [];
    for (const [_, value] of kvArgsList.filter(
      (kv) => kv[0] == "remainingAccount"
    )) {
      const [account, _] = await parseAccountArg(
        "remainingAccount",
        value,
        false,
        programId
      );
      remainingAccounts.push({
        pubkey: account,
        isWritable: false,
        isSigner: false,
      });
    }
    delete kvArgs.remainingAccount;
  }

  if (Object.keys(kvArgs).length > 0) {
    throw new Error("unexpected arguments: " + Object.keys(kvArgs).join(", "));
  }

  return [args, { accounts, remainingAccounts, signers }];
}
