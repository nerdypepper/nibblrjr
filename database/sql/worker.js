
const parser = require('sqlite-parser');
const { join } = require('path');
const { commandHash } = require('../commands');
const { parentPort } = require('worker_threads');
const { namespace } = process.env;

const traverse = item => {
    if (Array.isArray(item)) {
        for (const child of item) {
            traverse(child);
        }
    } else {
        const { type, variant, name } = item;
        if (variant === 'attach') throw new Error('parity interrupt');
        if (variant === 'detach') throw new Error('wrong calendar');
        if (variant === 'pragma') throw new Error('insert floppy #2');
        if (
            type === 'identifier'
            && variant === 'function'
            && name.includes('extension')
        ) throw new Error('dont breathe this');

        for (const child of Object.values(item)) {
            if (typeof child === 'object' && child !== null) {
                traverse(child);
            }
        }
    }
};

const assertNotEvil = (query) => {
    const ast = parser(query);
    traverse(ast.statement);
};

const db = require('better-sqlite3')(
    join(__dirname, '../../storage/namespace', commandHash(namespace))
);
db.pragma('max_page_count = 1000');
db.pragma('page_size = 4096');
db.pragma('journal_mode = WAL');

const prepareCache = new Map();

const prepare = (query) => {
    if (prepareCache.has(query)) return prepareCache.get(query);
    const statement = db.prepare(query);
    prepareCache.set(query, statement);
    return statement;
};

parentPort.on('message', ([type, id, _query]) => {
    if (type === 'all') {
        parentPort.postMessage(['bump']);
        try {
            const [query, params] = _query;
            assertNotEvil(query);
            parentPort.postMessage(['result', id, prepare(query).all(...params)]);
        } catch (e) {
            parentPort.postMessage(['error', id, e]);
        }
    } else if (type === 'close') {
        db.close();
        process.exit(0);
    }
});