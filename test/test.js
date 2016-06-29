var chai = require('chai');
var expect = chai.expect;
var EscrowWallet = require('../src/escrowwallet');
var bitcoin = require('bitcoinjs-lib');

function isTransactionComplete(tx_hex, network) {
  var tx = bitcoin.Transaction.fromHex(tx_hex);
  network = network == 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.mainnet;
  var txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
  try {
    txb.build();
    return true;
  } catch(e) {
    return false;
  }
}

var mainnetWif = 'KwjWwzCT6qqWESMS5pFBys8F5Nhkff54HCrKL7LATxtE8SckHNnL';
var testnetWif = 'cNRtPuxr4iWGMPxch2LUC7fzEuZKjUyHNok85UKtpt3omDmGf5ta';
var pubKey = '03b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca';
var unsigned_tx = '01000000010541e698f0681f89cf06e8b05997a9c1e8f85fc91ee6df369ddb70d4ae650e6e0000000000ffffffff01204e00000000000017a914cd7b44d0b03f2d026d1e586d7ae18903b0d385f68700000000';
var semisigned_tx = '01000000010541e698f0681f89cf06e8b05997a9c1e8f85fc91ee6df369ddb70d4ae650e6e000000009200473044022032ce43939e558c0a0aaeab01118632d447f0a7bd8001beab566fda531d87b25f0220640dad3ff3802c1867ffcb58a123a9b44409789ab5d66d505385ead1713a9c24010047522103b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca2102236919c606bce80134eaff2bb988e3a274527f6084dc90cef56ee6438532d5f952aeffffffff01204e00000000000017a914cd7b44d0b03f2d026d1e586d7ae18903b0d385f68700000000';
var input_index = 0

var expectedMainnetLocalAddress = '1AkNdFYKjwkoXp1NX5dGkCK5vmckhEQ1RS';
var expectedMainnetP2SHAddress = '3N6snEpaUrn218wN5MJpB2EwLpUGZtBdXC';
var expectedMainnetRedeemScript = '522103b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca21034cf00a951ec0289b570c3cd72e8abe18d52ac035e5f977f707165b3200ab78f652ae';

var expectedTestnetLocalAddress = 'mrpJ6H8GVJ9diCCRG85LXEJWT57HSTKEtx';
var expectedTestnetP2SHAddress = '2MtTdqqodWoXKkoNtvTKGb2NoPbZdTLDizD';
var expectedTestnetRedeemScript = '522103b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca2102236919c606bce80134eaff2bb988e3a274527f6084dc90cef56ee6438532d5f952ae';

var expectedPartiallySignedTx = '01000000010541e698f0681f89cf06e8b05997a9c1e8f85fc91ee6df369ddb70d4ae650e6e0000000092000047304402205d4d15a387eaad6f568adedb478a9d02fe84a79787f3891fd47b77ad66056e89022068656464a61d1bb7f232daffb27baff57c9a042334a8d10d7b6539f87dc0fbbb0147522103b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca2102236919c606bce80134eaff2bb988e3a274527f6084dc90cef56ee6438532d5f952aeffffffff01204e00000000000017a914cd7b44d0b03f2d026d1e586d7ae18903b0d385f68700000000';
var expectedFullySignedTx = '01000000010541e698f0681f89cf06e8b05997a9c1e8f85fc91ee6df369ddb70d4ae650e6e00000000d900473044022032ce43939e558c0a0aaeab01118632d447f0a7bd8001beab566fda531d87b25f0220640dad3ff3802c1867ffcb58a123a9b44409789ab5d66d505385ead1713a9c240147304402205d4d15a387eaad6f568adedb478a9d02fe84a79787f3891fd47b77ad66056e89022068656464a61d1bb7f232daffb27baff57c9a042334a8d10d7b6539f87dc0fbbb0147522103b3931eec7cf5357b3405c7127fd827f985d0ee2a7779a63fb06605626536d6ca2102236919c606bce80134eaff2bb988e3a274527f6084dc90cef56ee6438532d5f952aeffffffff01204e00000000000017a914cd7b44d0b03f2d026d1e586d7ae18903b0d385f68700000000';

