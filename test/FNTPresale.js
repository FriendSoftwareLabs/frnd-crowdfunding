
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const latestTime = require('./helpers/latestTime');
const { duration, increaseTimeTestRPCTo } = require('./helpers/increaseTime');

var FNTPresale = artifacts.require('./FNTPresale.sol');

contract('FNT Presale', function (accounts) {
  it('Should execute a presale succesfully reaching max cap', async function () {
    let weiRaised = new BigNumber(0);
    const maxCap = web3.toWei(10, 'ether');
    const wallet = accounts[1];
    const initialWalletBalance = await web3.eth.getBalance(accounts[1]);
    const endTime = await latestTime() + duration.days(5);
    const rate = 24000;

    let presale = await FNTPresale.new(
      maxCap, rate, endTime, wallet
    );

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    assert.equal(maxCap, await presale.maxCap());
    assert.equal(rate, await presale.rate());
    assert.equal(wallet, await presale.wallet());
    assert.equal(true, await presale.paused());

    // Unpause the presale

    await presale.unpause({ from: accounts[0] });

    assert.equal(false, await presale.paused());

    // Send some ETH and test the forwarding to the wallet address

    const contributionTX = await presale.sendTransaction({
      value: web3.toWei(1.5, 'ether'),
      from: accounts[2],
    });

    // Check tokens issued in event
    contributionTX.logs[0].args.tokensIssued
      .should.be.bignumber.equal(web3.toWei(1.5, 'ether') * rate);

    weiRaised = weiRaised.plus(web3.toWei(1.5, 'ether'));

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));

    // Pause the presale and dont allow to receive ETH

    await presale.pause({ from: accounts[0] });

    await presale.sendTransaction({
      value: web3.toWei(1.5, 'ether'),
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));

    //  Unpause it and dont allow to receive more than max cap

    await presale.unpause({ from: accounts[0] });

    await presale.sendTransaction({
      value: web3.toWei(8.5, 'ether') + 1,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));

    // Send ETH to reach max cap

    await presale.sendTransaction({
      value: web3.toWei(8.5, 'ether'),
      from: accounts[2],
    });

    weiRaised = weiRaised.plus(web3.toWei(8.5, 'ether'));

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));

    // Dont allow to receive more ETH after max cap reached
    await presale.sendTransaction({
      value: 1,
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));
  });

  it('Should execute a presale succesfully reaching end time', async function () {
    let weiRaised = new BigNumber(0);
    const maxCap = web3.toWei(10, 'ether');
    const wallet = accounts[1];
    const initialWalletBalance = await web3.eth.getBalance(accounts[1]);
    const endTime = latestTime() + duration.days(5);
    const rate = 24000;

    let presale = await FNTPresale.new(
      maxCap, rate, endTime, wallet
    );

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    assert.equal(maxCap, await presale.maxCap());
    assert.equal(rate, await presale.rate());
    assert.equal(wallet, await presale.wallet());
    assert.equal(true, await presale.paused());

    // Unpause the presale

    await presale.unpause({ from: accounts[0] });

    assert.equal(false, await presale.paused());

    // Send some ETH and test the forwarding to the wallet address

    await presale.sendTransaction({
      value: web3.toWei(7, 'ether'),
      from: accounts[2],
    });

    weiRaised = weiRaised.plus(web3.toWei(7, 'ether'));

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));

    // Reach end time of the presale and dont reject ETH

    await increaseTimeTestRPCTo(endTime);

    await presale.sendTransaction({
      value: web3.toWei(1.5, 'ether'),
      from: accounts[2],
    }).should.be.rejectedWith('revert');

    weiRaised.should.be.bignumber.equal(await presale.weiRaised());
    initialWalletBalance.plus(weiRaised)
      .should.be.bignumber.equal(await web3.eth.getBalance(accounts[1]));
  });
});
