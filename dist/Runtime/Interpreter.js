import { eval_char_string, eval_unary_expr, eval_input_expr, eval_output_expr, eval_iteration_Stmt, eval_call_expr, eval_member_expr, eval_object_expr, eval_identifier, eval_binary_expr, eval_string_expr, eval_assignment_expr, eval_selectionStmt_expr, eval_fileUse_expr } from "./Eval/Expressions.js";
import { eval_file_statement, eval_fn_declaration, eval_program, eval_var_declaration } from "./Eval/Statements.js";
import { Tokens } from "../Frontend/Lexer.js";
import { errorLog } from "../Main.js";
/**
 * Evaulate pure numeric operations with binary operators.
 */
export function evaluate(astNode, env) {
    if (astNode.kind == "ErrorExpr" || astNode == null || errorLog.length > 0) {
        return {
            type: "null",
            value: null,
        };
    }
    else {
        console.log("Ideally you should not be seeing this...");
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
                return {
                    value: value,
                    numberKind: NK,
                    type: "number",
                };
            case "Identifier":
                return eval_identifier(astNode, env);
            case "AssignmentExpr":
                console.log("Maybe it's the way you're dressed?");
                return eval_assignment_expr(astNode, env);
            case "BinaryExpr":
                console.log("Evaluating binary expression");
                return eval_binary_expr(astNode, env);
            case "StringLiteral":
                const textComponentHolder = astNode;
                return eval_string_expr(textComponentHolder.text, env);
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
                    return eval_program(astNode, env);
                }
            case "CharString":
                return eval_char_string(astNode, env);
            case "VarDeclaration":
                return eval_var_declaration(astNode, env);
            case "FunctionDeclaration":
                return eval_fn_declaration(astNode, env);
            case "ObjectLiteral":
                const astObjectLiteral = astNode;
                return eval_object_expr(astObjectLiteral, env);
            case "CallExpr":
                console.log("I see this as a call expression!");
                return eval_call_expr(astNode, env);
            case "MemberExpr":
                return eval_member_expr(astNode, env);
            case "SelectionStmtDeclaration":
                return eval_selectionStmt_expr(astNode, env);
            case "IterationStmt":
                return eval_iteration_Stmt(astNode, env);
            case "OutputExpr":
                return eval_output_expr(astNode, env);
            case "InputExpr":
                return eval_input_expr(astNode, env);
            case "FileExpr":
                return eval_file_statement(astNode, env);
            case "FileUse":
                return eval_fileUse_expr(astNode, env);
            case "UnaryExpr":
                return eval_unary_expr(astNode, env);
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
                return evaluate(returnStmt.value, env);
            default:
                console.log("AST node kind: " + astNode.kind);
                throw "AST node not yet setup for interpretation";
        }
    }
}
function isInt(value) {
    const num = Number(value);
    return !isNaN(num) && Number.isInteger(num);
}
