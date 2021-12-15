import * as anchor from "@project-serum/anchor";

export async function handleDecodeAccount({
  programId,
  accountType,
  accountPk,
}) {
  const clusterUrl = "https://api.devnet.solana.com";
  const throwAway = new anchor.web3.Keypair();
  const connection = new anchor.web3.Connection(clusterUrl, "confirmed");
  const walletWrapper = new anchor.Wallet(throwAway);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "confirmed",
  });
  const idl = await anchor.Program.fetchIdl(programId, provider);
  const program = new anchor.Program(idl, programId, provider);

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
