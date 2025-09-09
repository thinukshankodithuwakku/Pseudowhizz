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

} from "./AST.js"

import { Token, Tokens, tokenize } from "./Lexer.js";

import { errorLog, makeError } from "../Main.js";

export let errToken : string = "";
export let errLn : number = 0;
export let errCol : number = 0;

export default class Parser {

  private parse_Stmt(): Stmt {

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


            parsedStmt = this.parse_var_declaration();
            break;

          case Tokens.Constant:

            parsedStmt = this.parse_var_declaration();
            break;

          case Tokens.Function:

            parsedStmt = this.parse_fn_declaration(); 
            break; 

          case Tokens.Procedure:

            parsedStmt = this.parse_fn_declaration();
            break;

          case Tokens.If:

            parsedStmt = this.parse_selectionStmt_declaration();
            break;

          case Tokens.Case:

            parsedStmt = this.parse_selectionStmt_declaration();
            break;

          case Tokens.For:

            parsedStmt = this.parse_iterationStmt();
            break;

          case Tokens.Repeat:

            parsedStmt = this.parse_iterationStmt();
            break;

          case Tokens.While:

            parsedStmt = this.parse_iterationStmt();
            break;

          case Tokens.Output:

            parsedStmt = this.parse_output_expr();
            break;

          case Tokens.Input:

            parsedStmt = this.parse_input_expr();
            break;

          case Tokens.Openfile:
            parsedStmt = this.parse_file_expr();
            break;

          case Tokens.Closefile:
            parsedStmt = this.parse_file_expr();
            break;

          case Tokens.Readfile:

            //throw new Error("Recognised as file use expr!");

            parsedStmt = this.parse_file_use_expr();


            
            break;

          case Tokens.Writefile:
            parsedStmt = this.parse_file_use_expr();
            break;


          case Tokens.NOT:
            parsedStmt = this.parse_logic_expression();
            break;

          case Tokens.Return:

            parsedStmt = this.parse_return_stmt();

            break;

          default:
            
            parsedStmt = this.parse_expr();
        }



