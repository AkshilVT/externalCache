import Web3 from 'web3'
import { readFile, writeFile } from 'fs/promises'
import dotenv from 'dotenv'
dotenv.config()

async function benchmark() {
    const network = process.env.ETHEREUM_NETWORK
    const web3 = new Web3(`http://localhost:4000/`)

    // const web3 = new Web3(
    //     new Web3.providers.WebsocketProvider(
    //         `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
    //     )
    // )
    // const web3 = new Web3(
    //     new Web3.providers.HttpProvider(
    //         `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
    //     )
    // )

    // const max_v = await web3.eth.getBlockNumber()
    const max_v = 3484214
    console.log(max_v)
    for (let i = 0; i < 100; i++) {
        let start = Date.now()
        const bal = await web3.eth.getBlock(getRandomItem(max_v))
        // const bal = await getRandomItem(contracts)
        //     .methods.balanceOf(getRandomItem(addresses))
        //     .call()
        let end = Date.now()
        writeFile('blockNumberSERVER.csv', `${end - start}\n`, {
            flag: 'a',
        })
        console.log('time:', end - start)
    }
    return process.exit(0)
}

benchmark()

// program to get a random item from an array

function getRandomItem(max_value) {
    // get random index value
    const randomIndex = Math.floor(Math.random() * max_value)

    console.log('i:', randomIndex)

    return randomIndex
}
