

import { Tokens } from "./Lexer.js";
import { BooleanVal, RuntimeVal, ValueType } from "../Runtime/Value.js";

export type NodeType =
  // STATEMENTS
  | "Program"
  | "VarDeclaration"
  | "ObjectLiteral"
  | "FunctionDeclaration"
  | "SelectionStmtDeclaration"
  | "IterationStmt"
  | "ReturnStmt"

  // Literals
  | "BooleanLiteral"
  | "NumericLiteral"
  | "StringLiteral"
  | "CharString"
  | "NullLiteral"
  | "Identifier"


  //EXPRESSIONS

  | "MemberExpr"
  | "CallExpr"
  | "AssignmentExpr" 
  | "BinaryExpr"
  | "UnaryExpr"
  | "OutputExpr"
  | "FileExpr"
  | "FileUse"
  | "ErrorExpr"
  | "EndClosureExpr"
  | "FileNameExpr"
  | "CommentExpr"
  | "DefaultCase"
  | "InputExpr";

/**
 * Statements do not result in a value at runtime.
 They contain one or more expressions internally */
export interface Stmt {
  kind: NodeType;
  ln: number,
}

export interface ReturnStmt {
  kind: "ReturnStmt";
  value: Expr[];
  comment?:string;
  ln: number,
}



export interface VarDeclaration extends Stmt {
  kind: "VarDeclaration";
  constant: boolean,
  identifier: string[],
  dataType: 
  Tokens.Integer
  | Tokens.Real 
  | Tokens.String 
  | Tokens.Char 
  | Tokens.Boolean 
  | Tokens.Any
  | Tokens.Null,
  value?: Expr[],
  comment?:string,
  ln: number,
}

/**
 * Defines a block which contains many statements.
 * -  Only one program will be contained in a file.
 */
export interface Program extends Stmt {
  kind: "Program";
  body: Stmt[];
}





/**  Expressions will result in a value at runtime unlike Statements */
export interface Expr extends Stmt {
  ln: number,
}



export interface InputExpr extends Expr {
  kind: "InputExpr",
  assigne: Expr[],
  promptMessage: Expr[],
  comment?:string,
  ln: number,
}

export interface FileNameExpr extends Expr {

  kind: "FileNameExpr",
  value: string,
  comment?:string,
  ln: number,

}

export interface DefaultCase extends Expr {

  kind: "DefaultCase",

}

export interface AssignmentExpr extends Expr {
  kind: "AssignmentExpr",
  assigne: Expr,
  value: Expr[],
  comment?:string,
  ln: number,
}

/**
 * A operation with two sides seperated by a operator.
 * Both sides can be ANY Complex Expression.
 * - Supported Operators -> + | - | / | * | %
 */
export interface BinaryExpr extends Expr {
  kind: "BinaryExpr";
  left: Expr;
  right: Expr;
  operator: string; // needs to be of type BinaryOperator
  bracket?: boolean;
  ln: number,

}

export interface UnaryExpr extends Expr {
  kind: "UnaryExpr";
  operator: string;
  right: Expr;
  bracket?:boolean;
  ln: number,
}

// LITERAL / PRIMARY EXPRESSION TYPES
/**
 * Represents a user-defined variable or symbol in source.
 */
export interface Identifier extends Expr {
  kind: "Identifier";
  symbol: string;
  ln: number,
}



/**
 * Represents a numeric constant inside the soure code.
 */
export interface NumericLiteral extends Expr {
  kind: "NumericLiteral";
  numberKind: Tokens.Integer | Tokens.Real;
  value: number;
}

export interface StringLiteral extends Expr {
  kind: "StringLiteral";
  text: string;
}

export interface NullLiteral extends Expr {
  kind: "NullLiteral",
  value: null;
}

export interface CharString extends Expr {
  kind: "CharString";
  text: string;
}





export interface NewObjectLiteralExpr extends Expr {
  
  kind: "ObjectLiteral",
  exprs: Expr[],
  dataType: Tokens,
  start: Expr,
  end: Expr,

  indexPairs: Map<number, [Expr, Expr]>;
  ln: number,

} 

export interface FileExpr extends Expr {
  kind: "FileExpr",
  operation: "CLOSE" | "OPEN";
  mode: "READ" | "WRITE";
  fileName: string,
  comment?:string,
  ln: number,

}

export interface FileUse extends Expr {
  kind: "FileUse",
  operation: "READ" | "WRITE";
  fileName : string,
  assigne: Expr[],
  comment?:string,
  ln: number,

}





export interface NewMemberExpr extends Expr {

  kind: "MemberExpr",
  object: Expr,
  indexes: Expr[]
  ln: number,

}

export interface CallExpr extends Expr {
  kind: "CallExpr",
  args: Expr[],
  callee: Expr,
  wasCallKeywordUsed: boolean,
  comment?:string,
  ln: number,
}

export interface SelectionStmtDeclaration extends Expr {
  kind: "SelectionStmtDeclaration",
  body: Map<string, [string, Stmt[]]>;
  returns?: ReturnStmt[];
  case?:boolean,

  header_comment?:string,
  footer_comment?:string,
  ln: number,
}

export interface EndClosureExpr extends Expr {
  kind: "EndClosureExpr",

}

export interface IterationStmt extends Expr {
  kind: "IterationStmt",
  iterationKind: "count-controlled" | "pre-condition" | "post-condition",
  iterator?:Identifier,
  startVal?:Expr,
  endVal?:Expr,
  step?:Expr,
  iterationCondition?:Expr,
  returnExpressions?:ReturnStmt[],
  body: Stmt[],

  header_comment?:string,
  footer_comment?:string,
  ln: number,

}

export interface OutputExpr extends Expr {
  kind: "OutputExpr",
  value: Expr[],
  comment?:string,
  ln: number,
}

export interface CommentExpr extends Expr {

  kind: "CommentExpr",
  value: string,
  ln: number,

}

export interface FunctionDeclaration extends Expr {
  kind: "FunctionDeclaration",
  parameters?: Map<string, 
    Expr>,

  name: string,
  body: Stmt[],
  returns?: Expr,

  isProcedure: boolean,
  wasCallKeywordUsed : boolean,
  expectedArguments: number,

  returnExpressions?: ReturnStmt[]

  header_comment?:string,
  footer_comment?:string,

  ln: number,
}

