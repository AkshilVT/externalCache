import { getBlockByHash, getTransactionByHash } from './api/dataQuery'
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

// const request = require('request');
// request('http://www.google.com', function (error: any, response: { statusCode: number; }, body: any) {
//   if (!error && response.statusCode == 200) {
//     console.log(body); // Print the google web page.
//   }
// });

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
    if (request.method === 'eth_getBlockByNumber') {
        console.log(
            'Request got from: ',
            req.header('x-forwarded-for') || req.connection.remoteAddress
        )
        if (request.params[0] == '0x1') {
            res.send(
                JSON.stringify({
                    jsonrpc: '2.0',
                    id: request.id,
                    result: {
                        baseFeePerGas: 875000000,
                        difficulty: '131072',
                        extraData: '0x',
                        miner: '0x2f14582947E292a2eCd20C430B46f2d27CFE213c',
                        mixHash:
                            '0xcd039d5508e92723db0f078b5205da89144e3a6fee3a34124c966f53c35ce42c',
                        nonce: '0xc7faaf72b4568480',
                        number: 1,
                        parentHash:
                            '0x25a5cc106eea7138acab33231d7160d69cb777ee0c2c553fcddf5138993e6dd9',
                        receiptsRoot:
                            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
                        sha3Uncles:
                            '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
                        size: 517,
                        stateRoot:
                            '0xc91d4ecd59dce3067d340b3aadfc0542974b4fb4db98af39f980a91ea00db9dc',
                        timestamp: 1634951226,
                        totalDifficulty: '262144',
                        transactions: [],
                        transactionsRoot:
                            '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
                        uncles: [],
                    },
                })
            )
        } else {
            res.send(
                JSON.stringify({ jsonrpc: '2.0', id: request.id, result: null })
            )
        }
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
