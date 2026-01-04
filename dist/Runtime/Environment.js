import { Tokens } from "../Frontend/Lexer.js";
import { MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, MK_STRING } from "./Value.js";
import { conv_memex_to_val, adjust_index, isint } from "./Eval/Expressions.js";
import { errorLog, makeError } from "../Main.js";
function arityCheck(expected, got) {
    if (expected != got) {
        return makeError(`Expected ${expected} arguments but got ${got}!`);
    }
}
export function SetupGlobalScope() {
    const env = new Environment;
    console.log("created new global environment");
    env.declareVar("TRUE", MK_BOOL(true), true);
    env.declareVar("FALSE", MK_BOOL(false), true);
    env.declareVar("NULL", MK_NULL(), true);
    env.declareVar("LENGTH", MK_NATIVE_FN((args, scope) => {
        arityCheck(1, args.length);
        args = autoConvert(args);
        let subjectComponent = args[0];
        let subject;
        let length;
        if (subjectComponent.type == "Object") {
            subject = subjectComponent.elements;
            length = subject.length;
        }
        else if (subjectComponent.type == "string") {
            subject = subjectComponent.value;
            length = subject.length;
        }
        else if (subjectComponent.type == "char") {
            length = 1;
        }
        else if (subjectComponent.type == "MemberExprVal") {
            subjectComponent = conv_memex_to_val(subjectComponent);
            const func = env.lookupVar("LENGTH");
            const result = func.call([subjectComponent], env);
            return result;
        }
        else {
            return makeError("LENGTH function only takes string or object literal parameters!");
        }
        return MK_NUMBER(length, Tokens.Integer);
    }), true);
    env.declareVar("UCASE", MK_NATIVE_FN((args, scope) => {
        arityCheck(1, args.length);
        args = autoConvert(args);
        if (args[0].type != "string" && args[0].type != "char") {
            return makeError("Argument is neither of string nor char type!");
        }
        else {
            console.log("UCASE argument: " + JSON.stringify(args[0]));
        }
        const text = args[0].value;
        const cap = text.toUpperCase();
        return MK_STRING(cap);
    }), true);
    env.declareVar("LCASE", MK_NATIVE_FN((args, scope) => {
        arityCheck(1, args.length);
        if (args[0].type != "string" && args[0].type != "char") {
            return makeError("Argument is neither of string nor char type!");
        }
        args = autoConvert(args);
        const text = args[0].value;
        const cap = text.toLowerCase();
        return MK_STRING(cap);
    }), true);
    env.declareVar("SUBSTRING", MK_NATIVE_FN((args, scope) => {
        arityCheck(3, args.length);
        args = autoConvert(args);
        if (args[0].type != "string") {
            return makeError("First argument of a 'SUBSTRING' function must be of type STRING");
        }
        const text = args[0].value;
        let start = (args[1].value);
        start = adjust_index(1, text.length, start);
        if (errorLog.length > 0) {
            return MK_NULL();
        }
        const end = (args[2].value);
        if (start + 1 < 1) {
            return makeError("Start position must be above zero!");
        }
        if (end < 1) {
            return makeError("Number of characters to be extracted must be above zero!");
        }
        const slice = text.substring(start, start + end);
        return MK_STRING(slice);
    }), true);
    env.declareVar("ROUND", MK_NATIVE_FN((args, scope) => {
        arityCheck(2, args.length);
        args = autoConvert(args);
        if (args[0].type !== "number") {
            return makeError("Argument 1 is not a number!");
        }
        if (args[1].type == "number") {
            const runtimeval = args[1];
            if (runtimeval.numberKind !== Tokens.Integer) {
                return makeError("Argument 2 of a 'ROUND' function must be an integer value!");
            }
        }
        else {
            return makeError("Argument 2 of a 'ROUND' function must be an integer value!");
        }
        const num = args[0].value;
        const dP = args[1].value;
        const rounded = RoundToPlaces(num, dP);
        const numberKind = (dP == 0)
            ? Tokens.Integer
            : Tokens.Real;
        return MK_NUMBER(rounded, numberKind);
    }), true);
    env.declareVar("RANDOM", MK_NATIVE_FN((args, scope) => {
        args = autoConvert(args);
        if (args.length > 2 || args.length == 1) {
            return makeError(`Expected 0 OR 2 arguments but got ${args.length}!`);
        }
        if (args.length == 0 || args == undefined) {
            return MK_NUMBER(RoundToPlaces(Math.random(), 5), Tokens.Real);
        }
        else {
            if (args[0].type != "number") {
                return makeError("First argument is not a numeric value!");
            }
            if (args[1].type != "number") {
                return makeError("Second argument is not a numeric value!");
            }
            const start = args[0].value;
            const end = args[1].value;
            const gap = Math.abs(end - start);
            const rand = RoundToPlaces((Math.random() * gap) + Math.min(start, end), 0);
            return MK_NUMBER(rand, Tokens.Real);
        }
    }), true);
    env.declareVar("DIV", MK_NATIVE_FN((args, scope) => {
        arityCheck(2, args.length);
        args = autoConvert(args);
        console.log("Function arguments: " + JSON.stringify(args));
        if (!isIntegerRuntime(args[0])) {
            return makeError("First argument is not of type integer!");
        }
        if (!isIntegerRuntime(args[1])) {
            return makeError("First argument is not of type integer!");
        }
        const num1 = args[0].value;
        const num2 = args[1].value;
        return MK_NUMBER(Math.trunc(num1 / num2), Tokens.Integer);
    }), true);
    env.declareVar("MOD", MK_NATIVE_FN((args, scope) => {
        arityCheck(2, args.length);
        args = autoConvert(args);
        if (!isIntegerRuntime(args[0])) {
            return makeError("First argument is not of type integer!");
        }
        if (!isIntegerRuntime(args[1])) {
            return makeError("First argument is not of type integer!");
        }
        const num1 = args[0].value;
        const num2 = args[1].value;
        return MK_NUMBER(num1 % num2, Tokens.Integer);
    }), true);
    return env;
}
function isIntegerRuntime(val) {
    if (val.type == "number") {
        const temp = val;
        if (isint(temp.value)) {
            return true;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}
function autoConvert(args) {
    let sorted = [];
    for (const arg of args) {
        if (arg.type == "MemberExprVal") {
            let clean = arg;
            while (clean.type == "MemberExprVal") {
                clean = conv_memex_to_val(clean);
            }
            sorted.push(clean);
        }
        else {
            sorted.push(arg);
        }
    }
    return sorted;
}
export default class Environment {
    message() {
        console.log("Before any adding: " + JSON.stringify(this.outputLog));
    }
    constructor(parentENV) {
        this.outputLog = [];
        //console.log("Constructor reached!");
        const global = parentENV ? true : false;
        this.parent = parentENV;
        this.variables = new Map();
        this.constants = new Set();
    }
    declareVar(varname, value, isConstant) {
        if (this.variables.has(varname) && !varname.endsWith('.txt')) {
            return makeError(`Cannot re-declare variable ${varname} as it already is defined.`);
        }
        this.variables.set(varname, value);
        if (isConstant) {
            this.constants.add(varname);
        }
        return value;
    }
    assignVar(varname, value) {
        const env = this.resolve(varname);
        if (env.constants.has(varname)) {
            return makeError(`Cannot reassign value to constant '${varname}' because it is not a variable!`);
        }
        env.variables.set(varname, value);
        return value;
    }
    lookupVar(varname) {
        const env = this.resolve(varname);
        if (errorLog.length > 0) {
            console.log("Error log: " + errorLog);
            return MK_NULL();
        }
        console.log("Environment that was returned: " + JSON.stringify(env));
        return env.variables.get(varname);
    }
    resolve(varname) {
        console.log("This: " + JSON.stringify(this.parent));
        if (this.variables.has(varname) && this !== undefined) {
            return this;
        }
        if (this.parent == undefined && !this.variables.has(varname)) {
            makeError(`Cannot resolve '${varname}' as it does not exist.`);
        }
        else if (this.parent !== undefined) {
            return this.parent.resolve(varname);
        }
        else {
            throw "Parent environment or environment itself is undefined!";
        }
    }
}
function RoundToPlaces(num, dP) {
    return Math.round((num * (10 ** dP))) / (10 ** dP);
}
