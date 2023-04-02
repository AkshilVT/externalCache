import { getBlockByHash, getTransactionByHash } from './api/dataQuery'

const express = require('express')

const app = express()

const redis = require('redis')
let redisClient: {
    set(hash: any, arg1: string): unknown
    on: (arg0: string, arg1: (error: any) => void) => void
    connect: () => any
    get: (arg0: any) => any
}
;(async () => {
    redisClient = redis.createClient()

    redisClient.on('error', (error: any) => console.error(`Error : ${error}`))

    await redisClient.connect()
})()

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// const request = require('request');
// request('http://www.google.com', function (error: any, response: { statusCode: number; }, body: any) {
//   if (!error && response.statusCode == 200) {
//     console.log(body); // Print the google web page.
//   }
// });

// get blockheader
app.get('/', async (req: any, res: { send: (arg0: string) => void }) => {
    const hash = req.query.hash

    const block_details = await getBlockByHash(hash)
    // console.log("r: ", r);

    res.send(JSON.stringify({ status: '200', data: block_details }))
})

app.get(
    '/blockHash/:hash',
    async (req: any, res: { send: (arg0: string) => void }) => {
        const hash = req.params.hash
        let fromCache = false

        try {
            const cacheResults = await redisClient.get(hash)
            let block_details: string[]
            if (cacheResults) {
                fromCache = true
                block_details = (await getBlockByHash(hash)) as string[]
            } else {
                block_details = (await getBlockByHash(hash)) as string[]
                if (block_details.length === 0) {
                    throw 'API returned an empty array'
                }
                await redisClient.set(hash, JSON.stringify(block_details))
            }
            // console.log("r: ", r);

            res.send(
                JSON.stringify({
                    status: '200',
                    fromCache,
                    data: block_details,
                })
            )
        } catch {
            res.send(JSON.stringify({ status: '404', data: 'Not found' }))
        }
    }
)

app.get(
    '/txHash/:hash',
    async (req: any, res: { send: (arg0: string) => void }) => {
        const hash = req.params.hash
        let fromCache = false

        try {
            const cacheResults = await redisClient.get(hash)
            let tx_details: string[]
            if (cacheResults) {
                fromCache = true
                tx_details = (await getTransactionByHash(hash)) as string[]
            } else {
                tx_details = (await getTransactionByHash(hash)) as string[]
                if (tx_details.length === 0) {
                    throw 'API returned an empty array'
                }
                await redisClient.set(hash, JSON.stringify(tx_details))
            }
            // console.log("r: ", r);

            res.send(
                JSON.stringify({
                    status: '200',
                    fromCache,
                    data: tx_details,
                })
            )
        } catch {
            res.send(JSON.stringify({ status: '404', data: 'Not found' }))
        }
    }
)
