// Chuck Norris Deva test file
const {expect} = require('chai')
const jokes = require('./index.js');
jokes.config = require('../../.config.json');

describe(jokes.me.name, () => {
  beforeEach(() => {
    return jokes.init()
  });
  it('Check the SVARGA Object', () => {
    expect(jokes).to.be.an('object');
    expect(jokes).to.have.property('me');
    expect(jokes).to.have.property('vars');
    expect(jokes).to.have.property('listeners');
    expect(jokes).to.have.property('methods');
    expect(jokes).to.have.property('modules');
  });
})
