import {  Pause, endClosureVal, NullVal, NumberVal, RuntimeVal, SelectionStmt, StringVal, MK_NULL } from "./Value.js";
import {
  AssignmentExpr,
  BinaryExpr,
  Expr,
  Identifier,
  NumericLiteral,
  Program,
  Stmt,
  StringLiteral,
  VarDeclaration,
  CallExpr,
  FunctionDeclaration,
  SelectionStmtDeclaration,
  IterationStmt,
  OutputExpr,
  InputExpr,
  FileExpr,
  FileUse,
  UnaryExpr,
  ReturnStmt,
  CharString,
  NewObjectLiteralExpr,
  NewMemberExpr,
  FileNameExpr,
  CommentExpr,


} from "../Frontend/AST.js";
import Environment from "./Environment.js";
import {eval_new_memberExpr,eval_return_stmt ,eval_char_string, eval_unary_expr, eval_input_expr, eval_output_expr, eval_iteration_Stmt , eval_call_expr , eval_identifier, eval_binary_expr, eval_string_expr, eval_assignment_expr, eval_selectionStmt_expr, eval_fileUse_expr, eval_new_objectVal, eval_file_name_expr  } from "./Eval/Expressions.js";
import {eval_file_statement, eval_fn_declaration, eval_program, eval_var_declaration } from "./Eval/Statements.js";
import { Tokens } from "../Frontend/Lexer.js";
import { errorLog, pauseLog, makeError, my_state, StackFrame } from "../Main.js";
import PCON from "../Frontend/PCON.js";

const pcon = new PCON;
/**
 * Evaulate pure numeric operations with binary operators.
 */


export async function evaluate(astNode: Stmt, env: Environment, StackFrames : StackFrame[]): Promise<RuntimeVal> {

  const SF_BYREF = structuredClone(StackFrames);


  const avoid = ["FunctionDeclaration","SelectionStmtDeclaration","IterationStmt", "StringLiteral", "CharString", "NumericLiteral", "Identifier", "OutputExpr", "InputExpr", "ReturnStmt"];

  if(!avoid.includes(astNode.kind)) SF_BYREF.push({expr: pcon.stringify(astNode), ln: astNode.ln, context: env.context});
  

  if((pauseLog.length > 0 || astNode == null || errorLog.length > 0 || astNode.kind == "ErrorExpr") && my_state == "interpreting"){



    return {
      type: "null",
      value: null,
    } as NullVal;
  }

  else{

    switch (astNode.kind) {
      
      case "NumericLiteral":
        let NK = (astNode as NumericLiteral).numberKind;
        const value = ((astNode as NumericLiteral).value);
        if(NK == undefined){
          if(isInt(value)){
            NK = Tokens.Integer;
          }
          else{
            NK = Tokens.Real;
          }
        }

        if(isNaN(value)){

          return makeError("Evaluation of expression results in non-real value!", "Math");

        }
        else if(!isFinite(value)){

          return makeError("Evaluation of expression results in non-finite value!", "Math");

        }
        else{
          
          return {
            value: value,
            numberKind: NK,
            type: "number",
            ln: astNode.ln,
          } as NumberVal;
        }


      case "Identifier":
        return await eval_identifier(astNode as Identifier, env, SF_BYREF);

      case "AssignmentExpr":



        return await eval_assignment_expr(astNode as AssignmentExpr, env, SF_BYREF);

      case "BinaryExpr":

        return await eval_binary_expr(astNode as BinaryExpr, env, SF_BYREF);

      case "StringLiteral":
        const textComponentHolder = astNode as StringLiteral;
        let expr = await eval_string_expr(textComponentHolder.text, env);  

        expr.ln = textComponentHolder.ln;

        return expr;

      case "Program":
        const program = astNode as Program;
        const err = {kind: "ErrorExpr"} as Expr;

        if(program.body.length == 1 && program.body[0] == err){

          return {
            type: "null",
            value: null,
          } as NullVal;
        }
        else{
          return await eval_program(astNode as Program, env);
        }
        
      case "CharString":
        return await eval_char_string(astNode as CharString, env);

      case "VarDeclaration":

        return await eval_var_declaration(astNode as VarDeclaration, env, SF_BYREF);

      case "FunctionDeclaration":
        return await eval_fn_declaration(astNode as FunctionDeclaration, env, SF_BYREF);

      case "ObjectLiteral":
        return await eval_new_objectVal(astNode as NewObjectLiteralExpr, env, SF_BYREF);

      case "CallExpr":

        

        return await eval_call_expr(astNode as CallExpr, env, SF_BYREF);

      case "CommentExpr":

        const com = astNode as CommentExpr;

        return {type: "string", value: com.value} as StringVal;

      case "MemberExpr":
        

        return await eval_new_memberExpr(astNode as NewMemberExpr, env, SF_BYREF);


      case "SelectionStmtDeclaration":
        return await eval_selectionStmt_expr(astNode as SelectionStmtDeclaration, env, SF_BYREF);

      case "IterationStmt":
        return await eval_iteration_Stmt(astNode as IterationStmt, env, SF_BYREF);

      case "OutputExpr":

        return await eval_output_expr(astNode as OutputExpr, env, SF_BYREF);

      case "InputExpr":

        return await eval_input_expr(astNode as InputExpr, env, SF_BYREF);
        

      case "FileExpr":

        return await eval_file_statement(astNode as FileExpr, env, SF_BYREF);

      case "FileUse":

        //throw new Error("Problem detected?");

        return await eval_fileUse_expr(astNode as FileUse, env, SF_BYREF);

      case "UnaryExpr":
        return await eval_unary_expr(astNode as UnaryExpr, env, SF_BYREF);

      case "EndClosureExpr":
        return {
          type: "end-closure"
        } as endClosureVal;

      case "NullLiteral":
          return {
            type: "null",
            value: null,
          } as NullVal;

      case "ReturnStmt":
        const returnStmt = astNode as ReturnStmt;

        return await eval_return_stmt(returnStmt, env,SF_BYREF);

      case "FileNameExpr":

          return await eval_file_name_expr(astNode as FileNameExpr, env);

      

      default:


        

        throw new Error(`AST node ${astNode.kind} not yet setup for interpretation`);
        
    }
  }

    

}

function isInt(value) {
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num);
}
