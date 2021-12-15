import * as anchor from "@project-serum/anchor";
import { anchorSetup } from "./anchor";

export async function handleDecodeAccount({
  rpcUrl,
  programId,
  accountType,
  accountPk,
}) {
  const [idl, program] = await anchorSetup(rpcUrl, programId);

  if (!program.account[accountType]) {
    console.error(
      `${accountType} not a valid account type on program ${programId}!`
    );
    process.exit(1);
  }
  const account = await program.account[accountType].fetch(accountPk);
  console.log(`decoding ${accountType}:${accountPk}...`);
  console.log(account);
}
