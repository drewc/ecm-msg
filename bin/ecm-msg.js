#!/usr/bin/env node
import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import pkg from '@kenjiuno/msgreader';
const MsgReader = pkg.default ;

import  { default as iconvLite } from 'iconv-lite';
import { deEncapsulateSync } from 'rtf-stream-parser';

import { decompressRTF } from '@kenjiuno/decompressrtf';
import { escapeHTML } from '@wordpress/escape-html'


program
  .command('body-html <msgFilePath> [saveToHtmlFilePath]')
  .description('Parse msg file and return rtf body as HTML')
  .action((msgFilePath, saveToHtmlFilePath) => {
    const msgFileBuffer = fs.readFileSync(msgFilePath)
    const testMsg = new MsgReader(msgFileBuffer)
    testMsg.parserConfig = testMsg.parserConfig || {};
    const testMsgInfo = testMsg.getFileData();
    const rtfb = Buffer.from(decompressRTF(testMsgInfo.compressedRtf)),
          rtf = deEncapsulateSync(rtfb, { decode: iconvLite.decode });
    const html = rtf.mode === 'html' ? rtf.text : escapeHTML(rtf.text);
    console.log(html)
  });


program
  .command('json <msgFilePath>')
  .description('Parse msg file and print json structure')
  .option('-f, --full-json', 'print full JSON')
  .action((msgFilePath, options) => {
    const msgFileBuffer = fs.readFileSync(msgFilePath)
    const testMsg = new MsgReader(msgFileBuffer)
    testMsg.parserConfig = testMsg.parserConfig || {};
    const testMsgInfo = testMsg.getFileData();
    const rtfb = Buffer.from(decompressRTF(testMsgInfo.compressedRtf)),
          rtf = deEncapsulateSync(rtfb, { decode: iconvLite.decode });
    const { attachments,
            recipients,
            subject,
            senderName,
            inetAcctName,
            body } = testMsgInfo
    console.log(
      options.fullJson
        ? JSON.stringify(testMsgInfo, null, 2)
        : JSON.stringify({
          sender: {
            name: senderName,
            email: inetAcctName
          },
          recipients,
          subject,
          body, rtf
        })
    );
  });
program
  .command('rtf <msgFilePath> [saveToRtfFilePath]')
  .description('Parse msg file and print decompressed rtf')
  .action((msgFilePath, saveToRtfFilePath) => {
    const msgFileBuffer = fs.readFileSync(msgFilePath)
    const testMsg = new MsgReader(msgFileBuffer)
    const testMsgInfo = testMsg.getFileData()

    const body = Buffer.from(decompressRTF(testMsgInfo.compressedRtf))

    if (typeof saveToRtfFilePath === "string" && saveToRtfFilePath.length >= 1) {
      fs.writeFileSync(saveToRtfFilePath, body);
    }
    else {
      console.log(body.toString('utf-8'));
    }
  });


program
  .parse(process.argv);
