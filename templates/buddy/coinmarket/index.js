"use strict";
const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const {me} = config
const {vars} = data;

const Svarga = require('@indra.ai/svarga');
const COINMARKET = new Svarga({
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
    'coins:get'(packet) {
      const {id,q} = packet;
      const evt = `coins:get:${id}`;
      let symbol = q.text.replace(/^#coins /g, '').trim();
      if (findSymbol) symbol = findSymbol.id

      this.func.ticker(symbol).then(result => {
        if (!result.length) {
          this.talk(evt, 'coin not found')
        }
        else {
          const coin = result[0];
          // format return message
          console.log(JSON.stringify(coin, null, 2));
          const msg = {embed: {
            title: `**${coin.name}** *(${coin.symbol})*`,
            description: `**$${coin.price_usd}**\n**${this.methods.updown(coin.percent_change_1h)} ${coin.percent_change_1h}%** 1hr - **${this.methods.updown(coin.percent_change_24h)} ${coin.percent_change_24h}%**. 24hr **${this.methods.updown(coin.percent_change_7d)} ${coin.percent_change_7d}%**. 7d`,
            timestamp: new Date(),
            footer: {
              icon_url: this.config.images.indra,
              text: this.config.name
            }
          }}
          packet.a = {
            bot: this.vars.me,
            text: msg,
          };
          this.talk(evt, packet);
        }
      })
    },

  },
  deva: {},
  modules: {},
  func: {
    ticker(tck) {
      tck = tck || this.vars.ticker;
      return new Promise((resolve, reject) => {
        this.getUrl(`${this.vars.uri}/${tck}`).then(result => {
          console.log('TICKER RESULT: ', result.data);
          if (result.error) reject(result.error);
          resolve(result.data);
        }).catch(reject)
      });
    },
    top(limit) {
      limit = limit || this.vars.limit;
      return new Promise((resolve, reject) => {
        this.getUrl(`${this.vars.uri}?limit=${limit}`).then(result => {
          if (result.error) reject(result.error);
          return resolve(result.data);
        }).catch(reject);
      });
    },
    updown(num) {
      return num > 0 ? ' ☝🏻 ' : ' 👇🏻 ';
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
    top(packet) {
      const limit = packet.q.params[1] || this.vars.limit;
      return this.func.top(limit);
    },
    ticker(packet) {
      const ticker = packet.q.text || this.vars.ticker;
      return this.func.ticker(ticker)
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
      if (!this.running) return Promise.resolve({text:'OFFLINE'});
      return this.methods[packet.method](packet.msg);
    }
  },
  onStart() {
    this.func.prompt(`✅ START: ${this.me.name}`);
  },
  onStop() {
    this.func.prompt(`🛑 STOP: ${this.me.name}`);
  },
  onLoaded() {},
  onInit() {
    this.talk('ready', this.me);
  },
});
module.exports = COINMARKET
