
const latestTime = require('./helpers/latestTime');
const { duration, increaseTimeTestRPCTo } = require('./helpers/increaseTime');
const abiDecoder = require('abi-decoder');

const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var FNTCrowdsale = artifacts.require('./FNTCrowdsale.sol');
var FNTToken = artifacts.require('./FNTToken.sol');
abiDecoder.addABI(FNTCrowdsale.abi);

const ALLOWED_DIFFERENCE = parseInt(web3.toWei(0.0001));
function assertApprox (a, b) {
  return assert.approximately(
    parseFloat(a),
    parseFloat(b),
    ALLOWED_DIFFERENCE
  );
};

contract('FNT Crowdsale', function (accounts) {
  const wallet = accounts[1];
  const rate = new BigNumber(20000);
  const minFunding = new BigNumber(web3.toWei(10000, 'ether'));
  const mediumFunding = new BigNumber(web3.toWei(25000, 'ether'));
  const highFunding = new BigNumber(web3.toWei(50000, 'ether'));
  const maxTotalSupply = new BigNumber(web3.toWei(2000000000));
  const maxICOSupply = maxTotalSupply.mul(82).div(100);
  const teamWallet = accounts[8];
  const fsnasWallet = accounts[9];

  it('Should execute a crowdsale succesfully reaching max cap with crowdsale tokens buying four times', async function () {
    let weiRaised = new BigNumber(0);
    let presaleWei = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);
    const walletInicialETH = await web3.eth.getBalance(wallet);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    // Check crowdsale values
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    minFunding.should.be.bignumber.equal(await crowdsale.minFunding());
    mediumFunding.should.be.bignumber.equal(await crowdsale.mediumFunding());
    rate.should.be.bignumber.equal(await crowdsale.rate());
    maxICOSupply.should.be.bignumber.equal(await crowdsale.maxICOSupply());
    assert.equal(wallet, await crowdsale.wallet());
    assert.equal(true, await token.paused());

    // Should allow add crowdsale tokens before ICO
    await crowdsale.addPresaleTokens(
      [accounts[5], accounts[6]],
      [web3.toWei(1000, 'ether'), web3.toWei(500, 'ether')],
      30000
    );

    totalSupply = totalSupply.add(web3.toWei(1500, 'ether') * 30000);
    weiRaised = weiRaised.add(web3.toWei(1500, 'ether'));
    presaleWei = presaleWei.add(web3.toWei(1500, 'ether'));

    // Shouldnt allow buy before start time
    await crowdsale.sendTransaction({
      value: web3.toWei(10, 'ether'),
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    await crowdsale.addToWhitelist([accounts[2]]);

    await increaseTimeTestRPCTo(startTime + 1);

    // Should allow add crowdsale tokens in ICO
    await crowdsale.addPresaleTokens(
      [accounts[5]], [web3.toWei(1000, 'ether')], 30000
    );
    totalSupply = totalSupply.add(web3.toWei(1000, 'ether') * 30000);
    weiRaised = weiRaised.add(web3.toWei(1000, 'ether'));
    presaleWei = presaleWei.add(web3.toWei(1000, 'ether'));

    // Buy all tokens
    let weiSent = new BigNumber(web3.toWei(47500));
    await crowdsale.sendTransaction({
      value: web3.toWei(7500),
      from: accounts[2],
    });
    await crowdsale.sendTransaction({
      value: web3.toWei(15000),
      from: accounts[2],
    });
    await crowdsale.sendTransaction({
      value: web3.toWei(25000),
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    const remainingWei = maxICOSupply.sub(await token.totalSupply()).div(rate);
    const buyerTokenBalance = new BigNumber(web3.toWei(7500)).mul(rate.mul(1.15))
      .add(new BigNumber(web3.toWei(15000)).mul(rate.mul(1.10)))
      .add(new BigNumber(web3.toWei(25000)).mul(rate.mul(1.05)))
      .add(remainingWei.mul(rate));

    await crowdsale.sendTransaction({
      value: remainingWei,
      from: accounts[2],
    });

    totalSupply = totalSupply.add(buyerTokenBalance);
    totalSupply.should.be.bignumber.equal(await token.totalSupply());
    weiRaised = weiRaised.add(remainingWei);
    maxICOSupply.should.be.bignumber.equal(await token.totalSupply());
    buyerTokenBalance.should.be.bignumber.equal(await token.balanceOf(accounts[2]));

    // Shouldnt allow buy once cap is reached
    await crowdsale.sendTransaction({
      value: 1,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    await increaseTimeTestRPCTo(endTime + 1);

    totalSupply.should.be.bignumber.equal(await token.totalSupply());
    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Should end with max token supply reached
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(maxTotalSupply, await token.totalSupply());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );

    // Check that weiRaised is in vault address
    walletInicialETH.add(weiRaised).sub(presaleWei).should.be.bignumber
      .equal(await web3.eth.getBalance(wallet));

    // Unpause token from team wallet
    await token.unpause({ from: teamWallet });
    assert.equal(false, await token.paused());
  });

  it('Should execute a crowdsale succesfully reaching max capand closing the vault before finalize', async function () {
    let weiRaised = new BigNumber(0);
    let presaleWei = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);
    const walletInicialETH = await web3.eth.getBalance(wallet);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    // Check crowdsale values
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    minFunding.should.be.bignumber.equal(await crowdsale.minFunding());
    mediumFunding.should.be.bignumber.equal(await crowdsale.mediumFunding());
    rate.should.be.bignumber.equal(await crowdsale.rate());
    maxICOSupply.should.be.bignumber.equal(await crowdsale.maxICOSupply());
    assert.equal(wallet, await crowdsale.wallet());
    assert.equal(true, await token.paused());

    // Should allow add crowdsale tokens before ICO
    await crowdsale.addPresaleTokens(
      [accounts[5], accounts[6]],
      [web3.toWei(1000, 'ether'), web3.toWei(500, 'ether')],
      30000
    );

    totalSupply = totalSupply.add(web3.toWei(1500, 'ether') * 30000);
    weiRaised = weiRaised.add(web3.toWei(1500, 'ether'));
    presaleWei = presaleWei.add(web3.toWei(1500, 'ether'));

    // Shouldnt allow buy before start time
    await crowdsale.sendTransaction({
      value: web3.toWei(10, 'ether'),
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    await crowdsale.addToWhitelist([accounts[2]]);

    await increaseTimeTestRPCTo(startTime + 1);

    // Should allow add crowdsale tokens in ICO
    await crowdsale.addPresaleTokens(
      [accounts[5]], [web3.toWei(1000, 'ether')], 30000
    );
    totalSupply = totalSupply.add(web3.toWei(1000, 'ether') * 30000);
    weiRaised = weiRaised.add(web3.toWei(1000, 'ether'));
    presaleWei = presaleWei.add(web3.toWei(1000, 'ether'));

    await crowdsale.sendTransaction({
      value: web3.toWei(7500),
      from: accounts[2],
    });

    new BigNumber(web3.toWei(7500))
      .should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    await crowdsale.closeVault();

    new BigNumber(web3.toWei(0))
      .should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    // Buy all tokens
    let weiSent = new BigNumber(web3.toWei(47500));
    await crowdsale.sendTransaction({
      value: web3.toWei(15000),
      from: accounts[2],
    });
    await crowdsale.sendTransaction({
      value: web3.toWei(25000),
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    const remainingWei = maxICOSupply.sub(await token.totalSupply()).div(rate);
    const buyerTokenBalance = new BigNumber(web3.toWei(7500)).mul(rate.mul(1.15))
      .add(new BigNumber(web3.toWei(15000)).mul(rate.mul(1.10)))
      .add(new BigNumber(web3.toWei(25000)).mul(rate.mul(1.05)))
      .add(remainingWei.mul(rate));

    await crowdsale.sendTransaction({
      value: remainingWei,
      from: accounts[2],
    });

    totalSupply = totalSupply.add(buyerTokenBalance);
    totalSupply.should.be.bignumber.equal(await token.totalSupply());
    weiRaised = weiRaised.add(remainingWei);
    maxICOSupply.should.be.bignumber.equal(await token.totalSupply());
    buyerTokenBalance.should.be.bignumber.equal(await token.balanceOf(accounts[2]));

    // Shouldnt allow buy once cap is reached
    await crowdsale.sendTransaction({
      value: 1,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    await increaseTimeTestRPCTo(endTime + 1);

    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Should end with max token supply reached
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(maxTotalSupply, await token.totalSupply());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[8].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );

    // Check that weiRaised is in vault address
    walletInicialETH.add(weiRaised).sub(presaleWei).should.be.bignumber
      .equal(await web3.eth.getBalance(wallet));

    // Unpause token from team wallet
    await token.unpause({ from: teamWallet });
    assert.equal(false, await token.paused());
  });

  it('Should execute a crowdsale succesfully reaching min cap with crowdsale tokens', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    // Should allow add crowdsale tokens before ICO
    await crowdsale.addPresaleTokens(
      [accounts[5], accounts[6]],
      [web3.toWei(1000, 'ether'), web3.toWei(500, 'ether')],
      30000
    );
    totalSupply = totalSupply.add(web3.toWei(1500, 'ether') * 30000);
    weiRaised = weiRaised.add(web3.toWei(1500, 'ether'));

    // Shouldnt allow buy before start time
    await crowdsale.sendTransaction({
      value: web3.toWei(10, 'ether'),
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy tokens
    let weiSent = new BigNumber(web3.toWei(8500));
    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(new BigNumber(web3.toWei(8500)).mul(rate.mul(1.15)));
    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    await increaseTimeTestRPCTo(endTime + 1);

    // Shouldnt allow buy once ico is finished
    await crowdsale.addPresaleTokens(
      [accounts[5]], [web3.toWei(1000, 'ether')], 30000
    ).should.be.rejectedWith('revert');

    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Check token supply
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );
  });

  it('Should execute a crowdsale succesfully reaching medium cap with crowdsale tokens', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy tokens
    let weiSent = new BigNumber(web3.toWei(26000));
    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(new BigNumber(web3.toWei(10000)).mul(rate.mul(1.15)));
    totalSupply = totalSupply.add(new BigNumber(web3.toWei(15000)).mul(rate.mul(1.10)));
    totalSupply = totalSupply.add(new BigNumber(web3.toWei(1000)).mul(rate.mul(1.05)));
    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    await increaseTimeTestRPCTo(endTime + 1);

    // Shouldnt allow buy after ICO ends
    await crowdsale.sendTransaction({
      value: 1,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Check token supply
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );
  });

  it('Should execute a crowdsale succesfully between min and medium cap with crowdsale tokens instantly', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const wallet = accounts[1];
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy tokens
    let weiSent = new BigNumber(web3.toWei(11000));
    let tokensToBuy = new BigNumber(web3.toWei(10000)).mul(rate.mul(1.15))
      .add(new BigNumber(web3.toWei(1000)).mul(rate.mul(1.10)));

    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(tokensToBuy);
    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    await crowdsale.sendTransaction({
      value: 100,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(100);
    totalSupply = totalSupply.add(new BigNumber(100).mul(rate.mul(1.10)));
    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    await increaseTimeTestRPCTo(endTime + 1);

    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Check token supply
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );
  });

  it('Should execute a crowdsale succesfully between medium and high cap with crowdsale tokens instantly', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const wallet = accounts[1];
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy tokens
    let weiSent = new BigNumber(web3.toWei(26000));
    let tokensToBuy = new BigNumber(web3.toWei(10000)).mul(rate.mul(1.15))
      .add(new BigNumber(web3.toWei(15000)).mul(rate.mul(1.10)))
      .add(new BigNumber(web3.toWei(1000)).mul(rate.mul(1.05)));

    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(tokensToBuy);
    totalSupply.should.be.bignumber.equal(await token.totalSupply());

    await increaseTimeTestRPCTo(endTime + 1);

    weiRaised.should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    const finalizeTX = await crowdsale.finalize();

    new BigNumber(0).should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Check token supply
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );
  });

  it('Should execute a crowdsale succesfully reaching max cap with crowdsale tokens instantly', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const wallet = accounts[1];
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy all tokens
    let weiSent = new BigNumber(web3.toWei(10000));
    let tokensToBuy = new BigNumber(web3.toWei(10000)).mul(rate.mul(1.15));

    weiSent = weiSent.add(web3.toWei(15000));
    tokensToBuy = tokensToBuy.add(new BigNumber(web3.toWei(15000)).mul(rate.mul(1.10)));

    weiSent = weiSent.add(web3.toWei(25000));
    tokensToBuy = tokensToBuy.add(new BigNumber(web3.toWei(25000)).mul(rate.mul(1.05)));

    weiSent = weiSent.add(maxICOSupply.sub(tokensToBuy).div(rate));
    tokensToBuy = tokensToBuy.add(maxICOSupply.sub(tokensToBuy));

    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(tokensToBuy);
    tokensToBuy.should.be.bignumber.equal(await token.totalSupply());

    await increaseTimeTestRPCTo(endTime + 1);

    const finalizeTX = await crowdsale.finalize();

    // Add extra 18% of issued tokens
    totalSupply = totalSupply.add(
      totalSupply.mul(219512195122).div(1000000000000)
    );

    // Check token supply
    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
    assertApprox(totalSupply, await token.totalSupply());
    assertApprox(totalSupply.mul(0.12), await token.balanceOf(fsnasWallet));
    assert.equal(teamWallet, await token.owner());

    // Check vested team tokens
    const VestedTokensEvent = abiDecoder.decodeLogs(finalizeTX.receipt.logs)[9].events;
    assertApprox(
      totalSupply.mul(6).div(100).div(2),
      await token.balanceOf(VestedTokensEvent[0].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[1].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[2].value)
    );
    assertApprox(
      totalSupply.mul(6).div(100).div(2).div(3),
      await token.balanceOf(VestedTokensEvent[3].value)
    );
  });

  it('Should allow token refunds if crowdsale fails', async function () {
    let weiRaised = new BigNumber(0);
    let totalSupply = new BigNumber(0);
    const wallet = accounts[1];
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const token = FNTToken.at(await crowdsale.token());

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2]]);

    // Buy some tokens
    let weiSent = new BigNumber(web3.toWei(5000));
    await crowdsale.sendTransaction({
      value: weiSent,
      from: accounts[2],
    });
    weiRaised = weiRaised.add(weiSent);
    totalSupply = totalSupply.add(weiSent.mul(rate.mul(1.15)));
    totalSupply.should.be.bignumber.equal(await token.totalSupply());
    weiRaised.should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    await increaseTimeTestRPCTo(endTime + 1);

    await crowdsale.finalize();

    const previousBalance = await web3.eth.getBalance(accounts[2]);

    await crowdsale.claimRefund({ from: accounts[2], gasPrice: 0 });

    new BigNumber(0)
      .should.be.bignumber.equal(await web3.eth.getBalance(await crowdsale.vault()));

    // Check claimed balance received
    new BigNumber(previousBalance).add(web3.toWei(5000))
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[2]));
  });

  it('Should fail adding more presale tokens than max supply', async function () {
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    const presaleRate = 100000;
    const weiSent = maxTotalSupply.div(presaleRate).add(1);

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addPresaleTokens(
      [accounts[5]], [weiSent], presaleRate
    ).should.be.rejectedWith('revert');
  });

  it('Should fail when buying tokens from not whitelisted address', async function () {
    let weiRaised = new BigNumber(0);
    const startTime = latestTime() + duration.days(1);
    const endTime = latestTime() + duration.days(2);

    let crowdsale = await FNTCrowdsale.new(
      startTime, endTime, rate, minFunding, mediumFunding, highFunding, wallet,
      maxTotalSupply, teamWallet, fsnasWallet
    );

    await increaseTimeTestRPCTo(startTime + 1);

    await crowdsale.addToWhitelist([accounts[2], accounts[3]]);
    await crowdsale.removeFromWhitelist([accounts[2]]);

    assert.equal(true, await crowdsale.whitelist(accounts[3]));

    await crowdsale.sendTransaction({
      value: 100,
      from: accounts[3],
    });

    weiRaised = weiRaised.add(100);
    await crowdsale.sendTransaction({
      value: 100,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    weiRaised.should.be.bignumber.equal(await crowdsale.weiRaised());
  });
});
