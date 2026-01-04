import { Tokens } from "../../Frontend/Lexer.js";
import { evaluate } from "../Interpreter.js";
import { MK_NULL, MK_NUMBER, MK_STRING, MK_BOOL, MK_CHAR } from "../Value.js";
import { configureFileMemory, errorLog, makeError, pauseLog, func_map } from "../../Main.js";
import { concantate_exprs } from "./Expressions.js";
const initial_frame = {
    expr: undefined,
    ln: undefined,
    context: "<module>"
};
export async function eval_program(program, env) {
    let lastEvaluated = MK_NULL();
    program.body = program.body.filter(item => item.kind != "CommentExpr");
    const fn_decls = program.body.filter(c => c.kind == "FunctionDeclaration");
    const rest = program.body.filter(c => c.kind != "FunctionDeclaration");
    program.body = [...fn_decls, ...rest];
    for (const statement of program.body) {
        if (statement.kind == "CallExpr") {
            const callee = await evaluate(statement.callee, env, [{ expr: undefined, ln: undefined, context: "<module>" }]);
            if (!callee.isProcedure) {
                return makeError("Unassigned expression encountered!", "type", statement.ln);
            }
        }
        lastEvaluated = await evaluate(statement, env, [initial_frame]);
        if (errorLog.length > 0 || pauseLog.length > 0) {
            return MK_NULL();
        }
    }
    return lastEvaluated;
}
export function eval_file_statement(fileExpr, env, StackFrames) {
    const stringVal = {
        type: "string",
        kind: "StringLiteral",
        value: ""
    };
    env.declareVar(fileExpr.fileName, stringVal, true, env, StackFrames);
    configureFileMemory(fileExpr.fileName, fileExpr.mode, fileExpr.operation, fileExpr.ln, StackFrames);
    return MK_NULL();
}
export async function eval_var_declaration(declaration, env, StackFrames) {
    let value;
    for (const name of declaration.identifier) {
        if (natives.includes(name)) {
            return makeError(`'${name}' is a reserved native method. Please try a different name!`);
        }
    }
    if (localStorage.getItem('Af') != "true") {
        const types = [];
        if (declaration && declaration.value && declaration.constant) {
            for (const val of declaration.value) {
                types.push((await evaluate(val, env, StackFrames)).type);
            }
            if (types.includes("Object")) {
                return makeError('Entire ARRAY assignment has been turned off. To allow entire ARRAY assignment, enable "Support Non-syllabus Features" in settings.', "type", declaration.value[0].ln);
            }
        }
    }
    if (declaration.value != undefined) {
        if (declaration.value.length == 1) {
            value = await evaluate(declaration.value[0], env, StackFrames);
            if (value.type == "number") {
                value.numberKind = declaration.dataType;
            }
        }
        else {
            value = await concantate_exprs(declaration.value, env, StackFrames);
        }
    }
    else if (declaration.dataType) {
        value = MK_EMPTY(declaration.dataType);
    }
    else {
        value = MK_NULL();
    }
    value.ln = declaration.ln;
    for (let i = 0; i < declaration.identifier.length; i++) {
        env.declareVar(declaration.identifier[i], value, declaration.constant, env, StackFrames);
    }
    return value;
}
export function MK_EMPTY(typ) {
    switch (typ) {
        case Tokens.Integer:
            return MK_NUMBER(0, typ);
        case Tokens.Real:
            return MK_NUMBER(0, typ);
        case Tokens.Char:
            return MK_CHAR('');
        case Tokens.Boolean:
            return MK_BOOL(false);
        case Tokens.String:
            return MK_STRING("");
        default:
            return MK_NULL();
    }
}
export const natives = ["ROUND", "RANDOM", "SUBSTRING", "LCASE", "UCASE", "MOD", "DIV", "NUM_TO_STR", "STR_TO_NUM", "EOF"];
export function eval_fn_declaration(declaration, env) {
    func_map.set(declaration.name, declaration.isProcedure ? "PROCEDURE" : "FUNCTION");
    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body,
        returnType: declaration.returns,
        expectedArguments: declaration.parameters.size,
        isProcedure: declaration.isProcedure,
        returnExpressions: declaration.returnExpressions,
        ln: declaration.ln,
    };
    if (natives.includes(declaration.name))
        return makeError(`'${declaration.name}' is a reserved native method. Please try a different name!`);
    return env.declareVar(declaration.name, fn, true, env, [initial_frame]);
}
