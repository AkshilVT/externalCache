import {
    getBlockByHash,
    getBlockByNumber,
    getTransactionByHash,
} from './api/dataQuery'
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
    // const hash = req.query.hash
    const request = req.body
    console.log('request: ', request)

    // const block_details = await getBlockByHash(hash)
    // console.log("r: ", r);

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
        if (request.params[0] == '0x330614') {
            try {
                const cacheResults = await redisClient.get(
                    request.method + request.params[0]
                )
                if (cacheResults) {
                    console.log('cache hit')
                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: JSON.parse(cacheResults),
                        })
                    )
                } else {
                    console.log('cache miss')
                    const block_number = parseInt(request.params[0], 16)
                    let block_details: string[]
                    block_details = (await getBlockByNumber(
                        block_number
                    )) as string[]

                    res.send(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            id: request.id,
                            result: block_details[0],
                        })
                    )
                    const key = request.method + request.params[0]
                    console.log(
                        'Write into Cache: ',
                        await redisClient.set(
                            key,
                            JSON.stringify(block_details[0])
                        )
                    )
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            console.log(request.params[0])
            res.send(
                JSON.stringify({ jsonrpc: '2.0', id: request.id, result: null })
            )
        }
    } else if (request.method === 'eth_call') {
        /*-----------------------------------------------------------------
                ETH_CALL
    ------------------------------------------------------------------*/
        console.log('eth_call')
        if (
            request.params[0].to ===
            '0x1e8c104d068f22d351859cdbfe41a697a98e6ea2'
        ) {
            if (
                request.params[0].data ===
                '0xf46eccc40000000000000000000000004284890d4acd0bcb017ece481b96fd4cb457cac8'
            ) {
                res.send(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: '0x0000000000000000000000000000000000000000000000000000000000000001',
                    })
                )
            } else if (
                request.params[0].data ===
                '0x70a082310000000000000000000000004284890d4acd0bcb017ece481b96fd4cb457cac8'
            ) {
                res.send(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: '0x000000000000000000000000000000000000000000679b10238039c2df2aaef3',
                    })
                )
            } else {
                console.log(request.params[0].data)
                res.send(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        id: request.id,
                        result: null,
                    })
                )
            }
        } else {
            res.send(
                JSON.stringify({ jsonrpc: '2.0', id: request.id, result: null })
            )
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
