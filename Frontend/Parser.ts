import { NullVal ,RuntimeVal, MK_NULL, MK_NUMBER, MK_STRING, MK_BOOL, MK_CHAR, ValueType } from "../Runtime/Value.js";
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
  inputExpr,
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

import { Token, Tokens, tokenize } from "./Lexer.js";

import { errorLog, makeError, error } from "../Main.js";
import { isint } from "../Runtime/Eval/Expressions.js";

export let errToken : string = "";
export let errLn : number = 0;
export let errCol : number = 0;

export default class Parser {

  private parse_Stmt(context : string): Stmt {

    //throw new Error("Tokens: " + JSON.stringify(this.tokens));


    if(errorLog.length > 0){

      return {
        kind: "ErrorExpr",

      } as Expr;
    }
    else{

        let parsedStmt : Stmt;

        //throw new Error("This.at().type is: " + this.at().value);

        switch(this.at().type){
          case Tokens.Declare:


            parsedStmt = this.parse_var_declaration(context);
            break;

          case Tokens.Constant:

            parsedStmt = this.parse_var_declaration(context);
            break;

          case Tokens.Function:

            parsedStmt = this.parse_fn_declaration(context); 
            break; 

          case Tokens.Procedure:

            parsedStmt = this.parse_fn_declaration(context);
            break;

          case Tokens.If:

            parsedStmt = this.parse_selectionStmt_declaration(context);
            break;

          case Tokens.Case:

            parsedStmt = this.parse_selectionStmt_declaration(context);
            break;

          case Tokens.For:

            parsedStmt = this.parse_iterationStmt(context);
            break;

          case Tokens.Repeat:

            parsedStmt = this.parse_iterationStmt(context);
            break;

          case Tokens.While:

            parsedStmt = this.parse_iterationStmt(context);
            break;

          case Tokens.Output:

            parsedStmt = this.parse_output_expr(context);
            break;

          case Tokens.Input:

            parsedStmt = this.parse_input_expr(context);
            break;

          case Tokens.Openfile:
            parsedStmt = this.parse_file_expr(context);
            break;

          case Tokens.Closefile:
            parsedStmt = this.parse_file_expr(context);
            break;

          case Tokens.Readfile:

            //throw new Error("Recognised as file use expr!");

            parsedStmt = this.parse_file_use_expr(context);


            
            break;

          case Tokens.Writefile:
            parsedStmt = this.parse_file_use_expr(context);
            break;

          case Tokens.Return:

            parsedStmt = this.parse_return_stmt(context);

            break;

          case Tokens.Comment:

            parsedStmt = {kind: "CommentExpr", value: this.eat().value} as CommentExpr;
            break;


          default:
            
            parsedStmt = this.parse_expr(context);
        }



       return parsedStmt;
    }


  }

  

  parse_return_stmt(context : string) : Stmt {

    const ln = this.eat().ln;

    let expressions : Expr[] = [];
    
    let commaParsed : boolean = false;

    while(this.not_eol()){
      commaParsed = false;
      expressions.push(this.parse_expr(context));

      if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
        commaParsed = true;
        this.eat();

        if(!this.not_eol()){
          return this.MK_Err(context, "Expression expected!");
        }
      }
      else if(this.at().value == '&' || this.at().value == '+'){
        return this.MK_Err(context, "Use ',' to concatenate multiple expressions into one string");
      }
      else if(!commaParsed && this.not_eol()){

        return this.MK_Err(context,"Comma expected!");
      }

      if(errorLog.length > 0){
        return this.MK_Err(context,"");
      }
    }

    const stmt = {kind: "ReturnStmt", value: expressions, ln: ln} as ReturnStmt;

    if(this.at().type == Tokens.Comment){

      stmt.comment = this.eat().value;

    }

    if(this.at().type == Tokens.EOL){
      this.eat();
    }

