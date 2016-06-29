var bitcoin = require('bitcoinjs-lib');

var EscrowWallet = function(pubKey, options) {
  var self = this;

  function setSecondPartyPublicKey() {
    if (typeof pubKey != "string") {
      throw new Error("public key must be supplied");
    }

    self.secondPartyPubKeyBuffer = new Buffer(pubKey, 'hex');
  }

  function setNetwork() {
    if (options.network === 'testnet') {
      self.network = bitcoin.networks.testnet;
    } else {
      self.network = bitcoin.networks.mainnet
    }
  }

  function setPrivateKey() {
    if (options.wif) {
      self.keyPair = bitcoin.ECPair.fromWIF(options.wif, self.network);
    } else {
      self.keyPair = bitcoin.ECPair.makeRandom({ network: self.network });
    }
  }

  function setP2SH() {
    var pubKeys = [self.secondPartyPubKeyBuffer, self.keyPair.getPublicKeyBuffer()];
    self.redeemScript = bitcoin.script.multisigOutput(2, pubKeys);
    var scriptPubKey = bitcoin.script.scriptHashOutput(bitcoin.crypto.hash160(self.redeemScript));
    self.P2SHAddress = bitcoin.address.fromOutputScript(scriptPubKey, self.network);
  }

  options = options || {}

  setSecondPartyPublicKey()
  setNetwork()
  setPrivateKey()
  setP2SH()
}

EscrowWallet.prototype.getWIF = function() {
  return this.keyPair.toWIF();
}

EscrowWallet.prototype.getLocalAddress = function () {
  return this.keyPair.getAddress();
}

EscrowWallet.prototype.getP2SHAddress = function() {
  return this.P2SHAddress;
}

EscrowWallet.prototype.getRedeemScript = function() {
  return this.redeemScript.toString('hex');
}

EscrowWallet.prototype.signTransaction = function(tx_hex, input_index) {
  var tx = bitcoin.Transaction.fromHex(tx_hex);
  var txb = bitcoin.TransactionBuilder.fromTransaction(tx, this.network);
  txb.sign(input_index, this.keyPair, this.redeemScript);
  return txb.buildIncomplete().toHex();
}

module.exports = EscrowWallet;
