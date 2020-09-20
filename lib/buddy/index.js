#!/usr/bin/env node
// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

// $ deva buddy


const Svarga = require('@indra.ai/svarga');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const config = require(path.join(__dirname, '.config.json'));
const data = require(path.join(__dirname, 'data.json'));

const { me } = config;
const { vars } = data;

const BUDDY = new Svarga({
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

    addToIndex() {
      if (this.vars.options.dir) return Promose.resolve(`📄 CUSTOM DEVA DIR. NO INDEX FILE.`);
      const indexFile = path.join(this.vars.paths.copy_to_base, 'index.js');

      const fileExists = fs.existsSync(indexFile);
      let indexFileLoad = fs.readFileSync(path.join(this.vars.paths.copy_index, 'index.js'), 'utf8')
      if (fileExists) {
        indexFileLoad = fs.readFileSync(indexFile, 'utf8');
      }

      const indexFileUpadate = indexFileLoad.replace('};', `  ${this.vars.answers.key}: require('./${this.vars.answers.key}'),\n};`);
      fs.writeFileSync(indexFile, indexFileUpadate);

      return Promise.resolve(`${this.vars.messages.index_updated} ${indexFile}`);
    },
    baseDevaDirectory() {
      const { copy_to_base } = this.vars.paths;
      const dir_exists = fs.existsSync(copy_to_base);
      if (!dir_exists) {
        fs.mkdirSync(copy_to_base);
      }
      return dir_exists;
    },

    queFiles(copy_from, copy_to) {
      const { answers, create } = this.vars;
      this.vars.create.directories.push(copy_to);

      return new Promise((resolve, reject) => {
        const items = fs.readdirSync(copy_from);
        if (!items) return reject('NO ITEMS');

        items.forEach(item => {
          const copy_from_file = path.resolve(copy_from, item);
          const copy_to_file = path.join(copy_to, item);

          const filestat = fs.statSync(copy_from_file);

          if (filestat.isDirectory()) this.func.queFiles(copy_from_file, copy_to_file);
          else {
            const content = fs.readFileSync(copy_from_file, 'utf8')
                            .replace(/:key:/g, answers.key)
                            .replace(/:key-upper:/g, answers.key.toUpperCase())
                            .replace(/:name:/g, answers.name)
                            .replace(/:describe:/g, answers.describe)
                            .replace(/:description:/g, answers.description)
                            .replace(/:avatar:/g, answers.avatar)
                            .replace(/:background:/g, answers.background)
                            .replace(/:voice:/g, answers.voice)
                            .replace(/:gender:/g, answers.gender);

            // PUSH THE NEWLY CREATED FILE TO THE CREATE FILES ARRAY VARIABLE
            this.vars.create.files.push({copy_to_file, content});

            return resolve(this.vars.messages.que_complete);
          }
        });

      });
    },

    que() {
      const { copy_from, copy_to } = this.vars.paths;

      if (!copy_from) return console.log('no files to copy from');
      if (!copy_to) return console.log('no files to copy to');


      console.log(chalk.greenBright(this.vars.messages.que_heading));
      console.log(chalk.cyan(`↪ fr: ${copy_from}`));
      console.log(chalk.cyan(`↪ to: ${copy_to}`));


      this.func.queFiles(copy_from, copy_to).then(filesQued => {

        console.log(chalk.greenBright(filesQued));
        return this.func.createDeva();
      }).then(devaCreated => {
        console.log(chalk.greenBright(devaCreated));
        return this.func.addToIndex();
      }).then(indexAdded => {
        console.log(chalk.greenBright(indexAdded));
      }).catch(err => {
        console.error('🛑 ERROR', err);
      });
    },


    createDeva() {
      this.func.baseDevaDirectory();

      const {files,directories} = this.vars.create;

      directories.forEach(dir => {
        console.log(chalk.magenta(`${this.vars.messages.folder} ${dir}`));
        fs.mkdirSync(dir);
      });

      files.forEach(file => {
          fs.writeFileSync(file.copy_to_file, file.content)
          console.log(chalk.yellow(`${this.vars.messages.file} ${file.copy_to_file}`));
      });
      return Promise.resolve(`${this.vars.messages.deva_created} ${this.vars.options.key} (${this.vars.options.name}) `);
    },

  },

  methods: {
    inquire() {
      // append directory to questions because of __dirname
      this.vars.questions.push({
        type: 'input',
        name: 'directory',
        message: 'DIRECTORY',
        default: path.join(process.cwd(), 'deva'),
      });

      this.modules.inquire.prompt(this.vars.questions).then(answers => {

        // set the options variable to load what the BUDDY was configured with.
        this.vars.paths = {
          copy_index: path.join(__dirname, '..', '..', 'templates', 'buddy'),
          copy_from: path.join(__dirname, '..', '..', 'templates', 'buddy', answers.template),
          copy_to_base: answers.directory,
          copy_to: path.join(answers.directory, answers.key),
        },

        console.log(chalk.yellow('::::::::::::::::::::::::::::'));
        console.log(chalk.blueBright.bold(this.vars.messages.heading));
        for (let answer in answers) {
          console.log(chalk.blueBright(`↪ ${answer.toUpperCase()}: `) + chalk.greenBright(answers[answer]));
        }
        console.log(chalk.yellow('::::::::::::::::::::::::::::'));

        // now this is where we take the
        this.vars.answers = answers;
        this.func.que();
      });
    },

  },

  onInit() {
    // run method que when the BUDDY inits.
    this.methods.inquire();
  },
});


module.exports = options => {
  // initialize the BUDDY DEVA
  BUDDY.vars.options = options.opts();
  BUDDY.init();
}
