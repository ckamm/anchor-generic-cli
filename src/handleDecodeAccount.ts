import * as anchor from "@project-serum/anchor";
import { anchorSetup } from "./anchor";

//
// Very hacky output formatting. There must be a better way to serialize.
//

function objArrayToString(arr, nest) {
  let nestStr = " ".repeat(2 * nest);
  let innerNestStr = " ".repeat(2 * (nest + 1));
  let str = "[\n";
  let first = true;
  for (const val of arr) {
    if (!first) {
      str += ",\n";
    }
    first = false;
    str += `${innerNestStr}${objToString(val, nest + 1)}`;
  }
  str += `\n${nestStr}]`;
  return str;
}

function arrayToString(arr) {
  let str = "[";
  let first = true;
  for (const val of arr) {
    if (!first) {
      str += ", ";
    }
    first = false;
    str += val.toString();
  }
  str += `]`;
  return str;
}

function objToString(obj, nest) {
  let nestStr = " ".repeat(2 * nest);
  let innerNestStr = " ".repeat(2 * (nest + 1));
  let str = "{\n";
  let first = true;
  for (const [p, val] of Object.entries(obj)) {
    if (!first) {
      str += ",\n";
    }
    first = false;
    str += `${innerNestStr}"${p}": `;
    if (val.toString() === "[object Object]") {
      str += `${objToString(val, nest + 1)}`;
    } else if (
      Array.isArray(val) &&
      val.length > 0 &&
      val[0].toString() === "[object Object]"
    ) {
      str += objArrayToString(val, nest + 1);
    } else if (Array.isArray(val) && val.length > 0 && val[0].toString !== undefined) {
      str += arrayToString(val);
    } else if (Array.isArray(val)) {
      str += JSON.stringify(val);
    } else {
      str += `"${val}"`; // would be nice if numbers were json numbers
    }
  }
  str += `\n${nestStr}}`;
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

export async function handleDecodeAllAccounts({
  rpcUrl,
  programId,
  feePayerPath,
  accountType,
}) {
  const [idl, program] = await anchorSetup(rpcUrl, programId, feePayerPath);

  if (!program.account[accountType]) {
    console.error(
      `${accountType} not a valid account type on program ${programId}!`
    );
    process.exit(1);
  }
  const accounts = await program.account[accountType].all();
  for (const account of accounts) {
    console.log(objToString(account, 0));
  }
}
