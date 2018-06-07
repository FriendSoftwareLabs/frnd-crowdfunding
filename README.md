# FNToken Token Generation Event

## Contracts

### FNToken

The Friend Token based in the standard token implemented by zeppelin-solidity.

### FNTPresale

The presale smart contract to receive ETH contributions before ICO.
The presale has a maximum cap and a end time, it cant receive more ETH than max cap and cant issue tokens after end time timestamp.

### FNTCrowdsale

The FNTCrowdsale do the token distribution for the FNToken, it will issue and distribute 2000000000 tokens in total in the following steps:
  1.- Create the crowdsale contract, it also creates the token contract.
  2.- The FN team adds the presale token buyers.
  3.- The presale starts at a certain time and it will have the following rates:
    0 - 10000 ETH raised: 23000 Tokens per ETH.
    10000 - 25000 ETH raised: 22000 Tokens per ETH.
    25000 - 50000 ETH raised: 21000 Tokens per ETH.
    up to 50000 ETH raised: 20000 Tokens per ETH.
  4.- The crowdsale is finished after certain time, if less than 10000 ETH were raised all raised funds are returned.
  5.- The team receives a Vested token schedule of the 6% of total supply and the FSNAS receive 12% of the token supply instantly.

## Install

```
git clone https://github.com/FriendSoftwareLabs/tge-contracts
npm install
```

## Test

```
npm test
```
# frnd-crowdfunding
