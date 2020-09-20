// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// Chuck Norris Deva test file

const {expect} = require('chai')
const chuck = require('./index.js');
chuck.config = require('../../.config.json');

describe(chuck.me.name, () => {
  beforeEach(() => {
    return chuck.init()
  });
  it('Check the SVARGA Object', () => {
    expect(chuck).to.be.an('object');
    expect(chuck).to.have.property('me');
    expect(chuck).to.have.property('vars');
    expect(chuck).to.have.property('listeners');
    expect(chuck).to.have.property('methods');
    expect(chuck).to.have.property('modules');
  });
})
