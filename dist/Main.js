import Parser from "./Frontend/Parser.js";
import { SetupGlobalScope } from "./Runtime/Environment.js";
import { evaluate } from "./Runtime/Interpreter.js";
import { MK_NULL } from "./Runtime/Value.js";
export let outputLog = [];
export let errorLog = [];
export let files = new Map([
    ["Main.pseudo", ""],
    ["Sample.txt", "Hello world!"],
]);
export let pseudoFiles = new Map(); //Key = filename, value = READ or WRITE
let FileValues = new Map(); //Key = filename, value = actual text
export function resolveFile(filename, request) {
    const keyArr = Array.from(pseudoFiles.keys());
    if (!keyArr.includes(filename)) {
        makeError(`File ${filename} does not exist or has been closed!`);
        return null;
    }
    else {
        switch (request) {
            case "MODE":
                return pseudoFiles.get(filename);
            case "CONTENT":
                return files.get(filename);
            case "LENGTH":
                return FileValues.get(filename).length;
        }
    }
}
export function UseFile(filename, operation, value) {
    const keyArr = Array.from(pseudoFiles.keys());
    if (!keyArr.includes(filename)) {
        makeError(`File ${filename} does not exist or has been closed!`);
    }
    else {
        if (operation == "READ") {
            if (pseudoFiles.get(filename) != "READ") {
                makeError(`File '${filename}' has not been opened for reading!`);
            }
            else {
                if (FileValues.get(filename).length == 0) {
                    makeError(`Reached end of file '${filename}'!`);
                    return " ";
                }
                else {
                    console.log("File array before hand: " + FileValues.get(filename));
                    const text = FileValues.get(filename).shift();
                    return text;
                }
            }
        }
        else {
            if (pseudoFiles.get(filename) != "WRITE") {
                makeError(`File '${filename}' has not been opened for writing!`);
            }
            else {
                const current = files.get(filename);
                let wrap = String(value);
                console.log("Wrap before: " + wrap);
                if ((wrap.startsWith("'") && wrap.endsWith("'")) || (wrap.startsWith('"') && wrap.endsWith('"'))) {
                    wrap = wrap.slice(1, -1);
                }
                console.log("Wrap after: " + wrap);
                FileValues.get(filename).push(wrap);
                files.set(filename, current + '\n' + wrap);
                return null;
            }
        }
    }
}
export function configureFileMemory(filename, mode, operation) {
    const keyArr = Array.from(files.keys());
    if (operation == "OPEN") {
        if (!keyArr.includes(filename)) {
            makeError(`File '${filename}' does not exist!`);
        }
        else {
            if (pseudoFiles.has(filename)) {
                if (pseudoFiles.get(filename) == mode) {
                    makeError(`File '${filename}' is already opened in ${mode} mode!`);
                }
                else {
                    pseudoFiles.set(filename, mode);
                }
            }
            else {
                let toUse = files.get(filename).split((/\r?\n/));
                FileValues.set(filename, toUse);
                pseudoFiles.set(filename, mode);
            }
        }
    }
    else if (operation == "CLOSE") {
        if (!keyArr.includes(filename)) {
            makeError(`File '${filename}' does not exist!`);
        }
        else {
            if (pseudoFiles.has(filename)) {
                FileValues.delete(filename);
                pseudoFiles.delete(filename);
            }
            else {
                makeError(`File '${filename}' already closed or has not been opened yet!`);
            }
        }
    }
}
export function makeError(message) {
    if (errorLog.length == 0) {
        errorLog.push("Unresolved: " + message);
    }
    return MK_NULL();
}
export function repl(src, request) {
    outputLog = [];
    errorLog = [];
    const parser = new Parser();
    const env = SetupGlobalScope();
    let program;
    let result;
    if (request == "program") {
        program = parser.produceAST(src);
        const evaluatedProgam = evaluate(program, env);
        if (evaluatedProgam.type == "null" || errorLog.length > 0) {
            return null;
        }
        else {
            result = evaluatedProgam;
        }
    }
    console.log("Developer output: " + JSON.stringify(result));
    if (request == "program") {
        return result;
    }
    else if (request == "env") {
        return env;
    }
    else {
        return result;
    }
}
