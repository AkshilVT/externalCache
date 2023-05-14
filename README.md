# externalCache
Creating an External Caching application which reads data from a Full Node. Ethereum.

## Problem Statement
### Querying Blockchain is SLOW
Create a caching layer at RPC for data queries from smart contract, the cache should be updated when write transactions are processed by the Node. Two possible ways to do this:

 - Caching at RPC layer inside of a Node and an outside load balancer which directs calls to proper load balancer where cached data might be available
 - Implement a caching layer outside of Node, which encapsulates all RPC calls and caches data. (Basically receives calls, processes it in some way, calls an RPC internally, gets output, processes it in some way, sends data back to caller)

**Problem**: Querying blockchain data can be slow

**Solution**: Increase data availability and speed up queries.

***This repository focuses on the second solution.***

## Initial Architecture
![image](https://user-images.githubusercontent.com/75160883/233833382-29af7063-2a41-4f0e-8c5b-61428c291a2b.png)

### TechStack
 - Permanent database - PostgresSQL
 - Caching layer - Redis (In memory key value store)
 - Server - Express
 - Language - Typescript
 - Linting - ESLint
 - Formatting - Prettier
 
 ### Working
 We would provide a HTTP url, this will act as a HTTPProvider in web3.js/ether.js. This would be client side. People can use this url to get in touch with blockchain network.
 ```Javascript
      const web3 = new Web3(new Web3.providers.HttpProvider('HTTP_URL'))
```
When the user calls any function. The call will go to the server and will be processed in the following manner - 
 - First the call will be scanned thorugh cache layer(Redis), if there is any data in cache &#8594; return data.
 - Second the call will be scanned through the database(Postgres), if there is any data in db &#8594; return data and write in cache.
 - Lastly the call will be made to a full node which will give us the data and will write that in cace and db.
 
 One more layer is working in the background that is the subscription layer to the blockchain network. This layer periodically fetches data from blockchain network and stores it in the database.
 
 ## Setup
 1. Clone the repository
 2. Use your favourite package manager to install dependencies ```npm i``` or ```yarn``` or ```pnpm i```
 3. To start the server you can use ```pnpm start```
 4. To start the subscription layer use ```pnpm subs```
 
 **Note:** All JS and TS files in this repo (expect api/*.ts, indes.ts, subscription.ts) are used for testing this server.
