# HaveIBeenPwned Application

This CLI utility will create a .csv file listing all breaches for a list of mail addresses.

[![Build](https://github.com/GreepTheSheep/HaveIBeenPwned-cli/actions/workflows/build.yml/badge.svg)](https://github.com/GreepTheSheep/HaveIBeenPwned-cli/actions/workflows/build.yml)

## Usage:

```
./HaveIBeenPwned [-k API_KEY] [-f INPUT_FILE | -e MAIL_ADDRESS] (-o OUTPUT_FILE) (-all) (-v)
```
`API_KEY` is required, you can use the .env file if you don't want to expose the key
`INPUT_FILE` must be a raw text format, emails must be separated by lines (in CRLF format)
`OUTPUT_FILE` must be a CSV format, if a file is already created, it will add new lines
`-all` parameter will list emails that are not breached in the `OUTPUT_FILE`
`-v` parameter will verbose output logs

## Build from source:

### Linux

Clone the repo, install dependencies with `npm i`, then run `npm run build:linux`

### Windows

Clone the repo, install dependencies with `npm i`.

Then install Windows Build Tools with `npm i -g windows-build-tools` **on a Administrative PowerShell**

Once done, build with `npm run build:win`