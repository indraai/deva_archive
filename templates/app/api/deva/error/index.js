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
const ERROR = new Svarga({
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
  vars,
  deva: {},
  listeners: {
    'error'(packet) {
      this.func.errorHandler(packet).then(result => {
        this.talk(`error:${packet.id}`, result);
      });
    }
  },
  modules: {},
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

    errorHandler(packet) {
      console.error(packet);
      return Promise.resolve();
    },

    // HELP FUNCTION TO ACCESS THE HELP MARKDOWN FILES.
    help(text) {
      return this.lib.help(text, __dirname);
    },

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
  },
  onStop() {
    this.func.prompt(`🛑 STOP: ${this.me.name}`);
  },
  onLoaded() {
    this.start();
  },
  onInit() {
    this.talk('ready', this.me);
  },
});
module.exports = ERROR
