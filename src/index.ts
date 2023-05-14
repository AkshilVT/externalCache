import {
    getBlockByHash,
    getBlockByNumber,
    getEthCall,
    getTransactionByHash,
    writeBlockByNumber,
    writeEthCall,
} from './api/dataQuery'
import { ethcallINFURA, getBlockByNumberFromINFURA } from './api/infuraQuery'
const bodyParser = require('body-parser')

const express = require('express')

const app = express()

// Set up body-parser middleware to parse JSON-RPC requests
app.use(bodyParser.json())
// Middleware function to log incoming requests
// app.use((req: {
//     body(body: any): unknown; method: any; path: any;
// }, res: any, next: () => void) => {
//   console.log(`Method: ${req.method} Path: ${req.path}`);
//   console.log(req.body);
//   next();
// });

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

// get blockheader
app.get('/', async (req: any, res: { send: (arg0: string) => void }) => {
    const request = req.body
    console.log('request: ', request)

    res.send(JSON.stringify({ status: '200', data: 'Hello World!' }))
})

app.post('/', async (req: any, res: { send: (arg0: string) => void }) => {
    const request = req.body
    // console.log('request: ', request)
    console.log(
        'Request got from: ',
        req.header('x-forwarded-for') || req.connection.remoteAddress
    )

    /*-----------------------------------------------------------------
                ETH_GETBLOCKBYNUMBER
    ------------------------------------------------------------------*/
    if (request.method === 'eth_getBlockByNumber') {
        try {
            // Check if the block is in the cache
            const cacheResults = await redisClient.get(
                request.method + request.params[0]
            )
            // If the block is in the cache, return the cached block
            if (cacheResults) {
                console.log('cache hit')
                res.send(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: JSON.parse(cacheResults),
                    })
                )
            }
            // If the block is not in the cache, get the block from the database and return it
            else {
                console.log('cache miss')
                const block_number = parseInt(request.params[0], 16)
                let block_details: string[]
                try {
                    block_details = (await getBlockByNumber(
                        block_number
                    )) as string[]
                } catch (error) {
                    block_details = []
                    console.log(error)
                }

                if (block_details.length !== 0) {
                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: block_details[0],
                        })
                    )
                    // Write the block into the cache
                    const key = request.method + request.params[0]
                    console.log(
                        'Write into Cache: ',
                        await redisClient.set(
                            key,
                            JSON.stringify(block_details[0])
                        )
                    )
                } else {
                    // If the block is not in the database, fetch from INFURA
                    console.log('fetch from INFURA')
                    const block_number = parseInt(request.params[0], 16)
                    const block = await getBlockByNumberFromINFURA(block_number)
                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: block,
                        })
                    )
                    // Write the block into the cache
                    const key = request.method + request.params[0]
                    console.log(
                        'Write into Cache: ',
                        await redisClient.set(key, JSON.stringify(block))
                    )

                    // Write the block into the database
                    const db_write = await writeBlockByNumber(block)
                    console.log('Write into DB: ', db_write)
                }
            }
        } catch (error) {
            console.log(error)
        }
    } else if (request.method === 'eth_call') {
        /*-----------------------------------------------------------------
    ETH_CALL
    ------------------------------------------------------------------*/
        console.log('eth_call')
        // check if the contract address is in the cache
        try {
            let resSend = false
            const cacheResults = await redisClient.get(request.params[0].to)
            // console.log('cacheResults: ', cacheResults)

            if (cacheResults) {
                // console.log(JSON.parse(cacheResults)[request.params[0].data])
                if (JSON.parse(cacheResults)[request.params[0].data]) {
                    console.log('cache hit')
                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: JSON.parse(cacheResults)[
                                request.params[0].data
                            ],
                        })
                    )
                    resSend = true
                }
            }
            // check if contract and data are in db
            if (!resSend) {
                console.log('cache miss')

                const dbResults: any = await getEthCall(
                    request.params[0].to,
                    request.params[0].data
                )
                // console.log('dbResults: ', dbResults[0]['callresult'])
                if (dbResults.length === 1) {
                    console.log('db hit')
                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: dbResults[0]['callresult'],
                        })
                    )
                    resSend = true

                    // write into cache
                    const key = request.params[0].to
                    const cacheKey = request.params[0].data
                    let cacheObj = await redisClient.get(key)
                    if (!cacheObj) {
                        cacheObj = {}
                        cacheObj[cacheKey] = dbResults[0]['callresult']
                    } else {
                        cacheObj = JSON.parse(cacheObj)
                        cacheObj[cacheKey] = dbResults[0]['callresult']
                    }
                    console.log(
                        'Write into Cache: ',
                        await redisClient.set(key, JSON.stringify(cacheObj))
                    )
                } else {
                    console.log('db miss')
                    const resultINFURA = await ethcallINFURA(
                        request.params[0].to,
                        request.params[0].data
                    )

                    // write into cache
                    const key = request.params[0].to
                    const cacheKey = request.params[0].data
                    let cacheObj = await redisClient.get(key)
                    if (!cacheObj) {
                        cacheObj = {}
                        cacheObj[cacheKey] = resultINFURA
                    } else {
                        cacheObj = JSON.parse(cacheObj)
                        cacheObj[cacheKey] = resultINFURA
                    }
                    console.log(
                        'Write into Cache: ',
                        await redisClient.set(key, JSON.stringify(cacheObj))
                    )

                    // write into db
                    const db_write = await writeEthCall(
                        request.params[0].to,
                        request.params[0].data,
                        resultINFURA
                    )
                    console.log('Write into DB: ', db_write)

                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: resultINFURA,
                        })
                    )
                }
            }
        } catch (error) {
            res.send(
                JSON.stringify({
                    jsonrpc: '2.0',
                    id: request.id,
                    result: null,
                })
            )
            console.log(error)
        }
    } else {
        /*-----------------------------------------------------------------
                ELSE
    ------------------------------------------------------------------*/
        res.send(
            JSON.stringify({ jsonrpc: '2.0', id: request.id, result: null })
        )
    }
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