       return parsedStmt;
    }


  }


  parse_return_stmt() : Stmt {

    this.eat();

    let expressions : Expr[] = [];
    
    let commaParsed : boolean = false;

    while(this.not_eol()){
      commaParsed = false;
      expressions.push(this.parse_expr());

      if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
        commaParsed = true;
        this.eat();

        if(!this.not_eol()){
          return this.MK_Err("Expression expected!");
        }
      }
      else if(this.at().value == '&' || this.at().value == '+'){
        return this.MK_Err("Use ',' to concatenate multiple expressions into one string");
      }
      else if(!commaParsed && this.not_eol()){

        return this.MK_Err("Comma expected!");
      }

      if(errorLog.length > 0){
        return this.MK_Err("");
      }
    }

    if(this.at().type == Tokens.EOL){
      this.eat();
    }

    return {kind: "ReturnStmt", value: expressions} as ReturnStmt;


  }

  parse_file_use_expr(): Stmt {
    const operation = (this.eat().value == "READFILE")
    ? "READ"
    : "WRITE"
    if(this.at().type == Tokens.OpenBracket){
      this.eat();
    }
    const fileName = this.expect(Tokens.Filename, "Invalid file name!").value;

    this.expect(Tokens.Comma, "Comma expected!");

    let assigne : Expr[] = [];




    let commaParsed : boolean = false;

    while(this.not_eol() && this.at().type != Tokens.CloseBracket){

      commaParsed = false;

      const next = this.parse_expr();



      assigne.push(next);
      if(this.at().type == Tokens.Comma){
        commaParsed = true;
        this.eat();
        if(!this.not_eol()){
          return this.MK_Err("Expression expected!");
        }
      }
      else if(!commaParsed && this.not_eol() && this.at().type != Tokens.CloseBracket){

        return this.MK_Err("Comma expected!")

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
    } as FileUse


    return fileUseExpr;
  
  }

  parse_file_expr(): Expr {
    
    const operation = this.eat().value; //Consumes the OPEN or CLOSE token
    const fileName = this.expect(Tokens.Filename, `Invalid file name '${this.at().value}'!`).value;

    if(operation == "OPENFILE"){
      this.expect(Tokens.For, "Expecting 'FOR' keyword here!");

      if(this.at().type != Tokens.Read && this.at().type != Tokens.Write){

        if(this.at().type == Tokens.EOL){

          return this.MK_Err("File access mode (READ/WRITE) expected!")

        }
        else{

          return this.MK_Err(`Invalid file access mode '${this.at().value}'!`);

        }

        

      }

      const mode = this.eat().value;
      this.expect(Tokens.EOL, "Expecting new line!");

      const fileExpr = {
        kind: "FileExpr",
        operation: (operation == "OPENFILE")
        ? "OPEN"
        : "CLOSE",
        mode: mode,
        fileName: fileName,
      } as FileExpr;





      return fileExpr;
    }
    else{
      const fileExpr = {
        kind: "FileExpr",
        operation: "CLOSE",
        fileName: fileName
      } as FileExpr;

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


  private eat(): Token {

    const wouldBe = this.tokens.shift() as Token;

    return wouldBe;
    
  }

  private show_ln() : number {



    return this.at().ln;
  }

  private expect(type : Tokens, errMsg : any, overwriteError? : string) {



    const prev = this.tokens.shift() as Token;
    




    if(!prev || prev.type != type){
      this.MK_Err(errMsg, prev, overwriteError);
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
    };

    let parseCapacity = 0;

    let stmt : Expr;

    stmt = {
      kind: "NullLiteral",
      value: null,
    } as NullLiteral;

    while(this.not_eof() && parseCapacity < 100 && errorLog.length == 0 && (stmt.kind !== "ErrorExpr")){

      stmt =  this.parse_Stmt();
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





  private parse_input_expr(message? : Expr[]): Stmt {

    if(this.at().type == Tokens.Input){
      this.eat(); //Consumes the 'INPUT' token

      if(!this.not_eol()){
        return this.MK_Err(`Expression expected!`);
      }
      else{
        let assigne : Expr[] = [];

        let commaParsed : boolean = false;

        while(this.not_eol()){
          commaParsed = false;
          assigne.push(this.parse_expr());


          if(this.at().type == Tokens.Comma){
            commaParsed = true;
            this.eat();
            if(!this.not_eol()){
              return this.MK_Err("Expression expected!");
            }
          }
          else if(!commaParsed && this.not_eol()){

            return this.MK_Err("Comma expected!");

          }
        }

        this.expect(Tokens.EOL, "Expecting end of line!");

        if(!message){

          message = [{kind: "StringLiteral", text: "Enter user input: "} as StringLiteral];

        }


        const assignmentExpr = {
          kind: "InputExpr",
          assigne: assigne,
          promptMessage: message,
        } as inputExpr;



        return assignmentExpr;
      }

      
    }
    else{
      return this.parse_Stmt();
    }

    
  }


  private parse_list(extraLimiters? : Tokens[]) : Expr[] | Expr {

    const caution = extraLimiters ? [extraLimiters, Tokens.EOL, Tokens.EOF] : [Tokens.EOL, Tokens.EOF];

    let expressions : Expr[];
    let commaParsed : boolean = false;

    while(!caution.includes(this.at().type)){

      commaParsed = false;

      expressions.push(this.parse_expr());

      if(this.at().type == Tokens.Comma){
        commaParsed = true;
        this.eat();

        if(caution.includes(this.at().type)){

          return this.MK_Err("Expression expected!");

        }

      }
      else if(!commaParsed && !caution.includes(this.at().type)){

        return this.MK_Err("Comma expected!");

      }

      if(errorLog.length > 0){

        return this.MK_Err("");
      }

    }


    return expressions;

  }


  private parse_iterationStmt(): Stmt {
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
        return this.MK_Err("Not a valid iteration kind!");

    }

    if(iterationKind == "count-controlled"){
      const iterator = {
        kind: "Identifier",
        symbol: this.expect(Tokens.Identifier, "Expecting identifier name!").value,
      } as Identifier;

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }


      this.expect(Tokens.Assign, "Expecting assignment token!");


      const startVal = this.parse_expr();
      this.expect(Tokens.To, "Expecting 'TO' keyword here!");
      const endVal = this.parse_expr();

      let step : Expr;

      if(this.at().type == Tokens.Step){
        this.eat(); //Consumes the STEP token
        step = this.parse_expr();
      }


      this.expect(Tokens.EOL, "Expecting new line!");
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
              return this.MK_Err(`Expression expected!`);
            }
            else{
              let expressions : Expr[] = [];

              let commaParsed : boolean = false;

              while(this.not_eol()){

                commaParsed = false;

                expressions.push(this.parse_expr());

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err("Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){
                  return this.MK_Err("Comma expected!");
                }

              }


              
              returnExpressions.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
              body.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
            }


          }
          else{
            const parsed = this.parse_Stmt();



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

      this.expect(Tokens.Next, "Expecting 'NEXT' keyword!");

      if(errorLog.length > 0){
        return this.MK_NULL_PARSER();
      }
      
      if(this.at().type != Tokens.Identifier){
        return this.MK_Err("Identifier expected or none provided!");
      }

      const endIterator = {
        kind: "Identifier",
        symbol: this.expect(Tokens.Identifier, "Expecting identifier name!").value,

      } as Identifier;

      if(iterator.symbol != endIterator.symbol){
        return this.MK_Err(`Identifier '${iterator.symbol}' does not match identifier '${endIterator.symbol}'`, this.at(), "runtime");
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



      return iterationStmt;
    }
    else if(iterationKind == "post-condition"){
      this.expect(Tokens.EOL, "Expecting new line!");

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
              return this.MK_Err("Expression expected!");
            }
            else{
              
              let expressions : Expr[] = [];
              let commaParsed : boolean = false;

              while(this.not_eol()){
                commaParsed = false;
                expressions.push(this.parse_expr());

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err("Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){
                  return this.MK_Err("Comma expected!");
                }

              }

              returnExpressions.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
              body.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
            }

          }
          else{
            const parsed = this.parse_Stmt();

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

      this.expect(Tokens.Until, "Expecting 'UNTIL' keyword here!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }


      const condition = this.parse_expr();

      const repeatLoop = {
        kind: "IterationStmt",
        iterationKind: "post-condition",
        iterationCondition: condition,
        body: body,
        returnExpressions: returnExpressions,
      } as IterationStmt;

      return repeatLoop;
    }

    else if(iterationKind == "pre-condition"){
      const condition = this.parse_expr();

      this.expect(Tokens.Do, "Expecting 'DO' keyword here!");
      this.expect(Tokens.EOL, "Expecting new line!");

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
              expressions.push(this.parse_expr());

              if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                commaParsed = true;
                this.eat();
                if(!this.not_eol()){
                  return this.MK_Err("Expression expected!");
                }

              }
              else if(!commaParsed && this.not_eol()){
                return this.MK_Err("Comma expected!");
              }

            }

            returnExpressions.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
            body.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);

            
          }
          else{
            const parsed = this.parse_Stmt();

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

      this.expect(Tokens.Endwhile, "Expecting 'ENDWHILE' keyword after while loop declaration!");

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

      return whileLoop;

    }
    else{
      return this.MK_Err("Invalid iteration statement!");

    }



  }

  private not_eol() : boolean {

    if(this.at().type === Tokens.EOL || this.at().type === Tokens.EOF){

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

  private parse_selectionStmt_declaration(): Expr {
    const ifStatement = this.eat().type == Tokens.If; //consume the IF/CASE token
    let body = new Map<Expr, Stmt[]>();
    let Statements : Stmt[] = [];
    let ReturnExpressions : Stmt[] = [];
    
    if(ifStatement){

      

      const condition = this.parse_expr();
      
      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      if(this.at().type == Tokens.EOL){
        this.eat();
      }
      this.expect(Tokens.Then, "Expecting 'THEN' keyword!");
      this.expect(Tokens.EOL, "Expecting new line!");

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
              return this.MK_Err("Expression expected!");
            }
          }
          
          



          let parsed : Stmt;
          
          if(!this.not_eof()){

            const custom = {type: Tokens.EOF, value: "EOF", ln: this.at().ln + 1, col: 1} as Token;

            return this.MK_Err("Expecting 'ENDIF' token!", custom);
          }
          else{
            parsed = this.parse_Stmt();
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
                    return this.MK_Err("Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){

                  return this.MK_Err("Comma expected!");

                }

                expressions.push(this.parse_expr());
              }

              ReturnExpressions.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
              Statements.push({kind: "ReturnStmt", value: expressions} as ReturnStmt);
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
      
      body.set(condition, Statements);
      
      Statements = [];

      while(this.at().type == Tokens.EOL){
        this.eat();
      }

      if(this.at().type == Tokens.Elseif){
        while(this.not_eof() && this.at().type !== Tokens.Else && this.at().type !== Tokens.Endif){
          Statements = [];
          this.eat(); // Consumes the elseif
          const condition = this.parse_expr();
          
          if(this.at().type == Tokens.EOL){
            this.eat();
          }

          this.expect(Tokens.Then, "Expecting 'THEN' token here!");
          this.expect(Tokens.EOL, "Expecting new line!");

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
                expressions.push(this.parse_expr());

                if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
                  commaParsed = true;
                  this.eat();

                  if(!this.not_eol()){
                    return this.MK_Err("Expression expected!");
                  }
                }
                else if(!commaParsed && this.not_eol()){

                  return this.MK_Err("Comma expected!");

                }
              }

              parsed = {kind: "ReturnStmt", value: expressions } as ReturnStmt;

            }
            else{
              parsed = this.parse_Stmt();
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

          body.set(condition, Statements);

        }
      }
      
      

      Statements = [];
      
      if(this.at().type == Tokens.Else){
        this.eat();
        this.expect(Tokens.EOL, `Expecting new line!`);

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

            const parsed = this.parse_Stmt();

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

        body.set(mkTrue, Statements);
      }
      


      if(this.at().type !== Tokens.Endif && this.at().type !== Tokens.EOL && this.not_eof()){

        this.expect(Tokens.EOL, "Expecting new line before ENDIF token!");
      }



      this.expect(Tokens.Endif, "Expecting 'ENDIF' token after if statement declaration!");



      if(errorLog.length > 0){
        return this.MK_NULL_PARSER();
      }

      
    }
    else{

      this.expect(Tokens.Of, "Expecting 'OF' keyword!");

      if(errorLog.length > 0){

        return this.MK_NULL_PARSER();

      }

      let condition : BinaryExpr;

      if(!this.not_eol()){
        return this.MK_Err("Name expected!");
      }
      const name = this.parse_expr();
      this.expect(Tokens.EOL, `Expecting new line!`);


      if(!this.not_eol()){
        return this.MK_Err("Expression expected!")
      }
      else{
        const expr = this.parse_expr();
        condition = {
          kind: "BinaryExpr",
          left: name,
          right: expr,
          operator: '='
        } as BinaryExpr;

        this.expect(Tokens.Colon, "Expecting colon!");



        if(!this.not_eol() || this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise){
          return this.MK_Err("Statements expected!");
        }



        let parsed = this.parse_Stmt();
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
          parsed = this.parse_Stmt();
          if(!parsed || parsed.kind == "ErrorExpr"){
            return this.MK_NULL_PARSER();
          }


        }

        body.set(condition, Statements);

        while(this.at().type == Tokens.EOL){
          this.eat();
        }



        let check : Stmt;
        if(this.classify(parsed) == "Stmt"  && this.at().type !== Tokens.Otherwise && this.at().type !== Tokens.Endcase){
          check = this.parse_Stmt();
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
            this.expect(Tokens.Colon, "Colon expected!");

            parsed = this.parse_Stmt();

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
              parsed = this.parse_Stmt();
              if(!parsed || parsed.kind == "ErrorExpr"){
                return this.MK_NULL_PARSER();
              }
            }

            body.set(condition, Statements);

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

          if(!this.not_eol || this.at().type == Tokens.Endcase){
            return this.MK_Err("Statements expected!");
          }
          else{

            
            let parsed = this.parse_Stmt();
           

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
                parsed = this.parse_Stmt();
                if(!parsed || parsed.kind == "ErrorExpr"){
                  return this.MK_NULL_PARSER();
                }
              }

            }

            const MK_TRUE = {
              kind: "Identifier",
              symbol: "TRUE"
            } as Identifier;

            body.set(MK_TRUE, Statements);
            
          }
        }
      }
    }

    

    while(this.at().type == Tokens.EOL){
      this.eat();
    }

    
    
    if(!ifStatement){
      this.expect(Tokens.Endcase, "Expecting 'ENDCASE' token!");
    }
    

 
    
    const ifStmt = {
      kind: "SelectionStmtDeclaration",
      body: body,
      returns: (ReturnExpressions.length > 0)
      ? ReturnExpressions
      : [],

    } as SelectionStmtDeclaration;

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




  parse_fn_declaration(): Stmt {
    const procedure = (this.eat().type == Tokens.Procedure);
    const name = this.expect(Tokens.Identifier, "Expecting identifier name!").value;

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
            paramName.push(this.expect(Tokens.Identifier, "Name expected!").value);
            if(this.at().type == Tokens.Comma){
              commaParsed = true;
              this.eat();
              if(!this.not_eol() || this.at().type == Tokens.Colon){
                return this.MK_Err("Name expected!");
              }
            }
            else if(!commaParsed && this.not_eol() && this.at().type != Tokens.Colon){

              return this.MK_Err("Comma expected!");

            }
          }

          let paramType : Expr;

          this.expect(Tokens.Colon, "Expecting colon here!");
          
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
                return this.MK_Err("Array bounds expected!");
              }

              this.parse_expr();
              this.expect(Tokens.Colon, "Expecting colon!");



              this.parse_expr();
              this.expect(Tokens.CloseSquareBracket, "Expecting closing square brackets!");

              return this.MK_Err("Remove array bounds to ensure any array length can be accepted.");

            }
            else{
              this.expect(Tokens.Of, "Expecting 'OF' keyword!");

              if(!(this.isValidDataType(this.at()))){
                this.MK_Err(`Invalid data type '${this.at().value}'!`);
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
            return this.MK_Err(`Invalid data type '${this.at().value}'!`);
          }

          

          continue;
        }
        else if(this.at().type === Tokens.Comma){
          this.eat();
          continue;
        }
        else{
          return this.MK_Err("Expecting either parameters, comma or blank!");

        }
      }

      this.expect(Tokens.CloseBracket, "Expecting close brackets here!");



    }

    if(!procedure){
      
      this.expect(Tokens.Returns, `'RETURNS' expected!`);

      if(this.isValidDataType(this.at())){
        returnType = this.conv_tk_to_expr(this.eat().type as Tokens.String | Tokens.Char | Tokens.Boolean | Tokens.Integer | Tokens.Real | Tokens.Null | Tokens.Any);

      }
      else if(this.at().type == Tokens.Array){

        this.eat();
        this.expect(Tokens.Of, "Expecting 'OF' token!");
        if(!this.isValidDataType(this.at())){
          return this.MK_Err(`Invalid data type '${this.at().value}'!`);
        }


        returnType = {
          kind: "ObjectLiteral",
          dataType: this.eat().type,
        } as NewObjectLiteralExpr;
      }
      else{
        return this.MK_Err(`Expecting either valid return type, or 'ARRAY' keyword!`);
      }
    }
    else{
      if(this.at().type == Tokens.Returns){
        return this.MK_Err("Procedures cannot return a value!");
      }
    }


    

    this.expect(Tokens.EOL, "Expecting new line!");

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
          return this.MK_Err("Procedures cannot return a value!");

        }
        else{
          
          this.eat();
          
          let expressions : Expr[] = [];

          let commaParsed : boolean = false;

          while(this.not_eol()){
            commaParsed = false;
            expressions.push(this.parse_expr());

            if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
              commaParsed = true;
              this.eat();

              if(!this.not_eol()){
                return this.MK_Err("Expression expected!");
              }
            }
            else if(!commaParsed && this.not_eol() && this.at().type != Tokens.CloseBracket){

              return this.MK_Err("Comma expected!");

            }
          }

          parsed = {kind: "ReturnStmt", value: expressions} as ReturnStmt;

          returnExpressions.push(parsed);

          body.push(parsed);
          


        }

      }
      else if(this.at().type == Tokens.If || this.at().type == Tokens.Case){
        parsed = this.parse_selectionStmt_declaration() as SelectionStmtDeclaration;

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
        parsed = this.parse_iterationStmt();

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

        const parsed = this.parse_Stmt();

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
      this.expect(Tokens.Endprocedure, "Expecting 'ENDPROCEDURE' keyword after procedure declaration!");
    }
    else{

      this.expect(Tokens.Endfunction, "Expecting 'ENDFUNCTION' keyword after function declaration!");
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

    if(!procedure && returnExpressions.length == 0){
      return this.MK_Err("Functions that are not procedures must return a value!") ;

    }

    const displayparams = [...fn.parameters.entries()];


    if(errorLog.length > 0){



      return this.MK_NULL_PARSER();
    }
    else{
      return fn;
    }

    
    

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

  parse_var_declaration(): Stmt {

    const isConstant = this.eat().type == Tokens.Constant;
    

    let identifier : string[] = [];

    while(this.at().type != Tokens.Colon && this.at().type != Tokens.Array && this.at().type != Tokens.Assign){



      const ident = this.expect(Tokens.Identifier, "Name expected!").value;



      identifier.push(ident);
      if(this.at().type == Tokens.Comma){
        this.eat();

        if(!this.not_eol() || this.at().type == Tokens.Colon){
          this.expect(Tokens.Identifier, "Name expected!");
        }

      }
      else if(this.at().type == Tokens.Colon || this.at().type == Tokens.Array || this.at().type == Tokens.Assign){
        break;
      }
      else{

        return this.MK_Err("Expecting comma!");
      }
    }


    type dataType = 
      Tokens.Integer
    | Tokens.Real 
    | Tokens.String 
    | Tokens.Char 
    | Tokens.Boolean 
    | Tokens.Any
    | Tokens.Null
    let DT : dataType;
    //e.g DECLARE Score : INTEGER
    if(this.at().type == Tokens.Colon){
      if(isConstant){
        return this.MK_Err("Must not have colon after constant declaration!");

      }
      else{
        this.eat(); //consume the : token
        if(this.at().type == Tokens.Array){

          this.eat() //consume the ARRAY token
          const val = this.parse_new_obj_literal();


              return {
                kind: "VarDeclaration",
                constant: false,
                identifier: identifier,
                dataType: (val as NewObjectLiteralExpr).dataType,
                value: [val],
              } as VarDeclaration;

        }
        else{

          if(this.isValidDataType(this.at())){
            
            DT = this.eat().type as dataType;
            if(this.at().type == Tokens.EOL){
              this.eat()
              const varDec =  {
                kind: "VarDeclaration",
                constant: false,
                identifier: identifier,
                dataType: DT,
              } as VarDeclaration


              return varDec;
            }
            else{
              return this.MK_Err("New line expected!");

            }
          }
          else if(this.at().type == Tokens.EOL){
           return this.MK_Err("Expect datatype after non-constant variable declaration!") ;

          }
          else{
            return this.MK_Err(`Invalid data type '${this.eat().value}'!`) ;

          }
        }

        
      }
    }
    else if(this.at().type == Tokens.Assign){
      
      this.eat(); //consume the ← token
      if(this.at().type == Tokens.EOF || this.at().type == Tokens.EOL){
        return this.MK_Err(`Must assign constant "${identifier}" a value!`);

      }
      let vals : Expr[] = [];

      let commaParsed : boolean = false;

      while(this.not_eol()){

        
        commaParsed = false;
        vals.push(this.parse_expr());



        if(this.at().type == Tokens.Comma || this.at().type == Tokens.Ampersand){
          commaParsed = true;
          this.eat();
          if(!this.not_eol()){
            return this.MK_Err("Expression expected!");

          }


        }
        if(this.not_eol() && !commaParsed){
          return this.MK_Err("Comma expected!");
          //return this.MK_Err("Got " + this.at().value);
        }

      }

      return{
        kind: "VarDeclaration",
        constant: true,
        identifier: identifier,
        dataType: Tokens.Any,
        value: vals,
      }  as VarDeclaration;
      
      
    }
    else if(isConstant && !(this.at().type == Tokens.Assign || this.at().type == Tokens.EOL)){
      return this.MK_Err("Must use ← when assigning constants!");
      this.eat();

    }
    else if(!isConstant){
      return this.MK_Err("Must follow non-constant variable declaration with colon!"); 
    }
    else{
      return this.MK_Err("Did not complete variable/constant setup!");
    }
  }


  private parse_expr() : Expr{

    return this.parse_assignment_expr();

    
    
  }

  private parse_output_expr() : Expr {
    this.eat();

    if(!this.not_eol()){

      return this.MK_Err("Expression expected!");
    }
    else{
      
      let expressions : Expr[] = [];




      while(this.not_eol()){



        expressions.push(this.parse_expr());
        if(this.not_eol()){

          if(this.at().type == Tokens.Ampersand){

            this.eat();

          }
          else{
            this.expect(Tokens.Comma, "Comma expected!");
          }

          

          if(!this.not_eol()){
            return this.MK_Err("Expression expected!");
          }

        }
        else{
          break;
        }

      }


      const outputExpr = {
        kind: "OutputExpr",
        value: expressions,
      } as OutputExpr;




      while(this.at().type == Tokens.EOL){
        this.eat();

      }
      
      if(this.at().type == Tokens.Input){
        return this.parse_input_expr(outputExpr.value);
      }
      else{

        return outputExpr;
      }
    }


    
  }

  private parse_assignment_expr(): Expr {
    const left = this.parse_new_obj_literal();
    

      if(this.at().type == Tokens.Assign){
          this.eat(); //Advance past ← token

          if(!this.not_eol()){
            return this.MK_Err("Expression expected!");
          }


          let values : Expr[] = [];

          
          while(this.not_eol()){
            values.push(this.parse_expr());

            if(this.at().type == Tokens.Comma){
              this.eat();
              if(!this.not_eol()){
                return this.MK_Err("Expression expected!");
              }
            }
            else if(!this.not_eol()){

              //return this.MK_Err("Comma expected!");

            }
            else{
              break;
            }
          }

          return {
            value: values,
            assigne: left,
            kind: "AssignmentExpr",
          } as AssignmentExpr;
      }

      return left;
  }



  private parse_new_obj_literal() : Expr {

    if(this.at().type == Tokens.OpenSquareBracket){

      this.eat();

      if(this.at().type == Tokens.CloseSquareBracket){

        this.eat();

        const indexPairs = new Map<number, [Expr, Expr]>();

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1} as Expr;

        indexPairs.set(1, [one, one]);


        return {

          kind: "ObjectLiteral",
          exprs: [],
          dataType: Tokens.Any,
          start: one,
          end: one,
          indexPairs: indexPairs,
        } as NewObjectLiteralExpr;
      }





      const first = this.parse_expr();



      if(this.at().type == Tokens.Colon){


        this.eat();

        if(!this.not_eol() || this.at().type == Tokens.CloseSquareBracket){
          return this.MK_Err("End bound expected!");
        }

        const end_bound = this.parse_expr();

        let obj = {
          kind: "ObjectLiteral",
          exprs: [],
          start: first,
          end: end_bound,
        } as NewObjectLiteralExpr;

        let indexPairs = new Map<number, [Expr, Expr]>();

        indexPairs.set(1, [first, end_bound]);

        let dimension = 2;

        while(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){

          if(this.at().type == Tokens.Comma){
            this.eat();
          }

          const indexPair = this.parse_pure_obj_bounds();

          indexPairs.set(dimension, [indexPair[0], indexPair[1]]);

          dimension++;

        }

        let DT : Tokens;

        this.expect(Tokens.CloseSquareBracket, "Expecting closing square brackets!");
        this.expect(Tokens.Of, "Expecting 'OF' keyword!");

        if(this.isValidDataType(this.at())){
          DT = this.eat().type;
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

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1} as Expr;

        if(first.kind == "ObjectLiteral"){
          indexPairs.set(1, [(first as NewObjectLiteralExpr).start, (first as NewObjectLiteralExpr).end])
        }
        else{
          indexPairs.set(1, [one, one]);
        }

        this.eat();



        while(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){

          exprs.push(this.parse_expr());

          if(this.at().type == Tokens.Comma){
            this.eat();

            if(!this.not_eol()){
              return this.MK_Err("Expression expected!");
            }

          }

        }

        this.expect(Tokens.CloseSquareBracket, "Closing square brackets expected!");

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

        } as NewObjectLiteralExpr;


      }
      else if(this.at().type == Tokens.CloseSquareBracket){

        this.eat();

        const indexPairs = new Map<number, [Expr, Expr]>();

        const one = {kind: "NumericLiteral", numberKind: Tokens.Integer, value: 1} as Expr;

        indexPairs.set(1, [one, one]);




        return {

          kind: "ObjectLiteral",
          exprs: [first],
          dataType: Tokens.Any,
          start: one,
          end: one,
          indexPairs: indexPairs,
        } as NewObjectLiteralExpr;

      }
      else{
        return this.MK_Err("Expecting closing square brackets!");
      }



    }
    else{
      return this.parse_logic_expression();
    }


  }

  private parse_pure_obj_bounds() : Expr[] {

    if(this.at().type == Tokens.CloseSquareBracket || !this.not_eol()){
      return [this.MK_Err("Start bound expected!")];
    }
    const start_bound = this.parse_expr();
    this.expect(Tokens.Colon, "Colon expected!");
    if(this.at().type == Tokens.CloseSquareBracket || !this.not_eol()){

      return [this.MK_Err("End bound expected!")];

    }
    const end_bound = this.parse_expr();

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


  private parse_logic_expression(StringJoining? : boolean) : Expr {

    let left : Expr;
    
    if(this.at().type == Tokens.NOT){
      left = {kind: "NullLiteral", value: null} as NullLiteral;
      
    }
    else{

      left = this.parse_comparitive_expression();
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
 }


 private parse_comparitive_expression() : Expr{
 
  let left : Expr = this.parse_additive_expression();



  const binaryOperators = ["<>", "<", ">", "≥", "≤", "<=", ">=", "="];

  while( binaryOperators.includes(this.at().value)){
    const operator = this.eat().value;

    let right : Expr;
    
    if(!this.not_eol()){

      return this.MK_Err("Expression expected!");

    }

    right = this.parse_additive_expression();

    left = {
      kind: "BinaryExpr",
      left,
      right,
      operator,
    } as BinaryExpr;
  }


  return left;
 }



  private parse_additive_expression(StringJoining? : boolean) : Expr{
    let left = this.parse_multiplicative_expression();
    
   
    
    
    while(this.at().value == '+' || this.at().value == '-'){
      const operator = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err("Expression expected!");

      }


      const right = this.parse_multiplicative_expression();
      
      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }



  private parse_multiplicative_expression(): Expr{
    let left = this.parse_exponential_expression();
    

    while(this.at().value == '*' || this.at().value == '/' ){
      const operator = this.eat().value;


      if(!this.not_eol()){

        return this.MK_Err("Expression expected!");

      }

      const right = this.parse_exponential_expression();

      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator
      } as BinaryExpr;
    }
    

    return left;
  }



  private parse_exponential_expression(): Expr{
    let left = this.parse_unary_expr();
    

    while(this.at().value == '^' ){
      const operator = this.eat().value;


      if(!this.not_eol()){

        return this.MK_Err("Expression expected!");

      }

      const right = this.parse_unary_expr();

      left = {
        kind: "BinaryExpr",
        left,
        right,
        operator
      } as BinaryExpr;
    }


    return left;
  }

  private parse_unary_expr() : Expr {

    if(this.at().type == Tokens.UnaryOperator){
      const operator = this.eat().value;

      if(!this.not_eol()){

        return this.MK_Err("Expression expected!");

      }

      const right = this.parse_call_member_expr();

      return {kind: "UnaryExpr", operator: operator, right: right} as UnaryExpr;
    }
    else{
      return this.parse_call_member_expr();
    }

    
  }

  private parse_call_member_expr(): Expr {
    
    if(this.at().type == Tokens.Call){
      this.eat();

      if(!this.not_eol()){

        return this.MK_Err("Procedure name expected!");

      }

      const member = this.parse_new_memberExpression();
      const procedure = member as FunctionDeclaration;



      //This may be the cause of any problems, but I did it to allow calling procedures without brackets
      if(this.at().type == Tokens.OpenBracket || this.at().type == Tokens.EOL){
        return this.parse_call_expr(member, true);
      }

      return member;

    }
    else{

      const member = this.parse_new_memberExpression();




      if(this.at().type == Tokens.OpenBracket){
        return this.parse_call_expr(member, false);
      }

      return member;
    }

  }


  private parse_call_expr(caller : Expr, wasCallKeywordUsed : boolean): Expr {

    let args : Expr[] = [];

    if(this.at().type == Tokens.OpenBracket){
      args = this.parse_args();
    }
    
    let call_expr : Expr = {
      kind: "CallExpr",
      caller, 
      args: args,
      wasCallKeywordUsed: wasCallKeywordUsed,
    } as CallExpr;


    return call_expr;
  }

  private parse_args(): Expr[] {
    this.expect(Tokens.OpenBracket, "Expecting open brackets!");
    const args = this.at().type == Tokens.CloseBracket
    ? []
    : this.parse_arguments_list();

    this.expect(Tokens.CloseBracket, "Expecting close brackets here!");

    return args;
  }

  private parse_arguments_list(): Expr[]{
    const args = [this.parse_expr()];

    while(this.at().type == Tokens.Comma && this.eat()){
      args.push(this.parse_expr());
    }

    return args;
  }

  private MK_Err(message : string, token? : Token, owrt? : string) : Expr {



    

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


    const err = (owrt ? owrt : "syntax") as "syntax" | "runtime" | "type" | "lexer" | "math";

    makeError(message + ` (Ln ${ln})`, err);
    return {
      kind: "ErrorExpr"
    } as Expr;
  }


  private parse_new_memberExpression() : Expr {

    let Object : Expr = this.parse_primary_expression();

    if(this.at().type == Tokens.OpenSquareBracket){

      this.eat(); //Consumes the '[' token

      const parent_Obj = Object;

      let indexArr : Expr[] = [];

      while(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){

        indexArr.push(this.parse_expr());

        if(this.at().type == Tokens.Comma){
          this.eat();
          if(!this.not_eol() || this.at().type == Tokens.CloseSquareBracket){
            return this.MK_Err("Expression expected!");
          }

        }
        else if(this.not_eol() && this.at().type != Tokens.CloseSquareBracket){
          this.MK_Err("Comma expected!");
        }

      }

      this.expect(Tokens.CloseSquareBracket, "Expecting closing square brackets!");

      Object = {

        kind: "MemberExpr",
        object: parent_Obj,
        indexes: indexArr,

      } as NewMemberExpr;

      

    }
    
    return Object;


  }

  private parse_primary_expression(): Expr{
    const tk = this.at().type;

    switch(tk){


      case Tokens.Identifier:
        
        return {
          kind: "Identifier",
          symbol: this.eat().value,
        } as Identifier;

      case Tokens.Boolean:
        return {
          kind: "Identifier",
          symbol: this.eat().value,
        } as Identifier;


      case Tokens.StringLiteral:


        return {
          kind: "StringLiteral",
          text: this.eat().value,
        } as StringLiteral

      case Tokens.NumericLiteral:
        
        return {
          kind: "NumericLiteral",
          value: parseFloat(this.eat().value),
        } as NumericLiteral;
        
      case Tokens.OpenBracket:
        this.eat(); //remove opening bracket
        const value = this.parse_expr();
        this.expect(
          Tokens.CloseBracket, "Expected closing brackets!"
        );

        return value;

      case Tokens.EOL:
        this.eat();

        return null as any;

      case Tokens.EOF:

        return null as any;


      default:

        //throw new Error(`Unexpected token found during parsing ${this.at().value}`);
        
        return this.MK_Err(`Unexpected token found during parsing '${this.at().value}'!`);
        
    }
  }
}

function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && str.trim() !== '';
}




