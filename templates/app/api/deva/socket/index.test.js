// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

const {expect} = require('chai')
const socket = require('./index.js');
socket.config = require('../../.config.json');
socket.lib = require('../../lib');

describe(socket.me.name, () => {
  beforeEach(() => {
    return socket.init()
  });
  it('Check the SVARGA Object', () => {
    expect(socket).to.be.an('object');
    expect(socket).to.have.property('me');
    expect(socket).to.have.property('vars');
    expect(socket).to.have.property('listeners');
    expect(socket).to.have.property('methods');
    expect(socket).to.have.property('modules');
  });
})
