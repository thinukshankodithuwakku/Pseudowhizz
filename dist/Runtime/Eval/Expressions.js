import Environment from "../Environment.js";
import { evaluate } from "../Interpreter.js";
import { MK_NULL, MK_STRING } from "../Value.js";
import { Tokens } from "../../Frontend/Lexer.js";
import { UseFile, outputLog, errorLog, makeError } from "../../Main.js";
function eval_numeric_binary_expr(lhs, rhs, operator) {
    let resultType;
    let result;
    if (operator == "+") {
        //console.log("Attempt at adding the numbers");
        result = lhs.value + rhs.value;
        resultType = "number";
    }
    else if (operator == "-") {
        result = lhs.value - rhs.value;
        resultType = "number";
    }
    else if (operator == "*") {
        result = lhs.value * rhs.value;
        resultType = "number";
    }
    else if (operator == "/") {
        if (rhs.value == 0) {
            return makeError("Division by zero!");
        }
        else {
            result = lhs.value / rhs.value;
            resultType = "number";
        }
    }
    else if (operator == '^') {
        result = lhs.value ** rhs.value;
        resultType = "number";
    }
    else if (operator == "<") {
        result = lhs.value < rhs.value;
        resultType = "boolean";
    }
    else if (operator == ">") {
        result = lhs.value > rhs.value;
        resultType = "boolean";
    }
    else if (operator == ">=") {
        result = lhs.value >= rhs.value;
        resultType = "boolean";
    }
    else if (operator == "<=") {
        result = lhs.value <= rhs.value;
        resultType = "boolean";
    }
    else if (operator == "=") {
        result = lhs.value == rhs.value;
        resultType = "boolean";
    }
    else if (operator == '<>') {
        result = lhs.value !== rhs.value;
        resultType = "boolean";
    }
    else {
        return makeError("Unrecognised binary operator!");
    }
    let numberkind;
    if (isint(result.toString())) {
        numberkind = Tokens.Integer;
    }
    else {
        numberkind = Tokens.Real;
    }
    switch (resultType) {
        case "number":
            return { value: result, type: "number", numberKind: numberkind };
        case "boolean":
            return { value: result, type: "boolean" };
        default:
            return makeError("Invalid result expression!");
    }
}
export function eval_output_expr(output, env) {
    let messageComponent = evaluate(output.value, env);
    console.log("Message component: " + JSON.stringify(messageComponent));
    let message = "";
    message = convThisToStr(messageComponent).value;
    outputLog.push(message);
    console.log(outputLog);
    return {
        type: "string",
        kind: "StringLiteral",
        value: message,
    };
}
function eval_logic_binary_expr(lhs, rhs, operator) {
    let result;
    if (operator == "AND") {
        result = lhs.value && rhs.value;
    }
    else if (operator == "OR") {
        result = lhs.value || rhs.value;
    }
    else if (operator == "NOT") {
        result = !rhs.value;
    }
    else if (operator == "<>") {
        result = lhs.value !== rhs.value;
    }
    else if (operator == "=") {
        result = lhs.value == rhs.value;
    }
    else {
        return makeError("Cannot perform binary operation on boolean values!");
    }
    return { value: result, type: "boolean" };
}
function eval_string_binary_expr(lhs, rhs, operator) {
    let resultType;
    let result;
    if (operator == '=') {
        result = lhs.value == rhs.value;
        resultType = "boolean";
    }
    else if (operator == '<>') {
        result = !(lhs.value == rhs.value);
        resultType = "boolean";
    }
    else if (operator == ',' || operator == '+') {
        let lVal = lhs.value;
        let rVal = rhs.value;
        if ((lVal.startsWith('"') && lVal.endsWith('"')) || (lVal.startsWith("'") && lVal.endsWith("'"))) {
            lVal = lVal.slice(1, -1);
        }
        if ((rVal.startsWith('"') && rVal.endsWith('"')) || (rVal.startsWith("'") && rVal.endsWith("'"))) {
            rVal = rVal.slice(1, -1);
        }
        result = lVal + rVal;
        resultType = "string";
    }
    else {
        return makeError(`Cannot use binary operator '${operator}' on operands of type ${lhs.type} and ${rhs.type}`);
    }
    if (resultType == "boolean") {
        return { value: result, type: "boolean" };
    }
    else if (resultType == "string") {
        return { value: result, type: "string", kind: "StringLiteral" };
    }
    else {
        return makeError("Invalid result expression!");
    }
}
export function isint(str) {
    const num = Number(str);
    return !isNaN(num) && Number.isInteger(num);
}
export function eval_fileUse_expr(fileUse, env) {
    if (env.variables.has(fileUse.fileName)) {
        if (fileUse.operation == "READ") {
            const raw = UseFile(fileUse.fileName, "READ");
            let value;
            let badum;
            for (const expr of fileUse.assigne) {
                const runtimeval = evaluate(expr, env);
                if (errorLog.length > 0) {
                    return null;
                }
                if (runtimeval.type == "Object") {
                    let val = raw;
                    if (val.startsWith('[') && val.endsWith(']')) {
                        val = val.slice(1, -1);
                    }
                    const obj = runtimeval;
                    const str = {
                        type: "string",
                        kind: "StringLiteral",
                        value: val,
                    };
                    const newObj = assignStringToObj(str, obj);
                    if (errorLog.length > 0) {
                        return MK_NULL();
                    }
                    const assignmentExpr = {
                        kind: "AssignmentExpr",
                        assigne: expr,
                        value: newObj,
                    };
                    badum = eval_assignment_expr(assignmentExpr, env);
                }
                else {
                    value = automaticAssignement(runtimeval, raw);
                    const assignmentExpr = {
                        kind: "AssignmentExpr",
                        assigne: expr,
                        value: value
                    };
                    badum = eval_assignment_expr(assignmentExpr, env);
                }
            }
            return badum;
        }
        else {
            for (const expr of fileUse.assigne) {
                let toAssign = evaluate(expr, env);
                if (errorLog.length > 0) {
                    return null;
                }
                toAssign = convThisToStr(toAssign);
                UseFile(fileUse.fileName, "WRITE", toAssign.value);
            }
            return MK_NULL();
        }
    }
    else {
        return makeError(`File ${fileUse.fileName} has not been opened in the current scope or does not exist!`);
    }
}
function extractBracketedGroups(input) {
    const regex = /\[[^\[\]]*?\]/g;
    return input.match(regex) || []; //Thanks chatgpt :D
}
function assignStringToObj(getting, expecting) {
    if (expecting.elements[0].type == "Object") {
        if (!(getting.value.startsWith('[') && getting.value.endsWith(']'))) {
            makeError("Please wrap object literals in square brackets when assigning to 2d arrays");
        }
        const split = extractBracketedGroups(getting.value);
        let newObj = {
            kind: "ObjectLiteral",
            elements: [],
            start: { kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.start },
            end: { kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.end },
            innerStart: { kind: "NumericLiteral", numerKind: Tokens.Integer, value: expecting.elements[0].start },
            innerEnd: { kind: "NumericLiteral", numerKind: Tokens.Integer, value: expecting.elements[0].end },
            dataType: expecting.dataType,
            is2dArr: true,
            declaring: "Value",
        };
        if (split.length != expecting.elements.length) {
            makeError(`Assigne array has length ${expecting.elements.length} but inputted array has length ${split.length}!`);
        }
        for (let i = 0; i < split.length; i++) {
            let used = split[i].trim();
            if (used.startsWith('[') && used.endsWith(']')) {
                used = used.slice(1, -1);
            }
            const newElm = assignStringToObj({ type: "string", kind: "StringLiteral", value: used }, expecting.elements[i]);
            newObj.elements.push(newElm);
        }
        return newObj;
    }
    else {
        let split = [];
        let newObj = {
            kind: "ObjectLiteral",
            elements: [],
            start: { kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.start },
            end: { kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.end },
            dataType: expecting.dataType,
            is2dArr: false,
            declaring: "Value",
        };
        newObj.elements = [];
        if (getting.value.includes(',')) {
            split = getting.value.split(',');
        }
        else if (getting.value.includes(' ')) {
            split = getting.value.split(' ');
        }
        else {
            split = getting.value.split('');
        }
        if (split.length != expecting.elements.length) {
            makeError(`Assigne array has length ${expecting.elements.length} but inputted array has length ${split.length}!`);
        }
        switch (expecting.dataType) {
            case Tokens.Char:
                for (const item of split) {
                    console.log("Item before trimming: " + item);
                    const use = item.trim();
                    console.log("Item after trimming: " + use);
                    if (use.length > 1) {
                        makeError(`Item '${use}' of inputted array is not of type CHAR!`);
                    }
                    newObj.elements.push({ kind: "CharString", text: use });
                }
                break;
            case Tokens.Integer:
                for (const item of split) {
                    const use = item.trim();
                    console.log("Item before trimming: " + use);
                    if (!isint(Number(use))) {
                        makeError(`Item '${use}' of inputted array is not of type INTEGER!`);
                    }
                    newObj.elements.push({ kind: "NumericLiteral", numberKind: Tokens.Integer, value: Number(use) });
                }
                break;
            case Tokens.Real:
                for (const item of split) {
                    const use = item.trim();
                    if (!isNumeric(use)) {
                        makeError(`Item '${use}' is not of type REAL!`);
                    }
                    newObj.elements.push({ kind: "NumericLiteral", numberKind: Tokens.Real, value: Number(use) });
                }
                break;
            case Tokens.Boolean:
                for (const item of split) {
                    const use = item.trim();
                    if (use != "TRUE" && use != "FALSE") {
                        makeError(`Item '${use}' is not of type BOOLEAN!`);
                    }
                    newObj.elements.push({ kind: "Identifier", symbol: use });
                }
                break;
            default:
                for (const item of split) {
                    newObj.elements.push({ kind: "StringLiteral", text: item.trim() });
                }
        }
        return newObj;
    }
}
function inputCaster(getting, expecting) {
    if (expecting.type == "string") {
        return convThisToStr(getting);
    }
    else if (expecting.type == "char") {
        if (getting.type == "string") {
            return {
                type: "char",
                value: getting.value,
            };
        }
        else {
            return makeError("Invalid assignment!");
        }
    }
    else if (expecting.type == "number") {
        const num = Number(getting.value);
        return {
            type: "number",
            numberKind: (isint(num)) ? Tokens.Integer : Tokens.Real,
            value: num
        };
    }
    else if (expecting.type == "boolean") {
        return {
            type: "boolean",
            value: (getting.value == "TRUE") ? true : false,
        };
    }
    else {
        return getting;
    }
}
function automaticAssignement(assigne, value) {
    let toUse = assigne;
    if (toUse.type == "MemberExprVal") {
        toUse = conv_memex_to_val(toUse);
    }
    if (toUse.type == "number" && isNumeric(value)) {
        return {
            kind: "NumericLiteral",
            numberKind: (isint(Number(value)))
                ? Tokens.Integer
                : Tokens.Real,
            value: Number(value)
        };
    }
    else if (toUse.type == "boolean" && (value == "TRUE" || value == "FALSE")) {
        return {
            kind: "Identifier",
            symbol: value,
        };
    }
    else if (toUse.type == "char" && value.length == 1) {
        return {
            kind: "CharString",
            text: value,
        };
    }
    else {
        return {
            kind: "StringLiteral",
            text: value
        };
    }
}
export function eval_selectionStmt_expr(declaration, env) {
    let result = MK_NULL();
    let scopes = [];
    console.log("Selection statement: " + JSON.stringify(declaration));
    for (const condition of declaration.body.keys()) {
        if (evaluate(condition, env).value) {
            console.log("Condition which has been evaluated as true: " + JSON.stringify(condition));
            scopes.push(new Environment(env));
            for (const stmt of declaration.body.get(condition)) {
                result = evaluate(stmt, scopes[scopes.length - 1]);
                console.log("Declaration return length: " + declaration.returns.length);
                if (declaration.returns.length > 0) {
                    const conditionArray = Array.from(declaration.body.keys());
                    const returnIndex = conditionArray.indexOf(condition);
                    result = evaluate(declaration.returns[returnIndex], scopes[scopes.length - 1]);
                }
                if (stmt.kind == "SelectionStmtDeclaration") {
                    const temp = stmt;
                    if (temp.returns.length > 0 && result.type != "end-closure" && result.type !== "null") {
                        console.log("Attempting to return something from a case statement");
                        return result;
                    }
                }
                else if (stmt.kind == "IterationStmt") {
                    const temp = stmt;
                    if (temp.returnExpressions.length > 0 && result.type != "end-closure" && result.type !== "null") {
                        return result;
                    }
                }
                else if (stmt.kind == "ReturnStmt") {
                    const result = evaluate(stmt, scopes[scopes.length - 1]);
                    return result;
                }
            }
            console.log("Evaluated result: " + JSON.stringify(result));
            return result;
        }
        else {
            console.log(`Condition ${JSON.stringify(condition)} is false!`);
        }
    }
    console.log("What is result here: " + JSON.stringify(result));
    return result;
}
export function conv_memex_to_val(memex) {
    switch (memex.valueType) {
        case "number":
            const num = memex.value;
            return {
                type: "number",
                numberKind: isint(num)
                    ? Tokens.Integer
                    : Tokens.Real,
                value: num,
            };
        case "string":
            if (memex.value.length == 1) {
                return {
                    type: "char",
                    value: memex.value,
                };
            }
            else {
                return {
                    type: "string",
                    kind: "StringLiteral",
                    value: memex.value,
                };
            }
        case "boolean":
            return {
                type: "boolean",
                value: memex.value,
            };
        case "char":
            return {
                type: "char",
                value: memex.value,
            };
        case "Object":
            console.log("Memex as an object: " + JSON.stringify(memex));
            return {
                type: "Object",
                elements: memex.value,
                start: memex.parentObject.start,
                end: memex.value.length,
                dataType: assess_dataType_fromstring(String(memex.value[0])),
            };
        default:
            throw new Error("Temporary terminator");
            return makeError("Invalid expression! Expression is of type " + memex.valueType);
    }
}
export function eval_input_expr(inpExpr, env) {
    let prmptComponent = evaluate(inpExpr.promptMessage, env);
    if (prmptComponent.type == "MemberExprVal") {
        prmptComponent = conv_memex_to_val(prmptComponent);
    }
    let prmptText = String(prmptComponent.value);
    if (prmptText.startsWith('"') && prmptText.endsWith('"')) {
        prmptText = prmptText.slice(1, -1);
    }
    else if (prmptText.startsWith("'") && prmptText.endsWith("'")) {
        prmptText = prmptText.slice(1, -1);
    }
    let val = prompt(prmptText);
    let badum;
    for (const expr of inpExpr.assigne) {
        if (!resolve_var(expr, env)) {
            return null;
        }
        const evaluatedAssigne = evaluate(expr, env);
        if (evaluatedAssigne.type == "Object") {
            if (val.startsWith('[') && val.endsWith(']')) {
                val = val.slice(1, -1);
            }
            const obj = evaluatedAssigne;
            const str = {
                type: "string",
                kind: "StringLiteral",
                value: val,
            };
            const newObj = assignStringToObj(str, obj);
            if (errorLog.length > 0) {
                return MK_NULL();
            }
            const assignmentExpr = {
                kind: "AssignmentExpr",
                assigne: expr,
                value: newObj,
            };
            badum = eval_assignment_expr(assignmentExpr, env);
        }
        else {
            let aVal;
            const runTimeVal = evaluate(expr, env);
            aVal = automaticAssignement(runTimeVal, val);
            const assignMentExpr = {
                kind: "AssignmentExpr",
                assigne: expr,
                value: aVal,
            };
            badum = eval_assignment_expr(assignMentExpr, env);
        }
    }
    return badum;
}
function resolve_var(varExpr, env) {
    switch (varExpr.kind) {
        case "Identifier":
            env.lookupVar(varExpr.symbol);
            if (errorLog.length > 0) {
                return false;
            }
            else {
                return true;
            }
        case "MemberExpr":
            env.lookupVar(varExpr.object.symbol);
            if (errorLog.length > 0) {
                return false;
            }
            else {
                return true;
            }
        case "AssignmentExpr":
            return resolve_var(varExpr.assigne, env);
        default:
            return true;
    }
}
export function eval_iteration_Stmt(iterStmt, env) {
    let closures = [];
    const Limit = 1000;
    switch (iterStmt.iterationKind) {
        case "count-controlled":
            const scope = new Environment(env);
            let startVal = evaluate(iterStmt.startVal, env);
            if (startVal.type == "MemberExprVal") {
                startVal = {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: startVal.value
                };
            }
            else {
                startVal = {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: startVal.value,
                };
            }
            let endVal = evaluate(iterStmt.endVal, env);
            if (endVal.type == "MemberExprVal") {
                endVal = {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: endVal.value
                };
            }
            else {
                endVal = {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: endVal.value,
                };
            }
            const varname = iterStmt.iterator.symbol;
            scope.declareVar(varname, startVal, false);
            let result;
            let step;
            if (iterStmt.step != undefined) {
                step = evaluate(iterStmt.step, env);
                if (step.type == "MemberExprVal") {
                    step = conv_memex_to_val(evaluate(iterStmt.step, env));
                }
                else {
                    step = {
                        type: "number",
                        numberKind: Tokens.Integer,
                        value: step.value,
                    };
                }
            }
            else {
                step = {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: 1,
                };
            }
            scope.assignVar(varname, {
                type: "number",
                numberKind: Tokens.Integer,
                value: startVal.value,
            });
            const strt = startVal.value;
            const end = endVal.value;
            let stp = step.value;
            if (stp > -1) {
                scope.assignVar(varname, {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: strt,
                });
                for (let i = strt; i <= end; i += stp) {
                    scope.assignVar(varname, {
                        type: "number",
                        numberKind: Tokens.Integer,
                        value: i,
                    });
                    closures = [new Environment(scope)];
                    //console.log("Iterstmt body: " + JSON.stringify(Array.from(iterStmt.body.entries())));
                    for (const stmt of iterStmt.body) {
                        const currentEnv = closures[closures.length - 1];
                        if (stmt.kind == "SelectionStmtDeclaration") {
                            result = eval_selectionStmt_expr(stmt, currentEnv);
                            console.log("Resultee of selection statement: " + JSON.stringify(result));
                            if (result.type !== "null" && stmt.returns.length > 0 && result.type != "end-closure") {
                                return result;
                            }
                        }
                        else if (stmt.kind == "IterationStmt") {
                            result = eval_iteration_Stmt(stmt, currentEnv);
                            const temp = stmt;
                            if (result.type !== "null" && temp.returnExpressions.length > 0 && result.type != "end-closure") {
                                return result;
                            }
                        }
                        else if (stmt.kind == "ReturnStmt") {
                            console.count("Return called");
                            return evaluate(stmt.value, currentEnv);
                        }
                        else if (stmt.kind == "ErrorExpr" || errorLog.length > 0) {
                            return MK_NULL();
                        }
                        else {
                            result = evaluate(stmt, currentEnv);
                        }
                    }
                    const iterVal = scope.lookupVar(varname).value;
                    if (iterVal > endVal.value) {
                        return result;
                    }
                }
            }
            else {
                scope.assignVar(varname, {
                    type: "number",
                    numberKind: Tokens.Integer,
                    value: strt,
                });
                for (let i = strt; i >= end; i += stp) {
                    closures = [new Environment(scope)];
                    const current = closures[closures.length - 1];
                    scope.assignVar(varname, {
                        type: "number",
                        numberKind: Tokens.Integer,
                        value: i,
                    });
                    if (scope.lookupVar(varname).value < endVal.value) {
                        return result;
                    }
                    for (const stmt of iterStmt.body) {
                        result = evaluate(stmt, current);
                        if (stmt.kind == "SelectionStmtDeclaration") {
                            if (stmt.returns.length > 0 && result.type != "end-closure" && result.type !== "null") {
                                console.log("Am i ever excecuted?");
                                return result;
                            }
                            else {
                                console.log("Am i ever excecuted?");
                                continue;
                            }
                        }
                        else if (stmt.kind == "IterationStmt") {
                            const temp = stmt;
                            if (temp.returnExpressions.length > 0 && result.type != "end-closure" && result.type !== "null") {
                                return result;
                            }
                            else {
                                continue;
                            }
                        }
                        else if (stmt.kind == "ReturnStmt") {
                            return evaluate(stmt.value, current);
                        }
                        else if (stmt.kind == "ErrorExpr") {
                            return MK_NULL();
                        }
                    }
                    if (i > end) {
                        break;
                    }
                }
            }
            return result;
        case "post-condition":
            const scpe = new Environment(env);
            let condition = evaluate(iterStmt.iterationCondition, env);
            if (condition.type == "MemberExprVal") {
                condition = conv_memex_to_val(condition);
            }
            let res;
            let iterations = 0;
            closures = [new Environment(scpe)];
            const current = closures[closures.length - 1];
            for (const stmt of iterStmt.body) {
                res = evaluate(stmt, current);
                if (stmt.kind == "ErrorExpr") {
                    return MK_NULL();
                }
                if (stmt.kind == "SelectionStmtDeclaration" && stmt.returns) {
                    console.log("Supposed return expressions: " + JSON.stringify(stmt.returns.length));
                    if (res.type != "null" && stmt.returns.length > 0 && res.type != "end-closure") {
                        console.log("Returning from an if statement :(");
                        return res;
                    }
                    else {
                        console.log("I don't know what condition this is but it certainly isn't the right one...");
                    }
                }
                else if (res.type != "null" && stmt.kind == "IterationStmt") {
                    const temp = stmt;
                    if (temp.returnExpressions.length > 0 && res.type != "end-closure") {
                        return res;
                    }
                }
                else if (stmt.kind == "ReturnStmt") {
                    const result = evaluate(stmt, current);
                    return result;
                }
            }
            condition = evaluate(iterStmt.iterationCondition, current);
            if (condition.type == "MemberExprVal") {
                condition = conv_memex_to_val(condition);
            }
            if (condition.value) {
                if (iterStmt.returnExpressions.length > 0) {
                    return evaluate(iterStmt.returnExpressions[0], current);
                }
                else {
                    return res;
                }
            }
            if (condition.type == "null") {
                return makeError("Problem evaluating condition");
            }
            else if (errorLog.length > 0) {
                return null;
            }
            iterations++;
            while (!condition.value) {
                closures = [new Environment(scpe)];
                const current = closures[closures.length - 1];
                for (const stmt of iterStmt.body) {
                    res = evaluate(stmt, current);
                    if (stmt.kind == "ErrorExpr") {
                        return MK_NULL();
                    }
                    if (stmt.kind == "SelectionStmtDeclaration" && stmt.returns) {
                        console.log("Supposed return expressions: " + JSON.stringify(stmt.returns.length));
                        if (res.type != "null" && stmt.returns.length > 0 && res.type != "end-closure") {
                            console.log("Returning from an if statement :(");
                            return res;
                        }
                        else {
                            console.log("I don't know what condition this is but it certainly isn't the right one...");
                        }
                    }
                    else if (res.type != "null" && stmt.kind == "IterationStmt") {
                        const temp = stmt;
                        if (temp.returnExpressions.length > 0 && res.type != "end-closure") {
                            return res;
                        }
                    }
                    else if (stmt.kind == "ReturnStmt") {
                        const result = evaluate(stmt, current);
                        return result;
                    }
                }
                condition = evaluate(iterStmt.iterationCondition, current);
                if (condition.type == "MemberExprVal") {
                    condition = conv_memex_to_val(condition);
                }
                if (condition.value) {
                    if (iterStmt.returnExpressions.length > 0) {
                        return evaluate(iterStmt.returnExpressions[0], current);
                    }
                    else {
                        return res;
                    }
                }
                if (condition.type == "null") {
                    return makeError("Problem evaluating condition");
                }
                else if (errorLog.length > 0) {
                    return null;
                }
                iterations++;
                if (iterations > Limit) {
                    throw "Exceeded safe limit. You may want to consider switching to a WHILE or FOR loop.";
                }
            }
            return MK_NULL();
        case "pre-condition":
            const schaufe = new Environment(env);
            let kondition = evaluate(iterStmt.iterationCondition, env);
            if (kondition.type == "MemberExprVal") {
                kondition = conv_memex_to_val(kondition);
            }
            let output;
            let iterats = 0;
            if (!kondition.value) {
                console.log("Yep, doing this...");
                return MK_NULL();
            }
            else {
                console.log("The condition in question: " + JSON.stringify(kondition));
            }
            while (kondition.value) {
                kondition = evaluate(iterStmt.iterationCondition, env);
                if (kondition.type == "MemberExprVal") {
                    kondition = conv_memex_to_val(kondition);
                }
                if (!kondition.value) {
                    break;
                }
                closures = [new Environment(schaufe)];
                const current = closures[closures.length - 1];
                for (const stmt of iterStmt.body) {
                    output = evaluate(stmt, current);
                    if (stmt.kind == "ErrorExpr") {
                        return MK_NULL();
                    }
                    else if (stmt.kind == "SelectionStmtDeclaration") {
                        if (stmt.returns.length > 0 && output.type != "null" && output.type != "end-closure") {
                            return output;
                        }
                    }
                    else if (stmt.kind == "IterationStmt") {
                        const temp = stmt;
                        if (temp.returnExpressions.length > 0 && output.type != "null" && output.type != "end-closure") {
                            return output;
                        }
                    }
                    else if (stmt.kind == "ReturnStmt") {
                        const result = evaluate(stmt, current);
                        return result;
                    }
                }
                iterats++;
                if (iterats > Limit) {
                    throw "Exceeded iteration limit. Consider switching to a FOR or REPEAT loop.";
                }
            }
            if (iterats == 0) {
                return MK_NULL();
            }
            else {
                const current = closures[closures.length - 1];
                if (iterStmt.returnExpressions.length > 0) {
                    return evaluate(iterStmt.returnExpressions[0], current);
                }
                else {
                    return output;
                }
            }
        default:
            return MK_NULL();
    }
}
function find_global_scope(env) {
    let curEnv = env;
    while (curEnv.parent !== undefined) {
        curEnv = curEnv.parent;
    }
    return curEnv;
}
export function eval_binary_expr(binop, env) {
    let lhs = evaluate(binop.left, env);
    let rhs = evaluate(binop.right, env);
    if (lhs.type == "MemberExprVal") {
        lhs = conv_memex_to_val(lhs);
    }
    if (rhs.type == "MemberExprVal") {
        rhs = conv_memex_to_val(rhs);
    }
    console.log(`Details of binary expr: ${JSON.stringify(lhs)}, ${JSON.stringify(rhs)}`);
    // Only currently support numeric + string + logic operations
    if (lhs.type == "number" && rhs.type == "number") {
        return eval_numeric_binary_expr(lhs, rhs, binop.operator);
    }
    else if ((lhs.type == "string" && rhs.type == "string") || (lhs.type == "char" && rhs.type == "char")) {
        return eval_string_binary_expr(lhs = convThisToStr(lhs), rhs = convThisToStr(rhs), binop.operator);
    }
    else if ((lhs.type == "string" && rhs.type == "char") || (rhs.type == "string" && lhs.type == "char")) {
        return eval_string_binary_expr(lhs = convThisToStr(lhs), rhs = convThisToStr(rhs), binop.operator);
    }
    else if (lhs.type == "boolean" && rhs.type == "boolean") {
        return eval_logic_binary_expr(lhs, rhs, binop.operator);
    }
    else if ((lhs.type == "null") && rhs.type == "boolean" && (binop.operator) == "NOT") {
        return eval_logic_binary_expr(lhs, rhs, binop.operator);
    }
    else if ((lhs.type != "string" && lhs.type != "char") || (rhs.type != "string" && rhs.type != "char")) {
        const types = [lhs.type, rhs.type];
        if (types.includes("string") || types.includes("string")) {
            lhs = convThisToStr(lhs);
            rhs = convThisToStr(rhs);
            return eval_string_binary_expr(lhs, rhs, binop.operator);
        }
        else {
            return makeError(`Cannot use binary operator '${binop.operator}' on operands of type ${lhs.type} and ${rhs.type}`);
        }
    }
    else {
        return makeError(`Cannot use operator '${binop.operator}' on operands of type ${lhs.type.toUpperCase()} and ${rhs.type.toUpperCase()}!`);
    }
}
export function eval_identifier(ident, env) {
    const val = env.lookupVar(ident.symbol);
    if (errorLog.length > 0) {
        return MK_NULL();
    }
    return val;
}
export function eval_string_expr(str, env) {
    //return { type:"string" , kind: "StringLiteral", value: str } as RuntimeVal;
    if (str.length == 1) {
        return { type: "char", value: str };
    }
    else {
        return { type: "string", kind: "StringLiteral", value: str };
    }
}
export function eval_assignment_expr(node, env, permission) {
    const newVal = evaluate(node.value, env);
    const identifier = node.assigne.symbol;
    if (env.constants.has(identifier)) {
        return makeError(`Cannot reassign to constant '${identifier}' because it is not a variable!`);
    }
    else {
        if (node.assigne.kind == "MemberExpr") {
            const varname = node.assigne.object.symbol;
            console.log("Assigne as member expression: " + JSON.stringify(node.assigne));
            const memex = node.assigne;
            let obj = evaluate(memex.object, env);
            const constIndex = evaluate(memex.indexComponent, env);
            let index = { ...constIndex };
            if (obj.type == "Object") {
                if (memex.secondaryIndexComponent == undefined) {
                    const ob = obj;
                    index.value = adjust_index(ob.start, ob.elements.length, index.value);
                    obj = insertAtIndex(obj, newVal, index);
                    env.assignVar(varname, obj);
                    return obj;
                }
                else {
                    console.log("Absolute raw index component: " + JSON.stringify(evaluate(memex.indexComponent, env)) + JSON.stringify(evaluate(memex.secondaryIndexComponent, env)));
                    const ob = obj;
                    const old = index.value;
                    index.value = adjust_index(ob.start, ob.elements.length, old);
                    if (index.value < 0 || errorLog.length > 0) {
                        return MK_NULL();
                    }
                    let ch = ob.elements[index.value];
                    if (ch.type == "Object") {
                        let sIC = evaluate(memex.secondaryIndexComponent, env);
                        const childOb = ob.elements[index.value];
                        sIC.value = adjust_index(childOb.start, childOb.elements.length, sIC.value);
                        if (errorLog.length > 0) {
                            return MK_NULL();
                        }
                        const replacing = childOb.elements[sIC.value];
                        let objType = obj.type.toUpperCase();
                        if (objType === "MEMBEREXPRVAL") {
                            objType = (conv_memex_to_val(obj).type).toUpperCase();
                        }
                        if (objType === "OBJECT") {
                            objType = Tokens[obj.dataType].toUpperCase();
                        }
                        if (!ConfirmRaw(newVal, replacing)) {
                            return makeError(`Cannot assign value of data type ${newVal.type.toUpperCase()} to
                  data type ${objType}!`);
                        }
                        obj = insertAtIndex(obj, newVal, index, sIC);
                        env.assignVar(varname, obj);
                        console.log("Assigned object: " + JSON.stringify(obj));
                        return obj;
                    }
                    else if (ch.type == "string") {
                        const constSIC = evaluate(memex.secondaryIndexComponent, env);
                        let sIC = { ...constSIC };
                        ch = ch;
                        sIC.value = adjust_index(1, ch.value.length, sIC.value);
                        if (!Confirm(newVal, Tokens.Char)) {
                            return makeError(`Cannot assign value of data type ${newVal.type.toUpperCase()} to data type CHAR!`);
                        }
                        obj = insertAtIndex(obj, newVal, index, sIC);
                        env.assignVar(varname, obj);
                        return obj;
                    }
                    else {
                        return makeError("Cannot mutate data that is not a string or object literal!");
                    }
                }
            }
            else if (obj.type == "string") {
                if (memex.secondaryIndexComponent !== undefined) {
                    return makeError("Cannot access the substring of a CHAR value!");
                }
                else {
                    index.value = adjust_index(1, obj.value.length, index.value);
                    if (!Confirm(newVal, Tokens.Char)) {
                        return makeError(`Cannot assign value of data type ${newVal.type.toUpperCase()} to data type CHAR!`);
                    }
                    const newStr = insertAtIndex(obj, newVal, index);
                    env.assignVar(varname, newStr);
                    return newStr;
                }
            }
            else {
                return makeError("Object is neither an array nor a string. It is " + JSON.stringify(memex.object));
            }
        }
        else if (node.assigne.kind == "Identifier") {
            const varname = node.assigne.symbol;
            const varType = env.lookupVar(varname);
            if (!ConfirmRaw(newVal, varType)) {
                console.log("Trying to assign: " + JSON.stringify(newVal));
                console.log("To assigne: " + JSON.stringify(varType));
                console.log("");
                let newValMsg = (newVal.type == "Object") ? String(Tokens[newVal.dataType]) : String(newVal.type);
                let varValMsg = (varType.type == "Object") ? String(Tokens[varType.dataType]) : String(varType.type);
                newValMsg = newValMsg.toUpperCase();
                varValMsg = varValMsg.toUpperCase();
                return makeError(`Cannot assign value of type ${newValMsg} to variable of type ${varValMsg}!`);
            }
            else {
                if (varType.type == "Object" && newVal.type == "Object") {
                    const varObj = varType;
                    const newObj = newVal;
                    if ((varObj.elements.length != newObj.elements.length) && permission == undefined) {
                        return makeError(`Assigne has ${varObj.elements.length} children but assigning object literal has ${newObj.elements.length} children!`);
                    }
                }
                const aC = auto_caster(newVal, varType);
                env.assignVar(varname, aC);
                return aC;
            }
        }
        else {
            console.log("Assignment expr: " + JSON.stringify(node));
            return makeError("Can only reassign existing identifiers, not raw expressions...");
        }
    }
}
function auto_caster(getting, expecting) {
    if (expecting.type == "number") {
        return {
            type: "number",
            numberKind: expecting.numberKind,
            value: getting.value,
        };
    }
    else if (expecting.type == "string") {
        if (getting.type == "string") {
            return getting;
        }
        else if (getting.type == "char") {
            return {
                type: "string",
                kind: "StringLiteral",
                value: getting.value,
            };
        }
        else {
            return makeError(`Cannot assign value of type ${getting.type} to data type STRING!`);
        }
    }
    else if (expecting.type == "Object") {
        return {
            type: "Object",
            elements: getting.elements,
            start: expecting.start,
            end: expecting.end,
            dataType: expecting.dataType,
        };
    }
    else {
        return getting;
    }
}
function ConfirmRaw(getting, expecting) {
    let better = expecting;
    if (better.type == "MemberExprVal") {
        better = conv_memex_to_val(better);
    }
    if (getting.type == "Object" && expecting.type != "Object") {
        makeError("Assigne is not an object literal!");
        return false;
    }
    switch (better.type) {
        case "Object":
            if (getting.type != "Object") {
                makeError("Assigning value is not an object literal!");
                return false;
            }
            else {
                return Confirm(getting, better.dataType);
            }
        case "boolean":
            return Confirm(getting, Tokens.Boolean);
        case "char":
            return Confirm(getting, Tokens.Char);
        case "number":
            return Confirm(getting, better.numberKind);
        case "string":
            return Confirm(getting, Tokens.String);
        default:
            return true;
    }
}
function insertAtIndex(object, newVal, index, secondaryIndex) {
    if (object.type == "Object") {
        if (!Confirm(newVal, object.dataType)) {
            return makeError(`Value of data type ${newVal.type.toUpperCase()} cannot be assigned to object literal
        of type ${Tokens[object.dataType].toUpperCase()}!`);
        }
        else {
            if (secondaryIndex == undefined) {
                let tempArr = object.elements;
                tempArr.splice(index.value, 1, newVal);
                let newObject = object;
                newObject.elements = tempArr;
                return newObject;
            }
            else {
                let parentObject = object;
                let childObject = parentObject.elements[index.value];
                if (childObject.type == "Object") {
                    childObject = childObject;
                    if (!Confirm(newVal, childObject.dataType)) {
                        return makeError(`Cannot assign value of data type ${newVal.type.toUpperCase()} to data type ${Tokens[childObject.dataType].toUpperCase()}!`);
                    }
                    childObject.elements[secondaryIndex.value] = newVal;
                    return parentObject;
                }
                else if (childObject.type == "string") {
                    if (!Confirm(newVal, Tokens.Char)) {
                        return makeError(`Cannot assign value of data type ${newVal.type.toUpperCase()} to data type CHAR!`);
                    }
                    let str = childObject.value;
                    const secInd = secondaryIndex.value;
                    str = str.slice(0, secInd) + newVal.value + str.slice(secInd + 1);
                    childObject.value = str;
                    return parentObject;
                }
                else {
                    return makeError("Detected as being whatever this is");
                }
            }
        }
    }
    else if (object.type == "string") {
        console.log("Object type: " + object.type);
        let aidVal = newVal;
        if (aidVal.value.length == 1) {
            aidVal = { type: "char", value: aidVal.value };
        }
        if (!Confirm(aidVal, Tokens.Char)) {
            return makeError(`Cannot assign value of data type ${aidVal.type.toUpperCase()} to data type CHAR!`);
        }
        else {
            if (secondaryIndex !== undefined) {
                return makeError("Cannot access the substring of data type CHAR!");
            }
            else {
                let newStr = String(object.value);
                const indexVal = index.value;
                newStr = newStr.slice(0, indexVal) + newVal.value + newStr.slice(indexVal + 1);
                return {
                    type: "string",
                    kind: "StringLiteral",
                    value: newStr,
                };
            }
        }
    }
}
function findlengthfromrange(start, end) {
    const absDiff = (end - start);
    if (absDiff < start) {
        return absDiff + 1;
    }
    else {
        return absDiff;
    }
}
function fill_empty_obj(dataType, start, end, innerStart, innerEnd) {
    let iterVal = MK_NULL();
    let elements = [];
    switch (dataType) {
        case Tokens.String:
            iterVal = {
                type: "string",
                kind: "StringLiteral",
                value: " "
            };
            break;
        case Tokens.Char:
            iterVal = {
                type: "char",
                value: ' '
            };
            break;
        case Tokens.Integer:
            iterVal = {
                type: "number",
                numberKind: Tokens.Integer,
                value: 0
            };
            break;
        case Tokens.Real:
            iterVal = {
                type: "number",
                numberKind: Tokens.Real,
                value: 0,
            };
            break;
        case Tokens.Boolean:
            iterVal = {
                type: "boolean",
                value: false,
            };
            break;
        default:
            iterVal = MK_NULL();
    }
    const iterations = (end - start) + 1;
    if (innerStart == undefined && innerEnd == undefined) {
        for (let i = 0; i < iterations; i++) {
            elements.push(iterVal);
        }
    }
    else {
        for (let i = 0; i < iterations; i++) {
            elements.push(fill_empty_obj(dataType, innerStart, innerEnd));
        }
    }
    return {
        type: "Object",
        elements: elements,
        start: start,
        end: end,
        dataType: dataType,
    };
}
export function eval_object_expr(obj, env) {
    console.log("Object expression: " + JSON.stringify(obj));
    if (obj.declaring == "Range" && obj.elements.length == 0) {
        if (obj.is2dArr) {
            let start = evaluate(obj.start, env);
            if (start.type == "MemberExprVal") {
                start = conv_memex_to_val(start);
            }
            if (!isint(start.value)) {
                return makeError(`Start value '${start.value}' is not an integer!`);
            }
            let end = evaluate(obj.end, env);
            if (end.type == "MemberExprVal") {
                end = conv_memex_to_val(end);
            }
            if (!isint(end.value)) {
                return makeError(`Start value '${end.value}' is not an integer!`);
            }
            let innerStart = evaluate(obj.innerStart, env);
            if (innerStart.type == "MemberExprVal") {
                innerStart = conv_memex_to_val(innerStart);
            }
            if (!isint(innerStart.value)) {
                return makeError(`Start value '${innerStart.value}' is not an integer!`);
            }
            let innerEnd = evaluate(obj.innerEnd, env);
            if (innerEnd.type == "MemberExprVal") {
                innerEnd = conv_memex_to_val(innerEnd);
            }
            if (!isint(innerEnd.value)) {
                return makeError(`End value '${innerEnd.value}' is not an integer!`);
            }
            return fill_empty_obj(obj.dataType, start.value, end.value, innerStart.value, innerEnd.value);
        }
        else {
            let start = evaluate(obj.start, env);
            if (start.type == "MemberExprVal") {
                start = conv_memex_to_val(start);
            }
            if (!isint(start.value)) {
                return makeError(`Start value '${start.value}' is not an integer!`);
            }
            let end = evaluate(obj.end, env);
            if (end.type == "MemberExprVal") {
                end = conv_memex_to_val(end);
            }
            if (!isint(end.value)) {
                return makeError(`End value '${end.value} is not an integer!'`);
            }
            const objVal = fill_empty_obj(obj.dataType, start.value, end.value);
            return objVal;
        }
    }
    else {
        let values = [];
        for (const expr of obj.elements) {
            let evaluated = evaluate(expr, env);
            if (evaluated.type == "MemberExprVal") {
                evaluated = conv_memex_to_val(evaluated);
            }
            values.push(evaluated);
        }
        let dt;
        if (values[0].type == "number") {
            let isReal = false;
            for (const val of values) {
                if (!isint(val.value)) {
                    isReal = true;
                }
            }
            dt = isReal ? Tokens.Real : Tokens.Integer;
        }
        else if (values[0].type == "string" || values[0].type == "char") {
            let isString = false;
            for (const val of values) {
                if (val.value.length != 1) {
                    isString = true;
                }
            }
            dt = isString ? Tokens.String : Tokens.Char;
        }
        else {
            dt = conv_runtimeval_dt(values[0]);
        }
        for (const val of values) {
            if (!Confirm(val, dt)) {
                return makeError("Item(s) in object literal does not match type! Type was " + Tokens[dt]);
                ;
            }
        }
        return {
            type: "Object",
            elements: values,
            start: 1,
            end: values.length,
            dataType: dt,
        };
    }
}
function conv_runtimeval_dt(r) {
    switch (r.type) {
        case "MemberExprVal":
            const n = conv_memex_to_val(r);
            return (conv_runtimeval_dt(n));
        case "Object":
            return r.dataType;
        case "boolean":
            return Tokens.Boolean;
        case "char":
            return Tokens.Char;
        case "string":
            return Tokens.String;
        case "number":
            return r.numberKind;
        default:
            return Tokens.Null;
    }
}
export function eval_member_expr(node, env) {
    console.log("I was called when node was: " + JSON.stringify(node));
    if (node.secondaryIndexComponent === undefined) {
        const evaluatedParent = evaluate(node.object, env);
        if (evaluatedParent.type == "Object") {
            const evPar = evaluatedParent;
            let index = evaluate(node.indexComponent, env).value;
            if (!isint(index)) {
                return makeError(`Index ${index} is not an integer!`);
            }
            index = adjust_index(evPar.start, evPar.elements.length, index);
            if (errorLog.length > 0) {
                return MK_NULL();
            }
            return evPar.elements[index];
        }
        else if (evaluatedParent.type == "string") {
            const evPar = evaluatedParent;
            let index = evaluate(node.indexComponent, env).value;
            index = adjust_index(1, evPar.value.length, index);
            if (errorLog.length > 0) {
                return MK_NULL();
            }
            const char = {
                type: "char",
                value: evPar.value[index]
            };
            return char;
        }
        else if (evaluatedParent.type == "function") {
            return makeError(JSON.stringify(evaluatedParent));
        }
        else {
            console.log("Parent object was: " + JSON.stringify(evaluatedParent) + " and member expression was " + JSON.stringify(node));
            return makeError("Parent object is neither a string literal or object literal");
        }
    }
    else {
        const temp = {
            kind: "MemberExpr",
            object: node.object,
            indexComponent: node.indexComponent
        };
        const parentObj = eval_member_expr(temp, env);
        if (parentObj.type == "Object") {
            let index = evaluate(node.secondaryIndexComponent, env).value;
            if (!isint(index)) {
                return makeError(`Index ${index} is not an integer!`);
            }
            index = adjust_index(parentObj.start, parentObj.elements.length, index);
            if (errorLog.length > 0) {
                return MK_NULL();
            }
            return parentObj.elements[index];
        }
        else if (parentObj.type == "string") {
            let index = evaluate(node.secondaryIndexComponent, env).value;
            index = adjust_index(1, parentObj.value.length, index);
            return {
                type: "char",
                value: String(parentObj.value[index])
            };
        }
        else {
            return makeError("Parent object is neither string literal nor object literal!");
        }
    }
}
export function eval_char_string(expr, env) {
    return {
        type: "char",
        value: String(expr.text),
    };
}
export function adjust_index(start, len, i) {
    const newIndex = i - start;
    const end = (start + len) - 1;
    if (i < start || newIndex > end) {
        makeError("Index out of range because i was " + i + " And start was: " + start + " and length was: " + len);
    }
    return newIndex;
}
function Confirm(runtimeval, returnType) {
    let evaluatedType;
    console.log("Runtime val: " + JSON.stringify(runtimeval));
    switch (runtimeval.type) {
        case "MemberExprVal":
            const memex = conv_memex_to_val(runtimeval);
            return Confirm(memex, returnType);
        case "Object":
            evaluatedType = runtimeval.dataType;
            break;
        case "boolean":
            evaluatedType = Tokens.Boolean;
            break;
        case "string":
            const stringText = runtimeval.value;
            if (stringText.length == 1) {
                evaluatedType = Tokens.Char;
            }
            else {
                evaluatedType = Tokens.String;
            }
            break;
        case "char":
            evaluatedType = Tokens.Char;
            break;
        case "number":
            const num = runtimeval.value;
            if (isint(num)) {
                evaluatedType = Tokens.Integer;
            }
            else {
                evaluatedType = Tokens.Real;
            }
            break;
        default:
            evaluatedType = Tokens.Null;
    }
    console.log("Evaluated type: " + Tokens[evaluatedType]);
    if (evaluatedType !== returnType) {
        if (returnType == Tokens.Real && evaluatedType == Tokens.Integer) {
            return true;
        }
        else if (returnType == Tokens.String && evaluatedType == Tokens.Char) {
            return true;
        }
        else {
            if (returnType == Tokens.Any) {
                return true;
            }
            else {
                makeError(`Values is not of type ${Tokens[returnType].toUpperCase()}!`);
                return false;
            }
        }
    }
    else {
        return true;
    }
}
function maxeval(expr, env) {
    const temp = evaluate(expr, env);
    if (temp.type == "MemberExprVal") {
        return conv_memex_to_val(temp);
    }
    else {
        return temp;
    }
}
export function eval_call_expr(expr, env) {
    const args = expr.args.map((arg) => maxeval(arg, env));
    const fn = evaluate(expr.caller, env);
    if (errorLog.length > 0) {
        return MK_NULL();
    }
    if (fn.type == "native-fn") {
        const nativeFnValue = fn;
        const result = fn.call(args, env);
        return result;
    }
    else if (fn.type = "function") {
        const func = fn;
        const funcProcComponent = eval_identifier(expr.caller, env);
        if (expr.wasCallKeywordUsed && !funcProcComponent.isProcedure) {
            return makeError("Remove 'CALL' keyword");
        }
        if (!expr.wasCallKeywordUsed && funcProcComponent.isProcedure) {
            return makeError("Must use 'CALL' keyword when calling procedures!");
        }
        const scope = new Environment(func.declarationEnv);
        console.log("Declaration environment: ");
        if (func.parameters.size != args.length) {
            return makeError(`Expected ${func.parameters.size} arguments, but got ${args.length}`);
        }
        if (func.parameters !== null) {
            if (func.parameters.size > 0) {
                console.log("Function arguments: " + JSON.stringify(args));
                for (let i = 0; i < args.length; i++) {
                    let arg = args[i];
                    const parameter = Array.from(func.parameters.entries())[i];
                    if (arg.type == "MemberExprVal") {
                        arg = conv_memex_to_val(arg);
                    }
                    let paramType;
                    if (parameter[1].kind == "ObjectLiteral") {
                        if (arg.type != "Object") {
                            return makeError("Expecting argument to be object literal!");
                        }
                        if (!Confirm(arg, parameter[1].dataType)) {
                            return makeError(`Object literal is not of type ${Tokens[parameter[1].dataType].toUpperCase()}`);
                        }
                        paramType = {
                            type: "Object",
                            elements: arg.elements,
                            start: arg.start,
                            end: arg.end,
                            dataType: parameter[1].dataType,
                        };
                    }
                    else {
                        paramType = evaluate(parameter[1], scope);
                        console.log("Apparently param type is: " + JSON.stringify(parameter[1]));
                    }
                    if (!ConfirmRaw(arg, paramType)) {
                        let paramTypeMsg = String(paramType.type);
                        if (paramTypeMsg == "number") {
                            paramTypeMsg = Tokens[paramType.numberKind];
                        }
                        else if (paramTypeMsg == "Object") {
                            paramTypeMsg = Tokens[paramType.dataType];
                        }
                        paramTypeMsg = paramTypeMsg.toUpperCase();
                        if (errorLog.length == 0) {
                            return makeError(`Argument '${JSON.stringify(arg.value)}' is not of type ${paramTypeMsg}`);
                        }
                        else {
                            return MK_NULL();
                        }
                    }
                }
                for (let i = 0; i < func.parameters.size; i++) {
                    const varname = Array.from(func.parameters.keys())[i];
                    scope.declareVar(varname, args[i], false);
                }
                console.log("Scope variables: " + JSON.stringify(Array.from(scope.variables.entries())));
            }
        }
        let result = MK_NULL();
        for (const stmt of func.body) {
            console.log("Stmt kind: " + stmt.kind);
            if (stmt.kind == "SelectionStmtDeclaration") {
                result = evaluate(stmt, scope);
                if (result.type !== "null" && stmt.returns.length > 0 && result.type != "end-closure") {
                    const returnType = evaluate(func.returnType, scope);
                    if (!func.isProcedure) {
                        if (returnType.type == "Object") {
                            if (!confirmForReturning(result, func.returnType, scope)) {
                                return MK_NULL();
                            }
                            else {
                                return result;
                            }
                        }
                        else {
                            const rt = conv_runtimeval_dt(returnType);
                            if (Confirm(result, rt)) {
                                console.log("Selection statement fully evaluated!");
                                return result;
                            }
                            else {
                                return makeError(`Value is not of type ${Tokens[rt]} because
                  it is of type ${JSON.stringify(result)}!`);
                            }
                        }
                    }
                    else {
                        return makeError("Procedures may not return a value!");
                    }
                }
            }
            else if (stmt.kind == "IterationStmt") {
                result = evaluate(stmt, scope);
                const temp = stmt;
                console.log("Result of selection statement: " + JSON.stringify(result));
                if (result.type !== "null" && temp.returnExpressions.length > 0 && result.type != "end-closure") {
                    if (!func.isProcedure) {
                        if (!confirmForReturning(result, func.returnType, scope)) {
                            return MK_NULL();
                        }
                        else {
                            return result;
                        }
                    }
                    else {
                        return makeError("Procedures may not return a value!");
                    }
                }
            }
            else if (stmt.kind == "ReturnStmt") {
                if (func.isProcedure) {
                    return makeError("Procedures may not return a value!");
                }
                else {
                    result = evaluate(stmt.value, scope);
                    if (!confirmForReturning(result, func.returnType, scope)) {
                        return MK_NULL();
                    }
                    else {
                        return result;
                    }
                }
            }
            else {
                result = evaluate(stmt, scope);
            }
        }
        if (!func.isProcedure) {
            for (const expr of func.returnExpressions) {
                result = evaluate(expr, scope);
                if (result.type == "MemberExprVal") {
                    result = conv_memex_to_val(result);
                }
                const returnType = conv_runtimeval_dt(evaluate(func.returnType, scope));
                const returnToken = conv_dt_runtimeval(returnType);
                result = auto_caster(result, returnToken);
                if (!func.isProcedure && !kindMatchesToken(result, returnType, env)) {
                    makeError(`Return type is not ${result.type},
            !`);
                }
            }
        }
        return result;
    }
    else {
        return makeError(`Function does not exist!`);
    }
}
function confirmForReturning(getting, expecting, env) {
    if (expecting.kind == "ObjectLiteral") {
        if (getting.type != "Object") {
            makeError("Value returned is not an object literal!");
        }
        const r = expecting.dataType;
        console.log("Evaluated result: " + Tokens[getting.dataType]);
        console.log("Evaluated result: type: " + JSON.stringify(Tokens[r]));
        if (Confirm(getting, r)) {
            return true;
        }
        else {
            makeError(`Returned value is not of type ${Tokens[r].toUpperCase()}`);
            return false;
        }
    }
    else {
        const rtv = evaluate(expecting, env);
        if (ConfirmRaw(getting, rtv)) {
            return true;
        }
        else {
            return false;
        }
    }
}
function conv_dt_runtimeval(dt) {
    switch (dt) {
        case Tokens.Integer:
            return { type: "number", numberKind: dt, value: 0 };
        case Tokens.Real:
            return { type: "number", numberKind: dt, value: 0 };
        case Tokens.String:
            return { type: "string", kind: "StringLiteral", value: " " };
        case Tokens.Char:
            return { type: "char", value: ' ' };
        case Tokens.Boolean:
            return { type: "boolean", value: false };
        default:
            return MK_NULL();
    }
}
function assess_dataType_fromstring(str) {
    if (str.startsWith('"') && str.endsWith('"')) {
        return Tokens.String;
    }
    else if (str.startsWith("'") && str.endsWith("'")) {
        return Tokens.Char;
    }
    else if (isNumeric(str)) {
        if (isint(Number(str))) {
            return Tokens.Integer;
        }
        else {
            return Tokens.Real;
        }
    }
    else if (str == "TRUE" || str == "FALSE") {
        return Tokens.Boolean;
    }
    else if (str == "NULL") {
        return Tokens.Null;
    }
    else {
        return Tokens.Any;
    }
}
function isNumeric(str) {
    return !isNaN(Number(str)) && str.trim() !== '';
}
function kindMatchesToken(val, tk, env) {
    const kind = val.type;
    switch (kind) {
        case "string":
            if (tk == Tokens.String) {
                return true;
            }
            else {
                return false;
            }
        case "char":
            if (tk == Tokens.Char) {
                return true;
            }
            else {
                return false;
            }
        case "number":
            const numKind = val.numberKind;
            if (tk == numKind) {
                return true;
            }
            else {
                return false;
            }
        case "boolean":
            if (tk == Tokens.Boolean) {
                return true;
            }
            else {
                return false;
            }
        case "null":
            if (tk == Tokens.Null) {
                return true;
            }
            else {
                return false;
            }
        case "Object":
            if (tk == val.dataType) {
                return true;
            }
            else {
                return false;
            }
        case "MemberExprVal":
            const temp = conv_memex_to_val(val);
            return kindMatchesToken(temp, tk, env);
        case "function":
            const rtv = evaluate(val.returnType, env);
            const rtk = conv_runtimeval_dt(rtv);
            if (tk == rtk) {
                return true;
            }
            else {
                return false;
            }
        case "native-fn":
            console.log("Native function return types cannot be evaluated yet :(");
            return true;
        default:
            return false;
    }
}
export function eval_unary_expr(unaryExpr, env) {
    let val = evaluate(unaryExpr.right, env);
    if (val.type == "MemberExprVal") {
        val = conv_memex_to_val(val);
    }
    if (unaryExpr.operator == '+') {
        return val;
    }
    else if (unaryExpr.operator == '-') {
        return {
            type: "number",
            numberKind: val.numberKind,
            value: -val.value,
        };
    }
    else {
        makeError("Unrecognised unary operator!");
    }
}
function stringifyPlus(str, rTVT) {
    let toUse = JSON.stringify(str);
    if (toUse.startsWith('"') && toUse.endsWith('"') && rTVT.type !== "string") {
        toUse = toUse.slice(1, -1);
    }
    else if (toUse.startsWith("'") && toUse.endsWith("'") && rTVT.type !== "char") {
        toUse = toUse.slice(1, -1);
    }
    else if (toUse.startsWith['['] && toUse.endsWith(']') && rTVT.type !== "Object") {
        toUse = toUse.slice(1, -1);
    }
    else if (toUse.startsWith('"') && toUse.endsWith('"') && rTVT.type == "Object") {
        toUse = toUse.slice(1, -1);
    }
    return toUse;
}
function CustomWrap(symbol, word) {
    if (!(word.startsWith(symbol) && word.endsWith(symbol))) {
        return symbol + word + symbol;
    }
    else {
        return word;
    }
}
function convThisToStr(val) {
    let value = "";
    if (val === undefined) {
        console.log("Val was: " + JSON.stringify(val));
    }
    switch (val.type) {
        case "string":
            value = val.value;
            value = CustomWrap('"', value);
            break;
        case "MemberExprVal":
            let memex = val;
            if (memex.type == "MemberExprVal") {
                memex = conv_memex_to_val(memex);
            }
            return convThisToStr(memex);
        case "Object":
            value = '[';
            const obj = val;
            console.log("Object val: " + JSON.stringify(obj));
            for (const elm of obj.elements) {
                let toAdd = stringifyPlus(convThisToStr(elm).value, elm);
                if (elm.type == "Object" && toAdd.startsWith('"') && toAdd.endsWith('"')) {
                    toAdd = toAdd.slice(1, -1);
                }
                console.log("To add: " + toAdd);
                value += toAdd;
                value += ",";
            }
            value = value.substring(0, value.length - 1);
            value += ']';
            break;
        case "boolean":
            value = String(val.value).toUpperCase();
            break;
        case "char":
            value = String(val.value);
            value = CustomWrap("'", value);
            break;
        case "number":
            value = String(val.value);
            break;
        default:
            value = JSON.stringify(val);
    }
    return MK_STRING(value);
}
