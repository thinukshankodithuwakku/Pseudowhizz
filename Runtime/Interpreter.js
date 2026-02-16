import { eval_new_memberExpr, eval_return_stmt, eval_char_string, eval_unary_expr, eval_input_expr, eval_output_expr, eval_iteration_Stmt, eval_call_expr, eval_identifier, eval_binary_expr, eval_string_expr, eval_assignment_expr, eval_selectionStmt_expr, eval_fileUse_expr, eval_new_objectVal, eval_file_name_expr } from "./Eval/Expressions.js";
import { eval_file_statement, eval_fn_declaration, eval_program, eval_var_declaration } from "./Eval/Statements.js";
import { Tokens } from "../Frontend/Lexer.js";
import { errorLog, pauseLog, makeError, my_state } from "../Main.js";
import PCON from "../Frontend/PCON.js";
const pcon = new PCON;
/**
 * Evaulate pure numeric operations with binary operators.
 */
export async function evaluate(astNode, env, StackFrames) {
    const SF_BYREF = structuredClone(StackFrames);
    const avoid = ["FunctionDeclaration", "SelectionStmtDeclaration", "IterationStmt", "StringLiteral", "CharString", "NumericLiteral", "Identifier", "OutputExpr", "InputExpr", "ReturnStmt"];
    if (!avoid.includes(astNode.kind))
        SF_BYREF.push({ expr: pcon.stringify(astNode), ln: astNode.ln, context: env.context });
    if ((pauseLog.length > 0 || astNode == null || errorLog.length > 0 || astNode.kind == "ErrorExpr") && my_state == "interpreting") {
        return {
            type: "null",
            value: null,
        };
    }
    else {
        switch (astNode.kind) {
            case "NumericLiteral":
                let NK = astNode.numberKind;
                const value = (astNode.value);
                if (NK == undefined) {
                    if (isInt(value)) {
                        NK = Tokens.Integer;
                    }
                    else {
                        NK = Tokens.Real;
                    }
                }
                if (isNaN(value)) {
                    return makeError("Evaluation of expression results in non-real value!", "Math");
                }
                else if (!isFinite(value)) {
                    return makeError("Evaluation of expression results in non-finite value!", "Math");
                }
                else {
                    return {
                        value: value,
                        numberKind: NK,
                        type: "number",
                        ln: astNode.ln,
                    };
                }
            case "Identifier":
                return await eval_identifier(astNode, env, SF_BYREF);
            case "AssignmentExpr":
                return await eval_assignment_expr(astNode, env, SF_BYREF);
            case "BinaryExpr":
                return await eval_binary_expr(astNode, env, SF_BYREF);
            case "StringLiteral":
                const textComponentHolder = astNode;
                let expr = await eval_string_expr(textComponentHolder.text, env);
                expr.ln = textComponentHolder.ln;
                return expr;
            case "Program":
                const program = astNode;
                const err = { kind: "ErrorExpr" };
                if (program.body.length == 1 && program.body[0] == err) {
                    return {
                        type: "null",
                        value: null,
                    };
                }
                else {
                    return await eval_program(astNode, env);
                }
            case "CharString":
                return await eval_char_string(astNode, env);
            case "VarDeclaration":
                return await eval_var_declaration(astNode, env, SF_BYREF);
            case "FunctionDeclaration":
                return await eval_fn_declaration(astNode, env);
            case "ObjectLiteral":
                return await eval_new_objectVal(astNode, env, SF_BYREF);
            case "CallExpr":
                return await eval_call_expr(astNode, env, SF_BYREF);
            case "CommentExpr":
                const com = astNode;
                return { type: "string", value: com.value };
            case "MemberExpr":
                return await eval_new_memberExpr(astNode, env, SF_BYREF);
            case "SelectionStmtDeclaration":
                return await eval_selectionStmt_expr(astNode, env, SF_BYREF);
            case "IterationStmt":
                return await eval_iteration_Stmt(astNode, env, SF_BYREF);
            case "OutputExpr":
                return await eval_output_expr(astNode, env, SF_BYREF);
            case "InputExpr":
                return await eval_input_expr(astNode, env, SF_BYREF);
            case "FileExpr":
                return await eval_file_statement(astNode, env, SF_BYREF);
            case "FileUse":
                //throw new Error("Problem detected?");
                return await eval_fileUse_expr(astNode, env, SF_BYREF);
            case "UnaryExpr":
                return await eval_unary_expr(astNode, env, SF_BYREF);
            case "EndClosureExpr":
                return {
                    type: "end-closure"
                };
            case "NullLiteral":
                return {
                    type: "null",
                    value: null,
                };
            case "ReturnStmt":
                const returnStmt = astNode;
                return await eval_return_stmt(returnStmt, env, SF_BYREF);
            case "FileNameExpr":
                return await eval_file_name_expr(astNode, env);
            default:
                throw new Error(`AST node ${astNode.kind} not yet setup for interpretation`);
        }
    }
}
function isInt(value) {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num);
}
