#!/usr/bin/env node
/**
 * This file is part of rcon-interactive
 * Copyright (c) 2017 DerEnderKeks
 * See the LICENSE file for more information
 */

const repl = require('repl');
const querystring = require('querystring');
const Rcon = require('modern-rcon');
const colors = require('colors');

let rcon = null;
let connected = false;

const help = {
  connect: 'Connect using \'.connect <address[:port]> <password>\'.',
  notConnected: 'Not connected!'
};

const log = (message) => {
  if (message) console.log(message);
  replServer.displayPrompt();
};

const rconEval = (cmd, context, filename, callback) => {
  if (!connected || !rcon) return log(`${help.notConnected} ${help.connect}`.red);
  if (!cmd || cmd.replace('\n', '').length < 1) return log(null);
  rcon.send(cmd).then((data) => {
    return callback(null, data);
  }).catch(err => {
    return callback(err, null);
  });
};

const connect = (args) => {
  let address = args[0] ? args[0] : '127.0.0.1:27015';
  let host = address.split(':')[0];
  let port = address.split(':')[1] ? parseInt(address.split(':')[1]) : 27015;
  let password = args[1] ? args[1] : '';
  console.log(`Connecting to ${address}...`.magenta);
  rcon = new Rcon(host, port, password);
  rcon.connect().then(() => {
    connected = true;
    log('Connected!'.green);
  }).catch(console.error);
};

const disconnect = () => {
  if (!connected || !rcon) return;
  console.log('Disconnecting...'.magenta);
  rcon.disconnect();
  rcon = null;
  connected = false;
  log('Disconnected.'.red);
};

const exit = (signal) => {
  console.log(`Received ${signal}. Exiting.`.red);
  disconnect();
  process.exit(0);
};

if (process.argv.length > 2) {
  connect(process.argv.splice(2))
} else {
  console.log(help.connect.magenta);
}

const replServer = repl.start({ prompt: '> ', eval: rconEval });

replServer.defineCommand('exit', () => {
  console.log('Exiting...'.magenta);
  if (rcon) rcon.disconnect();
  process.exit(0);
});

replServer.defineCommand('connect', {
  help: `Connect to a RCON server. ${help.connect}`,
  action(args) {
    connect(args.split(' '));
  }
});

replServer.defineCommand('disconnect', {
  help: 'Disconnect the current connection.',
  action() {
    if (!connected || !rcon) return console.log(`${help.notConnected} ${help.connect}`.red);
    disconnect();
  }
});

process.on('SIGINT', () => {
  exit('SIGINT');
});

process.on('SIGTERM', () => {
  exit('SIGTERM');
});