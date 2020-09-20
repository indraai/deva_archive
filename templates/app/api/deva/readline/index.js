// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// Alex - American Dude
// Daniel - English man
// Fred - Robot
// Fiona - Scotland Female
// Karen - Australian Female
// Moira - Irish Female
// Samantha - American Female
// Tessa - South African
// Veena - Indian
// Victoria - US

const fs = require('fs');
const path = require('path');
const config_path = path.join(__dirname, '.config.json');
const config = require(config_path);
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;

const say = require('say');
const chalk = require('chalk');

const Svarga = require('@indra.ai/svarga');
const readline = require('readline');

// Create new svarga object
const READLINE = new Svarga({
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
  listeners: {
    'prompt'(input) {
      this.func.prompt(input);
      this.func.say(input).then(() => {
        this.talk(`prompt:${input.id}`, true);
      }).catch(err => {
        this.talk('error', {type:'readline:listener:prompt', err, packet});
        console.error(this.vars.messages.error);
      });
    },

    'say'(packet) {
      this.func.say(packet).then(() => {
        this.talk(`say:${packet.id}`, true);
      }).catch(err => {
        this.talk(`say:${packet.id}`, false);
      });
    },
  },
  modules: {
    rl: readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    }),
  },
  func: {
    prompt(packet) {
      if (this.config.args.includes('silent')) return Promise.resolve('silent');
      if (!packet) return;
      const { id, bot, text, data, quiet, color} = packet;

      try {
        const prompt_emoji = bot && bot.prompt && bot.prompt.emoji ? `${bot.prompt.emoji} #` : '#';
        const prompt_color = color ? color : bot.prompt.color;

        this.modules.rl.setPrompt(chalk[prompt_color](prompt_emoji + bot.prompt.text + ': '))
        this.modules.rl.prompt(true);
        console.log(chalk[prompt_color](text));

      } catch (e) {
        console.log(chalk.redBright.bold(packet));
        console.log('CHALK ERROR', packet, e);
      }


      const command_emoji = this.me.prompt.emoji ? `${this.me.prompt.emoji} #` : '#';

      this.modules.rl.setPrompt(command_emoji + this.me.prompt.text + ': ');
      this.modules.rl.prompt(true);

      return Promise.resolve();
    },
    say(opts) {
      opts.quiet = opts.quiet || false;
      return new Promise((resolve, reject) => {
        const text = opts.text.replace(/https:\/\/\S*/gi, '')
                              .replace(/#/gi, '')
                              .replace(/[^\x00-\x7F]/g, '').toLowerCase();

        if (!text || opts.quiet) return resolve();

        say.speak(text, opts.bot.voice.speech, opts.bot.voice.speed, (err) => {
          if (err) return reject(err)
          return resolve();
        });
      });
    },
    actions(trig) {
      const triggers = ['#']
      const check = trig.substring(0,1);
      const triggered = triggers.includes(check);
      if (!triggered) return this.vars.actions.default;    // if not triggered do regular chat
      const getAction = trig.substring(1).split(' ')[0].toString();
      return `${getAction}:question`;
    },
    logout() {
      console.log(`LOGOUT: ${this.lib.formatDate(new Date(), 'long', true)}`);
      this.talk('logout', {
        id: this.uid(),
        date: Date.now(),
      });
      setTimeout(() => {
        console.log(`EXIT!`);
        process.exit(0);
      }, 1000);
    },
  },
  methods: {
    question(input) {
      const id = this.uid();
      let quiet = false;

      this.modules.rl.prompt();
      if (input.toLowerCase() === 'exit') return this.modules.rl.close();

      // check for hashtag as first string for an action
      const action = this.func.actions(input);

      const packet = {
        id,
        key: this.me.key,
        q: {
          bot: this.me,
          text: input,
        },
        created: Date.now(),
      }

      return new Promise((resolve, reject) => {

        // if no input return the resolved packet
        if (!input) {
          packet.a = {
            bot: this.me,
            text: this.vars.messages.say_something,
          }
          return resolve(packet);
        };

        this.talk(action, packet);
        this.once(`${action}:${packet.id}`, answer => {

          // format the final answer result
          const finalAnswer = {
            id: answer.id,
            bot: answer.a.data && answer.a.data.result && answer.a.data.result.bot ? answer.a.data.result.bot : answer.a.bot,
            text: answer.a.data && answer.a.data.result && answer.a.data.result.text ? answer.a.data.result.text : answer.a.text,
            data: answer.a.data,
            created: answer.created,
          };

          this.func.prompt(finalAnswer).then(() => {
            return this.func.say(finalAnswer);
          }).then(() => {
            return resolve(answer);
          }).catch(reject);

        });
      });
    },
    status() {
      const { running, stopped } = this.vars.messages;
      this.status();
      return Promise.resolve({
        text: this.running ? running : stopped,
      });
    },
    // HELP FUNCTION TO ACCESS THE HELP MARKDOWN FILES.
    help(text) {
      return this.lib.help(text, __dirname);
    },
    get(packet) {
      return this.methods[packet.method](packet.msg);
    },
  },
  onStart() {
    this.func.prompt({text:`✅ START: ${this.me.name}`, bot: this.me});
  },
  onStop() {
    this.func.prompt({text:`🛑 STOP: ${this.me.name}`, bot: this.me});
  },
  onLoaded() {
    this.start();
  },
  onInit() {
    this.modules.rl.on('line', this.methods.question)
      .on('close', () => {
        this.modules.rl.prompt();
        this.func.logout();
      });
    this.talk('ready', this.me);
  },
});
module.exports = READLINE
