"use strict";
const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;

const Svarga = require('@indra.ai/svarga');

const JOKES = new Svarga({
  me: {
    key: me.key,
    name: me.name,
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
  listeners: {
    'jokes:joke'(packet) {
      if (!this.running) return;
      this.methods.joke(packet).then(joke => {
        packet.a = {
          bot: this.me,
          text: joke.text,
          data: {
            format: this.me.key,
            type: 'joke',
          }
        };

        this.talk(`jokes:joke:${packet.id}`, packet);
        this.talk('chatbot:chat', {
          id: packet.id,
          q: {
            bot: this.me,
            text: joke.text,
          },
          created: Date.now(),
        });

      }).catch(err => {
        console.log('jokes error');
      })
    }
  },
  deva: {},
  modules: {
    api: false,
  },
  func: {
    joke() {
      return new Promise((resolve, reject) => {
        this.modules.api.get(this.vars.url).then(result => {
          return resolve(this.lib.decoded(result.data.joke).trim().replace(/\?/, '? ... '));
        }).catch(reject);
      });
    },
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
        this.func.joke().then(joke => {
          return resolve({text:joke})
        }).catch(reject)
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
    this.modules.api = this.createUrl({
      headers: {
        "Accept": "application/json",
      }
    });
  },
  onStop() {
    this.func.prompt(`🛑 STOP: ${this.me.name}`);
  },
  onLoaded() {},
  onInit() {
    this.talk('ready', this.me);
  },
});
module.exports = JOKES
