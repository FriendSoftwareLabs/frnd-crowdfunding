pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title FNTPresale
 * @dev Contract to raise a max amount of Ether before TGE
 *
 * The token rate is 24000 FNT per Ether, if you send 10 Ethers you will
 * receive 240000 FNT after TGE
 * The contract is pausable and it starts in paused state
 */

contract FNTPresale is Ownable, Pausable {
  using SafeMath for uint256;

  // The address where all funds will be forwarded
  address public wallet;

  // The total amount of wei raised
  uint256 public weiRaised = 0;

  // The maximun amount of wei to be raised
  uint256 public maxCap;

  // Time at when the presale when finish
  uint256 public endTime;

  // Rate at which the token will be distributed
  uint256 public rate;

  // Event triggered every time a contribution is received
  event ContributionReceived(address sender, uint256 weiValue, uint256 tokensIssued);

  /**
     @dev Constructor. Creates the FNTPresale contract
     The contract can start with some wei already raised, it will
     also have a maximun amount of wei to be raised and a wallet
     address where all funds will be forwarded inmediatly.

     @param _maxCap see `maxCap`
     @param _rate see `rate`
     @param _wallet see `wallet`
   */
  function FNTPresale(
    uint256 _maxCap, uint256 _rate, uint256 _endTime, address _wallet
  ) {
    require(_endTime > now);

    maxCap = _maxCap;
    rate = _rate;
    endTime = _endTime;
    wallet = _wallet;
    paused = true;
  }

  /**
     @dev Fallback function that will be executed every time the contract
     receives ether, the contract will accept ethers when is not paused, when
     the endTime is not reached and when the amount sent plus the wei raised is
     not higher than the max cap.

     ONLY send from a ERC20 compatible wallet like myetherwallet.com
   */
  function () public whenNotPaused payable {
    require(weiRaised.add(msg.value) <= maxCap);
    require(now < endTime);

    weiRaised = weiRaised.add(msg.value);
    uint256 tokens = msg.value.mul(rate);

    wallet.transfer(msg.value);

    ContributionReceived(msg.sender, msg.value, tokens);
  }

}
