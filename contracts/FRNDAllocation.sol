pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20Basic.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

  /**
   * @dev Buy tokens fallback function, overrides zeppelin buyTokens function
   *
   * ONLY send from a ERC20 compatible wallet like myetherwallet.com
   *
   */
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


  		token.transfer( 0x40dA105628020e051Cf456aF082d248919541aDC, weiAmount.div(100).mul(27)); //27% of team tokens
  		Allocated( 0x40dA105628020e051Cf456aF082d248919541aDC, weiAmount.div(100).mul(27) );
  		
  		token.transfer(0x9bBCe79AD158e1f78aB71b4c9B8FaF46501C91FA, weiAmount.div(100).mul(20)); //20% of team tokens
  		Allocated(0x9bBCe79AD158e1f78aB71b4c9B8FaF46501C91FA, weiAmount.div(100).mul(20));
  		
  		token.transfer(0x4085bd2D0D0E9c4d3eB8739C1C7FaED9fe06dE26, weiAmount.div(100).mul(16)); //16% of team tokens
  		Allocated(0x4085bd2D0D0E9c4d3eB8739C1C7FaED9fe06dE26, weiAmount.div(100).mul(16));
  		
  		token.transfer(0x60aC87b76b617005221C1A46372B2F17B7f01e46, weiAmount.div(100).mul(11)); //11% of team tokens
  		Allocated(0x60aC87b76b617005221C1A46372B2F17B7f01e46, weiAmount.div(100).mul(11));
  		
  		token.transfer(0x00D3E79Eab18D583e583d04B2654ACb3465DcFa2, weiAmount.div(100).mul(9));  //9% of team tokens
  		Allocated(0x00D3E79Eab18D583e583d04B2654ACb3465DcFa2, weiAmount.div(100).mul(9));
  		
  		//collective account for those without wallets...
  		token.transfer(0x4de2388eb29baf944c896f711a4e1ae48fcca865, weiAmount.div(100).mul(17)); //rest% of team tokens
  		Allocated(0x4de2388eb29baf944c896f711a4e1ae48fcca865, weiAmount.div(100).mul(17));
  		
  		// 27 + 20 + 16 + 12 + 1 + 1.5 + 1.5 + 2 + 1.5 + 1.5 + 1.5 == 85.5
  		// collective account = = > 14.5
  		token.transfer(0xece1f3ebeb98e3f2a8c81cc1e5c74715de00b6e6, weiAmount.div(200).mul(29)); 
  		Allocated(0xece1f3ebeb98e3f2a8c81cc1e5c74715de00b6e6, weiAmount.div(200).mul(29));  		  		

    }

}