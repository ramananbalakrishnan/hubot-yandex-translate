// Description:
//   Allows Hubot to translate messages using the Yandex Translate API
//
// Configuration
//   YANDEX_TRANSLATE_API_KEY - Your Yandex Translate API key
//
// Commands:
//   hubot translate <message> - translate message using the Yandex Translate API
//   hubot translate [from-to] <message> - e.g. "hubot translate fr-en merci"
//   hubot translate [to] <message> - e.g. "hubot translate fr thanks"

'use strict';

var languages = require('../lib/languages');

function getCode (language, basic) {
  var lang = (language || '').toLowerCase();
  return languages.indexOf(lang) === -1 ? basic : lang;
}

function yandexTranslate (robot) {
  var choices = languages.sort().join('|');
  var pattern = '' +
    '(?: translate)' +
    '(?: (' + choices + '))?' +
    '(?:[\s-]+(' + choices + '))?' +
    '(.*)';
  var rparts = new RegExp(pattern, 'i');

  robot.respond(rparts, request);

  function request (command) {
    var input = command.match[3].trim();
    var term = '"' + input + '"';
    var one = command.match[1];
    var two = command.match[2];
    var origin = getCode(two ? one : 'auto', 'auto');
    var target = getCode(two ? two : one, 'en');
    var lang = origin === 'auto' ? target : origin + '-' + target;
    var q = {
      key: process.env.YANDEX_TRANSLATE_API_KEY,
      lang: lang,
      text: input
    };

    command
      .http('https://translate.yandex.net/api/v1.5/tr.json/translate')
      .query(q)
      .header('User-Agent', 'Mozilla/5.0')
      .get()(response);

    function response (err, res, body) {
      var parsed = parse(body).lang.split('-');
      if (parsed) {
        command.send(['from ' + parseLang[0] + ' to ' + parseLang[1] + ':', '> ' + parsed.text].join('\n'));
      }
    }
  }
}

function parse (json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return { text: 'No.' };
  }
}

module.exports = yandexTranslate;
