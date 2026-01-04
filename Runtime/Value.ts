import { CharString, Expr, Stmt } from "../Frontend/AST.js";
import { Tokens } from "../Frontend/Lexer.js";
import Environment from "./Environment.js";

export type ValueType = "MemberExprVal" | "null" | "number" | "boolean" | "string" | "char" | "Object" | "function"
| "native-fn" | "selection" | "end-closure" | "pause" | "file-name";

export type primitiveValue = string | boolean | number | null | NewObjectVal;

export interface RuntimeVal {
  type: ValueType;
  ln: number,
}

export interface MemberExprVal extends RuntimeVal{
  type: "MemberExprVal"
  valueType: ValueType;
  parentObject: NewObjectVal;
  value: primitiveValue | primitiveValue[];
}

export interface FileNameVal extends RuntimeVal {
  type: "file-name",
  value: string,

}

export interface Pause extends RuntimeVal {

  type: "pause",
  value: string,

}

export interface NewObjectVal extends RuntimeVal {

  type: "Object",
  vals: RuntimeVal[],
  dataType: 
  Tokens.Any
  | Tokens.Real
  | Tokens.Integer
  | Tokens.String
  | Tokens.Char
  | Tokens.Boolean
  | Tokens.Null,
  WereBoundsDeclared: boolean,
  start: number,
  end: number,

}


/**
 * Defines a value of undefined meaning
 */
export interface NullVal extends RuntimeVal {
  type: "null";
  value: null;
}

export function MK_NULL() {

  return { type: "null", value: null } as NullVal;
}

function MK_TYPE(type : Tokens) : RuntimeVal {


  switch(type){

    case Tokens.String:
      return MK_STRING("");

    case Tokens.Char:
      return MK_CHAR('');

    case Tokens.Integer:
      return MK_NUMBER(0, type);

    case Tokens.Real:
      return MK_NUMBER(0.0, type);

    case Tokens.Boolean:
      return MK_BOOL(false);

    default:
      return MK_NULL();
    

  }

}




export interface BooleanVal extends RuntimeVal {
  type: "boolean";
  value: boolean;
}

export interface StringVal extends RuntimeVal {
  type: "string";
  kind: "StringLiteral";
  value: string;
}

export interface endClosureVal extends RuntimeVal {
  type: "end-closure";
}

export interface CharVal extends RuntimeVal {
  type: "char";
  value: string;
}

export function MK_BOOL(b = true) {
  return { type: "boolean", value: b } as BooleanVal;
}

export function MK_STRING(s : string) : StringVal {

  return { type: "string", kind: "StringLiteral", value: s} as StringVal;

  
}

export function MK_CHAR(c : string) : CharVal{

  return { type: "char", value: c} as CharVal;
}


/**
 * Runtime value that has access to the raw native javascript number.
 */
export interface NumberVal extends RuntimeVal {
  type: "number";
  numberKind: Tokens.Integer | Tokens.Real;
  value: number;
}

export function MK_NUMBER(n = 0, overwriteNumberKind : Tokens.Integer | Tokens.Real | "Auto" ) {

  if(overwriteNumberKind != "Auto"){
    /*return {
      type: "number",
      numberKind: overwriteNumberKind,
      value: n
    } as NumberVal;*/

    if(!isint(n) && overwriteNumberKind == Tokens.Integer){
      throw "Cannot assign integer type to real type number!";
    }
    return {
      type: "number",
      numberKind: overwriteNumberKind,
      value: n
    } as NumberVal;    

  }
  else{
      return { type: "number", 
          numberKind:n.toString().includes('.') ? Tokens.Integer : Tokens.Real,
          value: n } as NumberVal;
  }


}

function isint(str) {
  const num = Number(str);
  return !isNaN(num) && Number.isInteger(num);
}

export type FunctionCall = (args:RuntimeVal[], env:Environment) => RuntimeVal;

export interface NativeFnValue extends RuntimeVal {
  type: "native-fn",
  call: FunctionCall,
}

export function MK_NATIVE_FN(call:FunctionCall){
  return {type:"native-fn", call} as NativeFnValue;
}

export interface SelectionStmt extends RuntimeVal{
  type: "selection";
  body: Map<BooleanVal, Stmt[]>;

  declarationEnv : Environment;

}

export interface FunctionValue extends RuntimeVal {
  type: "function";
  name: string;
  parameters?: Map<string,Expr>;
  declarationEnv:Environment;
  body: Stmt[],
  returnType?: Expr,
  isProcedure: boolean,
  expectedArguments: number
  returnExpressions: Stmt[],
}

