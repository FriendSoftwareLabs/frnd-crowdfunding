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
        
        
        token.transfer(0x9135125C1D7aB62c49CdB2CCeE7908b40b91b7b1, weiAmount.div(100).mul(27)); 
        Allocated(0x9135125C1D7aB62c49CdB2CCeE7908b40b91b7b1, weiAmount.div(100).mul(27));
        
        token.transfer(0xCA6e03C1E8B1987edcCF974468a9a9cE4dDA948c, weiAmount.div(100).mul(20));
        Allocated(0xCA6e03C1E8B1987edcCF974468a9a9cE4dDA948c, weiAmount.div(100).mul(20));
        
        token.transfer(0xe061eF3EfdC0fDcE1Ccf8E4EAe6d07D3DbfcC288, weiAmount.div(100).mul(16)); 
        Allocated(0xe061eF3EfdC0fDcE1Ccf8E4EAe6d07D3DbfcC288, weiAmount.div(100).mul(16));
        
        token.transfer(0xA0C0434a967C9f63a1FE14ad9D6A3EfD4F6186fb, weiAmount.div(100).mul(12)); 
        Allocated(0xA0C0434a967C9f63a1FE14ad9D6A3EfD4F6186fb, weiAmount.div(100).mul(12));
        
        token.transfer(0x3dcAD194B033ca0Da0705FA05808A232776B7565, weiAmount.div(100)); 
        Allocated(0x3dcAD194B033ca0Da0705FA05808A232776B7565, weiAmount.div(100));
        
        token.transfer(0x2F0ad1F104AbB1c48ac0CaFb51dba70FE630870A, weiAmount.div(200).mul(3)); 
        Allocated(0x2F0ad1F104AbB1c48ac0CaFb51dba70FE630870A, weiAmount.div(200).mul(3));
        
        token.transfer(0x9747DAb8b85f9ac13beCf77B899519e933F9B5bd, weiAmount.div(200).mul(3)); 
        Allocated(0x9747DAb8b85f9ac13beCf77B899519e933F9B5bd, weiAmount.div(200).mul(3));
        
        token.transfer(0x29edc817537bcf2dc3f4fa16c2ebb51942e81cce, weiAmount.div(100).mul(2)); 
        Allocated(0x29edc817537bcf2dc3f4fa16c2ebb51942e81cce, weiAmount.div(100).mul(2));
        
        token.transfer(0xD7af9EB3dd84B86394179c8A29536895D1F42DA4, weiAmount.div(200).mul(3)); 
        Allocated(0xD7af9EB3dd84B86394179c8A29536895D1F42DA4, weiAmount.div(200).mul(3));
        
        token.transfer(0x0CF75a43C6CAa54A7b3fC6CEcB6Fb64eCAAD73cf, weiAmount.div(200).mul(3)); 
        Allocated(0x0CF75a43C6CAa54A7b3fC6CEcB6Fb64eCAAD73cf, weiAmount.div(200).mul(3));
        
        token.transfer(0xD9c29a7E6Dd676DF5C707D3bC8Aa5A81379b8D90, weiAmount.div(200).mul(3)); 
        Allocated(0xD9c29a7E6Dd676DF5C707D3bC8Aa5A81379b8D90, weiAmount.div(200).mul(3));
        
        // 27 + 20 + 16 + 11 + 1 + 1 + 1.5 + 1.5 + 2 + 1.5 + 1.5 + 1.5 == 85.5
        // collective account ==> 14.5
        token.transfer(0xece1f3ebeb98e3f2a8c81cc1e5c74715de00b6e6, weiAmount.div(200).mul(29)); 
        Allocated(0xece1f3ebeb98e3f2a8c81cc1e5c74715de00b6e6, weiAmount.div(200).mul(29)); 		  		

    }
    
}