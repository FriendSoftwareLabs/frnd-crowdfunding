module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
    },
    testrpc: {
      host: 'localhost',
      port: 8546,
      network_id: '*',
      from: "0xabcdef1bd6185d885d8fae822dfa7ab970e1217c",
      gas:4700000
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '*',
    },
    ropsten: {
      host: '192.168.2.143',
      port: 8545,
      network_id: '*',
      from: "0x4085bd2D0D0E9c4d3eB8739C1C7FaED9fe06dE26"
    },  
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};