import { BooleanVal } from "../Runtime/Value.js";
import {
  BinaryExpr,
  Expr,
  Identifier,
  NumericLiteral,
  StringLiteral,
  Program,
  Stmt,
  VarDeclaration,
  FunctionDeclaration,
  AssignmentExpr,
  NullLiteral,
  CallExpr,
  SelectionStmtDeclaration,
  IterationStmt,
  OutputExpr,
  CharString,
  InputExpr,
  FileExpr,
  FileUse,
  UnaryExpr,
  EndClosureExpr,
  ReturnStmt,
  NewObjectLiteralExpr,
  NewMemberExpr,
  FileNameExpr,
  CommentExpr,

} from "./AST.js"
import { Token, Tokens } from "./Lexer.js";

export default class PCON {


    public stringify(expr : Expr) : string{

        switch(expr.kind){

            case "AssignmentExpr":
                return this.str_assignment_expr(expr as AssignmentExpr);

            case "BinaryExpr":
                return this.str_binary_expr(expr as BinaryExpr);

            case "CallExpr":
                return this.str_call_expr(expr as CallExpr);

            case "ReturnStmt":
                return `RETURN ${this.concatenate((expr as ReturnStmt).value)}`;

            case "OutputExpr":
                return `OUTPUT ${this.concatenate((expr as OutputExpr).value)}`;

            case "InputExpr":
                return `INPUT ${this.concatenate((expr as InputExpr).promptMessage)}`;

            case "BooleanLiteral":
                return `TRUE`;

            case "CharString":
                return `'${(expr as CharString).text}'`;

            case "StringLiteral":

                return `"${(expr as StringLiteral).text}"`;

            case "NumericLiteral":
                return String((expr as NumericLiteral).value);

            case "UnaryExpr":
                return `${(expr as UnaryExpr).operator}${this.stringify((expr as UnaryExpr).right)}`;

            case "FileExpr":
                return this.str_file_expr(expr as FileExpr);
            case "FileUse":
                return this.str_fileUse_expr(expr as FileUse);

            case "MemberExpr":
                return this.str_member_expr(expr as NewMemberExpr);

            case "Identifier":
                return (expr as Identifier).symbol;

            case "ObjectLiteral":
                return this.str_obj_literal(expr as NewObjectLiteralExpr);

            case "VarDeclaration":
                return this.str_var_decl(expr as VarDeclaration);

            case "FileNameExpr":
                return (expr as FileNameExpr).value;

            case "IterationStmt":
                return this.str_iter_stmt(expr as IterationStmt);

            default:
                return '';
        }

    }

    private str_iter_stmt(s : IterationStmt) : string {

        switch(s.iterationKind){

            case "count-controlled":
                return `FOR ${s.iterator.symbol} ← ${this.stringify(s.startVal)} TO ${this.stringify(s.endVal)}`;

            case "post-condition":
                return `UNTIL ${this.stringify(s.iterationCondition)}`

            case "pre-condition":
                return `WHILE ${this.stringify(s.iterationCondition)} DO`;

            default:
                return ``;


        }

    }

    private str_obj_literal(e : NewObjectLiteralExpr) : string {

        return '[' + this.concatenate(e.exprs) +']';

    }

    private tkn_to_string(tk : Tokens.Real | Tokens.Integer | Tokens.Boolean | Tokens.Char | Tokens.Any | Tokens.String | Tokens.Null) : string {



        switch(tk){

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

    private str_var_decl(decl : VarDeclaration) : string {


        if(decl.constant){

            return `CONSTANT ${decl.identifier.join(', ')} ← ${this.concatenate(decl.value)}`;

        }
        else{


            let dt : string = '';
            
            if(decl.value && decl.value[0].kind == "ObjectLiteral"){

                const obj_expr = decl.value[0] as NewObjectLiteralExpr;
                const index_strings = '[' + Array.from(obj_expr.indexPairs.keys())
                .map(key => `${this.stringify(obj_expr.indexPairs.get(key)[0])}:${this.stringify(obj_expr.indexPairs.get(key)[1])}`)
                .join(', ') + ']';

                dt = `ARRAY${index_strings} OF ${Tokens[(decl.value[0] as NewObjectLiteralExpr).dataType]}`;

            }
            else{

                dt = this.tkn_to_string(decl.dataType)

            }

            return `DECLARE ${decl.identifier.join(', ')} : ${dt}`;

        }


    }

    private str_member_expr(expr : NewMemberExpr) : string {

        return `${this.stringify(expr.object)}[${this.concatenate(expr.indexes)}]`;

        


    }

    private str_fileUse_expr(expr : FileUse) : string {

        return `${expr.operation}FILE ${expr.fileName}, ${this.concatenate(expr.assigne)}`;


    }

    private str_file_expr(expr : FileExpr) : string {

        if(expr.operation == "OPEN"){
            return `OPENFILE ${expr.fileName} FOR ${expr.mode}`;

        }
        else{

            return `CLOSEFILE ${expr.fileName}`;

        }

        

    }

    private str_call_expr(expr : CallExpr) : string {

        return `${expr.wasCallKeywordUsed ? "CALL " : ''}${(expr.callee as Identifier).symbol}(${this.concatenate(expr.args)})`;
        

    }

    private str_binary_expr(expr : BinaryExpr) : string {

        return `${this.stringify(expr.left)} ${expr.operator} ${this.stringify(expr.right)}`

    }

    private str_assignment_expr(expr : AssignmentExpr) : string {

        return `${this.stringify(expr.assigne)} ← ${this.concatenate(expr.value)}`;


    }

    private concatenate(exprs : Expr[]) : string {


        if(!exprs || exprs.length == 0) return '';

        return exprs.map(expr => this.stringify(expr)).join(', ');

    }

}