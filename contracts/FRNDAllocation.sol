pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20Basic.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/// @title FRND Allocation - dispatches tokens to developer accounts
contract FRNDTeamAllocation is Ownable {

    using SafeMath for uint256;
    
	ERC20Basic public token;

    event Allocated(address indexed beneficiary, uint256 weiAmount);

    function setToken( ERC20Basic _token ) onlyOwner public {
	    require(_token != address(0));
	    
	    token = _token;
    }

	function distributeTeamTokens() onlyOwner public {

  	    uint256 weiAmount = token.balanceOf(this);
        require(weiAmount > 0);

  		/*
	  		TODO! Insert the correct team member addresses!
  		*/
  		token.transfer( 0x01, weiAmount.div(4)); //25% of team tokens
  		Allocated( 0x01, weiAmount.div(4) );
  		
  		token.transfer(0x02, weiAmount.div(100).mul(18)); //18% of team tokens
  		Allocated(0x02, weiAmount.div(100).mul(18));
  		
  		token.transfer(0x03, weiAmount.div(100).mul(15)); //15% of team tokens
  		Allocated(0x03, weiAmount.div(100).mul(15));
  		
  		token.transfer(0x04, weiAmount.div(100).mul(12)); //12% of team tokens
  		Allocated(0x04, weiAmount.div(100).mul(12));
  		
  		token.transfer(0x05, weiAmount.div(100).mul(9));  //9% of team tokens
  		Allocated(0x05, weiAmount.div(100).mul(9));
  		
  		//collective account for those without wallets...
  		token.transfer(0x06, weiAmount.div(100).mul(21)); //21% of team tokens
  		Allocated(0x06, weiAmount.div(100).mul(21));

    }

}