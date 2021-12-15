import * as anchor from "@project-serum/anchor";
import { anchorSetup, buildInstruction } from "./anchor";

export async function handleInstruction({
  programId,
  rpcUrl,
  feePayerPath,
  action,
  instructionName,
  kvArgsList,
}) {
  const [idl, program] = await anchorSetup(rpcUrl, programId, feePayerPath);
  const [args, ctx] = await buildInstruction(
    idl,
    instructionName,
    kvArgsList,
    programId
  );

  switch (action) {
    case "encode":
      console.log(program.instruction[instructionName](...args, ctx));
      break;
    case "send":
      console.log(await program.rpc[instructionName](...args, ctx));
      break;
    default:
      throw new Error("unknown action: " + action);
  }
}
