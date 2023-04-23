import Web3 from 'web3'
import { readFile } from 'fs/promises'
const Token = JSON.parse(
    await readFile(new URL('./Token.json', import.meta.url))
)
import dotenv from 'dotenv'
dotenv.config()
async function sample() {
    // console.log(process.env.INFURA_API_KEY)
    const network = process.env.ETHEREUM_NETWORK
    const web3 = new Web3(`http://www.localhost:4000/`)

    // const web3 = new Web3(
    //     new Web3.providers.WebsocketProvider(
    //         `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
    //     )
    // )

    // Contract.setProvider(
    //     `wss://${network}.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
    // )
    // web3.eth.Contract.setProvider(`https://www.localhost:4000/`)
    // Contract.setProvider(`https://www.localhost:4000/`)

    // console.log(
    //     web3.eth.accounts.privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY)
    // )

    var contract = new web3.eth.Contract(
        Token,
        '0x1E8C104D068F22D351859cdBfE41A697A98E6EA2'
    )
    console.log(
        'mint:',
        await contract.methods
            .minters('0x4284890d4AcD0bcb017eCE481B96fD4Cb457CAc8')
            .call()
    )
    console.log(
        'bal:',
        await contract.methods
            .balanceOf('0x4284890d4AcD0bcb017eCE481B96fD4Cb457CAc8')
            .call()
    )

    const data = web3.eth.abi.encodeFunctionCall(
        {
            name: 'balanceOf',
            type: 'function',
            inputs: [
                { internalType: 'address', name: 'minter', type: 'address' },
            ],
        },
        ['0x4284890d4AcD0bcb017eCE481B96fD4Cb457CAc8']
    )
    console.log(
        'call:',
        await web3.eth.call({
            to: '0x1E8C104D068F22D351859cdBfE41A697A98E6EA2',
            data: data,
        })
    )

    // web3.eth
    //     .call({
    //         from: '0x64436CeA8886a5E19211E620753E735B7AA43A40',
    //         to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
    //         gas: '0x76c0',
    //         gasPrice: '0x9184e72a000',
    //         value: '0x9184e72a',
    //         data: '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
    //     })
    //     .then(console.log)
    //     .catch(console.error)
}
sample()
