// ------------------------------ Postgres ------------------------------
const { Pool } = require('pg') // Import the pg package
require('dotenv').config()

const pool = new Pool({
    user: process.env.PG_USER,
    host: 'localhost',
    database: 'externalCache',
    password: process.env.PG_PASSWORD,
    port: 5432, // Default port for Postgres
})

export function getBlockByHash(blockHash: string) {
    return new Promise(function (resolve, reject) {
        pool.query(
            'SELECT * FROM blocks WHERE block_hash = $1',
            [blockHash],
            (err: { stack: any }, res: any) => {
                if (err) {
                    // console.error('Error executing query', err.stack);
                    reject(err)
                } else {
                    // console.log('Connected to Postgres at', res.rows);
                    resolve(res.rows)
                }
            }
        )
    })
    // return block;
}

export function getBlockByNumber(blockNumber: number) {
    return new Promise(function (resolve, reject) {
        pool.query(
            'SELECT * FROM blocks WHERE number = $1',
            [blockNumber],
            (err: { stack: any }, res: any) => {
                if (err) {
                    // console.error('Error executing query', err.stack);
                    reject(err)
                } else {
                    // console.log('Connected to Postgres at', res.rows);
                    resolve(res.rows)
                }
            }
        )
    })
    // return block;
}

export function writeBlockByNumber(block: any) {
    return new Promise(function (resolve, reject) {
        pool.query(
            'INSERT INTO blocks VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)',
            [
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
            (err: { stack: any }, res: any) => {
                if (err) {
                    // console.error('Error executing query', err.stack);
                    reject(err)
                } else {
                    // console.log('Connected to Postgres at', res.rows);
                    resolve('OK')
                }
            }
        )
    })
}

export function getTransactionByHash(txHash: string) {
    return new Promise(function (resolve, reject) {
        pool.query(
            'SELECT * FROM transactions WHERE tx_hash = $1',
            [txHash],
            (err: { stack: any }, res: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res.rows)
                }
            }
        )
    })
}
