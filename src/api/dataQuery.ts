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
