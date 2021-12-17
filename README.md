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
