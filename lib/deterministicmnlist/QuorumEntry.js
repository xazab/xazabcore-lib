/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';
var _ = require('lodash');
var BufferReader = require('../encoding/bufferreader');
var BufferWriter = require('../encoding/bufferwriter');
var BufferUtil = require('../util/buffer');
var $ = require('../util/preconditions');
var Hash = require('../crypto/hash');
var constants = require('../constants');
var utils = require('../util/js');

var isHexString = utils.isHexaString;
var isHexStringOfSize = utils.isHexStringOfSize;
var isUnsignedInteger = utils.isUnsignedInteger;
var isSha256 = utils.isSha256HexString;

var SHA256_HASH_SIZE = constants.SHA256_HASH_SIZE;
var BLS_PUBLIC_KEY_SIZE = constants.BLS_PUBLIC_KEY_SIZE;
var BLS_SIGNATURE_SIZE = constants.BLS_SIGNATURE_SIZE;

/**
 * @typedef {Object} SMLQuorumEntry
 * @property {number} version
 * @property {number} llmqType
 * @property {string} quorumHash
 * @property {number} signersCount
 * @property {string} signers
 * @property {number} validMembersCount
 * @property {string} validMembers
 * @property {string} quorumPublicKey
 * @property {string} quorumVvecHash
 * @property {string} quorumSig
 * @property {string} membersSig
 */

/**
 * @class QuorumEntry
 * @param {string|Object|Buffer} [arg] - A Buffer, JSON string, or Object representing a SMLQuorumEntry
 * @constructor
 * @property {number} version
 * @property {number} llmqType
 * @property {string} quorumHash
 * @property {number} signersCount
 * @property {string} signers
 * @property {number} validMembersCount
 * @property {string} validMembers
 * @property {string} quorumPublicKey
 * @property {string} quorumVvecHash
 * @property {string} quorumSig
 * @property {string} membersSig
 */
function QuorumEntry(arg) {
  if (arg) {
    if (arg instanceof QuorumEntry) {
      return arg.copy();
    } else if (BufferUtil.isBuffer(arg)) {
      return QuorumEntry.fromBuffer(arg);
    } else if (_.isObject(arg)) {
      return QuorumEntry.fromObject(arg);
    } else if (arg instanceof QuorumEntry) {
      return arg.copy();
    } else if (isHexString(arg)) {
      return QuorumEntry.fromHexString(arg);
    } else {
      throw new TypeError('Unrecognized argument for QuorumEntry');
    }
  }
}

/**
 * Parse buffer and returns QuorumEntry
 * @param {Buffer} buffer
 * @return {QuorumEntry}
 */
QuorumEntry.fromBuffer = function fromBuffer(buffer) {
  var bufferReader = new BufferReader(buffer);
  var SMLQuorumEntry = new QuorumEntry();
  if (buffer.length < 100) {
    SMLQuorumEntry.isOutdatedRPC = true;
    SMLQuorumEntry.version = bufferReader.readUInt16LE();
    SMLQuorumEntry.llmqType = bufferReader.readUInt8();
    SMLQuorumEntry.quorumHash = bufferReader.read(constants.SHA256_HASH_SIZE).reverse().toString('hex');
    SMLQuorumEntry.signersCount = bufferReader.readVarintNum();
    SMLQuorumEntry.validMembersCount = bufferReader.readVarintNum();
    SMLQuorumEntry.quorumPublicKey = bufferReader.read(BLS_PUBLIC_KEY_SIZE).toString('hex');

    return SMLQuorumEntry;
  }
  SMLQuorumEntry.isOutdatedRPC = false;
  SMLQuorumEntry.version = bufferReader.readUInt16LE();
  SMLQuorumEntry.llmqType = bufferReader.readUInt8();
  SMLQuorumEntry.quorumHash = bufferReader.read(constants.SHA256_HASH_SIZE).reverse().toString('hex');
  SMLQuorumEntry.signersCount = bufferReader.readVarintNum();
  var signersBytesToRead = Math.floor((SMLQuorumEntry.getParams().size + 7) / 8) || 1;
  SMLQuorumEntry.signers = bufferReader.read(signersBytesToRead).toString('hex');
  SMLQuorumEntry.validMembersCount = bufferReader.readVarintNum();
  var validMembersBytesToRead = Math.floor((SMLQuorumEntry.getParams().size + 7) / 8) || 1;
  SMLQuorumEntry.validMembers = bufferReader.read(validMembersBytesToRead).toString('hex');
  SMLQuorumEntry.quorumPublicKey = bufferReader.read(BLS_PUBLIC_KEY_SIZE).toString('hex');
  SMLQuorumEntry.quorumVvecHash = bufferReader.read(SHA256_HASH_SIZE).reverse().toString('hex');
  SMLQuorumEntry.quorumSig = bufferReader.read(BLS_SIGNATURE_SIZE).toString('hex');
  SMLQuorumEntry.membersSig = bufferReader.read(BLS_SIGNATURE_SIZE).toString('hex');

  return SMLQuorumEntry;
};

