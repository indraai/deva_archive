// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// Error Deva test file

const {expect} = require('chai')
const error = require('./index.js');

describe(error.me.name, () => {
  beforeEach(() => {
    return error.init()
  });
  it('Check the SVARGA Object', () => {
    expect(error).to.be.an('object');
    expect(error).to.have.property('me');
    expect(error).to.have.property('vars');
    expect(error).to.have.property('listeners');
    expect(error).to.have.property('methods');
    expect(error).to.have.property('modules');
  });
})
