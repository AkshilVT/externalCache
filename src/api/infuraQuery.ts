const Web3 = require('web3')
require('dotenv').config()

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA_API_KEY}`
    )
)

export function getBlockByNumberFromINFURA(blockNumber: number) {
    return new Promise(function (resolve, reject) {
        web3.eth.getBlock(blockNumber, (err: any, res: any) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}
