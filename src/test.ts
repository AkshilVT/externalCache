const Web3 = require('web3')
require('dotenv').config()

// const web3 = new Web3(
//     new Web3.providers.HttpProvider(
//         `https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`
//     )
// )
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:4000'))

// console.log(web3);
// console.log(
//     JSON.stringify({
//         jsonrpc: '2.0',
//         id: 4088856975143886,
//         method: 'eth_getBlockByNumber',
//         params: ['0x1', false],
//     })
// )

async function getBlock() {
    const block = await web3.eth.getBlock(3343995)

    console.log(block)
}
getBlock()
