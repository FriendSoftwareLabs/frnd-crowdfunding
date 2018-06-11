var FNTCrowdsale = artifacts.require('./FNTCrowdsale.sol');
var FNTToken = artifacts.require('./FNTToken.sol');
var FRNDTeamAllocation = artifacts.require('./FRNDTeamAllocation.sol');


const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

module.exports = function(deployer, network) {

		var startTime = 1529046000 // GMT: Friday, June 15, 2018 7:00:00 AM
        var endTime = 1545400800; // GMT: Friday, December 21, 2018 2:00:00 PM
        
        const rate = new BigNumber(20000);
        var minFunding = new BigNumber(web3.toWei(10000, 'ether'));
        var mediumFunding = new BigNumber(web3.toWei(25000, 'ether'));
        var highFunding = new BigNumber(web3.toWei(50000, 'ether'));
        var maxTotalSupply = new BigNumber(web3.toWei(2000000000));
        

        wallet = false;
        teamAddress = false;
        FSNASAddress = false;

        //our local 1 machine blockchain
        if( network == 'testrpc' )
        {

	        startTime = Math.floor(Date.now() / 1000) + 600; // in 10mins
            endTime = Math.floor(Date.now() / 1000) + 3600*24; // in one day
        
            // TESTNET ADDRESS!!!!!!!!!!!!
            wallet = '0xbde7b0394ec9bfa6c8c3e36d2fb556bd24504634'; // multisig
            FSNASAddress = '0x83a6E0575A2A486AdF93440724b57b191EE97368';
        
        }
        else if( network == "ropsten" )
        {
                //much smaller numbers for our ropsten testing!!!
		        minFunding = new BigNumber(web3.toWei(5, 'ether'));
		        mediumFunding = new BigNumber(web3.toWei(12, 'ether'));
		        highFunding = new BigNumber(web3.toWei(15, 'ether'));
		        maxTotalSupply = new BigNumber(web3.toWei(500000)); 
                
                startTime = Math.floor(Date.now() / 1000) + 600; // in 10mins
                endTime = Math.floor(Date.now() / 1000) + ( 3600 * 24 ); // in one day
                
                wallet = "0x4f2f63065c34199a2dcadce91ec8e3a14bd6993a"; // ropsten company multisig
                FSNASAddress = "0x4f2f63065c34199a2dcadce91ec8e3a14bd6993a"; // ropsten company multisig           
        }
        else if( network == "mainnet" )
        {
	        wallet = '0xd8d3b694907a0ea26db1bc91ad4f36b3a89cb1cb'; /* gnosis multisig */
	        teamAddress = '0xece1f3ebeb98e3f2a8c81cc1e5c74715de00b6e6'; /* gnosis multisig - replaced by allocation contract that uses this for those without wallet */
	        FSNASAddress = '0x1991803a9797beb4325b74a537056e21326a4485'; /* gnosis multisig */
        }
        else
        {
                wallet = web3.eth.accounts[0];
                teamAddress = web3.eth.accounts[1];
                FSNASAddress = web3.eth.accounts[2];
        }
        
        
        deployer.deploy(FRNDTeamAllocation).then(function(){
		
			deployer.deploy(
                FNTCrowdsale, // our contract
               startTime, endTime, rate, minFunding, //all our parameters
               mediumFunding, highFunding, wallet,
               maxTotalSupply, FRNDTeamAllocation.address, FSNASAddress
			);
		
		});
         
        /*
        deployer.deploy(
                FNTCrowdsale, // our contract
               startTime, endTime, rate, minFunding, //all our parameters
               mediumFunding, highFunding, wallet,
               maxTotalSupply, teamAddress, FSNASAddress
        );*/

};