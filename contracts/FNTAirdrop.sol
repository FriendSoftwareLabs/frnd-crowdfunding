pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./FNTToken.sol";

/**
 * @title FNTAirdrop
 * @dev A contract that can hold ERC20 tokens and transfer them in batches
 */
contract FNTAirdrop is Ownable {

  function drop(address _token, address[] addrs, uint256[] values) public onlyOwner {
    require(token != address(0));
    require(addrs.length == values.length);

    FNTToken token = FNTToken(_token);

    for(uint256 i = 0; i < addrs.length; i ++) {
      require(addrs[i] != address(0));
      require(token.transfer(addrs[i], values[i]));
    }
  }

}
