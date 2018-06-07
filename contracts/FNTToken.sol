pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";

/**
   @title FNTToken, the Friend token

   Implementation of FRND, the ERC20 token for Friend, with extra methods
   to transfer value and data to execute a call on transfer.
   Uses OpenZeppelin BurnableToken, MintableToken and PausableToken.
 */
contract FNTToken is BurnableToken, MintableToken, PausableToken {
  // Token Name
  string public constant NAME = "Friend Network Token";

  // Token Symbol
  string public constant SYMBOL = "FRND";

  // Token decimals
  uint8 public constant DECIMALS = 18;

}
