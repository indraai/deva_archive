#!/usr/bin/env node
// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// the deva cli

const Svarga = require('@indra.ai/svarga');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;

const APP = new Svarga({
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
  deva: {},
  listeners: {},
  modules: {
    inquire: require('inquirer'),
  },
  func: {
    baseAppDirectory() {
      const { copy_to_base } = this.vars.paths;
      const dir_exists = fs.existsSync(copy_to_base);
      if (!dir_exists) {
        fs.mkdirSync(copy_to_base, {recursive:true});
      }
      return dir_exists;
    },
    queFiles(copy_from, copy_to) {
      const { answers, create } = this.vars;

      return new Promise((resolve, reject) => {
        const items = fs.readdirSync(copy_from);
        if (!items) return reject('NO ITEMS');

        items.forEach(item => {
          const copy_from_file = path.resolve(copy_from, item);
          const copy_to_file = path.join(copy_to, item);

          const filestat = fs.statSync(copy_from_file);
          const fileext = path.extname(copy_from_file);

          if (filestat.isDirectory()) {
            this.vars.create.directories.push(copy_to_file);
            this.func.queFiles(copy_from_file, copy_to_file);
          }
          else if (['.jpg','.png', '.gif'].includes(fileext)) {
            this.vars.create.files.push({copy_to_file, copy_from_file, content: 'COPY'})
          }
          else {
            // here we need to filter out which files get value changes.

            let content = fs.readFileSync(copy_from_file, 'utf8');
            if (item === '.config.json' || item === 'package.json') {
              content = content.replace(/:key:/g, answers.key)
                            .replace(/:key-upper:/g, answers.key.toUpperCase())
                            .replace(/:name:/g, answers.name)
                            .replace(/:description:/g, answers.description)
                            .replace(/:author:/g, answers.author)
                            .replace(/:port:/g, answers.port)
                            .replace(/:socket:/g, answers.socket)
                            .replace(/:license:/g, answers.license);
            }
            // PUSH THE NEWLY CREATED FILE TO THE CREATE FILES ARRAY VARIABLE
            this.vars.create.files.push({copy_to_file, copy_from_file, content});

            return resolve(this.vars.messages.que_complete);
          }
        });
      });
    },
    createApp() {
      return new Promise((resolve, reject) => {

        try {
          this.func.baseAppDirectory();

          const {files,directories} = this.vars.create;

          directories.forEach(dir => {
            console.log(chalk.magenta(`${this.vars.messages.folder} ${dir}`));
            fs.mkdirSync(dir);
          });

          files.forEach(file => {
              if (file.content === "COPY") {
                fs.copyFileSync(file.copy_from_file, file.copy_to_file);
              }
              else {
                fs.writeFileSync(file.copy_to_file, file.content)
              }
              console.log(chalk.yellow(`${this.vars.messages.file} ${file.copy_to_file}`));
          });

          return resolve(`${this.vars.messages.app_created} ${this.vars.answers.key} (${this.vars.answers.name})`);

        } catch (e) {
          return reject(e)
        }
      });
    }
  },
  methods: {
    // inquirer method presents the user with a set of questions to build out the
    // desired architecture.
    inquire() {
      // append directory to questions because of __dirname
      this.vars.questions.push({
        type: 'input',
        name: 'directory',
        message: 'DIRECTORY',
        default: process.cwd(),
      });
      this.modules.inquire.prompt(this.vars.questions).then(answers => {


        this.vars.paths = {
          copy_from: path.join(__dirname, '..', '..', 'templates', 'app', answers.template),
          copy_to: path.join(answers.directory, answers.key),
          copy_to_base: path.join(answers.directory, answers.key)
        }

        console.log(chalk.yellow('::::::::::::::::::::::::::::'));
        console.log(chalk.blueBright.bold(this.vars.messages.heading));
        console.log(chalk.blueBright(`↪ KEY: `) + chalk.greenBright(answers.key));
        console.log(chalk.blueBright(`↪ NAME: `) + chalk.greenBright(answers.name));
        console.log(chalk.blueBright(`↪ DESCRIPTION: `) + chalk.greenBright(answers.description));
        console.log(chalk.blueBright(`↪ PORT: `) + chalk.greenBright(answers.port));
        console.log(chalk.blueBright(`↪ AUTHOR: `) + chalk.greenBright(answers.author));
        console.log(chalk.blueBright(`↪ TEMPLATE: `) + chalk.greenBright(answers.template));
        console.log(chalk.blueBright(`↪ DESTINATION: `) + chalk.greenBright(this.vars.paths.copy_to));
        console.log(chalk.yellow('::::::::::::::::::::::::::::'));

        // now this is where we take the
        this.vars.answers = answers;

        const { copy_from, copy_to } = this.vars.paths;

        if (!copy_from) return console.log('no files to copy from');
        if (!copy_to) return console.log('no files to copy to');

        console.log(chalk.greenBright(this.vars.messages.que_heading));
        console.log(chalk.cyan(`↪ fr: ${copy_from}`));
        console.log(chalk.cyan(`↪ to: ${copy_to}`));

        this.func.queFiles(copy_from, copy_to)
        .then(filesQued => {
          console.log(chalk.greenBright(filesQued));
          return this.func.createApp();
        }).then(appCreated => {
          console.log(chalk.greenBright(appCreated));
        }).catch(err => {
          console.error('🛑 ERROR', err);
        });

      });
    },
  },

  onInit() {
    console.log(chalk.greenBright.bold(this.vars.messages.heading));
    console.log(chalk.grey(this.vars.messages.welcome));
    this.methods.inquire();
  },
});

// initialize the APP DEVA

module.exports = () => {
  APP.init();
}
