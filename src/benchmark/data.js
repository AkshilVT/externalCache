const Web3 = require('web3')
const fs = require('fs')

const provider = new Web3.providers.HttpProvider('http://localhost:4000/')
const web3 = new Web3(provider)

async function getBlock(blockNumber, startTime) {
    try {
        const block = await web3.eth.getBlock(blockNumber)
        const endTime = new Date()
        const elapsed = endTime - startTime
        console.log(elapsed)
        // console.log('Block:', block);

        fs.appendFileSync('blockNumberSERVER.csv', `${elapsed}\n`, (err) => {
            if (err) throw err
            console.log('Time written to file.')
        })
    } catch (error) {
        console.error('An error occurred:', error)
    }
}

// fs.writeFile('time.txt', '', (err) => {
//     if (err) throw err;
// });

const min = 1 // minimum value for the range
const max = 3483393 // maximum value for the range

for (let i = 0; i < 100; ++i) {
    let randomInt = Math.floor(Math.random() * (max - min + 1)) + min
    setTimeout(() => {
        // console.log(randomInt)
        const startTime = new Date()
        getBlock(randomInt, startTime)
    }, 50)
}