/**
 * @param {string} string
 * @return {QuorumEntry}
 */
QuorumEntry.fromHexString = function fromString(string) {
  return QuorumEntry.fromBuffer(Buffer.from(string, 'hex'));
};

/**
 * Serialize SML entry to buf
 * @return {Buffer}
 */
QuorumEntry.prototype.toBuffer = function toBuffer() {
  this.validate();
  var bufferWriter = new BufferWriter();

  bufferWriter.writeUInt16LE(this.version);
  bufferWriter.writeUInt8(this.llmqType);
  bufferWriter.write(Buffer.from(this.quorumHash, 'hex').reverse());
  bufferWriter.writeVarintNum(this.signersCount);
  if (this.isOutdatedRPC) {
    bufferWriter.writeVarintNum(this.validMembersCount);
    bufferWriter.write(Buffer.from(this.quorumPublicKey, 'hex'));

    return bufferWriter.toBuffer();
  }

  bufferWriter.write(Buffer.from(this.signers, 'hex'));
  bufferWriter.writeVarintNum(this.validMembersCount);
  bufferWriter.write(Buffer.from(this.validMembers, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumPublicKey, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumVvecHash, 'hex').reverse());
  bufferWriter.write(Buffer.from(this.quorumSig, 'hex'));
  bufferWriter.write(Buffer.from(this.membersSig, 'hex'));

  return bufferWriter.toBuffer();
};

/**
 * Serialize SML entry to buf
 * @return {Buffer}
 */
QuorumEntry.prototype.toBufferForHashing = function toBufferForHashing() {
  this.validate();
  var bufferWriter = new BufferWriter();
  var fixedCounterLength = this.getParams().size;
  bufferWriter.writeUInt16LE(this.version);
  bufferWriter.writeUInt8(this.llmqType);
  bufferWriter.write(Buffer.from(this.quorumHash, 'hex').reverse());
  bufferWriter.writeVarintNum(fixedCounterLength);
  bufferWriter.write(Buffer.from(this.signers, 'hex'));
  bufferWriter.writeVarintNum(fixedCounterLength);
  bufferWriter.write(Buffer.from(this.validMembers, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumPublicKey, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumVvecHash, 'hex').reverse());
  bufferWriter.write(Buffer.from(this.quorumSig, 'hex'));
  bufferWriter.write(Buffer.from(this.membersSig, 'hex'));

  return bufferWriter.toBuffer();
};

/**
 * Serialize quorum entry commitment to buf
 * @return {Buffer}
 */
QuorumEntry.prototype.getCommitmentHash = function getCommitmentBuffer() {
  this.validate();
  var bufferWriter = new BufferWriter();
  bufferWriter.writeUInt8(this.llmqType);
  bufferWriter.write(Buffer.from(this.quorumHash, 'hex').reverse());
  bufferWriter.writeVarintNum(this.getParams().size);
  bufferWriter.write(Buffer.from(this.validMembers, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumPublicKey, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumVvecHash, 'hex').reverse());

  return Hash.sha256sha256(bufferWriter.toBuffer()).reverse();
};

/**
 * Create SMLQuorumEntry from an object
 * @param {SMLQuorumEntry} obj
 * @return {QuorumEntry}
 */
QuorumEntry.fromObject = function fromObject(obj) {
  var SMLQuorumEntry = new QuorumEntry();
  SMLQuorumEntry.isOutdatedRPC = false;
  SMLQuorumEntry.version = obj.version;
  SMLQuorumEntry.llmqType = obj.llmqType;
  SMLQuorumEntry.quorumHash = obj.quorumHash;
  SMLQuorumEntry.signersCount = obj.signersCount;
  SMLQuorumEntry.signers = obj.signers;
  SMLQuorumEntry.validMembersCount = obj.validMembersCount;
  SMLQuorumEntry.validMembers = obj.validMembers;
  SMLQuorumEntry.quorumPublicKey = obj.quorumPublicKey;
  SMLQuorumEntry.quorumVvecHash = obj.quorumVvecHash;
  SMLQuorumEntry.quorumSig = obj.quorumSig;
  SMLQuorumEntry.membersSig = obj.membersSig;
  if (SMLQuorumEntry.signers === undefined) {
    SMLQuorumEntry.isOutdatedRPC = true;
  }
  SMLQuorumEntry.validate();
  return SMLQuorumEntry;
};

