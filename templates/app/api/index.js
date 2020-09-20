#!/usr/bin/env node
// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

const args = process.argv.slice(2);

const pkg = require('./package.json');

const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;
const chalk = require('chalk');

const Svarga = require('@indra.ai/svarga');
const deva = require('./deva');
const lib = require('./lib')

// set configuration variables
config.dir = __dirname;
config.version = pkg.version;
config.name = pkg.name;
config.args = args;

// setup express for http/s api
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');


// Create new svarga object
const APP = new Svarga({
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
  config,
  lib,
  deva,
  vars,
  listeners: {
    ready(bot) {
      this.func.ready(bot);
    },
  },
  modules: {
    app: express(),
    marked: require('marked'),
  },
  func: {
    prompt(text, quiet=true) {
      if (!text) return false;
      this.talk('prompt', {
        id: this.uid(),
        bot: this.me,
        text,
        quiet,
        created: Date.now(),
      });
    },
    writeTerminalTitle(msg) {
      if (process.platform == 'win32') {
    		process.title = `${this.me.name} ${version} ${msg}`;
    	} else {
        process.stdout.write(
            String.fromCharCode(27) + "]0;" + `${this.me.name} ${pkg.version} ${msg}` + String.fromCharCode(7)
        );
    	}
    },
    setCounter() {
      this.vars.counter = Object.keys(this.deva).length;
    },

    ready(bot) {
      const id = this.uid();
      this.vars.ready.push(bot);
      this.talk('prompt', {
        id,
        bot: bot,
        text: `⭐️ - ${bot.name} is READY!!!`,
        created: Date.now(),
        quiet: true,
      });
      if (this.vars.ready.length === Object.keys(this.deva).length) this.func.loaded();
    },

    loaded() {
      const id = this.uid();
      this.talk('loaded')
    },

    displayObject(obj) {
      const out = []
      for (let x in obj) {
        if (typeof obj[x] === 'object') this.func.displayObject(obj[x])
        else out.push(`- *${x}* ${obj[x]}`);
      }
      return out.join('\n');
    },

    displayItem(key, value) {
      const typeFunc = typeof value === 'function';
      const typeObj = typeof value === 'object';
      const typeArr = Array.isArray(value);

      let typeOutput = String(value);
      if (key === 'wrapper') typeOutput = '```html\n' + value + '\n```';
      else if (typeFunc) typeOutput = '```js\n' + String(value) + '\n```';
      else if (typeObj) typeOutput = this.func.displayObject(value);
      else if (typeArr) typeOutput = '-' + value.join('\n-');

      return typeOutput.length ? typeOutput : '';
    },

    readme(rd='') {
      const outputData = {};

      // load the deva this
      let thisDeva = rd ? this.deva[rd.split('/')[1]] : this;

      if (!outputData.deva) outputData.deva = [];
      if (thisDeva && thisDeva.deva) for (let x in thisDeva.deva) {
        outputData.deva.push(`### [${x}](/docs/${x} "${x}")\n${this.deva[x].me.description}`);
      }


      this.vars.displayItems.forEach(itm => {
        if (!outputData[itm]) outputData[itm] = [];
        const itmDeva = thisDeva[itm];

        for (let x in itmDeva) {
          const itmDevaX = itm === 'modules' ? '```js\nReference CODE\n```' : itmDeva[x];
          const Output = this.func.displayItem(x, itmDevaX);
          outputData[itm].push(`##### ${x}\n${Output}\n`);
        }
      });

      const splash = `<div class="splash" style="background-image:url(${thisDeva.me.profile.background})"><div class="avatar"><img src="${thisDeva.me.profile.avatar}" /></div><h1>${thisDeva.me.name}</h1><p>${thisDeva.me.profile.describe}</p></div>`

      const readmeFile = fs.readFileSync(rd ? `./${rd}/README.md` : './README.md', 'utf-8');
      const codeFile = fs.readFileSync(rd ? `./${rd}/index.js` : './index.js', 'utf-8');

      const dataFile = JSON.parse(fs.readFileSync(rd ? `./${rd}/data.json` : './data.json', 'utf-8'));
      const configFile = JSON.parse(fs.readFileSync(rd ? `./${rd}/.config.json` : './.config.json', 'utf-8'));

      const file = readmeFile.replace(/:me:/g, outputData.me.join('\n\n'))
                      .replace(/:vars:/g, outputData.vars.join('\n\n'))
                      .replace(/:listeners:/g, outputData.listeners.join('\n\n'))
                      .replace(/:modules:/g, outputData.modules.join('\n\n'))
                      .replace(/:func:/g, outputData.func.join('\n\n'))
                      .replace(/:methods:/g, outputData.methods.join('\n\n'))
                      .replace(/:deva:/g, outputData.deva.join(`\n\n`))
                      .replace(/:code:/g, '```js\n' + codeFile + '\n```')
                      .replace(/:data:/g, '```json\n' + JSON.stringify(dataFile, null, 2) + '\n```')
                      .replace(/:config:/g, '```json\n' + JSON.stringify(configFile, null, 2) + '\n```');

      const readme = this.modules.marked(file);

      return this.vars.wrapper.replace(/:content:/g, readme)
              .replace(/:splash:/g, splash)
              .replace(/:key:/g, thisDeva.me.key)
              .replace(/:name:/g, thisDeva.me.name)
              .replace(/:description:/g, thisDeva.me.description)
              .replace(/:port:/g, this.config.ports.api)
              .replace(/:author:/g, pkg.author)
              .replace(/:version:/g, pkg.version)
              .replace(/:year:/g, this.lib.formatDate(Date.now(), 'year'));
    },
    help(rd='') {
      const thisDeva = rd ? this.deva[rd.split('/')[1]] : this;
      const readmeFile = fs.readFileSync(rd ? `./${rd}/README.md` : './README.md', 'utf-8');
      const readme = this.modules.marked(readmeFile);
      return this.vars.wrapper.replace(/:content:/g, readme)
              .replace(/:key:/g, thisDeva.me.key)
              .replace(/:name:/g, thisDeva.me.name)
              .replace(/:description:/g, thisDeva.me.description)
              .replace(/:port:/g, this.config.ports.api)
              .replace(/:author:/g, pkg.author)
              .replace(/:version:/g, pkg.version)
              .replace(/:year:/g, this.lib.formatDate(Date.now(), 'year'));
    },

  },
  methods: {
    default(req, res) {
      res.send(this.vars.messages.default_route_online)
    },
    docs(req,res) {
      const d = req.params.deva ? `deva/${req.params.deva}` : '';
      res.send(this.func.readme(d));
    },
    help(req, res) {
      const d = req.params.deva ? `deva/${req.params.deva}/help` : '';
      res.send(this.func.help(d));
    },
    deva(req, res) {
      const ip = req.header['x-forwarded-for'] || req.connection.remoteAddress || false;
      // this is the main method to process the deva from a get/post request
      // then we are going to send the data into the deva to be processed
      // after processing we will return a json dataset to the user.
      // store data in a standard packet to send it into the get processor
      if (!req || !res) return this.talk('error', {
        id: tihs.uid(),
        key: this.me.key,
        q: {
          bot: this.me,
          text: this.vars.messages.error,
          meta: {
            ip,
            format: this.me.key,
            type: 'deva-request-error',
          },
          data: false,
          error: 'INVALID REQUEST',
          created: Date.now(),
        },
        created: Date.now(),
      })

      const data = {
        id: this.uid(),
        key: req.body.key || req.params.key || req.query.key || false,
        q: {
          bot: this.me,
          text: req.body.msg || req.params.msg || req.query.msg || false,
          meta: {
            format: req.params.deva || false,
            type: req.params.method || false,
            params: req.params,
            ip,
          },
          data: false,
          error: false,
          created: Date.now(),
        },
        created: Date.now(),
      }

      const deva = !(req.params.deva in this.deva) ? false : this.deva[req.params.deva];

      // make sure this is a valid deva
      // if not valid log the error
      if (!deva) return res.json({error: this.vars.messages.deva_not_found});

      // run the get method and send the data packet.
      // once that finishes it will then return the
      // result in json format.
      deva.methods.get(data).then(result => {
        return res.json(result)
      }).catch(err => {

        this.talk('error', {
          id: tihs.uid(),
          key: this.me.key,
          q: {
            bot: this.me,
            text: this.vars.messages.error,
            meta: {
              format: this.me.key,
              type: 'deva-get-error',
              params: req.params,
              ip,
            },
            data: false,
            error: err,
            created: Date.now(),
          },
          created: Date.now(),
        });

        return res.json({error: this.vars.messages.error});
      });
    },
    status() {
      const { running, stopped } = this.vars.messages;
      this.status();
      return Promise.resolve({text:this.running ? running : stopped});
    },
  },
  onStart() {
    // start app on port designated in the variables.
    this.modules.app.listen(this.config.ports.api);

    this.func.setCounter();
    this.func.writeTerminalTitle('ONLINE');
  },
  onStop() {
    this.func.writeTerminalTitle('OFFLINE');
  },
  onLoaded() {},
  onInit() {
    this.vars.wrapper = fs.readFileSync(path.join(__dirname, 'www', 'index.html'), 'utf-8'),

    this.modules.app.use(bodyParser.urlencoded({extended: true}));
    this.modules.app.use(bodyParser.json());
    this.modules.app.use(cors());
    this.modules.app.use('/assets', express.static('assets'));

    this.modules.app
      .get('/', this.methods.default)
      .post(`/deva/:deva/:method`, this.methods.deva)
      .get(`/deva/:deva/:method`, this.methods.deva)
      .get(`/docs/`, this.methods.docs)
      .get(`/docs/:deva`, this.methods.docs)
      .get(`/docs/:deva/help/`, this.methods.help);

console.log(`🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
██████╗░███████╗██╗░░░██╗░█████╗░
██╔══██╗██╔════╝██║░░░██║██╔══██╗
██║░░██║█████╗░░╚██╗░██╔╝███████║
██║░░██║██╔══╝░░░╚████╔╝░██╔══██║
██████╔╝███████╗░░╚██╔╝░░██║░░██║
╚═════╝░╚══════╝░░░╚═╝░░░╚═╝░░╚═╝
🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
Name: ${chalk.yellow(pkg.name)}
Version: ${chalk.cyan(pkg.version)}
---
Ports
↪ API: ${chalk.blueBright(config.ports.api)}
↪ Socket: ${chalk.blueBright(config.ports.socket)}
---
Dir: ${chalk.magenta(config.dir)}
Date: ${chalk.blueBright(lib.formatDate(Date.now(), 'long', true))}
🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸`);
    this.start();
  },
});

// Init APP with Deva init active
APP.init(true).then(complete => {

}).catch(console.error);
