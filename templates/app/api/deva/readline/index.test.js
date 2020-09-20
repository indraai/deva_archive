// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// come up with a test scenerio for indra
const { asser, expect, should } = require('chai')
const readline = require('./index.js');
readline.lib = require('../../lib');

describe(readline.me.name, () => {
  beforeEach(() => {
    return readline.init()
  });
  it('Check the SVARGA Object', () => {
    expect(readline).to.be.an('object');
    expect(readline).to.have.property('me');
    expect(readline).to.have.property('vars');
    expect(readline).to.have.property('listeners');
    expect(readline).to.have.property('methods');
    expect(readline).to.have.property('modules');
  });
})
