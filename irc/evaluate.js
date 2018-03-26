const util = require('util');
const {VM} = require('vm2');

util.inspect.styles.null = 'red';

process.on('uncaughtException', (err) => {
    console.error(err);
});

function evaluate({ input, context, colors = true }) {

    try {
        const evaluation = new VM({
            timeout: 3000,
            sandbox: context,
        }).run(`
            ['VMError', 'Buffer'].forEach(key => {
                Object.defineProperty(this, key, { enumerable: false });
            });
            delete global.console;

            ${input}
        `);

        return { output: objectDebug(evaluation, colors) };
    } catch(e) {
        return {
            output: `${(colors?'\u000304':'')}${e.name}: ${e.message}`,
            error: true,
        };
    }
}

function objectDebug(evaluation, colors = true) {
    const output = util.inspect(evaluation, { depth: 1, colors })
        .replace(/\s+/g, ' ')
        .replace(new RegExp('\u001b\\[39m', 'g'), '\u000f')// reset
        .replace(new RegExp('\u001b\\[31m', 'g'), '\u000313') // null
        .replace(new RegExp('\u001b\\[33m', 'g'), '\u000307') // num / bool
        .replace(new RegExp('\u001b\\[32m', 'g'), '\u000303')// str
        .replace(new RegExp('\u001b\\[90m', 'g'), '\u000314')// str?
        .replace(new RegExp('\u001b\\[36m', 'g'), '\u000310');// func

    if (output.length > 396) {
        return output.slice(0, 396) + '\u000f ...';
    }
    else {
        return output;
    }
}

module.exports = {
    evaluate,
    objectDebug,
};
