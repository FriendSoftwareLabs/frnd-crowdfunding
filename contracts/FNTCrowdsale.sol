pragma solidity ^0.4.18;


import "zeppelin-solidity/contracts/token/TokenTimelock.sol";
import "./FNTRefundableCrowdsale.sol";
import "./FNTToken.sol";

/**
 * @title FNTCrowdsale
 * @dev The crowdsale of the Firend Token network
 * The Friend token network will have a max total supply of 2000000000
 * The minimun cap for the sale is 25000 ETH
 * The crowdsale is capped in tokens total supply
 * If the minimun cap is not reached the ETH raised is returned
 */
contract FNTCrowdsale is FNTRefundableCrowdsale {

  uint256 public maxICOSupply;

  uint256 public maxTotalSupply;

  uint256 public minFunding;

  uint256 public mediumFunding;

  uint256 public highFunding;

  uint256 public presaleWei;

  address public teamAddress;

  address public FSNASAddress;

  mapping(address => bool) public whitelist;

  event WhitelistedAddressAdded(address addr);
  event WhitelistedAddressRemoved(address addr);
  event VestedTeamTokens(address first, address second, address thrid, address fourth);

  /**
   * @dev Throws if called by any account that's not whitelisted.
   */
  modifier onlyWhitelisted() {
    require(whitelist[msg.sender]);
    _;
  }

  /**
   * @dev Constructor
   * Creates a Refundable Crowdsale and set the funding, max supply and addresses
   * to distribute tokens at the end of the crowdsale.
   * @param _startTime address, when the crowdsale starts
   * @param _endTime address, when the crowdsale ends
   * @param _rate address, crowdsale rate without bonus
   * @param _minFunding address, soft cap
   * @param _mediumFunding address, medium funding stage
   * @param _highFunding address, high funding stage
   * @param _wallet address, wallet to receive ETH raised
   * @param _maxTotalSupply address, maximun token supply
   * @param _teamAddress address, team's address
   * @param _FSNASAddress address, fsnas address
   */
  function FNTCrowdsale(
    uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _minFunding,
    uint256 _mediumFunding, uint256 _highFunding, address _wallet,
    uint256 _maxTotalSupply, address _teamAddress, address _FSNASAddress
  ) public
    RefundableCrowdsale(_minFunding)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    require(_maxTotalSupply > 0);
    require(_minFunding > 0);
    require(_mediumFunding > _minFunding);
    require(_highFunding > _mediumFunding);
    require(_teamAddress != address(0));
    require(_FSNASAddress != address(0));
    minFunding = _minFunding;
    mediumFunding = _mediumFunding;
    highFunding = _highFunding;
    maxTotalSupply = _maxTotalSupply;
    maxICOSupply = maxTotalSupply.mul(82).div(100);
    teamAddress = _teamAddress;
    FSNASAddress = _FSNASAddress;
    FNTToken(token).pause();
  }

  // Internal function that returns a MintableToken, FNTToken is mintable
  function createTokenContract() internal returns (MintableToken) {
    return new FNTToken();
  }

  /**
   * @dev Buy tokens fallback function, overrides zeppelin buyTokens function
   * @param beneficiary address, the address that will receive the tokens
   *
   * ONLY send from a ERC20 compatible wallet like myetherwallet.com
   *
   */
  function buyTokens(address beneficiary) public onlyWhitelisted payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = 0;
    if (weiRaised < minFunding) {

      // If the weiRaised go from less than min funding to more than high funding
      if (weiRaised.add(weiAmount) > highFunding) {
        tokens = minFunding.sub(weiRaised)
          .mul(rate).mul(115).div(100);
        tokens = tokens.add(
          mediumFunding.sub(minFunding).mul(rate).mul(110).div(100)
        );
        tokens = tokens.add(
          highFunding.sub(mediumFunding).mul(rate).mul(105).div(100)
        );
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(highFunding).mul(rate)
        );

      // If the weiRaised go from less than min funding to more than medium funding
      } else if (weiRaised.add(weiAmount) > mediumFunding) {
        tokens = minFunding.sub(weiRaised)
          .mul(rate).mul(115).div(100);
        tokens = tokens.add(
          mediumFunding.sub(minFunding).mul(rate).mul(110).div(100)
        );
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(mediumFunding).mul(rate).mul(105).div(100)
        );

      // If the weiRaised go from less than min funding to more than min funding
      // but less than medium
      } else if (weiRaised.add(weiAmount) > minFunding) {
        tokens = minFunding.sub(weiRaised)
          .mul(rate).mul(115).div(100);
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(minFunding).mul(rate).mul(110).div(100)
        );

      // If the weiRaised still continues being less than min funding
      } else {
        tokens = weiAmount.mul(rate).mul(115).div(100);
      }

    } else if ((weiRaised >= minFunding) && (weiRaised < mediumFunding)) {

      // If the weiRaised go from more than min funding and less than min funding
      // to more than high funding
      if (weiRaised.add(weiAmount) > highFunding) {
        tokens = mediumFunding.sub(weiRaised)
          .mul(rate).mul(110).div(100);
        tokens = tokens.add(
          highFunding.sub(mediumFunding).mul(rate).mul(105).div(100)
        );
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(highFunding).mul(rate)
        );

      // If the weiRaised go from more than min funding and less than min funding
      // to more than medium funding
      } else if (weiRaised.add(weiAmount) > mediumFunding) {
        tokens = mediumFunding.sub(weiRaised)
          .mul(rate).mul(110).div(100);
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(mediumFunding).mul(rate).mul(105).div(100)
        );

      // If the weiRaised still continues being less than medium funding
      } else {
        tokens = weiAmount.mul(rate).mul(110).div(100);
      }

    } else if ((weiRaised >= mediumFunding) && (weiRaised < highFunding)) {

      // If the weiRaised go from more than medium funding and less than high funding
      // to more than high funding
      if (weiRaised.add(weiAmount) > highFunding) {
        tokens = highFunding.sub(weiRaised)
          .mul(rate).mul(105).div(100);
        tokens = tokens.add(
          weiRaised.add(weiAmount).sub(highFunding).mul(rate)
        );

      // If the weiRaised still continues being less than high funding
      } else {
        tokens = weiAmount.mul(rate).mul(105).div(100);
      }

    // If the weiRaised still continues being more than high funding
    } else {
      tokens = weiAmount.mul(rate);
    }

    // Check not to sold more than maxICOSupply
    require(token.totalSupply().add(tokens) <= maxICOSupply);

    // Take in count wei received
    weiRaised = weiRaised.add(weiAmount);

    // Mint the token to the buyer
    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    // Forward funds to vault
    forwardFunds();
  }

  /**
   * @dev Distribute tokens to a batch of addresses, called only by owner
   * @param addrs address[], the addresses where tokens will be issued
   * @param values uint256[], the value in wei to be added
   * @param rate uint256, the rate of tokens per ETH used
   */
  function addPresaleTokens(
    address[] addrs, uint256[] values, uint256 rate
  ) onlyOwner external {
    require(now < endTime);
    require(addrs.length == values.length);
    require(rate > 0);

    uint256 totalTokens = 0;

    for(uint256 i = 0; i < addrs.length; i ++) {
      token.mint(addrs[i], values[i].mul(rate));
      totalTokens = totalTokens.add(values[i].mul(rate));

      // Take in count wei received
      weiRaised = weiRaised.add(values[i]);
      presaleWei = presaleWei.add(values[i]);
    }

    // Check not to issue more than maxICOSupply
    require(token.totalSupply() <= maxICOSupply);
  }

  /**
   * @dev add an address to the whitelist
   * @param addrs address[] addresses to be added in whitelist
   */
  function addToWhitelist(address[] addrs) onlyOwner external {
    for(uint256 i = 0; i < addrs.length; i ++) {
      require(!whitelist[addrs[i]]);
      whitelist[addrs[i]] = true;
      WhitelistedAddressAdded(addrs[i]);
    }
  }

  /**
   * @dev remove an address from the whitelist
   * @param addrs address[] addresses to be removed from whitelist
   */
  function removeFromWhitelist(address[] addrs) onlyOwner public {
    for(uint256 i = 0; i < addrs.length; i ++) {
      require(whitelist[addrs[i]]);
      whitelist[addrs[i]] = false;
      WhitelistedAddressRemoved(addrs[i]);
    }
  }


  /**
   * @dev Must be called after crowdsale ends, to do some extra finalization
   * work. Calls the contract's finalization function.
   */
  function finalize() onlyOwner public {
    require(!isFinalized);
    
    if( goalReached() )
    {
	    finalization();
	    Finalized();
	
	    isFinalized = true;
    }
	else
	{
		if( hasEnded() )
		{
		    vault.enableRefunds();
		    
		    Finalized();
		    isFinalized = true;
		}
	}    
  }

  /**
   * @dev Finalize the crowdsale and token minting, and transfer ownership of
   * the token, can be called only by owner
   */
  function finalization() internal {
    super.finalization();

    // Multiplying tokens sold by 0,219512195122
    // 18 / 82 = 0,219512195122 , which means that for every token sold in ICO
    // 0,219512195122 extra tokens will be issued.
    uint256 extraTokens = token.totalSupply().mul(219512195122).div(1000000000000);
    uint256 teamTokens = extraTokens.div(3);
    uint256 FSNASTokens = extraTokens.div(3).mul(2);

    // Mint toke time locks to team
    TokenTimelock firstBatch = new TokenTimelock(token, teamAddress, now.add(30 days));
    token.mint(firstBatch, teamTokens.div(2));

    TokenTimelock secondBatch = new TokenTimelock(token, teamAddress, now.add(1 years));
    token.mint(secondBatch, teamTokens.div(2).div(3));

    TokenTimelock thirdBatch = new TokenTimelock(token, teamAddress, now.add(2 years));
    token.mint(thirdBatch, teamTokens.div(2).div(3));

    TokenTimelock fourthBatch = new TokenTimelock(token, teamAddress, now.add(3 years));
    token.mint(fourthBatch, teamTokens.div(2).div(3));

    VestedTeamTokens(firstBatch, secondBatch, thirdBatch, fourthBatch);

    // Mint FSNAS tokens
    token.mint(FSNASAddress, FSNASTokens);

    // Finsih the minting
    token.finishMinting();

    // Transfer ownership of token to company wallet
    token.transferOwnership(wallet);

  }

}
