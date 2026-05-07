/**
 * Welcome Page
 *
 * Displays a beautiful welcome screen when programspec is run without arguments.
 */

import chalk from 'chalk';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

const LOGO = `
 ____                                          _     _           _
|  _ \\ _ __ _____  ___   _  ___ _ __ ___   __ _| |__ | |__   __ _| |
| |_) | '__/ _ \\ \\/ / | | |/ __| '_ \` _ \\ / _\` | '_ \\| '_ \\ / _\` | |
|  __/| | | (_) >  <| |_| | (__| | | | | | (_| | | | | | | | (_| | |
|_|   |_|  \\___/_/\\_\\\\__, |\\___|_| |_| |_|\\__,_|_| |_|_| |_|\\__,_|_|
                     |___/
`;

const DIVIDER = '─'.repeat(50);

export function showWelcome(): void {
  console.log();
  console.log(chalk.cyan(LOGO));
  console.log(chalk.gray('  AI Native Development Operating System'));
  console.log(chalk.gray(`  v${version}`));
  console.log();
  console.log(chalk.gray(DIVIDER));
  console.log();

  // Quick Start
  console.log(chalk.bold('  Quick Start:'));
  console.log();
  console.log(`    ${chalk.green('programspec init')}           ${chalk.gray('Initialize project')}`);
  console.log(`    ${chalk.green('programspec new program')}    ${chalk.gray('Create a new program')}`);
  console.log();

  // Workflow
  console.log(chalk.bold('  Workflow:'));
  console.log();
  console.log(`    ${chalk.green('programspec status')}         ${chalk.gray('View program status')}`);
  console.log(`    ${chalk.green('programspec run')}            ${chalk.gray('Execute program')}`);
  console.log(`    ${chalk.green('programspec update')}         ${chalk.gray('Refresh tool commands')}`);
  console.log();

  // More
  console.log(chalk.bold('  More:'));
  console.log();
  console.log(`    ${chalk.green('programspec explore')}        ${chalk.gray('Enter explore mode')}`);
  console.log(`    ${chalk.green('programspec schemas')}        ${chalk.gray('View workflow schemas')}`);
  console.log(`    ${chalk.green('programspec agents')}         ${chalk.gray('View available agents')}`);
  console.log(`    ${chalk.green('programspec evolve')}         ${chalk.gray('System evolution')}`);
  console.log(`    ${chalk.green('programspec analyze')}        ${chalk.gray('Analyze recommendations')}`);
  console.log();

  // Help
  console.log(chalk.gray(DIVIDER));
  console.log(chalk.gray('  Run programspec <command> --help for more info'));
  console.log();
}
