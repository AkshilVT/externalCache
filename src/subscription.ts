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
                // console.log("New Block: ",blockHeader.number);

                const query = {
                    text: 'INSERT INTO blocks (block_hash, block_number, timestamp, gas_limit, gas_used, miner, transactions_root) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    values: [
                        blockHeader.hash,
                        blockHeader.number,
                        blockHeader.timestamp,
                        blockHeader.gasLimit,
                        blockHeader.gasUsed,
                        blockHeader.miner,
                        blockHeader.transactionsRoot,
                    ],
                }
                pool.query(query, (err: { stack: any }, res: any) => {
                    if (err) {
                        console.error('Error executing query', err.stack)
                    } else {
                        console.log('Inserted block: ', blockHeader.number)
                    }
                })
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
                                            console.log(
                                                'Inserted transactions: ',
                                                tx.hash
                                            )
                                        }
                                    }
                                )
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
