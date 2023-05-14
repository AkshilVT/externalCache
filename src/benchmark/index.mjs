import Web3 from 'web3'
import { readFile, writeFile } from 'fs/promises'
const Token1 = JSON.parse(
    await readFile(new URL('./tokens/tDAI.json', import.meta.url))
)
const Token2 = JSON.parse(
    await readFile(new URL('./tokens/Token.json', import.meta.url))
)
const Token3 = JSON.parse(
    await readFile(new URL('./tokens/LINK.json', import.meta.url))
)
const Token4 = JSON.parse(
    await readFile(new URL('./tokens/AAVE.json', import.meta.url))
)
import dotenv from 'dotenv'
dotenv.config()

async function benchmark() {
    const network = process.env.ETHEREUM_NETWORK
    // const web3 = new Web3(`http://localhost:4000/`)

    // const web3 = new Web3(
    //     new Web3.providers.WebsocketProvider(
    //         `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
    //     )
    // )
    const web3 = new Web3(
        new Web3.providers.HttpProvider(
            `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
        )
    )

    // Contracts --------------------------------------------------------
    var contract1 = new web3.eth.Contract(
        Token1,
        '0x53844F9577C2334e541Aec7Df7174ECe5dF1fCf0'
    )
    var contract2 = new web3.eth.Contract(
        Token2,
        '0x1E8C104D068F22D351859cdBfE41A697A98E6EA2'
    )
    var contract3 = new web3.eth.Contract(
        Token3,
        '0x779877A7B0D9E8603169DdbD7836e478b4624789'
    )
    var contract4 = new web3.eth.Contract(
        Token4,
        '0x5bB220Afc6E2e008CB2302a83536A019ED245AA2'
    )

    const contracts = [contract1, contract2, contract3, contract4]
    // Addresses ---------------------------------------------------------
    const addresses = [
        '0x3d18EB26C9c9Ea3657CE4d270345516AB30D357A',
        '0x91B3136722300C0C8a9D4f45598Ca00A2C931326',
        '0x7ceB1cff2f290f0BD2B649eE07Ed467eAA690937',
        '0x4281eCF07378Ee595C564a59048801330f3084eE',
        '0x3769d87bC2f6e35F214747f8ad95ec72eEd000e9',
        '0xcADC3b2EabcB327c96126A6d49b2b3845Fd14268',
        '0x91B3136722300C0C8a9D4f45598Ca00A2C931326',
        '0xDcdeABAB36fF583578C9F313A3BD4288eaCf5eF3',
        '0xb80CF7F215288E15B7a29bcBC6b8DBbA8619968E',
        '0xD3B304653E6dFb264212f7dd427F9E926B2EaA05',
        '0x7a7a2003aB5706818458854086fB2666583be5Fa',
        '0x4284890d4AcD0bcb017eCE481B96fD4Cb457CAc8',
    ]

    for (let i = 0; i < 100; i++) {
        let start = Date.now()
        const bal = await getRandomItem(contracts)
            .methods.balanceOf(getRandomItem(addresses))
            .call()
        let end = Date.now()
        writeFile('benchmarkINFURAHttp100.csv', `${end - start}\n`, {
            flag: 'a',
        })
        console.log('bal:', bal, 'time:', end - start)
    }
    return process.exit(0)
}

benchmark()

// program to get a random item from an array

function getRandomItem(arr) {
    // get random index value
    const randomIndex = Math.floor(Math.random() * arr.length)

    // get random item
    const item = arr[randomIndex]
    // console.log(item)

    return item
}
