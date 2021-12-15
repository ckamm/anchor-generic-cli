import {
  array,
  command,
  multioption,
  option,
  positional,
  restPositionals,
  run,
  string,
  subcommands,
} from "cmd-ts";
import { handleInstruction } from "./handleInstruction";
import { KvArg, PubkeyArg } from "./util";
import { handleDecodeAccount } from "./handleDecodeAccount";

const commonArgs = {
  programId: option({ type: PubkeyArg, long: "program" }),
  rpcUrl: option({ type: string, long: "rpc" }),
  feePayerPath: option({
    type: string,
    short: "k",
    long: "keypair",
    defaultValue: () => "~/.config/solana/id.json",
  }),
};

const cmdInstruction = command({
  name: "instruction",
  args: {
    ...commonArgs,
    action: positional({ type: string, displayName: "action" }),
    instructionName: positional({ type: string, displayName: "name" }),
    kvArgsList: restPositionals({
      type: KvArg,
      displayName: "account and data args",
    }),
  },
  handler: handleInstruction,
});

const cmdDecodeAccount = command({
  name: "decode_account",
  args: {
    accountType: positional({ type: string, displayName: "account type" }),
    accountPk: positional({ type: string, displayName: "account public key" }),
    ...commonArgs,
  },
  handler: handleDecodeAccount,
});

const app = subcommands({
  name: "commands",
  cmds: { instruction: cmdInstruction, decode_account: cmdDecodeAccount },
});

async function main() {
  run(app, process.argv.slice(2));
}

main();
