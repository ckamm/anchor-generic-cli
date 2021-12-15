import * as anchor from "@project-serum/anchor";
import { anchorSetup, buildInstruction } from "./anchor";

export async function handleInstruction({
  programId,
  rpcUrl,
  instructionName,
  kvArgsList,
}) {
  const [idl, program] = await anchorSetup(rpcUrl, programId);
  const [args, ctx] = await buildInstruction(
    idl,
    instructionName,
    kvArgsList,
    programId
  );
  console.log(program.instruction[instructionName](...args, ctx));
}