describe('EscrowWallet', function() {
  context('with a missing public key', function() {
    it('should throw an error', function() {
      expect(function() {
        new EscrowWallet()
      }).to.throw(Error, /public key must be supplied/);
    });
  });

  context('when not supplied with a key', function() {
    beforeEach(function() {
      this.wallet = new EscrowWallet(pubKey);
    });

    it('getWIF() should create a new key', function() {
      var wif = this.wallet.getWIF();
      expect(wif).to.be.a('string');
      expect(wif).to.have.lengthOf(52);
    });

    it('getWIF() should always return the same key', function() {
      var wif1 = this.wallet.getWIF();
      var wif2 = this.wallet.getWIF();
      expect(wif1).to.equal(wif2);
    });
  });

  context('when supplied with a key', function() {
    context('without specifying network', function() {
      beforeEach(function() {
        this.wallet = new EscrowWallet(pubKey, { wif: mainnetWif });
      });

      it('getWIF() should return the same key', function() {
        expect(this.wallet.getWIF()).to.equal(mainnetWif);
      });
    });

    context('using mainnet', function() {
      beforeEach(function() {
        this.wallet = new EscrowWallet(pubKey, { wif: mainnetWif, network: 'mainnet' });
      });

      it('getLocalAddress() should return a testnet address', function() {
        var address = this.wallet.getLocalAddress();
        expect(address).to.equal(expectedMainnetLocalAddress);
      });

      it('getP2SHAddress() should return a 2-of-2 multisig address', function() {
        var address = this.wallet.getP2SHAddress();
        expect(address).to.equal(expectedMainnetP2SHAddress);
      });

      it('getRedeemScript() should return a 2-of-2 multisig redeemScript', function() {
        var redeemScript = this.wallet.getRedeemScript();
        expect(redeemScript).to.equal(expectedMainnetRedeemScript);
      });
    });

    context('using testnet', function() {
      beforeEach(function() {
        this.network = 'testnet'
        this.wallet = new EscrowWallet(pubKey, { wif: testnetWif, network: this.network });
      });

      it('getLocalAddress() should return a testnet address', function() {
        var address = this.wallet.getLocalAddress();
        expect(address).to.equal(expectedTestnetLocalAddress);
      });

      it('getP2SHAddress() should return a 2-of-2 multisig address', function() {
        var address = this.wallet.getP2SHAddress();
        expect(address).to.equal(expectedTestnetP2SHAddress);
      });

      it('getRedeemScript() should return a 2-of-2 multisig redeemScript', function() {
        var redeemScript = this.wallet.getRedeemScript();
        expect(redeemScript).to.equal(expectedTestnetRedeemScript);
      });

      describe('signTransaction()', function() {
        context('with invalid arguments', function() {
          it('should throw an error when input index not valid', function() {
            var self = this;
            expect(function() {
              self.wallet.signTransaction(unsigned_tx, 4);
            }).to.throw(Error, /No input at index: 4/);
          });

          it('should throw an error when transaction not a hex', function() {
            var self = this;
            expect(function() {
              self.wallet.signTransaction('notahex', input_index);
            }).to.throw(Error, /Invalid hex string/);
          });
        });

        context('with an unsigned transaction', function() {
          it('should return a semi-signed transaction', function() {
            var signedTransaction = this.wallet.signTransaction(unsigned_tx, input_index);
            expect(signedTransaction).to.equal(expectedPartiallySignedTx);
            expect(isTransactionComplete(signedTransaction, this.network)).to.be.false;
          });
        });

        context('with a semi-signed transaction', function() {
          it('should return a fully signed transaction', function() {
            var signedTransaction = this.wallet.signTransaction(semisigned_tx, input_index);
            expect(signedTransaction).to.equal(expectedFullySignedTx);
            expect(isTransactionComplete(signedTransaction, this.network)).to.be.true;
          });
        });
      });
    });
  });
});
