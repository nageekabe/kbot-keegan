const ms = require('ms');
const reverseMs = require('pretty-ms');

const multiMsRegExp = /\+?\d+(\.\d*)?\s*(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)/gi;

module.exports = function parseTime(input) {
	if (Number.isFinite(input))
		return reverseMs(input, { verbose: true, secondsDecimalDigits: 0 });
	else if (typeof input !== 'string')
		return null;

	let matches = input.match(multiMsRegExp);

	return matches ? matches.reduce((a, b) => a + ms(b), 0) : null;
};