    return stmt;


  }

  parse_file_use_expr(context : string): Stmt {
    const operation = (this.eat().value == "READFILE")
    ? "READ"
    : "WRITE"
    if(this.at().type == Tokens.OpenBracket){
      this.eat();
    }
    const fileName = this.expect(context,Tokens.Filename, "Invalid file name!").value;

    this.expect(context,Tokens.Comma, "Comma expected!");

    let assigne : Expr[] = [];




    let commaParsed : boolean = false;

    while(this.not_eol() && this.at().type != Tokens.CloseBracket){

      commaParsed = false;

      const next = this.parse_expr(context);



      assigne.push(next);
      if(this.at().type == Tokens.Comma){
        commaParsed = true;
        this.eat();
        if(!this.not_eol()){
          return this.MK_Err(context,"Expression expected!");
        }
      }
      else if(!commaParsed && this.not_eol() && this.at().type != Tokens.CloseBracket){

        return this.MK_Err(context,"Comma expected!")

      }
      else if(!this.not_eol() || this.at().type == Tokens.CloseBracket){
        break;
      }
    }

    

    if(this.at().type == Tokens.CloseBracket){
      this.eat();
    }



    const fileUseExpr = {
      kind: "FileUse",
      operation: operation,
      fileName: fileName,
      assigne: assigne,
    } as FileUse;

    if(this.at().type == Tokens.Comment){
      fileUseExpr.comment = this.eat().value;
    }


    return fileUseExpr;
  
  }

  parse_file_expr(context : string): Expr {

    const ln = this.at().ln;
    const operation = this.eat().value; //Consumes the OPEN or CLOSE token


    if(!this.not_eol()){

      return this.MK_Err(context,"File name expected!");

    }

    const fileName = this.expect(context,Tokens.Filename, `Invalid file name '${this.at().value}'!`).value;

    if(operation == "OPENFILE"){
      this.expect(context,Tokens.For, "Expecting 'FOR' keyword here!");

      if(this.at().type != Tokens.Read && this.at().type != Tokens.Write){

        if(!this.not_eol()){

          return this.MK_Err(context,"File access mode (READ/WRITE) expected!")

        }
        else{

          return this.MK_Err(context,`Invalid file access mode '${this.at().value}'!`);

        }

        

      }

      const mode = this.eat().value;


      const fileExpr = {
        kind: "FileExpr",
        operation: (operation == "OPENFILE")
        ? "OPEN"
        : "CLOSE",
        mode: mode,
        fileName: fileName,
        ln: ln,
      } as FileExpr;

      if(this.at().type == Tokens.Comment){

        fileExpr.comment = this.eat().value;

      }

      this.expect(context,Tokens.EOL, "Expecting new line!");


      return fileExpr;
    }
    else{
      const fileExpr = {
        kind: "FileExpr",
        operation: "CLOSE",
        fileName: fileName,
        ln: ln,
      } as FileExpr;

      if(this.at().type == Tokens.Comment){

        fileExpr.comment = this.eat().value;

      }

      return fileExpr;
    }



  }
  
  private tokens : Token[] = [];

  private not_eof(): boolean {
    
    return this.tokens.length > 0 && this.tokens[0].type != Tokens.EOF;
  }

  private at(): Token {
    return this.tokens[0];


  }

  private peek() : Token {

    if(this.tokens.length >= 2) return this.tokens[1];
    else return null;

  }

  private eat(): Token {

    const wouldBe = this.tokens.shift() as Token;

    return wouldBe;
    
  }

  private show_ln() : number {



    return this.at().ln;
  }

  private expect(context : string, type : Tokens, errMsg : any, overwriteError? : string) {

    const prev = this.tokens.shift() as Token;

    if(!prev || prev.type != type){
      this.MK_Err(context, errMsg, prev, overwriteError);
    }

    return prev;
  }



  private scanValidDataType() : 
  Tokens.Any
  | Tokens.Real
  | Tokens.Integer
  | Tokens.String
  | Tokens.Char
  | Tokens.Boolean
  | Tokens.Null
  {

    for(let i = 0; i < this.tokens.length; i++){
      if(this.isValidDataType(this.tokens[i])){
        switch(this.tokens[i].type){
          case Tokens.Any:
            return Tokens.Any;

          case Tokens.Real:
            return Tokens.Real;
            
          case Tokens.Integer:
            return Tokens.Integer;

          case Tokens.String:
            return Tokens.String;

          case Tokens.Char:
            return Tokens.Char;

          case Tokens.Boolean:
            return Tokens.Boolean;

          default:
            return Tokens.Null;
        }
      }
      else if(this.tokens[i].type === Tokens.EOL 
        || this.tokens[i].type == Tokens.EOF
      ){
        return Tokens.Null;
      }
    }

  }





  public produceAST(src : string) : Program {
    
    this.tokens = tokenize(src);





    const program : Program = {
      kind: "Program",
      body: [],
      ln: 1,
    };

    let parseCapacity = 0;

    let stmt : Expr;

    stmt = {
      kind: "NullLiteral",
      value: null,
    } as NullLiteral;

    while(this.not_eof() && parseCapacity < Infinity && errorLog.length == 0 && (stmt.kind !== "ErrorExpr")){

      stmt =  this.parse_Stmt("<module>");
      if(stmt == null){
        stmt = {
          kind: "NullLiteral",
          value: null,
          } as NullLiteral;
      }

      program.body.push(stmt);

        
      parseCapacity++;

    }
    
    if(errorLog.length > 0){

      const err = {kind: "ErrorExpr"} as Expr;
      const errProgram = {kind: "Program", body: [err]} as Program;

 

      return errProgram;
    }
    else{

      return program;
    }
   
    
  }





  private parse_input_expr(context : string, message? : Expr[], comment?:string): Stmt {

    if(this.at().type == Tokens.Input){
      const ln = this.eat().ln; //Consumes the 'INPUT' token

      if(!this.not_eol()){
        return this.MK_Err(context,`Expression expected!`);
      }
      else{
        let assigne : Expr[] = [];

        let commaParsed : boolean = false;

        while(this.not_eol()){
          commaParsed = false;
          assigne.push(this.parse_expr(context));


          if(this.at().type == Tokens.Comma){
            commaParsed = true;
            this.eat();
            if(!this.not_eol()){
              return this.MK_Err(context,"Expression expected!");
            }
          }
          else if(!commaParsed && this.not_eol()){

            return this.MK_Err(context,"Comma expected!");

          }
        }

        

        if(!message){

          message = [{kind: "StringLiteral", text: "Enter user input: "} as StringLiteral];

        }


        const assignmentExpr = {
          kind: "InputExpr",
          assigne: assigne,
          promptMessage: message,
          ln: ln,
        } as inputExpr;

        if(this.at().type == Tokens.Comment){

          assignmentExpr.comment = this.eat().value;

        }

        if(comment){

          assignmentExpr.comment += ' ' + comment;

        }

        this.expect(context,Tokens.EOL, "Expecting end of line!");

        return assignmentExpr;
      }

      
    }
    else{
      return this.parse_Stmt(context);
    }

    
  }


  private parse_list(context : string, extraLimiters? : Tokens[]) : Expr[] | Expr {

    const caution = extraLimiters ? [...extraLimiters, Tokens.EOL, Tokens.EOF] : [Tokens.EOL, Tokens.EOF];

    let expressions : Expr[] = [];
    let commaParsed : boolean = false;



    while(!caution.includes(this.at().type)){

      commaParsed = false;

      const parsed = this.parse_expr(context);

      if(!parsed){

        return this.MK_Err(context,"Error parsing expression!");

      }
      else{
        expressions.push(parsed);
      }

      


      if(this.at().type == Tokens.Comma){
        commaParsed = true;
        this.eat();

        if(caution.includes(this.at().type)){

          return this.MK_Err(context,"Expression expected!");

        }

      }
      else if(!commaParsed && !caution.includes(this.at().type)){


        return this.MK_Err(context,"Comma expected!");

      }

      if(errorLog.length > 0){

        return this.MK_Err(context,"");
      }

    }


    return expressions;

  }


  private parse_iterationStmt(context : string): Stmt {
    const rawKeyword = this.eat().value;
    let iterationKind : string = "";


  

    switch(rawKeyword){
      case "FOR":
        iterationKind = "count-controlled";
        break;

      case "WHILE":
        iterationKind = "pre-condition";
        break;

      case "REPEAT":
        iterationKind = "post-condition";
        break;

      default:
        return this.MK_Err(context,"Not a valid iteration kind!");

    }

    if(iterationKind == "count-controlled"){

      let header_comment = undefined;
      let footer_comment = undefined;

      const iterator = {
        kind: "Identifier",
        symbol: this.expect(context,Tokens.Identifier, "Expecting identifier name!").value,
      } as Identifier;

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }


      this.expect(context,Tokens.Assign, "Expecting assignment token!");


      const startVal = this.parse_expr(context);
      this.expect(context,Tokens.To, "Expecting 'TO' keyword here!");
      const endVal = this.parse_expr(context);

      let step : Expr;

      if(this.at().type == Tokens.Step){
        this.eat(); //Consumes the STEP token
        step = this.parse_expr(context);
      }

      if(this.at().type == Tokens.Comment){

        header_comment = this.eat().value;

      }

      this.expect(context,Tokens.EOL, "Expecting new line!");
      let body : Stmt[] = [];
      let returnExpressions : Stmt[] = [];

      while(this.not_eof() && this.at().type !== Tokens.Next){
        while(this.at().type === Tokens.EOL){
          this.eat();
        }
        if(this.not_eof() && this.at().type !== Tokens.Next){
          if(this.at().type == Tokens.Return){
            this.eat();

            if(!this.not_eol()){
              return this.MK_Err(context,`Expression expected!`);
            }
            else{
              let expressions : Expr[] = [];

              let commaParsed : boolean = false;

              while(this.not_eol()){

                commaParsed = false;

                expressions.push(this.parse_expr(context));

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err(context,"Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){
                  return this.MK_Err(context,"Comma expected!");
                }

              }

              const return_stmt = {kind: "ReturnStmt", value: expressions} as ReturnStmt;

              if(this.at().type == Tokens.Comment){

                return_stmt.comment = this.eat().value;

              }
              
              returnExpressions.push(return_stmt);
              body.push(return_stmt);
            }


          }
          else{
            const parsed = this.parse_Stmt(context);



            if(!parsed || parsed.kind == "ErrorExpr"){
              return parsed;
            }
            else if(parsed.kind == "SelectionStmtDeclaration"){
              if((parsed as SelectionStmtDeclaration).returns.length > 0){
                for(const expr of (parsed as SelectionStmtDeclaration).returns){
                  returnExpressions.push(expr);
                }
              }

              body.push(parsed);

            }
            else if(parsed.kind == "IterationStmt"){
              if((parsed as IterationStmt).returnExpressions.length > 0){
                for(const expr of (parsed as IterationStmt).returnExpressions){
                  returnExpressions.push(expr);
                }
              }

              body.push(parsed);
            }
            else{
              body.push(parsed);
            }

            
            
          }
        }


      }

      body.push({kind: "EndClosureExpr"} as EndClosureExpr);

      this.expect(context,Tokens.Next, "Expecting 'NEXT' keyword!");

      if(errorLog.length > 0){
        return this.MK_NULL_PARSER();
      }
      
      if(this.at().type != Tokens.Identifier){
        return this.MK_Err(context,"Identifier expected or none provided!");
      }

      const endIterator = {
        kind: "Identifier",
        symbol: this.expect(context,Tokens.Identifier, "Expecting identifier name!").value,

      } as Identifier;

      if(iterator.symbol != endIterator.symbol){
        return this.MK_Err(context,`Identifier '${iterator.symbol}' does not match identifier '${endIterator.symbol}'`, this.at(), "runtime");
      }

      const iterationStmt = {
        kind: "IterationStmt",
        iterationKind: "count-controlled",
        iterator:iterator,
        startVal: startVal,
        endVal: endVal,
        step: (step != undefined)
        ? step
        : {
          kind: "NumericLiteral",
          numberKind: Tokens.Integer,
          value: 1
        } as NumericLiteral,
        body: body,
        returnExpressions: returnExpressions,
      } as IterationStmt;

      if(this.at().type == Tokens.Comment){

        footer_comment = this.eat().value;

      }

      if(header_comment){

        iterationStmt.header_comment = header_comment;

      }

      if(footer_comment){

        iterationStmt.footer_comment = footer_comment;

      }

      return iterationStmt;
    }
    else if(iterationKind == "post-condition"){

      const header_comment = (this.at().type == Tokens.Comment) ? this.eat().value : undefined;

      this.expect(context,Tokens.EOL, "Expecting new line!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      let body : Stmt[] = [];
      let returnExpressions : Stmt[] = [];

      while(this.not_eof() && this.at().type !== Tokens.Until){
        while(this.at().type == Tokens.EOL){
          this.eat();
        }

        if(this.not_eof()  && this.at().type !== Tokens.Until){
          if(this.at().type == Tokens.Return){
            this.eat();

            if(!this.not_eol()){
              return this.MK_Err(context,"Expression expected!");
            }
            else{
              
              let expressions : Expr[] = [];
              let commaParsed : boolean = false;

              while(this.not_eol()){
                commaParsed = false;
                expressions.push(this.parse_expr(context));

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err(context,"Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){
                  return this.MK_Err(context,"Comma expected!");
                }

              }

              const ret_statement = {kind: "ReturnStmt", value: expressions} as ReturnStmt;

              if(this.at().type == Tokens.Comment){

                ret_statement.comment == this.eat().value;

              }

              returnExpressions.push(ret_statement);
              body.push(ret_statement);
            }

          }
          else{
            const parsed = this.parse_Stmt(context);

            if(!parsed || parsed.kind == "ErrorExpr"){
              return parsed;
            }
            else{
              body.push(parsed);
            }
          }
        }

      }

      

      body.push({kind: "EndClosureExpr"} as EndClosureExpr);

      this.expect(context,Tokens.Until, "Expecting 'UNTIL' keyword here!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }


      const condition = this.parse_expr(context);

      const repeatLoop = {
        kind: "IterationStmt",
        iterationKind: "post-condition",
        iterationCondition: condition,
        body: body,
        returnExpressions: returnExpressions,
      } as IterationStmt;

      if(this.at().type == Tokens.Comment){

        repeatLoop.footer_comment = this.eat().value;

      }

      if(header_comment){

        repeatLoop.header_comment = header_comment;

      }

      return repeatLoop;
    }

    else if(iterationKind == "pre-condition"){
      const condition = this.parse_expr(context);

      this.expect(context,Tokens.Do, "Expecting 'DO' keyword here!");

      const header_comment = this.at().type == Tokens.Comment ? this.eat().value : undefined;

      this.expect(context,Tokens.EOL, "Expecting new line!");

      let body : Stmt[] = [];
      let returnExpressions : Stmt[] = [];

      while(this.not_eof() && this.at().type !== Tokens.Endwhile){
        while(this.at().type == Tokens.EOL){
          this.eat();
        }

        if(this.not_eof() && this.at().type !== Tokens.Endwhile){
          if(this.at().type == Tokens.Return){
            this.eat();
            
            let expressions : Expr[] = [];

            let commaParsed : boolean = false;

            while(this.not_eol()){
              commaParsed = false;
              expressions.push(this.parse_expr(context));

              if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                commaParsed = true;
                this.eat();
                if(!this.not_eol()){
                  return this.MK_Err(context,"Expression expected!");
                }

              }
              else if(!commaParsed && this.not_eol()){
                return this.MK_Err(context,"Comma expected!");
              }

            }

            const return_expr = {kind: "ReturnStmt", value: expressions} as ReturnStmt;

            if(this.at().type == Tokens.Comment){

              return_expr.comment = this.eat().value;

            }

            returnExpressions.push(return_expr);
            body.push(return_expr);

            
          }
          else{
            const parsed = this.parse_Stmt(context);

            if(!parsed || parsed.kind == "ErrorExpr"){
              return this.MK_NULL_PARSER();
            }
            else{
              body.push(parsed);
            }
          }
        }
      }



      body.push({kind: "EndClosureExpr"} as EndClosureExpr);

      this.expect(context,Tokens.Endwhile, "Expecting 'ENDWHILE' keyword after while loop declaration!");

      if(errorLog.length > 0){
        return this.MK_NULL_PARSER();
      }


      const whileLoop = {
        kind: "IterationStmt",
        iterationKind: "pre-condition",
        iterationCondition: condition,
        body: body,
        returnExpressions: returnExpressions,
      } as IterationStmt;

      if(header_comment){

        whileLoop.header_comment = header_comment;

      }

      if(this.at().type == Tokens.Comment){

        whileLoop.footer_comment = this.eat().value;

      }

      return whileLoop;

    }
    else{
      return this.MK_Err(context,"Invalid iteration statement!");

    }



  }

  private not_eol() : boolean {

    if(this.at().type === Tokens.EOL || this.at().type === Tokens.EOF || this.at().type == Tokens.Comment){

      return false;
    }
    else{

      return true;
    }
  }



  private classify(thing : Stmt) : string{
    if(thing.kind == "BinaryExpr" 
      || thing.kind == "BooleanLiteral" 
      || thing.kind == "CharString"
      || thing.kind == "Identifier"
      || thing.kind == "MemberExpr"
      || thing.kind == "NullLiteral"
      || thing.kind == "NumericLiteral"
      || thing.kind == "ObjectLiteral"
      || thing.kind == "StringLiteral"
      || thing.kind == "UnaryExpr"
      || thing.kind == "CommentExpr"
      ){
        return "Expr";
      }
    else if(thing.kind == "CallExpr"){
      const temp = thing as CallExpr;

      if(temp.wasCallKeywordUsed){
        return "Stmt";
      }
      else{
        return "Expr";
      } 
    }
    else{
      return "Stmt";
    }
  }

  currentTokenName() : string {
    return Tokens[this.at().type];
  }


  private parse_bool(val : boolean) : Identifier {

    return {

      kind: "Identifier",
      symbol: val ? "TRUE" : "FALSE",

    } as Identifier;


  }

  private parse_selectionStmt_declaration(context : string): Expr {
    const ifStatement = this.eat().type == Tokens.If; //consume the IF/CASE token
    let body = new Map<Expr, [string, Stmt[]]>();
    let Statements : Stmt[] = [];
    let ReturnExpressions : Stmt[] = [];

    let header_comment = "";
    let footer_comment = undefined;
    
    if(ifStatement){

      

      const condition = this.parse_expr(context);
      
      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      if(this.at().type == Tokens.Comment){

        header_comment = this.eat().value;

      }

      if(this.at().type == Tokens.EOL){
        this.eat();
      }
      this.expect(context,Tokens.Then, "Expecting 'THEN' keyword!");

      if(this.at().type == Tokens.Comment){

        header_comment += ' ' + this.eat().value;

      }

      this.expect(context,Tokens.EOL, "Expecting new line!");

      while(this.at().type == Tokens.EOL){
        this.eat();
      }
      
      Statements = [];
      //let ReturnExpressions : Stmt[] = [];

      

      while(this.at().type !== Tokens.Else && this.at().type !== Tokens.Endif && this.at().type !== Tokens.Elseif){
        
        while(this.at().type == Tokens.EOL){
          this.eat();
          }

          
        
        if(this.at().type !== Tokens.Endif && this.at().type !== Tokens.Elseif && this.at().type !== Tokens.Else){
          let returning : boolean;
          returning = false;
          if(this.at().type == Tokens.Return){
            
            returning = true;
            this.eat();
            if(!this.not_eol()){
              return this.MK_Err(context,"Expression expected!");
            }
          }
          
          



          let parsed : Stmt;
          
          if(!this.not_eof()){

            const custom = {type: Tokens.EOF, value: "EOF", ln: this.at().ln + 1, col: 1} as Token;

            return this.MK_Err(context,"Expecting 'ENDIF' token!", custom);
          }
          else{
            parsed = this.parse_Stmt(context);
          }

          
          
          

          if(!parsed || parsed.kind == "ErrorExpr"){


            return this.MK_NULL_PARSER();
          }
          else{
            
            if(returning){
              
              let expressions : Expr[] = [parsed];

              let commaParsed : boolean = false;

              while(this.not_eol()){

                commaParsed = false;

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err(context,"Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){

                  return this.MK_Err(context,"Comma expected!");

                }

                expressions.push(this.parse_expr(context));
              }

              const ret_stmt = {kind: "ReturnStmt", value: expressions, ln: expressions[0].ln} as ReturnStmt;


              if(this.at().type == Tokens.Comment){

                ret_stmt.comment = this.eat().value;

              }

              

              ReturnExpressions.push(ret_stmt);
              Statements.push(ret_stmt);
            }
            else{
              Statements.push(parsed);
            }
          }


        }
        else{
          break;
        }
      }

      
      
      Statements.push({kind: "EndClosureExpr"} as EndClosureExpr);
      
      body.set(condition, ["", Statements]);
      
      Statements = [];

      while(this.at().type == Tokens.EOL){
        this.eat();
      }

      if(this.at().type == Tokens.Elseif){
        while(this.not_eof() && this.at().type !== Tokens.Else && this.at().type !== Tokens.Endif){
          Statements = [];
          this.eat(); // Consumes the elseif
          const condition = this.parse_expr(context);

          let comment = (this.at().type == Tokens.Comment) ? this.eat().value : "";

          
          if(this.at().type == Tokens.EOL){
            this.eat();
          }

          this.expect(context,Tokens.Then, "Expecting 'THEN' token here!");

          if(this.at().type == Tokens.Comment){

            comment += ' ' + this.eat().value;

          }

          this.expect(context,Tokens.EOL, "Expecting new line!");

          if(this.at().type == Tokens.Else){
            break;
          }

          while(this.not_eof() && this.at().type !== Tokens.Elseif && this.at().type !== Tokens.Endif && this.at().type !== Tokens.Else){
            while(this.at().type == Tokens.EOL){
              this.eat();
            }

            let returning : boolean = false;

            let parsed : Stmt;

            if(this.at().type == Tokens.Else || this.at().type == Tokens.Elseif || this.at().type == Tokens.Endif){

              break;
            }


            if(this.at().type == Tokens.Return){
              returning = true;
              this.eat();

              let expressions : Expr[] = [];

              let commaParsed : boolean = false;


              while(this.not_eol()){
                commaParsed = false;
                expressions.push(this.parse_expr(context));

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err(context,"Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){

                  return this.MK_Err(context,"Comma expected!");

                }
              }

              parsed = {kind: "ReturnStmt", value: expressions, ln: expressions[0].ln } as ReturnStmt;


              if(this.at().type == Tokens.Comment){

                (parsed as ReturnStmt).comment = this.eat().value;

              }

            }
            else{
              parsed = this.parse_Stmt(context);
            }


            

            if(!parsed || parsed.kind == "ErrorExpr"){
              return this.MK_NULL_PARSER();
            }
            else{
              Statements.push(parsed);
              if(returning){
                ReturnExpressions.push(parsed);
              }
            }


          }
          Statements.push({kind: "EndClosureExpr"} as EndClosureExpr);

          body.set(condition, [comment, Statements]);

        }
      }
      
      

      Statements = [];
      
      if(this.at().type == Tokens.Else){
        this.eat();

        const comment = this.at().type == Tokens.Comment ? this.eat().value : "";

        this.expect(context,Tokens.EOL, `Expecting new line!`);

        while(this.not_eof() && this.at().type !== Tokens.Endif){
          while(this.at().type == Tokens.EOL){
            this.eat();
          }

          if(this.at().type !== Tokens.Endif){
            let returning : boolean;
            returning = false;

            if(this.at().type == Tokens.Return){
              returning = true;
              this.eat();
            }

            let parsed : Stmt;

            if(returning){

              const exprs = this.parse_list(context);
              let ln : number = 0;

              if(Array.isArray(exprs)){

                ln = exprs[0].ln;

              }
              else{

                ln = (exprs as Expr).ln;

              }

              parsed = {kind: "ReturnStmt", value: exprs, ln: ln} as ReturnStmt;


              if(this.at().type == Tokens.Comment){

                (parsed as ReturnStmt).comment = this.eat().value;

              }


            }
            else{
              parsed = this.parse_Stmt(context);
            }
            
            

            if(!parsed || parsed.kind == "ErrorExpr"){
              return this.MK_NULL_PARSER();
            }
            else{
              Statements.push(parsed);
              if(returning){
                ReturnExpressions.push(parsed)
              }
            }


          }

        }

        const mkTrue = {
          kind: "Identifier",
          symbol: "TRUE",
        } as Identifier;

        Statements.push({kind: "EndClosureExpr"} as EndClosureExpr);

        body.set(mkTrue, [comment, Statements]);
      }
      


      if(this.at().type !== Tokens.Endif && this.at().type !== Tokens.EOL && this.not_eof()){

        this.expect(context,Tokens.EOL, "Expecting new line before ENDIF token!");
      }



      this.expect(context,Tokens.Endif, "Expecting 'ENDIF' token after if statement declaration!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      if(this.at().type == Tokens.Comment){

        footer_comment = this.eat().value;

      }

      if(errorLog.length > 0){
        return this.MK_NULL_PARSER();
      }

      
    }
    else{

      this.expect(context,Tokens.Of, "Expecting 'OF' keyword!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      let condition : BinaryExpr;

      if(!this.not_eol()){
        return this.MK_Err(context,"Name expected!");
      }
      const name = this.parse_expr(context);

      if(this.at().type == Tokens.Comment){

        header_comment = this.eat().value;

      }

      this.expect(context,Tokens.EOL, `Expecting new line!`);


      if(!this.not_eol()){
        return this.MK_Err(context,"Expression expected!")
      }
      else{
        const expr = this.parse_expr(context);
        condition = {
          kind: "BinaryExpr",
          left: name,
          right: expr,
          operator: '='
        } as BinaryExpr;

        this.expect(context,Tokens.Colon, "Expecting colon!");



        if(!this.not_eol() || this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise){
          return this.MK_Err(context,"Statements expected!");
        }



        let parsed = this.parse_Stmt(context);
        if(!parsed || parsed.kind == "ErrorExpr"){
          return this.MK_NULL_PARSER();
        }


        while(this.classify(parsed) == "Stmt"){

          if(parsed.kind == "ReturnStmt"){
            ReturnExpressions.push(parsed);
          }

          Statements.push(parsed);
          //this.expect(Tokens.EOL, `Expecting new line but got ${this.currentTokenName()} instead!`);
          while(this.at().type == Tokens.EOL){
            this.eat();
          }
          if(this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise){
            break;
          }
          parsed = this.parse_Stmt(context);
          if(!parsed || parsed.kind == "ErrorExpr"){
            return this.MK_NULL_PARSER();
          }


        }

        body.set(condition, ["", Statements]);

        while(this.at().type == Tokens.EOL){
          this.eat();
        }



        let check : Stmt;
        if(this.classify(parsed) == "Stmt"  && this.at().type !== Tokens.Otherwise && this.at().type !== Tokens.Endcase){
          check = this.parse_Stmt(context);
        }
        else if(this.classify(parsed) == "Expr"){
          check = parsed;
        }
        

        while(this.at().type !== Tokens.Otherwise && this.at().type !== Tokens.Endcase){
          if(this.classify(check) == "Expr"){
            Statements = [];
            condition = {
              kind: "BinaryExpr",
              left: name,
              right: check,
              operator: '='
            } as BinaryExpr;
            this.expect(context,Tokens.Colon, "Colon expected!");


            const comment = this.at().type == Tokens.Comment ? this.eat().value : "";

            parsed = this.parse_Stmt(context);

            while(this.classify(parsed) == "Stmt"){
              if(parsed.kind == "ReturnStmt"){
                ReturnExpressions.push(parsed);
              }

              Statements.push(parsed);
              //this.expect(Tokens.EOL, "Expecting new line!");
              while(this.at().type == Tokens.EOL){
                this.eat();
              }
              if(this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise){
                break;
              }
              parsed = this.parse_Stmt(context);
              if(!parsed || parsed.kind == "ErrorExpr"){
                return this.MK_NULL_PARSER();
              }
            }

            body.set(condition, [comment, Statements]);

            if(this.classify(parsed) == "Expr"){
              check = parsed;
            }
            else{
              break;
            }
          }
          else{
            break;
          }
        }

        while(this.at().type == Tokens.EOL){
          this.eat();
        }

        if(this.at().type == Tokens.Otherwise){

          Statements = [];
          this.eat();

          const comment = this.at().type == Tokens.Comment ? this.eat().value : "";

          if(!this.not_eol || this.at().type == Tokens.Endcase){
            return this.MK_Err(context,"Statements expected!");
          }
          else{

            
            let parsed = this.parse_Stmt(context);
           

            if(!parsed || parsed.kind == "ErrorExpr"){
              return this.MK_NULL_PARSER();
            }


            while(this.classify(parsed) == "Stmt"){
              if(parsed.kind == "ReturnStmt"){
                ReturnExpressions.push(parsed);
              }

              Statements.push(parsed);

              //this.expect(Tokens.EOL, "Expecting new line!");
              while(this.at().type == Tokens.EOL){
                this.eat();
              }

              if(this.at().type == Tokens.Endcase || !this.not_eof()){
                break;
              }
              else{
                parsed = this.parse_Stmt(context);
                if(!parsed || parsed.kind == "ErrorExpr"){
                  return this.MK_NULL_PARSER();
                }
              }

            }

            const MK_TRUE = {
              kind: "Identifier",
              symbol: "TRUE"
            } as Identifier;

            body.set(MK_TRUE, [comment, Statements]);
            
          }
        }
      }
    }

    

    while(this.at().type == Tokens.EOL){
      this.eat();
    }

    
    
    if(!ifStatement){
      this.expect(context,Tokens.Endcase, "Expecting 'ENDCASE' token!");
    }
    
    if(this.at().type == Tokens.Comment){

      footer_comment = this.eat().value;

    }
 
    
    const ifStmt = {
      kind: "SelectionStmtDeclaration",
      body: body,
      returns: (ReturnExpressions.length > 0)
      ? ReturnExpressions
      : [],
      case: !ifStatement,

    } as SelectionStmtDeclaration;

    if(header_comment){

      ifStmt.header_comment = header_comment;

    }

    if(footer_comment){

      ifStmt.footer_comment = footer_comment;

    }

    //throw "The if statement returns: " + JSON.stringify(ReturnExpressions);



    return ifStmt;


  }

  conv_tk_to_expr(tk : Tokens.String | Tokens.Char | Tokens.Integer | Tokens.Real | Tokens.Boolean | Tokens.Any | Tokens.Null) : Expr {

    switch(tk){
      case Tokens.String:
        return {
          kind: "StringLiteral",
          text: "",
        } as StringLiteral;

      case Tokens.Char:
        return {
          kind: "CharString",
          text: ''
        } as CharString;

      case Tokens.Integer:
        return {
          kind: "NumericLiteral",
          numberKind: Tokens.Integer,
          value: 0
        } as NumericLiteral;

      case Tokens.Real:
        return {
          kind: "NumericLiteral",
          numberKind: Tokens.Real,
          value: 0,
        } as NumericLiteral;

      case Tokens.Boolean:
        return {
          kind: "Identifier",
          symbol: "FALSE",
        } as Identifier;

      default:
        return {
          kind: "NullLiteral",
          value: null,
        } as NullLiteral;
    }

  }




  parse_fn_declaration(context : string): Stmt {

    let header_comment = undefined;



    const procedure = (this.eat().type == Tokens.Procedure);
    const name = this.expect(context,Tokens.Identifier, "Expecting function name!").value;

    if(errorLog.length > 0){

      return this.MK_NULL_PARSER();

    }

    let parameters = new Map<string, Expr>();


    let returnType : Expr; 
      

    let returnExpressions : Expr[] = []; 


    if(this.at().type == Tokens.OpenBracket){
      this.eat(); //Consumes the ( token


      

      while(this.not_eof() && this.at().type !== Tokens.CloseBracket){
        if(this.at().type == Tokens.Identifier){
          const paramName : string[] = [];
          let commaParsed : boolean = false;

          while(this.not_eol() && this.at().type != Tokens.Colon){
            commaParsed = false;
            paramName.push(this.expect(context,Tokens.Identifier, "Name expected!").value);
            if(this.at().type == Tokens.Comma){
              commaParsed = true;
              this.eat();
              if(!this.not_eol() || this.at().type == Tokens.Colon){
                return this.MK_Err(context,"Name expected!");
              }
            }
            else if(!commaParsed && this.not_eol() && this.at().type != Tokens.Colon){

              return this.MK_Err(context,"Comma expected!");

            }
          }

          let paramType : Expr;

          this.expect(context,Tokens.Colon, "Expecting colon here!");
          
          if(this.isValidDataType(this.at())){
            paramType = this.conv_tk_to_expr(this.eat().type as Tokens.String | Tokens.Char | Tokens.Null | Tokens.Any | Tokens.Integer | Tokens.Real | Tokens.Boolean);


            for(const name of paramName){
              parameters.set(name, paramType);
            }

            
          }
          else if(this.at().type == Tokens.Array){

            errorLog.pop();


            this.eat();


            if(this.at().type == Tokens.OpenSquareBracket){
              this.eat();

              if(!this.not_eol()  || this.at().type == Tokens.CloseSquareBracket){
                return this.MK_Err(context,"Array bounds expected!");
              }

              this.parse_expr(name);
              this.expect(context,Tokens.Colon, "Expecting colon!");



              this.parse_expr(name);
              this.expect(context,Tokens.CloseSquareBracket, "']' expected!");

              return this.MK_Err(context,"Remove array bounds to ensure any array length can be accepted.");

            }
            else{
              this.expect(context,Tokens.Of, "Expecting 'OF' keyword!");

              if(!(this.isValidDataType(this.at()))){
                this.MK_Err(context,`Invalid data type '${this.at().value}'!`, undefined, "type");
              }

              const rawObj = {
                kind: "ObjectLiteral",
                dataType: this.eat().type,

              } as NewObjectLiteralExpr;

              for(const name of paramName){
                parameters.set(name, rawObj);
              }

              
            }

          }
          else{
            return this.MK_Err(context,`Invalid data type '${this.at().value}'!`, undefined, "type");
          }

          

          continue;
        }
        else if(this.at().type === Tokens.Comma){
          this.eat();
          continue;
        }
        else{
          return this.MK_Err(context,"Expecting either parameters, comma or blank!");

        }
      }

      this.expect(context,Tokens.CloseBracket, "Expecting close brackets here!");



    }

    if(!procedure){
      
      this.expect(context,Tokens.Returns, `'RETURNS' expected!`);

      if(this.isValidDataType(this.at())){
        returnType = this.conv_tk_to_expr(this.eat().type as Tokens.String | Tokens.Char | Tokens.Boolean | Tokens.Integer | Tokens.Real | Tokens.Null | Tokens.Any);

      }
      else if(this.at().type == Tokens.Array){

        this.eat();
        this.expect(context,Tokens.Of, "Expecting 'OF' token!");
        if(!this.isValidDataType(this.at())){
          return this.MK_Err(context,`Invalid data type '${this.at().value}'!`, undefined, "type");
        }


        returnType = {
          kind: "ObjectLiteral",
          dataType: this.eat().type,
        } as NewObjectLiteralExpr;
      }
      else{
        return this.MK_Err(context,`Expecting either valid return type, or 'ARRAY' keyword!`);
      }
    }
    else{
      if(this.at().type == Tokens.Returns){
        return this.MK_Err(context,"Procedures cannot return a value!", this.at(), "Type");
      }
    }

    if(this.at().type == Tokens.Comment){

      header_comment = this.eat().value;

    }

    this.expect(context,Tokens.EOL, "Expecting new line!");

    const body : Stmt[] = [];


    let iterations = 0;

    while(this.not_eof() &&  
    (this.at().type !== Tokens.Endfunction) && this.at().type !== Tokens.Endprocedure){
      iterations++;
      
      while(this.at().type === Tokens.EOL){
        this.eat();
      }
      
      let parsed : Stmt;



      if(this.at().type == Tokens.Return){

        if(procedure){
          return this.MK_Err(context,"Procedures may not return a value!");

        }
        else{
          
          this.eat();
          
          let expressions : Expr[] = [];

          let commaParsed : boolean = false;

          while(this.not_eol()){
            commaParsed = false;
            expressions.push(this.parse_expr(name));

            if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
              commaParsed = true;
              this.eat();

              if(!this.not_eol()){
                return this.MK_Err(context,"Expression expected!");
              }
            }
            else if(!commaParsed && this.not_eol() && this.at().type != Tokens.CloseBracket){

              return this.MK_Err(context,"Comma expected!");

            }
          }

          parsed = {kind: "ReturnStmt", value: expressions, ln: expressions[0].ln} as ReturnStmt;

          if(this.at().type == Tokens.Comment){

            (parsed as ReturnStmt).comment = this.eat().value;

          }

          returnExpressions.push(parsed);

          body.push(parsed);
          


        }

      }
      else if(this.at().type == Tokens.If || this.at().type == Tokens.Case){
        parsed = this.parse_selectionStmt_declaration(name) as SelectionStmtDeclaration;

        if((parsed as SelectionStmtDeclaration).returns !== undefined){
          for(const stmt of (parsed as SelectionStmtDeclaration).returns){

  

            returnExpressions.push(stmt);
          }
        }

        if(errorLog.length > 0){
          return null;
        }

        body.push(parsed);
      }
      else if(this.at().type == Tokens.For || this.at().type == Tokens.While || this.at().type == Tokens.Repeat){
        parsed = this.parse_iterationStmt(name);

        const temp = parsed as IterationStmt;

        if(temp.returnExpressions !== undefined){
          if(temp.returnExpressions.length > 0){
            for(const stmt of temp.returnExpressions){
              returnExpressions.push(stmt);
            }
          }
        }


        body.push(parsed);

      }
      else{

        const parsed = this.parse_Stmt(name);

        if(!parsed || parsed.kind == "ErrorExpr"){
          return this.MK_NULL_PARSER();
        }
        else{
  
          body.push(parsed);

        }


        
      }


      

      while(this.at().type === Tokens.EOL){
        this.eat();
      }




    }

    while(this.at().type === Tokens.EOL){
      this.eat();
    }

    

    if(procedure){
      this.expect(context,Tokens.Endprocedure, "Expecting 'ENDPROCEDURE' keyword after procedure declaration!");
    }
    else{

      this.expect(context,Tokens.Endfunction, "Expecting 'ENDFUNCTION' keyword after function declaration!");
    }
    


    if(errorLog.length > 0){
      return this.MK_NULL_PARSER();
    }
    
    while(this.at().type === Tokens.EOL){
      this.eat();
    }

    



    const fn = {
      kind: "FunctionDeclaration",
      parameters: parameters,
      name: name,
      body: body,
      returns: (procedure)
      ? Tokens.Null
      : returnType,
      isProcedure: procedure,
      expectedArguments: parameters.size,
      returnExpressions: returnExpressions,

    } as FunctionDeclaration;

    if(this.at().type == Tokens.Comment){

      fn.footer_comment = this.eat().value;

    }

    if(header_comment){

      fn.header_comment = header_comment;

    }

    if(!procedure && returnExpressions.length == 0){
      return this.MK_Err(context,"Functions that are not procedures must return a value!") ;

    }




    if(errorLog.length > 0){



      return this.MK_NULL_PARSER();
    }
    else{
      return fn;
    }

    
    

  }

  private parse_fn_args(context : string) : Map<string, Expr> | Expr {

    let params = new Map<string, Expr>();

    let commaParsed : boolean = true;

    let names : string[] = [];

    while(this.not_eol() && this.at().type != Tokens.CloseBracket){

      if(this.at().type == Tokens.Identifier){

        if(commaParsed){
          names.push(this.eat().value);
          commaParsed = false;
        }
        else{

          return this.MK_Err(context,"Comma expected!");

        }
        

      }
      else if(this.at().type == Tokens.Colon){

        this.eat();
        if(this.isValidDataType(this.at())){

          const dt = this.eat().type;

          for(const name of names){

            params.set(name, this.conv_tk_to_expr(dt as Tokens.String | Tokens.Char | Tokens.Integer | Tokens.Boolean | Tokens.Real | Tokens.Any));

          }

          names = [];
          commaParsed = false;

        }
        else{

          return this.MK_Err(context,`Invalid data type ${this.at().value}`, undefined, "type");

        }

      }
      else if(this.at().type == Tokens.Comma){
        this.eat();
        commaParsed = true;

      }
      else{

        commaParsed = false;

      }

    }

    return params;

  }

  private MK_NULL_PARSER() : NullLiteral {

    return {kind: "NullLiteral", value: null} as NullLiteral;

  }

  private isValidDataType(check : Token) : boolean {
    const validDataTypes = new Set([
      Tokens.Integer,
      Tokens.Real,
      Tokens.String,
      Tokens.Char,
      Tokens.Boolean,
      Tokens.Any,
      Tokens.Null,
    ]);


    return validDataTypes.has(check.type)
  }

  private mk_number_parser(value? : number, ovwrt? : Tokens) : NumericLiteral {

    let nk = Tokens.Integer;

    if(ovwrt){

      nk = ovwrt;
    }
    else{

      nk = isint(value) ? Tokens.Integer : Tokens.Real;

    }

    if(!value){

      value = 0;

    }

    return {

      kind: "NumericLiteral",
      value: value,
      numberKind: nk,

    } as NumericLiteral;
  }

  private mk_bool_parser(value? : boolean) : Identifier {

    if(value){

      return {

        kind: "Identifier",
        symbol: "TRUE",
        ln: this.at().ln,
      }

    }
    else{

      return {

        kind: "Identifier",
        symbol: "FALSE",
        ln: this.at().ln,

      }


    }


  }

  private mk_string_parser(value? : string) : StringLiteral {

    if(!value){

      value = "";

    }

    return {

      kind: "StringLiteral",
      text: value,

    } as StringLiteral;


  }

  private mk_char_parser(value? : string) : CharString {


    if(!value){

      value = '';

    }

    return {

      kind: "CharString",
      text: value,

    } as CharString;

  }

  private mk_any_parser(type : Tokens) : Expr {

    switch(type){

      case Tokens.Integer:
        return this.mk_number_parser(0, type);

      case Tokens.Real:
        return this.mk_number_parser(0.0, type);

      case Tokens.Char:
        return this.mk_char_parser('');

      case Tokens.String:
        return this.mk_string_parser("");

      case Tokens.Boolean:
        return this.mk_bool_parser(false);

      default:
        return this.MK_NULL_PARSER();

    }


  }
 
  parse_var_declaration(context : string): Stmt {

    const isConstant = this.eat().type == Tokens.Constant;
    

    let identifier : string[] = [];

    while(this.at().type != Tokens.Colon && this.at().type != Tokens.Array && this.at().type != Tokens.Assign){


      let ident : string;


      if(this.at().type == Tokens.Identifier){
        ident = this.eat().value;
      }
      else if(this.at().value.length > 1 || this.at().value.toUpperCase() != this.at().value.toLowerCase()){

        return this.MK_Err(context,`'${this.at().value}' is a reserved keyword. Please try a different name!`);
      }
      else{
        return this.MK_Err(context,`Unexpected token found during parsing '${this.at().value}'!`);
      }





      identifier.push(ident);
      if(this.at().type == Tokens.Comma){
        this.eat();

        if(!this.not_eol()){
          return this.MK_Err(context,"Name expected!");
        }
        else if(this.at().type != Tokens.Identifier){


          if(this.at().value.length > 1){
            return this.MK_Err(context,`'${this.at().value}' is a reserved keyword. Please try a different name!`);
          }
          else{

            return this.MK_Err(context,`Unexpected token found during parsing '${this.at().value}'!`);

          }

          

        }

      }
      else if(this.at().type == Tokens.Colon || this.at().type == Tokens.Array || this.at().type == Tokens.Assign){
        break;
      }
      else{

        return this.MK_Err(context,"Expecting comma!");
      }
    }



    if(identifier.length == 0){

      return this.MK_Err(context,"Name expected!");

    }

    type dataType = 
      Tokens.Integer
    | Tokens.Real 
    | Tokens.String 
    | Tokens.Char 
    | Tokens.Boolean 
    | Tokens.Array
    | Tokens.Any
    | Tokens.Null
    let DT : dataType;
    //e.g DECLARE Score : INTEGER
    if(this.at().type == Tokens.Colon){
      if(isConstant){
        return this.MK_Err(context,"Must not have colon after constant declaration!");

      }
      else{
        this.eat(); //consume the : token
        if(this.at().type == Tokens.Array){

          const ln = this.eat().ln; //consume the ARRAY token
        
          if(this.at().type != Tokens.OpenSquareBracket){ 
            return this.MK_Err(context, "'[' expected!");
          }


          if(this.peek().type == Tokens.CloseSquareBracket){ 
            return this.MK_Err(context, "Array bounds expected!");
          }

          const val = this.parse_new_obj_literal(context);

          const var_decl = {
            kind: "VarDeclaration",
            constant: false,
            identifier: identifier,
            dataType: (val as NewObjectLiteralExpr).dataType,
            value: [val],
            ln: ln,
          } as VarDeclaration;

          if(this.at().type == Tokens.Comment){

            var_decl.comment = this.eat().value;

          }

              

          if(this.not_eol()){

            return this.MK_Err(context,"New line expected!");

          }

          return var_decl;

        }
        else{

          if(this.isValidDataType(this.at())){
            

            const ln = this.at().ln;
            DT = this.eat().type as dataType;
            if(this.at().type == Tokens.EOL || this.at().type == Tokens.Comment){

              const varDec =  {
                kind: "VarDeclaration",
                constant: false,
                identifier: identifier,
                dataType: DT,
                value: [this.mk_any_parser(DT)],
                ln: ln,
              } as VarDeclaration

              if(this.at().type == Tokens.Comment){

                varDec.comment = this.eat().value;

                if(this.at().type == Tokens.EOL){

                  this.eat();

                }

              }
              else{

                this.eat();

              }


              return varDec;
            }
            else{
              return this.MK_Err(context,"New line expected!");

            }
          }
          else if(this.at().type == Tokens.EOL){
           return this.MK_Err(context,"Expect datatype after non-constant variable declaration!") ;

          }
          else{
            return this.MK_Err(context,`Invalid data type '${this.eat().value}'!`, undefined, "type") ;

          }
        }

        
      }
    }
    else if(this.at().type == Tokens.Assign){
      
      this.eat(); //consume the ← token
      if(!this.not_eol()){
        return this.MK_Err(context,`Must assign constant "${identifier}" a value!`);

      }
      let vals : Expr[] = [];

      let commaParsed : boolean = false;

      const ln = this.at().ln;

      while(this.not_eol()){

        
        commaParsed = false;
        vals.push(this.parse_expr(context));



        if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
          commaParsed = true;
          this.eat();
          if(!this.not_eol()){
            return this.MK_Err(context,"Expression expected!");

          }


        }
        if(this.not_eol() && !commaParsed){
          return this.MK_Err(context,"Comma expected!");
          //return this.MK_Err("Got " + this.at().value);
        }

      }

      const var_decl = {
        kind: "VarDeclaration",
        constant: true,
        identifier: identifier,
        dataType: Tokens.Any,
        value: vals,
        ln: ln,
      }  as VarDeclaration;



      if(this.at().type == Tokens.Comment){

        var_decl.comment = this.eat().value;

      }

      return var_decl;
      
      
    }
    else if(isConstant && !(this.at().type == Tokens.Assign || this.at().type == Tokens.EOL)){
      return this.MK_Err(context,"Must use ← when assigning constants!");


    }
    else if(!isConstant){
      return this.MK_Err(context,"Must follow non-constant variable declaration with colon!"); 
    }
    else{
      return this.MK_Err(context,"Did not complete variable/constant setup!");
    }
  }

  private parse_whitespace() : string | undefined{

    let comment : string = "";

    while(this.at().type == Tokens.EOL || this.at().type == Tokens.Comment){

      if(this.at().type == Tokens.EOL){

        this.eat();

      }
      else if(this.at().type == Tokens.Comment){

        comment += ' ' + this.eat().value;

      }

    }



    return comment == "" ? undefined : comment;


  }

  private parse_expr(context : string) : Expr{

    return this.parse_assignment_expr(context);

    
    
  }

  private parse_output_expr(context : string) : Expr {
    const ln = this.eat().ln;

    if(!this.not_eol()){

      return this.MK_Err(context,"Expression expected!");
    }
    else{
      
      let expressions : Expr[] = [];




      while(this.not_eol()){



        expressions.push(this.parse_expr(context));
        if(this.not_eol()){

          if(this.at().type == Tokens.Ampersand){

            this.eat();

          }
          else{
            this.expect(context,Tokens.Comma, "Comma expected!");
          }

          

          if(!this.not_eol()){
            return this.MK_Err(context,"Expression expected!");
          }

        }
        else{
          break;
        }

      }


      const outputExpr = {
        kind: "OutputExpr",
        value: expressions,
        ln: ln,
      } as OutputExpr;

      if(this.at().type == Tokens.Comment){

        outputExpr.comment = this.eat().value;
        
      }
      while(this.at().type == Tokens.EOL){
        this.eat();

      }
      if(this.at().type == Tokens.Input){
        return this.parse_input_expr(context,outputExpr.value, outputExpr.comment);
      }
      else{

        return outputExpr;
      }
    }


    
  }

  private parse_assignment_expr(context : string): Expr {
    const left = this.parse_new_obj_literal(context);
    

      if(this.at().type == Tokens.Assign){
          const ln = this.eat().ln; //Advance past ← token

          if(!this.not_eol()){
            return this.MK_Err(context,"Expression expected!");
          }


          let values : Expr[] = [];

          
          while(this.not_eol()){
            values.push(this.parse_expr(context));

            if(this.at().type == Tokens.Comma){
              this.eat();
              if(!this.not_eol()){
                return this.MK_Err(context,"Expression expected!");
              }
            }
            else if(!this.not_eol()){

              //return this.MK_Err("Comma expected!");

            }
            else{
              break;
            }
          }

          const a_expr = {
            value: values,
            assigne: left,
            kind: "AssignmentExpr",
            ln: ln,
          } as AssignmentExpr;

          if(this.at().type == Tokens.Comment){

            a_expr.comment = this.eat().value;

          }

          return a_expr;

      }

      return left;
  }



  private parse_new_obj_literal(context : string) : Expr {

    if(this.at().type == Tokens.OpenSquareBracket){

      const ln = this.eat().ln;

      if(this.at().type == Tokens.CloseSquareBracket){

        this.eat();

        const indexPairs = new Map<number, [Expr, Expr]>();

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1, ln: ln} as Expr;

        indexPairs.set(1, [one, one]);


        return {

          kind: "ObjectLiteral",
          exprs: [],
          dataType: Tokens.Any,
          start: one,
          end: one,
          indexPairs: indexPairs,
          ln: ln,
        } as NewObjectLiteralExpr;
      }





      const first = this.parse_expr(context);



      if(this.at().type == Tokens.Colon){


        if(first.kind == "StringLiteral"){

          makeError("Array bounds must be of type INTEGER!", "type");
          return this.MK_NULL_PARSER();

        }


        const ln = this.eat().ln;

        if(!this.not_eol() || this.at().type == Tokens.CloseSquareBracket){
          return this.MK_Err(context,"End bound expected!");
        }

        const end_bound = this.parse_expr(context);

        if(end_bound.kind == "StringLiteral"){

          makeError("Array bounds must be of type INTEGER!", "type", end_bound.ln, );
          return this.MK_NULL_PARSER();

        }

        let obj = {
          kind: "ObjectLiteral",
          exprs: [],
          start: first,
          end: end_bound,
          ln: ln,
        } as NewObjectLiteralExpr;

        let indexPairs = new Map<number, [Expr, Expr]>();

        indexPairs.set(1, [first, end_bound]);

        let dimension = 2;

        while(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){

          if(this.at().type == Tokens.Comma){
            this.eat();
          }

          const indexPair = this.parse_pure_obj_bounds(context);

          indexPairs.set(dimension, [indexPair[0], indexPair[1]]);

          dimension++;

        }

        let DT : Tokens;

        this.expect(context,Tokens.CloseSquareBracket, "']' expected!");
        this.expect(context,Tokens.Of, "Expecting 'OF' keyword!");

        if(this.isValidDataType(this.at())){
          DT = this.eat().type;
        }
        else{

          return this.MK_Err(context,`Invalid data type '${this.at().value}'!`, undefined, "type");


        }

        if(errorLog.length > 0){
          return this.MK_NULL_PARSER();
        }

        obj.indexPairs = indexPairs;
        obj.dataType = DT;



        return obj;

      }
      else if(this.at().type == Tokens.Comma){

        let exprs : Expr[] = [first];

        const indexPairs = new Map<number, [Expr, Expr]>();

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1, ln: ln} as Expr;

        if(first.kind == "ObjectLiteral"){
          indexPairs.set(1, [(first as NewObjectLiteralExpr).start, (first as NewObjectLiteralExpr).end])
        }
        else{
          indexPairs.set(1, [one, one]);
        }

        this.eat();

        exprs = [first, ...this.parse_list(context, [Tokens.CloseSquareBracket]) as Expr[]];



        if(errorLog.length > 0){

          return this.MK_NULL_PARSER();

        }
        

        this.expect(context,Tokens.CloseSquareBracket, "']' expected!");

        let dimensionCount = 1;

        let test: Expr = exprs[0];

        while(test[0] && test[0].kind == "ObjectLiteral"){
          dimensionCount++;

          const obj = test[0] as NewObjectLiteralExpr;
          
          indexPairs.set(dimensionCount, [obj.start, obj.end]);

          test = obj;
        }

        const length = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: exprs.length} as NumericLiteral;

        return {

          kind: "ObjectLiteral",
          exprs: exprs,
          dataType: Tokens.Any,
          start: one, 
          end: length, 
          indexPairs: indexPairs,
          ln: ln,
        } as NewObjectLiteralExpr;


      }
      else if(this.at().type == Tokens.CloseSquareBracket){

        this.eat();

        const indexPairs = new Map<number, [Expr, Expr]>();

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1, ln: ln} as Expr;

        indexPairs.set(1, [one, one]);

        

        const obj = {

          kind: "ObjectLiteral",
          exprs: [first],
          dataType: Tokens.Any,
          start: one,
          end: one,
          indexPairs: indexPairs,
          ln: ln,
        } as NewObjectLiteralExpr;



        return obj;

      }
      else{
        return this.MK_Err(context,"']' expected!");
      }



    }
    else{
      return this.parse_or_expr(context);
    }


  }

  private parse_pure_obj_bounds(context : string) : Expr[] {

    if(this.at().type == Tokens.CloseSquareBracket || !this.not_eol()){
      return [this.MK_Err(context,"Start bound expected!")];
    }

    if(this.at().type == Tokens.StringLiteral){

      makeError("Array bounds must be of type INTEGER!", "type");
      return [this.MK_NULL_PARSER()];
    }

    const start_bound = this.parse_expr(context);

  

    this.expect(context, Tokens.Colon, "Colon expected!");
    if(this.at().type == Tokens.CloseSquareBracket || !this.not_eol()){

      return [this.MK_Err(context,"End bound expected!")];

    }

    if(this.at().type == Tokens.StringLiteral){

      makeError("Array bounds must be of type INTEGER!", "type", this.at().ln);
      return [this.MK_NULL_PARSER()];

    }


    const end_bound = this.parse_expr(context);

    return [start_bound, end_bound];

  }


  private parse_empty(type : Tokens) : Expr {


    switch(type){

      case Tokens.String:
        return {

          kind: "StringLiteral",
          text: " ",
        } as StringLiteral;

      case Tokens.Char:
        return {

          kind: "CharString",
          text: ' ',

        } as CharString;

      case Tokens.Real:
        return {
          kind: "NumericLiteral",
          numberKind: Tokens.Real,
          value: 0,
        } as NumericLiteral;

      case Tokens.Integer:
        return {

          kind: "NumericLiteral",
          numberKind: Tokens.Integer,
          value: 0,

        } as NumericLiteral;

      case Tokens.Boolean:
        return {

          kind: "Identifier",
          symbol: "FALSE"

        } as Identifier;

      default:

        return this.MK_NULL_PARSER();

    }

  }

  private parse_or_expr(context : string): Expr {

    let left : Expr = this.parse_and_expr(context);

    while(this.at().value == "OR"){

      const ln = this.at().ln;
      const op = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err(context, "Expression expected!");

      }

      left = {

        kind: "BinaryExpr",
        left,
        right: this.parse_and_expr(context),
        operator: op,
        ln: ln,

      } as BinaryExpr;


    }

    return left;

  }

  private parse_and_expr(context : string): Expr {

    let left : Expr = this.parse_not_expr(context);



    while(this.at().value == "AND"){

      const ln = this.at().ln;
      const op = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }

      left = {

        kind: "BinaryExpr",
        left,
        right: this.parse_not_expr(context),
        operator: op,
        ln: ln,

      } as BinaryExpr;


    }

    return left;
  }

  private parse_not_expr(context : string): Expr {

    let right : Expr;


    if(this.at().value == "NOT"){

      const ln = this.at().ln;
      const op = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }

      right = {

        kind: "UnaryExpr",
        operator: op,
        right: this.parse_not_expr(context),
        ln: ln,

      } as UnaryExpr;

    }
    else{

      right = this.parse_comparitive_expression(context);


    }




    return right;
  }


  /*private parse_logic_expression(StringJoining? : boolean) : Expr {

    let left : Expr;
    
    if(this.at().type == Tokens.NOT){
      left = {kind: "NullLiteral", value: null} as NullLiteral;
      
    }
    else{

      left = this.parse_comparitive_expression(context);
    }





      while(this.at().value === "AND" || this.at().value === "OR" || this.at().value === "NOT"){
        const operator = this.eat().value;


        if(!this.not_eol()){

          return this.MK_Err("Expression expected!");

        }

        let right : Expr = this.parse_comparitive_expression();

        
        left = {
          kind: "BinaryExpr",
          left,
          right,
          operator,
        } as BinaryExpr;
      }



    return left;
 }*/


 private parse_comparitive_expression(context : string) : Expr{
 
  let left : Expr = this.parse_additive_expression(context);



  const binaryOperators = ["<>", "<", ">", "≥", "≤", "<=", ">=", "="];

  while( binaryOperators.includes(this.at().value)){

    const ln = this.at().ln;
    const operator = this.eat().value;

    let right : Expr;
    
    if(!this.not_eol()){

      return this.MK_Err(context,"Expression expected!");

    }

    right = this.parse_additive_expression(context);

    left = {
      kind: "BinaryExpr",
      left,
      right,
      operator,
      ln: ln,
    } as BinaryExpr;
  }


  return left;
 }



  private parse_additive_expression(context : string) : Expr{
    let left = this.parse_multiplicative_expression(context);
    
   
    
    
    while(this.at().value == '+' || this.at().value == '-'){
      
      const ln = this.at().ln;
      const operator = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }


      const right = this.parse_multiplicative_expression(context);
      
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
        ln: ln,
      } as BinaryExpr;
    }

    return left;
  }



  private parse_multiplicative_expression(context : string): Expr{
    let left = this.parse_exponential_expression(context);
    

    while(this.at().value == '*' || this.at().value == '/' || this.at().value == '%'){
      
      const ln = this.at().ln;
      const operator = this.eat().value;


      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }

      const right = this.parse_exponential_expression(context);

      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
        ln: ln,
      } as BinaryExpr;
    }
    

    return left;
  }



  private parse_exponential_expression(context : string): Expr{
    let left = this.parse_unary_expr(context);
    

    while(this.at().value == '^' ){
      const ln = this.at().ln;
      const operator = this.eat().value;


      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }

      const right = this.parse_unary_expr(context);

      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
        ln: ln,
      } as BinaryExpr;
    }


    return left;
  }

  private parse_unary_expr(context : string) : Expr {

    if(this.at().type == Tokens.UnaryOperator){

      const tk = this.eat();

      const operator = tk.value;
      const ln = tk.ln;

      if(!this.not_eol()){

        return this.MK_Err(context,"Expression expected!");

      }
      

      const right = this.parse_call_member_expr(context);

      if(operator == '.' && right.kind != "NumericLiteral"){

        return this.MK_Err(context,"Expecting numeric literal after decimal point!");

      }

 

      return {kind: "UnaryExpr", operator: operator, right: right, ln: ln} as UnaryExpr;
    }
    else{
      return this.parse_call_member_expr(context);
    }

    
  }

  private parse_call_member_expr(context : string): Expr {
    
    if(this.at().type == Tokens.Call){
      this.eat();

      if(!this.not_eol()){

        return this.MK_Err(context,"Procedure name expected!");

      }

      const member = this.parse_new_memberExpression(context);
      const procedure = member as FunctionDeclaration;



     
      if(this.at().type == Tokens.OpenBracket || this.at().type == Tokens.EOL){
        return this.parse_call_expr(context, member, true);
      }

      return member;

    }
    else{

      const name = this.at();

      const member = this.parse_new_memberExpression(context);




      if(this.at().type == Tokens.OpenBracket){

        if(name.type == Tokens.Identifier){
          return this.parse_call_expr(context,member, false);
        }
        else{

          return this.MK_Err(context,"Expression is not callable!");

        }

        
      }

      return member;
    }

  }


  private parse_call_expr(context : string, callee : Expr, wasCallKeywordUsed : boolean): Expr {



    let args : Expr[] = [];

    if(this.at().type == Tokens.OpenBracket){
      args = this.parse_args(context);
    }


    
    let call_expr : Expr = {
      kind: "CallExpr",
      callee, 
      args: args,
      wasCallKeywordUsed: wasCallKeywordUsed,
      ln: this.at().ln,
    } as CallExpr;

    if(wasCallKeywordUsed && this.at().type == Tokens.Comment){

      (call_expr as CallExpr).comment = this.eat().value;

    }


    return call_expr;
  }

  private parse_args(context : string): Expr[] {
    this.expect(context,Tokens.OpenBracket, "Expecting open brackets!");
    const args = this.at().type == Tokens.CloseBracket
    ? []
    : this.parse_arguments_list(context);

    

    this.expect(context,Tokens.CloseBracket, "Expecting close brackets here!");


    return args;
  }

  private parse_arguments_list(context : string): Expr[]{
    const args = [this.parse_expr(context)];

    while(this.at().type == Tokens.Comma && this.eat()){
      args.push(this.parse_expr(context));
    }

    return args;
  }

  private MK_Err(context : string, message : string, token? : Token, owrt? : string) : Expr {



    

    if(token){
      errToken = token.value;
      errLn = token.ln;
      errCol = token.col;
    }
    else{
      errToken = this.at().value;
      errLn = this.at().ln;
      errCol = this.at().col;
    }

    const ln = (token) ? token.ln : this.show_ln();


    const err = (owrt ? owrt : "syntax") as error;

    makeError(message, err, ln, );
    return {
      kind: "ErrorExpr"
    } as Expr;
  }


  private parse_new_memberExpression(context : string) : Expr {

    let Object : Expr = this.parse_primary_expression(context);

    if(this.at().type == Tokens.OpenSquareBracket){

      this.eat(); //Consumes the '[' token

      const parent_Obj = Object;

      let indexArr : Expr[] = [];
      let ln = 0;

      while(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){
        const expr = this.parse_expr(context);
        ln = expr.ln;

        indexArr.push(expr);

        if(this.at().type == Tokens.Comma){
          this.eat();
          if(!this.not_eol() || this.at().type == Tokens.CloseSquareBracket){
            return this.MK_Err(context,"Expression expected!");
          }

        }
        else if(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){
          this.MK_Err(context,"Comma expected!");
        }

      }

      

      this.expect(context,Tokens.CloseSquareBracket, "']' Expected!");

      if(this.at().type == Tokens.OpenSquareBracket){

        this.eat();

        if(!this.not_eol() || this.at().type == Tokens.CloseSquareBracket){
          return this.MK_Err(context,"Expression expected!");
        }

        this.parse_expr(context);
        this.expect(context,Tokens.CloseSquareBracket, "']' expected!");

        return this.MK_Err(context,"Keep all indexes within a single pair of square brackets!");

      }

      Object = {

        kind: "MemberExpr",
        object: parent_Obj,
        indexes: indexArr,
        ln: ln,

      } as NewMemberExpr;

      

    }
    
    return Object;


  }

  private parse_primary_expression(context : string): Expr{
    const tk = this.at().type;

    switch(tk){


      case Tokens.Identifier:
        
        const n = this.eat();

        return {
          kind: "Identifier",
          symbol: n.value,
          ln: n.ln,
        } as Identifier;

      case Tokens.Boolean:

        const e = this.eat();

        return {
          kind: "Identifier",
          symbol: e.value,
          ln: e.ln,
        } as Identifier;


      case Tokens.StringLiteral:

        const t = this.eat();

        return {
          kind: "StringLiteral",
          text: t.value,
          ln: t.ln,
        } as StringLiteral

      case Tokens.NumericLiteral:
        
        const a = this.eat();

        return {
          kind: "NumericLiteral",
          value: parseFloat(a.value),
          ln: a.ln,
        } as NumericLiteral;
        
      case Tokens.OpenBracket:
        this.eat(); //remove opening bracket

        if(this.at().type == Tokens.CloseBracket){

          return this.MK_Err(context,"Expression expected!");
          
        }

        const value = this.parse_expr(context);
      
        if(value.kind == "BinaryExpr"){

          (value as BinaryExpr).bracket = true;

        }
        else if(value.kind == "UnaryExpr"){

          (value as UnaryExpr).bracket = true;

        }
        

        this.expect(context,
          Tokens.CloseBracket, "')' expected!");


        return value;

      case Tokens.EOL:
        this.eat();

        return null as any;

      case Tokens.EOF:

        return null as any;

      case Tokens.Comment:

          return {

            kind: "CommentExpr",
            value: this.eat().value,

          } as CommentExpr;

        


      case Tokens.Filename:

        const aten = this.eat();

        return {

          kind: "FileNameExpr",
          value: aten.value,
          ln: aten.ln,

        } as FileNameExpr;


      default:

        
        return this.MK_Err(context,`Unexpected token found during parsing '${this.at().value}'!`) /*this.MK_Err(`Unexpected token found during parsing '${this.at().value}'!`);*/
        
    }
  }



  pretty_tokens() : string {

    let out = "";

    for(const tk of this.tokens){

      out += tk.value;

      if(tk.value.toUpperCase() != tk.value.toLowerCase()){

        out += " ";

      }

    }

    return out;

  }
}



function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && str.trim() !== '';
}




