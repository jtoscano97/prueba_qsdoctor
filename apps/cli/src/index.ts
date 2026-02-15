#!/usr/bin/env node
/**
 * RedactGuard CLI — Sanitize before you push.
 * For CI/CD pipelines: GitHub Actions, Jenkins, etc.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BIN_NAME = process.platform === 'win32' ? 'redactguard.exe' : 'redactguard';
const BIN_PATH = path.join(__dirname, '..', 'bin', BIN_NAME);

function runBinary(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    if (!fs.existsSync(BIN_PATH)) {
      console.error(chalk.red('Error: RedactGuard binary not found. Run: npm run build:cli'));
      process.exit(1);
    }
    const proc = spawn(BIN_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (d) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

const program = new Command();

program
  .name('redactguard')
  .description('Zero-Trust Data Sanitization — CLI for CI/CD')
  .version('0.1.0');

program
  .command('audit <path>')
  .description('Analyze file for reversible redaction vulnerabilities')
  .option('-j, --json', 'Output as JSON')
  .option('--exit-on-fail', 'Exit with code 1 if score > 50')
  .action(async (filePath: string, opts: { json?: boolean; exitOnFail?: boolean }) => {
    try {
      const args = ['audit', path.resolve(filePath)];
      if (opts.json) args.push('--json');
      const { stdout, stderr, code } = await runBinary(args);
      if (stderr) process.stderr.write(stderr);
      process.stdout.write(stdout);
      if (code !== 0) process.exit(code);
      if (opts.exitOnFail && opts.json) {
        try {
          const j = JSON.parse(stdout);
          if (j.score > 50) process.exit(1);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error(chalk.red('Error:'), err);
      process.exit(1);
    }
  });

program
  .command('pdf-strip <input> <output>')
  .description('Strip metadata from PDF file')
  .action(async (input: string, output: string) => {
    try {
      const args = ['pdf-strip', path.resolve(input), path.resolve(output)];
      const { stdout, stderr, code } = await runBinary(args);
      if (stderr) process.stderr.write(stderr);
      process.stdout.write(stdout);
      process.exit(code ?? 0);
    } catch (err) {
      console.error(chalk.red('Error:'), err);
      process.exit(1);
    }
  });

program
  .command('sanitize <input> <output>')
  .description('Sanitize file with irreversible redaction')
  .option('-z, --zones <coords>', 'Zones as x,y,w,h (semicolon-separated)', '')
  .action(async (input: string, output: string, opts: { zones?: string }) => {
    try {
      const args = ['sanitize', path.resolve(input), path.resolve(output)];
      if (opts.zones) args.push('--zones', opts.zones);
      const { stdout, stderr, code } = await runBinary(args);
      if (stderr) process.stderr.write(stderr);
      process.stdout.write(stdout);
      process.exit(code ?? 0);
    } catch (err) {
      console.error(chalk.red('Error:'), err);
      process.exit(1);
    }
  });

program.parse();
