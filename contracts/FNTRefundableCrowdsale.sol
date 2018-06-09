pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/crowdsale/RefundableCrowdsale.sol";


/**
 * @title FNTRefundableCrowdsale
 * @dev Extension of teh RefundableCrowdsale form zeppelin to allow vault to be
 * closed once soft cap is reached
 */
contract FNTRefundableCrowdsale is RefundableCrowdsale {

  // if the vault was closed before finalization
  bool public vaultClosed = false;

  // close vault call
  function closeVault() public onlyOwner {
    require(!vaultClosed);
    require(goalReached());
    vault.close();
    vaultClosed = true;
  }

  // We're overriding the fund forwarding from Crowdsale.
  // In addition to sending the funds, we want to call
  // the RefundVault deposit function if the vault is not closed,
  // if it is closed we forward teh funds to the wallet
  function forwardFunds() internal {
    if (!vaultClosed) {
      vault.deposit.value(msg.value)(msg.sender);
    } else {
      wallet.transfer(msg.value);
    }
  }

  // vault finalization task, called when owner calls finalize()
  function finalization() internal {
    if (!vaultClosed && goalReached()) {
      vault.close();
      vaultClosed = true;
    } else if (!goalReached()) {
      vault.enableRefunds();
    }
  }
}
