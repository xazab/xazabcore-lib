# Xazabcore Library

[![NPM Version](https://img.shields.io/npm/v/@xazab/xazabcore-lib)](https://www.npmjs.com/package/@xazab/xazabcore-lib)
[![Build Status](https://img.shields.io/travis/com/xazab/xazabcore-lib)](https://travis-ci.org/xazab/xazabcore-lib)
[![Release Date](https://img.shields.io/github/release-date/xazab/xazabcore-lib)](https://github.com/xazab/xazabcore-lib/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen)](https://github.com/RichardLitt/standard-readme)

A pure and powerful JavaScript Xazab library.

Xazab is a powerful new peer-to-peer platform for the next generation of financial technology. The decentralized nature of the Xazab network allows for highly resilient Xazab infrastructure, and the developer community needs reliable, open-source tools to implement Xazab apps and services.

## Table of Contents
- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Install

### NodeJS

```
npm install @xazab/xazabcore-lib
```

### Browser

#### CDN Standalone

```html
<script src="https://unpkg.com/@xazab/xazabcore-lib"></script>
<script> 
const { PrivateKey } = xazabcore;
const privateKey = new PrivateKey();
const address = privateKey.toAddress().toString();
...
</script>
```

#### Building the Browser Bundle

To build a xazabcore-lib full bundle for the browser:

```sh
npm run build
```

This will generate a file named `xazabcore-lib.min.js` in the `dist/` folder.

## Usage

### Browser

```
<script src='./dist/xazabcore-lib.min.js' type="text/javascript"></script>
<script>
  const PrivateKey = xazabcore.PrivateKey;
  const privateKey = new PrivateKey();
  const address = privateKey.toAddress().toString();
</script>
```

### Modules

Some functionality is implemented as a module that can be installed separately:

* [Payment Protocol Support](https://github.com/xazab/xazabcore-payment-protocol)
* [Peer to Peer Networking](https://github.com/xazab/xazabcore-p2p)
* [Xazab Core JSON-RPC](https://github.com/xazab/xazabd-rpc)
* [Mnemonics](https://github.com/xazab/xazabcore-mnemonic)
* [Elliptical Curve Integrated Encryption Scheme](https://github.com/xazab/bitcore-ecies-xazab)
* [Signed Messages](https://github.com/xazab/bitcore-message-xazab)

### Development & Tests

```sh
git clone https://github.com/xazab/xazabcore-lib
cd xazabcore-lib
npm install
```

Run all the tests:

```sh
npm test
```

You can also run just the Node.js tests with `npm run test:node`, just the browser tests with `npm run test:browser` or run a test coverage report with `npm run coverage`.

## Documentation

### Concepts

* [Addresses](docs/core-concepts/address.md)
* [Block](docs/core-concepts/block.md)
* [Crypto](docs/core-concepts/crypto.md)
* [Encoding](docs/core-concepts/encoding.md)
* [Hierarchically-derived Private and Public Keys](docs/core-concepts/hierarchical.md)
* [Mnemonic](docs/core-concepts/mnemonic.md)
* [Networks](docs/core-concepts/networks.md)
* [PrivateKey](docs/core-concepts/privatekey.md)
* [PublicKey](docs/core-concepts/publickey.md)
* [Script](docs/core-concepts/script.md)
* [Transaction](docs/core-concepts/transaction.md)
* [Using Different Units](docs/core-concepts/unit.md)
* [Unspent Output](docs/core-concepts/unspentoutput.md)
* [URI](docs/core-concepts/uri.md)
* [Governance Object / Proposal](docs/core-concepts/govobject/govobject.md)

### How To Use

* [Addresses](docs/usage/address.md)
* [Block](docs/usage/block.md)
* [BlockHeader](docs/usage/blockheader.md)
* [Hierarchically-derived Private Key](docs/usage/hdprivatekey.md)
* [Hierarchically-derived Public Key](docs/usage/hdpublickey.md)
* [Message](docs/usage/message.md)
* [Mnemonic](docs/usage/mnemonic.md)
* [Opcode](docs/usage/opcode.md)
* [PrivateKey](docs/usage/privatekey.md)
* [PublicKey](docs/usage/publickey.md)
* [Script](docs/usage/script.md)
* [Transaction](docs/usage/transaction.md)
* [Transaction Iput](docs/usage/transaction_input.md)
* [Transaction Output](docs/usage/transaction_output.md)
* [URI](docs/usage/uri.md)

### Use Case Examples

Some examples can be found [here](docs/examples.md), below is a list of direct links for some of them.

* [Generate a random address](docs/examples.md#generate-a-random-address)
* [Generate an address from a SHA256 hash](docs/examples.md#generate-an-address-from-a-sha256-hash)
* [Import an address via WIF](docs/examples.md#import-an-address-via-wif)
* [Create a Transaction](docs/examples.md#create-a-transaction)
* [Sign a Xazab message](docs/examples.md#sign-a-bitcoin-message)
* [Verify a Xazab message](docs/examples.md#verify-a-bitcoin-message)
* [Create an OP RETURN transaction](docs/examples.md#create-an-op-return-transaction)
* [Create a 2-of-3 multisig P2SH address](docs/examples.md#create-a-2-of-3-multisig-p2sh-address)
* [Spend from a 2-of-2 multisig P2SH address](docs/examples.md#spend-from-a-2-of-2-multisig-p2sh-address)

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/xazab/xazabcore-lib/blob/master/CONTRIBUTING.md) file.

## License

Code released under [the MIT license](LICENSE).

Copyright 2013-2017 BitPay, Inc. Bitcore is a trademark maintained by BitPay, Inc.  
Copyright 2016-2017 The Dash Foundation, Inc.  
Copyright 2017-2020 Dash Core Group, Inc.  
Copyright      2020 Xazab Foundation
