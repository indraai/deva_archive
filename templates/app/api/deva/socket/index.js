// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

const fs = require('fs');
const path = require('path');
const config_path = path.join(__dirname, '.config.json');
const config = require(config_path);
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;

const Svarga = require('@indra.ai/svarga');
const Socket = require('socket.io');

const SOCKET = new Svarga({
  me: {
    key: me.key,
    name: me.name,
    description: me.description,
    prompt: me.prompt,
    voice: me.voice,
    profile: me.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  listeners: {
    socket(packet) {
      if (!this.running) return;
      const { event, data } = packet;
      this.modules.socket.emit(event, data)
    },
  },
  vars,
  func: {
    // PROMPT FUNCTION TO SEND PROMPT MESSAGES
    prompt(text, quiet=true, color=false) {
      if (!text) return false;
      this.talk('prompt', {
        id: this.uid(),
        bot: this.me,
        text,
        quiet,
        color,
        created: Date.now(),
      });
    },
    // HELP FUNCTION TO ACCESS THE HELP MARKDOWN FILES.
    help(text) {
      return this.lib.help(text, __dirname);
    },
  },
  modules: {
    socket: false,
    server: require('http').createServer(),
  },
  methods: {
    start(packet) {
      this.start();
      return Promise.resolve({
        text: this.vars.messages.running
      });
    },

    stop(packet) {
      this.stop();
      return Promise.resolve({
        text: this.vars.messages.stopped
      });
    },

    status() {
      const { running, stopped } = this.vars.messages;
      this.status();
      return Promise.resolve({text:this.running ? running : stopped});
    },

    help(packet) {
      return new Promise((resolve, reject) => {
        this.func.help(packet.q.text).then(help => {
          return resolve({text: `${help.title}\n\n${help.description}`})
        }).catch(reject);
      });
    },

    get(packet) {
      if (!this.running) return Promise.resolve({text: this.vars.messages.stopped});
      return this.methods[packet.method](packet.msg);
    },
  },
  onStart() {
    this.func.prompt(`✅ START: ${this.me.name}`);
    this.modules.socket = Socket(this.modules.server);
    this.modules.socket.on('connection', client => {
      client.on('disconnect', () => {})
    });
  },
  onStop() {
    this.func.prompt(`🛑 STOP: ${this.me.name}`);
    this.modules.socket = false;
  },
  onLoaded() {
    this.start();
  },
  onInit() {
    this.modules.server.listen(this.config.ports.socket);
    this.talk('ready', this.me);
  },
});
module.exports = SOCKET
