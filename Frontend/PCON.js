import { Tokens } from "./Lexer.js";
export default class PCON {
    stringify(expr) {
        switch (expr.kind) {
            case "AssignmentExpr":
                return this.str_assignment_expr(expr);
            case "BinaryExpr":
                return this.str_binary_expr(expr);
            case "CallExpr":
                return this.str_call_expr(expr);
            case "ReturnStmt":
                return `RETURN ${this.concatenate(expr.value)}`;
            case "OutputExpr":
                return `OUTPUT ${this.concatenate(expr.value)}`;
            case "InputExpr":
                return `INPUT ${this.concatenate(expr.promptMessage)}`;
            case "BooleanLiteral":
                return `TRUE`;
            case "CharString":
                return `'${expr.text}'`;
            case "StringLiteral":
                return `"${expr.text}"`;
            case "NumericLiteral":
                return String(expr.value);
            case "UnaryExpr":
                return `${expr.operator}${this.stringify(expr.right)}`;
            case "FileExpr":
                return this.str_file_expr(expr);
            case "FileUse":
                return this.str_fileUse_expr(expr);
            case "MemberExpr":
                return this.str_member_expr(expr);
            case "Identifier":
                return expr.symbol;
            case "ObjectLiteral":
                return this.str_obj_literal(expr);
            case "VarDeclaration":
                return this.str_var_decl(expr);
            case "FileNameExpr":
                return expr.value;
            case "IterationStmt":
                return this.str_iter_stmt(expr);
            default:
                return '';
        }
    }
    str_iter_stmt(s) {
        switch (s.iterationKind) {
            case "count-controlled":
                return `FOR ${s.iterator.symbol} ← ${this.stringify(s.startVal)} TO ${this.stringify(s.endVal)}`;
            case "post-condition":
                return `UNTIL ${this.stringify(s.iterationCondition)}`;
            case "pre-condition":
                return `WHILE ${this.stringify(s.iterationCondition)} DO`;
            default:
                return ``;
        }
    }
    str_obj_literal(e) {
        return '[' + this.concatenate(e.exprs) + ']';
    }
    tkn_to_string(tk) {
        switch (tk) {
            case Tokens.Char:
                return "CHAR";
            case Tokens.Boolean:
                return "BOOLEAN";
            case Tokens.Integer:
                return "INTEGER";
            case Tokens.Real:
                return "REAL";
            default:
                return "STRING";
        }
    }
    str_var_decl(decl) {
        if (decl.constant) {
            return `CONSTANT ${decl.identifier.join(', ')} ← ${this.concatenate(decl.value)}`;
        }
        else {
            let dt = '';
            if (decl.value && decl.value[0].kind == "ObjectLiteral") {
                const obj_expr = decl.value[0];
                const index_strings = '[' + Array.from(obj_expr.indexPairs.keys())
                    .map(key => `${this.stringify(obj_expr.indexPairs.get(key)[0])}:${this.stringify(obj_expr.indexPairs.get(key)[1])}`)
                    .join(', ') + ']';
                dt = `ARRAY${index_strings} OF ${Tokens[decl.value[0].dataType]}`;
            }
            else {
                dt = this.tkn_to_string(decl.dataType);
            }
            return `DECLARE ${decl.identifier.join(', ')} : ${dt}`;
        }
    }
    str_member_expr(expr) {
        return `${this.stringify(expr.object)}[${this.concatenate(expr.indexes)}]`;
    }
    str_fileUse_expr(expr) {
        return `${expr.operation}FILE "${expr.fileName}", ${this.concatenate(expr.assigne)}`;
    }
    str_file_expr(expr) {
        if (expr.operation == "OPEN") {
            return `OPENFILE "${expr.fileName}" FOR ${expr.mode}`;
        }
        else {
            return `CLOSEFILE "${expr.fileName}"`;
        }
    }
    str_call_expr(expr) {
        return `${expr.wasCallKeywordUsed ? "CALL " : ''}${expr.callee.symbol}(${this.concatenate(expr.args)})`;
    }
    str_binary_expr(expr) {
        return `${this.stringify(expr.left)} ${expr.operator} ${this.stringify(expr.right)}`;
    }
    str_assignment_expr(expr) {
        return `${this.stringify(expr.assigne)} ← ${this.concatenate(expr.value)}`;
    }
    concatenate(exprs) {
        if (!exprs || exprs.length == 0)
            return '';
        return exprs.map(expr => this.stringify(expr)).join(', ');
    }
}
