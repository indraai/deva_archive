// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const axios = require('axios');

const {me} = config
const {vars} = data;

const Svarga = require('@indra.ai/svarga');

const CHUCK = new Svarga({
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
    'chuck:joke'(packet) {
      if (!this.running) return;
      this.func.joke().then(joke => {
        this.talk(`chuck:joke:${packet.id}`, joke);
      }).catch(err => {

        console.log('chuck joke error', err);

        packet.a = {
          bot: this.me,
          text: this.vars.messages.error,
          meta: {
            format: this.me.key,
            type: 'chuck:joke',
          },
          data: false,
          error: err,
          created: Date.now(),
        };
        this.talk('error', packet);
      })
    }
  },
  vars,
  deva: {},
  modules: {},
  func: {
    joke() {
      return new Promise((resolve, reject) => {
        axios.get(this.vars.url).then(chuck => {
          return resolve(this.lib.decoded(chuck.data.value.joke));
        }).catch(reject)
      });
    },
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
  methods: {
    joke(packet) {
      return new Promise((resolve, reject) => {
        this.func.joke().then(text => {
          return resolve({text})
        }).catch(reject);
      });
    },
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
          return resolve({text: `# ${help.title}\n\n${help.description}`})
        }).catch(reject);
      });
    },
    get(packet) {
      if (!this.running) return Promise.resolve({text:this.vars.messages.stopped});
      return this.methods[packet.q.meta.type](packet);
    }
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
module.exports = CHUCK
