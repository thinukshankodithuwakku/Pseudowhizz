import { Tokens } from "../../Frontend/Lexer.js";
import { evaluate } from "../Interpreter.js";
import { MK_NULL, MK_NUMBER, MK_STRING, MK_BOOL, MK_CHAR } from "../Value.js";
import { configureFileMemory } from "../../Main.js";
export function eval_program(program, env) {
    let lastEvaluated = MK_NULL();
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env);
    }
    return lastEvaluated;
}
export function eval_file_statement(fileExpr, env) {
    const stringVal = {
        type: "string",
        kind: "StringLiteral",
        value: ""
    };
    env.declareVar(fileExpr.fileName, stringVal, true);
    configureFileMemory(fileExpr.fileName, fileExpr.mode, fileExpr.operation);
    return MK_NULL();
}
export function eval_var_declaration(declaration, env) {
    let value;
    //console.log(`Declaration value equals: ${JSON.stringify(declaration.value)}`);
    if (declaration.value != undefined) {
        value = evaluate(declaration.value, env);
    }
    else if (declaration.dataType != undefined) {
        /*if(declaration.dataType == Tokens.Integer){
          //console.log("This option was excecuted");
          console.log(JSON.stringify(MK_NUMBER(0, Tokens.Integer)));
          value = MK_NUMBER(0, Tokens.Integer);
        }
        else{
          value = MK_NUMBER(0.0, Tokens.Real);
        }*/
        //console.log("You got here, don't worry");
        switch (declaration.dataType) {
            case Tokens.Integer:
                value = MK_NUMBER(0, Tokens.Integer);
                break;
            case Tokens.Real:
                value = MK_NUMBER(0.0, Tokens.Real);
                break;
            case Tokens.String:
                value = MK_STRING("");
                break;
            case Tokens.Char:
                value = MK_CHAR('');
                break;
            case Tokens.Boolean:
                value = MK_BOOL(false);
                break;
            default:
                value = MK_NULL();
                break;
        }
    }
    else {
        value = MK_NULL();
    }
    for (let i = 0; i < declaration.identifier.length; i++) {
        env.declareVar(declaration.identifier[i], value, declaration.constant);
    }
    return value;
}
export function eval_fn_declaration(declaration, env) {
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
    };
    return env.declareVar(declaration.name, fn, true);
}
