import * as anchor from "@project-serum/anchor";
import { anchorSetup } from "./anchor";

function objArrayToString(arr, nest) {
  let nestStr = " ".repeat(2 * nest);
  let innerNestStr = " ".repeat(2 * (nest + 1));
  let str = "[\n";
  for (const val of arr) {
    str += `${innerNestStr}${objToString(val, nest + 1)},\n`;
  }
  str += nestStr + "]";
  return str;
}

function objToString(obj, nest) {
  let nestStr = " ".repeat(2 * nest);
  let innerNestStr = " ".repeat(2 * (nest + 1));
  let str = "{\n";
  for (const [p, val] of Object.entries(obj)) {
    str += `${innerNestStr}${p}: `;
    if (val.toString() === "[object Object]") {
      str += objToString(val, nest + 1);
    } else if (
      Array.isArray(val) &&
      val.length > 0 &&
      val[0].toString() === "[object Object]"
    ) {
      str += objArrayToString(val, nest + 1);
    } else {
      str += `${val}`;
    }
    str += ",\n";
  }
  str += nestStr + "}";
  return str;
}

export async function handleDecodeAccount({
  rpcUrl,
  programId,
  feePayerPath,
  accountType,
  accountPk,
}) {
  const [idl, program] = await anchorSetup(rpcUrl, programId, feePayerPath);

  if (!program.account[accountType]) {
    console.error(
      `${accountType} not a valid account type on program ${programId}!`
    );
    process.exit(1);
  }
  const account = await program.account[accountType].fetch(accountPk);
  console.log(objToString(account, 0));
}
