import * as anchor from "@project-serum/anchor";

export async function anchorSetup(
  rpcUrl: string,
  programId: anchor.web3.PublicKey
): Promise<[anchor.Idl, anchor.Program]> {
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");

  const throwAway = new anchor.web3.Keypair();
  const walletWrapper = new anchor.Wallet(throwAway);
  const provider = new anchor.Provider(connection, walletWrapper, {
    preflightCommitment: "confirmed",
  });

  const idl = await anchor.Program.fetchIdl(programId, provider);
  const program = new anchor.Program(idl, programId, provider);
  return [idl, program];
}
