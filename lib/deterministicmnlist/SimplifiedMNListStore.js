const constants = require('../constants');
const SimplifiedMNList = require('./SimplifiedMNList');
const SimplifiedMNListDiff = require('./SimplifiedMNListDiff');
const Transaction = require('../transaction');

const { SMLSTORE_MAX_DIFFS } = constants;

/**
 * @class SimplifiedMNListStore
 * @param {Array.<SimplifiedMNListDiff>} diffArray - an array of simplifiedMNListDiff
 * @param {Object} [options]
 * @constructor
 * @property {string} network
 * @property {Object} options
 * @property {number} maxDiffs - max num. of diff elements in store array
 * @property {Array.<Object>} diffStore - an array of diff entries
 * @property {SimplifiedMNList} baseSimplifiedMNList - the base SML
 * @property {SimplifiedMNList} currentSML - the current SML of the most recent block
 * @property {number} baseHeight - the block height of the base SML
 * @property {string} baseBlockHash - sha256, the block hash of the base SML
 * @property {number} tipHeight - the block height at the current tip
 * @property {string} tipHash - sha256, the block hash at the current tip
 */
function SimplifiedMNListStore(diffArray, options) {
  const firstDiff = new SimplifiedMNListDiff(diffArray.shift());
  this.network = firstDiff.network;
  this.options = options;
  this.maxDiffs = (typeof (options) !== 'undefined' && options.maxListsLimit) ? options.maxListsLimit : SMLSTORE_MAX_DIFFS;
  this.diffStore = [];

  // always store the first diff as a root to build on
  this.baseSimplifiedMNList = new SimplifiedMNList(firstDiff);
  this.currentSML = new SimplifiedMNList(firstDiff);
  this.baseHeight = firstDiff.cbTx.extraPayload.height;
  this.baseBlockHash = firstDiff.baseBlockHash;
  this.updateTipInfo(this.baseHeight, firstDiff.blockHash);

  if (!this.baseSimplifiedMNList) {
    throw new Error('no initial diff has been provided');
  }

  diffArray.forEach((diff) => {
    this.addDiff(diff);
  });
}

/**
 * Updates height and hash for latest block
 * @param {number} height
 * @param {string} hash
 */
SimplifiedMNListStore.prototype.updateTipInfo = function updateTipInfo(height, hash) {
  this.tipHeight = height;
  this.tipHash = hash;
};

/**
 * Adds a new SimplifiedMNListDiff to the store.
 * If SMLSTORE_MAX_DIFFS reached it drops the oldest
 * @param {SimplifiedMNListDiff} diff
 */
SimplifiedMNListStore.prototype.addDiff = function addDiff(diff) {
  if (!this.baseSimplifiedMNList) {
    throw new Error('no initial diff has been provided');
  }

  if (this.diffStore.length >= this.maxDiffs - 1) {
    this.baseSimplifiedMNList.applyDiff(this.diffStore[0].diff);
    this.diffStore.shift();
  }

  const cbTx = new Transaction(diff.cbTx);
  const { height } = cbTx.extraPayload;
  this.diffStore.push({ height, diff });
  this.currentSML.applyDiff(diff);
  this.updateTipInfo(height, diff.blockHash);
};

/**
 * Returns height for latest block
 * @returns {number}
 */
SimplifiedMNListStore.prototype.getTipHeight = function getTipHeight() {
  return this.tipHeight;
};

/**
 * Returns hash for latest block
 * @returns {string}
 */
SimplifiedMNListStore.prototype.getTipHash = function getTipHash() {
  return this.tipHash;
};

/**
 * @private
 * Returns a SimplifiedMNListDiff entry by height
 * @param {number} startHeight
 * @param {number} endHeight
 * @returns {SimplifiedMNListDiff[]}
 */
SimplifiedMNListStore.prototype.getSMLDiffbyHeightRange = function getSMLDiffbyHeightRange(startHeight, endHeight) {
  return this.diffStore.filter(
    diff => diff.height >= startHeight && diff.height <= endHeight,
  ).map(
    filteredDiffs => filteredDiffs.diff,
  );
};

/**
 * Returns a SimplifiedMNList by block height
 * @param {number} height
 * @returns {SimplifiedMNList}
 */
SimplifiedMNListStore.prototype.getSMLbyHeight = function getSMLbyHeight(height) {
  const diffs = (this.baseHeight === height)
    ? [] : this.getSMLDiffbyHeightRange(this.baseHeight, height);
  if (diffs.length === 0 && this.baseHeight !== height) {
    throw new Error('unable to construct SML at this height');
  }
  return this.createListFromBaseAndDiffs(diffs);
};

/**
 * Returns the SimplifiedMNList of the most recent block
 * @returns {SimplifiedMNList}
 */
SimplifiedMNListStore.prototype.getCurrentSML = function getCurrentSML() {
  return this.currentSML;
};

/**
 * @private
 * Applies an array of sequential SimplifiedMNListDiffs to the first base SimplifiedMNList
 * @param {SimplifiedMNListDiff[]} diffs
 * @returns {SimplifiedMNList}
 */
SimplifiedMNListStore.prototype.createListFromBaseAndDiffs = function createListFromBaseAndDiffs(diffs) {
  const currentSML = new SimplifiedMNList(
    this.baseSimplifiedMNList.toSimplifiedMNListDiff(), this.network,
  );
  diffs.forEach((diff) => {
    currentSML.applyDiff(diff);
  });
  return currentSML;
};

module.exports = SimplifiedMNListStore;
