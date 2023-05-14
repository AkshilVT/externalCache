const Web3 = require('web3')
const { Pool } = require('pg') // Import the pg package
require('dotenv').config()

const pool = new Pool({
    user: process.env.PG_USER,
    host: 'localhost',
    database: 'externalCache',
    password: process.env.PG_PASSWORD,
    port: 5432, // Default port for Postgres
})

const redis = require('redis')
let redisClient: {
    set(hash: any, arg1: string): unknown
    on: (arg0: string, arg1: (error: any) => void) => void
    connect: () => any
    get: (arg0: any) => any
    del: (arg0: any) => any
}
;(async () => {
    redisClient = redis.createClient()

    redisClient.on('error', (error: any) => console.error(`Error : ${error}`))

    await redisClient.connect()
})()

export default async function blockSubs() {
    // Configuring the connection to an Ethereum node
    const network = process.env.ETHEREUM_NETWORK
    const web3 = new Web3(
        new Web3.providers.WebsocketProvider(
            `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
        )
    )

    var subscription = web3.eth
        .subscribe('newBlockHeaders', function (error: any, blockHeader: any) {
            if (!error) {
                // Retrieving all blocks transactions
                console.log('Retrieving all blocks transactions')
                web3.eth.getBlock(
                    blockHeader.hash,
                    true,
                    (err: any, block: any) => {
                        if (err) {
                            console.error('Error retrieving block', err.stack)
                        } else {
                            console.log(
                                'Inserted transactions: ',
                                block.transactions.length
                            )
                            const query = {
                                text: 'INSERT INTO blocks VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)',
                                values: [
                                    block.baseFeePerGas,
                                    block.difficulty,
                                    block.extraData,
                                    block.gasLimit,
                                    block.gasUsed,
                                    block.hash,
                                    block.logsBloom,
                                    block.miner,
                                    block.mixHash,
                                    block.nonce,
                                    block.number,
                                    block.parentHash,
                                    block.receiptsRoot,
                                    block.sha3Uncles,
                                    block.size,
                                    block.stateRoot,
                                    block.timestamp,
                                    block.totalDifficulty,
                                    block.transactions,
                                    block.transactionsRoot,
                                    block.uncles,
                                    block.withdrawals,
                                    block.withdrawalsRoot,
                                ],
                            }
                            pool.query(
                                query,
                                (err: { stack: any }, res: any) => {
                                    if (err) {
                                        console.error(
                                            'Error executing query',
                                            err.stack
                                        )
                                    } else {
                                        console.log(
                                            'Inserted block: ',
                                            blockHeader.number
                                        )
                                    }
                                }
                            )

                            block.transactions.forEach((tx: any) => {
                                const query = {
                                    text: 'INSERT INTO transactions (block_hash, block_number, tx_hash, tx_from, tx_to, tx_input, tx_nonce, tx_r, tx_s, tx_v) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                                    values: [
                                        tx.blockHash,
                                        tx.blockNumber,
                                        tx.hash,
                                        tx.from,
                                        tx.to,
                                        tx.input,
                                        tx.nonce,
                                        tx.r,
                                        tx.s,
                                        tx.v,
                                    ],
                                }
                                pool.query(
                                    query,
                                    (err: { stack: any }, res: any) => {
                                        if (err) {
                                            console.error(
                                                'Error executing query',
                                                err.stack
                                            )
                                        } else {
                                            // console.log(
                                            //     'Inserted transactions: ',
                                            //     tx.hash
                                            // )
                                        }
                                    }
                                )

                                // clear tx from cache (State root changes everything)
                                if (tx.from) {
                                    const TxFrom = tx.from
                                        .toString()
                                        .toLowerCase()
                                    checkCacheAndDb(TxFrom)
                                }
                                if (tx.to) {
                                    const TxTo = tx.to.toString().toLowerCase()
                                    checkCacheAndDb(TxTo)
                                }
                            })
                        }
                    }
                )
                return
            }

            console.error(error)
        })
        .on('connected', function (subscriptionId: any) {
            console.log(
                subscriptionId,
                '---------------------------',
                typeof subscriptionId
            )
        })
        .on('data', function (blockHeader: any) {
            console.log(blockHeader)
        })
        .on('error', console.error)

    // unsubscribes the subscription
    subscription.unsubscribe(function (error: any, success: any) {
        if (success) {
            console.log('Successfully unsubscribed!')
        }
    })
}
blockSubs()

// cache functions
async function checkCacheAndDb(txHash: string) {
    const cacheTx = await redisClient.get(txHash)
    // console.log('cacheTx', cacheTx, txHash);
    // console.log(await redisClient.get("0x53844f9577c2334e541aec7df7174ece5df1fcf0"));

    if (cacheTx) {
        redisClient.del(txHash)
        console.log('Deleted tx from cache')
    }

    return new Promise(function (resolve, reject) {
        pool.query(
            // 'INSERT INTO ecall (callTo, callData, callResult) VALUES ($1, $2, $3)',
            'DELETE FROM ecall WHERE callto = ($1)',
            [txHash],
            (err: { stack: any }, res: any) => {
                if (err) {
                    // console.error('Error executing query', err.stack);
                    reject(err)
                } else {
                    console.log('Deleted tx from db')
                    resolve('OK')
                }
            }
        )
    })
}
