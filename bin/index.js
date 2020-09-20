#!/usr/bin/env node

// Copyright (c)2020 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.

"use strict";

// the deva cli

const cmd = require('commander');
const path = require('path');
const chalk = require('chalk');

const {version} = require('../package.json');

const app = require('../lib/app');
const buddy = require('../lib/buddy');

cmd
  .storeOptionsAsProperties(false)
  .passCommandToAction(true);

cmd.version(version);

console.log(chalk.greenBright(`
::::::::::::::::::::::::::::::::::

██████╗░███████╗██╗░░░██╗░█████╗░
██╔══██╗██╔════╝██║░░░██║██╔══██╗
██║░░██║█████╗░░╚██╗░██╔╝███████║
██║░░██║██╔══╝░░░╚████╔╝░██╔══██║
██████╔╝███████╗░░╚██╔╝░░██║░░██║
╚═════╝░╚══════╝░░░╚═╝░░░╚═╝░░╚═╝

::::::::::::::::::::::::::::::::::
${chalk.blueBright('version:')} ${chalk.yellowBright(version)}
::::::::::::::::::::::::::::::::::`));

// create a new DEVA APP
// $ deva app
// $ deva a
cmd
  .command('app')
  .description('Create a new DEVA APP')
  .action(options => {
    app(options);
  });


// create a new DEVA Buddy
// $ deva buddy -k *KEY* -n *NAME*
// $ deva b -k *KEY* -n *NAME*
cmd
  .command('buddy')
  .description('Create a new DEVA Buddy')
  .action(options => {
    buddy(options);
  });

cmd.parse(process.argv);