QuorumEntry.prototype.validate = function validate() {
  $.checkArgument(utils.isUnsignedInteger(this.version), 'Expect version to be an unsigned integer');
  $.checkArgument(utils.isUnsignedInteger(this.llmqType), 'Expect llmqType to be an unsigned integer');
  $.checkArgument(isSha256(this.quorumHash), 'Expected quorumHash to be a sha256 hex string');
  $.checkArgument(isUnsignedInteger(this.signersCount), 'Expect signersCount to be an unsigned integer');
  $.checkArgument(isUnsignedInteger(this.validMembersCount), 'Expect validMembersCount to be an unsigned integer');
  $.checkArgument(isHexStringOfSize(this.quorumPublicKey, BLS_PUBLIC_KEY_SIZE * 2), 'Expected quorumPublicKey to be a bls pubkey');
  if (!this.isOutdatedRPC) {
    $.checkArgument(utils.isHexaString(this.signers), 'Expect signers to be a hex string');
    $.checkArgument(utils.isHexaString(this.validMembers), 'Expect validMembers to be a hex string');
    $.checkArgument(isHexStringOfSize(this.quorumVvecHash, SHA256_HASH_SIZE * 2), `Expected quorumVvecHash to be a hex string of size ${SHA256_HASH_SIZE}`);
    $.checkArgument(isHexStringOfSize(this.quorumSig, BLS_SIGNATURE_SIZE * 2), 'Expected quorumSig to be a bls signature');
    $.checkArgument(isHexStringOfSize(this.membersSig, BLS_SIGNATURE_SIZE * 2), 'Expected membersSig to be a bls signature');
  }
};

QuorumEntry.prototype.toObject = function toObject() {
  return {
    version: this.version,
    llmqType: this.llmqType,
    quorumHash: this.quorumHash,
    signersCount: this.signersCount,
    signers: this.signers,
    validMembersCount: this.validMembersCount,
    validMembers: this.validMembers,
    quorumPublicKey: this.quorumPublicKey,
    quorumVvecHash: this.quorumVvecHash,
    quorumSig: this.quorumSig,
    membersSig: this.membersSig,
  };
};

QuorumEntry.getParams = function getParams(llmqType) {
  const params = {};
  switch (llmqType) {
    case constants.LLMQ_TYPES.LLMQ_TYPE_50_60:
      params.size = 50;
      params.threshold = 30;
      params.maximumActiveQuorumsCount = 24;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_400_60:
      params.size = 400;
      params.threshold = 240;
      params.maximumActiveQuorumsCount = 4;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_400_85:
      params.size = 400;
      params.threshold = 340;
      params.maximumActiveQuorumsCount = 4;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_100_67:
      params.size = 100;
      params.threshold = 67;
      params.maximumActiveQuorumsCount = 24;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_LLMQ_TEST:
      params.size = 3;
      params.threshold = 2;
      params.maximumActiveQuorumsCount = 2;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_LLMQ_DEVNET:
      params.size = 10;
      params.threshold = 3;
      params.maximumActiveQuorumsCount = 7;
      return params;
    case constants.LLMQ_TYPES.LLMQ_TYPE_TEST_V17:
      params.size = 3;
      params.threshold = 2;
      params.maximumActiveQuorumsCount = 2;
      return params;
    default:
      throw new Error(`Invalid llmq type ${llmqType}`);
  }
};
/**
 * @return {number}
 */
QuorumEntry.prototype.getParams = function getParams() {
  return QuorumEntry.getParams(this.llmqType);
};

/**
 * Serialize quorum entry commitment to buf
 * This is the message hash signed by the quorum for verification
 * @return {Uint8Array}
 */
QuorumEntry.prototype.getCommitmentHash = function getCommitmentHash() {
  const bufferWriter = new BufferWriter();
  bufferWriter.writeUInt8(this.llmqType);
  bufferWriter.write(Buffer.from(this.quorumHash, 'hex').reverse());
  bufferWriter.writeVarintNum(this.getParams().size);
  bufferWriter.write(Buffer.from(this.validMembers, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumPublicKey, 'hex'));
  bufferWriter.write(Buffer.from(this.quorumVvecHash, 'hex').reverse());

  return Hash.sha256sha256(bufferWriter.toBuffer());
};

/**
 * Verifies the quorum's bls threshold signature
 * @return {Promise<boolean>}
 */
QuorumEntry.prototype.isValidQuorumSig = async function isValidQuorumSig() {
  if (this.isOutdatedRPC) {
    throw new Error('Quorum cannot be verified: node running on outdated XazabCore version (< 0.16)');
  }

  return bls.verifySignature(
    this.quorumSig,
    Uint8Array.from(this.getCommitmentHash()),
    this.quorumPublicKey,
  );
};

