import { getBlockByHash } from './api/blockHeader'

const express = require('express')

const app = express()

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
        const block_details = await getBlockByHash(hash)
        // console.log("r: ", r);

        res.send(
            JSON.stringify({ status: '200', fromCache, data: block_details })
        )
    }
)
