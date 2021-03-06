# Examples

Look at program accounts:

```
$ yarn run cli \
  --rpc https://api.devnet.solana.com \
  --program 4Q6WW2ouZ6V3iaNm56MTd5n2tnTm4C5fiH8miFHnAFHo \
  decode_account registrar 92xCzGM7YgfMyTZDAWfh87g2f7i9DqwYZhDFW1C9utNc

decoding registrar:92xCzGM7YgfMyTZDAWfh87g2f7i9DqwYZhDFW1C9utNc...
{
  governanceProgramId: i7BqPFNUvB7yqwVeCRJHrtZVwRsZZNUJTdBm7Vg2cDb,
  realm: 2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4,
  realmGoverningTokenMint: 5cC7q4H6W94FuZhqBnNCjJFamECoNp91UykgsTDNQuav,
  realmAuthority: BFMdrBS7E2o28Kvkc2CKcdZgR4yuYvYqgNnMLSVQLy29,
  clawbackAuthority: BFMdrBS7E2o28Kvkc2CKcdZgR4yuYvYqgNnMLSVQLy29,
  votingMints: [
    {
      mint: 11111111111111111111111111111111,
      grantAuthority: 11111111111111111111111111111111,
(...)
```

Send instructions:

```
$ yarn run cli \
  --rpc https://api.devnet.solana.com \
  --program 4Q6WW2ouZ6V3iaNm56MTd5n2tnTm4C5fiH8miFHnAFHo \
  instruction send createRegistrar \
  'registrar=PDA:2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4;"registrar";5cC7q4H6W94FuZhqBnNCjJFamECoNp91UykgsTDNQuav' \
  realm=2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4 \
  governanceProgramId=i7BqPFNUvB7yqwVeCRJHrtZVwRsZZNUJTdBm7Vg2cDb \
  realmGoverningTokenMint=5cC7q4H6W94FuZhqBnNCjJFamECoNp91UykgsTDNQuav \
  realmAuthority=KEYPAIR:authority.json \
  clawbackAuthority=BFMdrBS7E2o28Kvkc2CKcdZgR4yuYvYqgNnMLSVQLy29 \
  payer=KEYPAIR:payer.json \
  systemProgram=11111111111111111111111111111111 \
  rent=SysvarRent111111111111111111111111111111111 \
  registrarBump=BUMP:registrar
```

Note that instruction fees are paid by `~/.config/solana/id.json` by default.
Use `-k` to change.

# Documentation

## Options

- `--rpc <url>`: RPC server url to send requests to.
- `--program <address>`: Program address to interact with. Must have an IDL uploaded.
- `-k <keypair file>`: Keypair to use for paying transaction fees. Defaults to
  `~/.config/solana/id.json`.

## decode_account Command

Use `decode_account <idl account type name> <address>` to fetch and print data.

## decode_all_accounts Command

Use `decode_all_accounts <idl account type name>` to fetch and print data for all accounts
of that type.

## instruction send Command

Use `instruction send <idl instruction name> <args>` to build an instruction and
send it.

`<args>` is a list of `key=value` arguments, where `key` is an account or
argument name, and `value` is the value to assign to it.

Examples:

- `realm=2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4`:
  Sends this address as the `realm` account.
- `authority=KEYPAIR:authority.json`:
  Loads the keypair from the file, sends the pubkey as the `authority` account and
  signs with its private key.
- `voter=PDA:2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4;"registrar"`:
  Computes a program derived address based on seeds separated by `;`.
- `voterBump=BUMP:voter`:
  Sends the bump used for computing the PDA from `voter` as the `voterBump`
  instruction argument.
- `remainingAccount=2oRJrS42s86YK2PjisbEdJQPot6VykJSr7wnturZJhz4`:
  The `remainingAccount` key has special meaning.
  Sends this address as an extra account. Can be repeated multiple times.
  Extra accounts are currently always read-only non-signers.

Many instruction argument types are not supported yet.