/**
 * Verifies the quorum's aggregated operator key signature
 * @param {SimplifiedMNList} mnList - MNList for the block (quorumHash)
 * @return {Promise<boolean>}
 */
QuorumEntry.prototype.isValidMemberSig = async function isValidMemberSig(mnList) {
  if (mnList.blockHash !== this.quorumHash) {
    throw new Error(`Wrong Masternode List for quorum: blockHash
      ${mnList.blockHash} doesn't correspond with quorumHash ${this.quorumHash}`);
  }
  if (this.isOutdatedRPC) {
    throw new Error('Quorum cannot be verified: node running on outdated XazabCore version (< 0.16)');
  }

  const quorumMembers = this.getAllQuorumMembers(mnList);
  const publicKeyStrings = quorumMembers.map(quorumMember => quorumMember.pubKeyOperator);

  const signersBits = BitArray.uint8ArrayToBitArray(
    Uint8Array.from(Buffer.from(this.signers, 'hex')),
  );

  return bls.verifyAggregatedSignature(
    this.membersSig,
    Uint8Array.from(this.getCommitmentHash()),
    publicKeyStrings,
    signersBits,
  );
};

/**
 * verifies the quorum against the det. MNList that was active
 * when the quorum was starting its DKG session. Two different
 * types of BLS signature verifications are performed:
 * 1. the quorumSig is verified with the quorumPublicKey
 * 2. the quorum members are re-calculated and the memberSig is
 * verified against their aggregated pubKeyOperator values
 * @param {SimplifiedMNList} quorumSMNList - MNList for the block (quorumHash)
 * the quorum was starting its DKG session with
 * @return {Promise<boolean>}
 */
QuorumEntry.prototype.verify = function verify(quorumSMNList) {
  return new Promise((resolve, reject) => {
    if (quorumSMNList.blockHash !== this.quorumHash) {
      return reject(new Error(`Wrong Masternode List for quorum: blockHash
      ${quorumSMNList.blockHash} doesn't correspond with quorumHash ${this.quorumHash}`));
    }
    if (this.isOutdatedRPC) {
      return reject(new Error('Quorum cannot be verified: node running on outdated XazabCore version (< 0.16)'));
    }

    // only verify if quorum hasn't already been verified
    if (this.isVerified) {
      return resolve(true);
    }

    return this.isValidMemberSig(quorumSMNList)
      .then((isValidMemberSig) => {
        if (!isValidMemberSig) {
          return false;
        }

        return this.isValidQuorumSig();
      })
      .then((isVerified) => {
        this.isVerified = isVerified;

        resolve(isVerified);
      });
  });
};

/**
 * Get all members for this quorum
 * @param {SimplifiedMNList} SMNList - MNlist for the quorum
 * @return {SimplifiedMNListEntry[]}
 */
QuorumEntry.prototype.getAllQuorumMembers = function getAllQuorumMembers(SMNList) {
  if (SMNList.blockHash !== this.quorumHash) {
    throw new Error(`Wrong Masternode List for quorum: blockHash
      ${SMNList.blockHash} doesn't correspond with quorumHash ${this.quorumHash}`);
  }
  return SMNList.calculateQuorum(this.getSelectionModifier(), this.getParams().size);
};

/**
 * Gets the modifier for deterministic sorting of the MNList
 * for quorum member selection
 * @return {Buffer}
 */
QuorumEntry.prototype.getSelectionModifier = function getSelectionModifier() {
  const bufferWriter = new BufferWriter();
  bufferWriter.writeUInt8(this.llmqType);
  bufferWriter.write(Buffer.from(this.quorumHash, 'hex').reverse());
  return Hash.sha256sha256(bufferWriter.toBuffer()).reverse();
};

/**
 * Gets the ordering hash for a requestId
 * @param {string} requestId - the requestId for the signing session to be verified
 * @return {Buffer}
 */
QuorumEntry.prototype.getOrderingHashForRequestId = function getOrderingHashForRequestId(
  requestId,
) {
  const buf = Buffer.concat(
    [Buffer.from(this.llmqType),
      Buffer.from(this.quorumHash, 'hex'),
      Buffer.from(requestId, 'hex')],
  );
  return Hash.sha256sha256(buf).reverse();
};

/**
 * @return {Buffer}
 */
QuorumEntry.prototype.calculateHash = function calculateHash() {
  return Hash.sha256sha256(this.toBufferForHashing()).reverse();
};

/**
 * Creates a copy of QuorumEntry
 * @return {QuorumEntry}
 */
QuorumEntry.prototype.copy = function copy() {
  return QuorumEntry.fromBuffer(this.toBuffer());
};

module.exports = QuorumEntry;
