#!/usr/bin/env node

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Import the commands
const initCommand = require('./commands/init');
const seedCommand = require('./commands/seed');

yargs(hideBin(process.argv))
  .command(initCommand)
  .command(seedCommand)
  .demandCommand(1, 'You need to provide a command. Try --help for a list.')
  .strict()
  .alias({ h: 'help' })
  .parse();

// Make this file a module to avoid global scope conflicts
export {};