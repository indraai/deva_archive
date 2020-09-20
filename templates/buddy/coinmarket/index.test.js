// Coinmarket Deva test file
const {expect} = require('chai')
const coinmarket = require('./index.js');
coinmarket.config = require('../../.config.json');

describe(coinmarket.me.name, () => {
  beforeEach(() => {
    return coinmarket.init()
  });
  it('Check the SVARGA Object', () => {
    expect(coinmarket).to.be.an('object');
    expect(coinmarket).to.have.property('me');
    expect(coinmarket).to.have.property('vars');
    expect(coinmarket).to.have.property('listeners');
    expect(coinmarket).to.have.property('methods');
    expect(coinmarket).to.have.property('modules');
  });
})
