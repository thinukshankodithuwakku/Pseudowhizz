import { CallExpr, Expr, FileExpr, FunctionDeclaration, IterationStmt, NodeType, NullLiteral, NumericLiteral, Program, SelectionStmtDeclaration, Stmt, VarDeclaration } from "./Frontend/AST.js";
import Parser, { errToken } from "./Frontend/Parser.js";
import Environment, {SetupGlobalScope} from "./Runtime/Environment.js";
import { evaluate } from "./Runtime/Interpreter.js";
import { RuntimeVal, MK_NULL } from "./Runtime/Value.js";
import { Token, tokenize, Tokens } from "./Frontend/Lexer.js";
import {PyT, JST} from "./Runtime/Translators.js";


interface ConsoleLine {

  type: 'output' | 'prompt' | 'input',
  value: string,

} 

export const UserFnArgDesc = new Map<string, {label : string, params : string[], returns : string}>();

export let outputLog : string[] = [];
export let consoleHistory : ConsoleLine[] = [];
export let errorLog : string[] = [];
export let errorLines : number[] = [];
export let pauseLog : string[] = [];
export let commentLog : string[] = [];
export let contexts : string[] = [];
export let programFile : string;
export const global_file_state = new Map<string, [string, string]>();
export const func_map = new Map<string, "FUNCTION" | "PROCEDURE">();
export let err : error;
export const callStackLimit = 8000;
//The above map: <filename, [r/w mode, using file]
export let cur_fl = "Main.pseudo";
export let natives = ["LCASE", "UCASE", "LENGTH", "ROUND", "EOF", "DIV", "MOD", "SUBSTRING"];


export interface StackFrame {

  context : string,
  ln : number,
  expr : string,

}

export const initial_frame = {

  context: "<module>",
  ln: undefined,
  expr: undefined,

}

let e = [];

type functionState = "translating" | "interpreting" | "unknown"; 
export let my_state : functionState = "unknown";


const trans = new JST();


if(localStorage.getItem("Saved") !== null && localStorage.getItem("Saved") !== ""){
  localStorage.setItem("Default", localStorage.getItem("Saved"));
}
else if(localStorage.getItem("Default") == null || localStorage.getItem("Default") == ""){
  fetch('/Prewritten/Default.txt')
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.statusText);
          }
          return response.text(); // Read as plain text
      })
      .then(text => {
          localStorage.setItem('Default', text); // Store the solution in localStorage

      })
      .catch(error => {
          console.error('Error fetching file:', error);
      });
}



export let files = new Map([
            ["Main.pseudo",""],
            ["Sample.txt","Hello world!"],
        ]);

export let pseudoFiles = new Map<string, string>(); //Key = filename, value = READ or WRITE
export let FileValues = new Map<string, string[]>(); //Key = filename, value = actual text

export function resolveFile(filename : string, request : "MODE" | "CONTENT" | "LENGTH", env : Environment, StackFrames : StackFrame[]) {

  const keyArr = Array.from(pseudoFiles.keys());



  if(!keyArr.includes(filename)){
    makeError(`File '${filename}' does not exist or has been closed!`, "Runtime",undefined,StackFrames) ;
    return null;
  }
  else{

    switch(request){
      case "MODE":
        return pseudoFiles.get(filename);

      case "CONTENT":
        return files.get(filename);

      case "LENGTH":
        return FileValues.get(filename).length;
    }


  }

}

export function UseFile(filename : string, operation : "READ" | "WRITE", env : Environment, StackFrames : StackFrame[], value? : String) : String{
  const keyArr = Array.from(pseudoFiles.keys());

  if(!keyArr.includes(filename)){
    makeError(`File ${filename} does not exist or has been closed!`, "Runtime", undefined, StackFrames) ;
  }
  else{
    if(operation == "READ"){


      if(pseudoFiles.get(filename) != "READ" && localStorage.getItem("Flmd") == "false"){

        makeError(`File '${filename}' has not been opened for reading!`, "Runtime",undefined, StackFrames) ;
      }
      else{

        if(FileValues.get(filename).length == 0){
          makeError(`Reached end of file '${filename}'!`, "Runtime",undefined, StackFrames);
          return " ";
        }
        else{

          const text = FileValues.get(filename).shift();


          return text;
        }
      }


    }
    else{


      if(pseudoFiles.get(filename) != "WRITE" && localStorage.getItem("Flmd") == "false"){
        makeError(`File '${filename}' has not been opened for writing!`, "Runtime",undefined, StackFrames);
      }
      else{
         
        const current = files.get(filename);

        

        let wrap = String(value);



        if((wrap.startsWith("'") && wrap.endsWith("'")) || (wrap.startsWith('"') && wrap.endsWith('"'))){
          wrap = wrap.slice(1,-1);
        }
        

        FileValues.set(filename, [wrap]);
        files.set(filename, wrap);


        return null;
      }
    }
  }



}

export function configureFileMemory(filename : string, mode: "READ" | "WRITE", operation: "CLOSE" | "OPEN", ln : number, StackFrames : StackFrame[] ){
  const keyArr = Array.from(files.keys());

  if(operation == "OPEN"){
    if(!keyArr.includes(filename)){

      makeError(`File '${filename}' does not exist!`, "Runtime", ln, StackFrames) ;
    }
    else{
      
      const foreign_access = global_file_state.get(filename) && global_file_state.get(filename)[0] == 'o' && global_file_state.get(filename)[1] != programFile;

      if(foreign_access){

        makeError(`File '${filename}' is already open in another program. Please close it first before using it in this program!`, "Runtime", ln, StackFrames);

      }
      else if(pseudoFiles.has(filename)){

        

        if(pseudoFiles.get(filename) == mode){
          makeError(`File '${filename}' is already open in ${mode} mode!`, "Runtime", ln, StackFrames);
        }
        else{
          pseudoFiles.set(filename, mode);
        }




      }
      else{

        

        let toUse = files.get(filename).split((/\r?\n/));
        FileValues.set(filename, toUse);
        global_file_state.set(filename, ['o', programFile]);
        pseudoFiles.set(filename, mode);
      }
      
    }
  }
  else if(operation == "CLOSE"){
    if(!keyArr.includes(filename)){
     makeError(`File '${filename}' does not exist!`, "Runtime", ln, StackFrames);
    }
    else{
      if(pseudoFiles.has(filename)){
          FileValues.delete(filename);
          pseudoFiles.delete(filename);
          global_file_state.set(filename, ['c', programFile]);
      }
      else{
        makeError(`File '${filename}' already closed or has not been opened yet!`, "Runtime", ln, StackFrames);
      }
      
    }
  }


}



export type error = "Syntax" | "Runtime" | "Type" | "Lexer" | "Math" | "Index" | "Name" | "Range" | "ZeroDivision";
export let running = false;

export const methods = new Set<string>();
export const constants = new Set<string>();
export const procedures = new Set<string>();

export let folded_line : number = null;

export class namespace {

  public remove(nmspc : "functions" | "constants" | "procedures" | "variables", c : string){

    

    switch(nmspc){

      case "constants":
        constants.delete(c);
        break;

      case "functions": 

        methods.delete(c);
        UserFnArgDesc.delete(c);
        
        break;

      case "procedures":
        procedures.delete(c);
        UserFnArgDesc.delete(c);
        break;

    }

  }


  public add(nmspc : "functions" | "constants" | "procedures", c : string){

    

    switch(nmspc){

      case "constants":
        constants.add(c);
        break;

      case "functions": 


        methods.add(c);
        break;

      case "procedures":

        procedures.add(c);
        break;
    }

  }

}

export const ns = new namespace();


export function makeError(message : string,  errType? : error, ln? : number, StackFrames? : StackFrame[]){


  err = errType;

  let errorMsg : string = "";
  


  errorLines.push(ln);


  if(StackFrames && StackFrames.length > 1){

    StackFrames.shift();

    let seen_lns = [];


    for(const frame of StackFrames){

      const bit = frame.ln ? `line ${frame.ln}, ` : ''

      if(frame.ln && !seen_lns.includes(frame.ln)){

        if(errType == "Syntax"){

          errorMsg += (`File <"${cur_fl}">, ${bit}`);
          seen_lns.push(frame.ln);

        }
        else{

          errorMsg += (` File <"${cur_fl}">, ${bit}in ${frame.context}\n   ${frame.expr}\n`);
          seen_lns.push(frame.ln);
        
        }

        

      }

      

    }

  }
  else{

    if(ln){


      if(errType == "Syntax") errorMsg += `File <"${cur_fl}">, line ${ln}\n`;
      else errorMsg += ` File <"${cur_fl}">, line ${ln}, in <module>\n`;
      

    }
    else{

      if(errType == "Syntax") errorMsg += `File <"${cur_fl}">\n`;
      else errorMsg += ` File <"${cur_fl}">, in <module>\n`;

    }

    

  }

  


  if(errType){
    errorMsg += "Uncaught " + errType + "Error: " + message;


  }
  else{
    errorMsg += "Uncaught: " + message;
  }



  if(errorLog.length == 0){

    errorLog.push(errorMsg);
  }
  
  return MK_NULL();
}

function countStmts(closure : Program | SelectionStmtDeclaration | FunctionDeclaration | IterationStmt, search : NodeType) : Stmt[] {

  
  const stmts = [];

  switch(closure.kind){

    case "Program":

      const program = closure as Program;
      if(!program.body.map(stmt => stmt.kind).includes(search)) return [];

      for(const stmt of program.body){

        if(stmt.kind == search){

          stmts.push(stmt);

        }
        else if(stmt.kind == "SelectionStmtDeclaration"){

          const found = countStmts(stmt as SelectionStmtDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "IterationStmt"){

          const found = countStmts(stmt as IterationStmt, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "FunctionDeclaration"){

          const found = countStmts(stmt as FunctionDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }

      }

      return stmts;

    case "FunctionDeclaration":

      const func = closure as FunctionDeclaration;
      if(!func.body.map(stmt => stmt.kind).includes(search)) return [];

      for(const stmt of func.body){

        if(stmt.kind == search){

          stmts.push(stmt);

        }
        else if(stmt.kind == "SelectionStmtDeclaration"){

          const found = countStmts(stmt as SelectionStmtDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "IterationStmt"){

          const found = countStmts(stmt as IterationStmt, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "FunctionDeclaration"){

          const found = countStmts(stmt as FunctionDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }

      }

      return stmts;

    case "IterationStmt":

      const iter = closure as IterationStmt;
      if(!iter.body.map(stmt => stmt.kind).includes(search)) return [];

      for(const stmt of iter.body){

        if(stmt.kind == search){

          stmts.push(stmt);

        }
        else if(stmt.kind == "SelectionStmtDeclaration"){

          const found = countStmts(stmt as SelectionStmtDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "IterationStmt"){

          const found = countStmts(stmt as IterationStmt, search);
          found.forEach(stmt => stmts.push(stmt));

        }
        else if(stmt.kind == "FunctionDeclaration"){

          const found = countStmts(stmt as FunctionDeclaration, search);
          found.forEach(stmt => stmts.push(stmt));

        }

      }

      return stmts;

    case "SelectionStmtDeclaration":

      const selec = closure as SelectionStmtDeclaration;
      

      const conds = [...selec.body.keys()];
      const bodies = conds.map(key => selec.body.get(key)[1]);

      for(const body of bodies){

        if(!body.map(stmt => stmt.kind).includes(search)) continue;

        for(const stmt of body){

          if(stmt.kind == search){

            stmts.push(stmt);

          }
          else if(stmt.kind == "SelectionStmtDeclaration"){

            const found = countStmts(stmt as SelectionStmtDeclaration, search);
            found.forEach(stmt => stmts.push(stmt));

          }
          else if(stmt.kind == "IterationStmt"){

            const found = countStmts(stmt as IterationStmt, search);
            found.forEach(stmt => stmts.push(stmt));

          }
          else if(stmt.kind == "FunctionDeclaration"){

            const found = countStmts(stmt as FunctionDeclaration, search);
            found.forEach(stmt => stmts.push(stmt));

          }

        }

      }

      return stmts;

    default:
      return [];
  }
  
}

export function pre_file_scan(src : string) : string[] {

  errorLog = [];

  const p = new Parser();
  const program = p.produceAST(src);


  if(errorLog.length > 0) return [];

  const fileNames = [...new Set((countStmts(program, "FileExpr") as FileExpr[]).map(expr => expr.fileName))];

  return fileNames;

}

export function halt_program(safe : boolean) {
  const input_modal = document.getElementById('input-modal') as HTMLDialogElement;
  input_modal.close();
  running = false;

  if(!safe){
    
    makeError("Session killed due to timeout");
  }
  
}

export async function repl(src : string, pF : string, filename : string, request? : string) {
  
  cur_fl = filename;

  programFile = pF;

  running = true;
  
  outputLog = [];
  errorLog = [];
  contexts = [];
  errorLines = [];
  pauseLog = [];
  commentLog = [];
  consoleHistory = [];
  const parser = new Parser();
  const env = SetupGlobalScope();
  


  let program : Program;
  let result : RuntimeVal;

  

  if(request == "program" || request == "evaluate"){
    my_state = "interpreting";
    program = parser.produceAST(src);

    
    

    if(loose_expr("<module>",program)){

      return null;

    }
    else{

      const initial_frame = {

        ln: undefined,
        context: "<module>",
        expr: undefined

      } as StackFrame

      
      const evaluatedProgam =  await evaluate(program, env, [initial_frame]);

      if(!evaluatedProgam || evaluatedProgam.type == "null" || errorLog.length > 0 || pauseLog.length > 0){
        return null;
      }
      else{
        result = evaluatedProgam;

        

      }
    }


    

  }
  else if(request == "env"){
    return env;
  }
  else if(request == "tokens"){

    my_state = "interpreting";

    const banned_tokens = [Tokens.EOL, Tokens.Comment, Tokens.Null, Tokens.Any, Tokens.Unrecognised];

    consoleHistory = [];

    for(const tk of tokenize(src)){
      if(!banned_tokens.includes(tk.type)){
        consoleHistory.push({type: "output", value: format_token(tk)});
      }
      

    }

    return outputLog;

  }


  else if(request == "ast"){

    my_state = "interpreting";

    program = parser.produceAST(src);

    consoleHistory = [];

    for(const stmt of program.body){

      if(stmt.kind != "NullLiteral" && stmt.kind != "CommentExpr"){
        consoleHistory.push({type: "output", value: format_astNode(stmt)});
      }
      

    }

    //consoleHistory = outputLog.map(log => ({type: 'output', value: log} as ConsoleLine));

    return [];

  }
  else if(request == "python"){

    my_state = "translating";

    program = parser.produceAST(src);
    

    if(loose_expr("<module>",program)){

      return ["#Cannot finish translation due to a potential syntax error", '#Evaluate your program and check that there are no errors first before translating!'];

    }
    else{






      errorLog = [];
      pauseLog = [];
      contexts = [];

      const translator = new PyT();
      const translatedProgam =  await translator.produce_py_program(program, env);

      outputLog = translatedProgam.split('\n')

      return outputLog;
    }

  }
  else if(request == "javascript"){

    my_state = "translating";

    program = parser.produceAST(src);
    

    if(loose_expr("<module>",program)){

      return ["// Cannot finish translation due to a potential syntax error", '// Evaluate your program and check that there are no errors first before translating!'];

    }
    else{

      errorLog = [];
      pauseLog = [];
      contexts = [];

      const translator = new JST();
      const translatedProgam = await translator.produce_JS_program(program);

      outputLog = translatedProgam.split('\n')

      return outputLog;
    }

  }

  else{
    my_state = "translating";
    return result;
  }
}





function format_astNode(stmt : Stmt) : string {

  switch(stmt.kind){

    case "EndClosureExpr":
      return "";

    case "FunctionDeclaration":

      const fn = stmt as FunctionDeclaration;

      let body = [];

      for(const stmt of fn.body){

        body.push(format_astNode(stmt) + '\n');
    

      }

      return `kind: FunctionDeclaration,\nparamaters: ${JSON.stringify(Array.from((fn.parameters)))},\nname: ${fn.name},\nbody: ${body}`;


    case "SelectionStmtDeclaration":

      const ss = stmt as SelectionStmtDeclaration;

      let bd1 = [];

      const conds = Array.from(ss.body.keys());

      for(const stmt of conds){

        const closure = ss.body.get(stmt)[1];

        for(const s of closure){
          bd1.push('\n' + format_astNode(s));
        }

      }



      return `kind: SelectionStatement,\n body: ${bd1}`;

    case "IterationStmt":

      const is = stmt as IterationStmt;

      let bd2 = [];

      for(const stmt of is.body){

        bd2.push('\n' + format_astNode(stmt));

      }

      return `kind: IterationStmt,\nbody: ${bd2}`;

    case "VarDeclaration":

      const vd = stmt as VarDeclaration;
      
      return `kind: VariableDeclaration,\nname(s): ${vd.identifier},\nisConstant?:${vd.constant},\ndataType: ${Tokens[vd.dataType]}`;

    case "NumericLiteral":

      const n = stmt as NumericLiteral;

      return `kind: NumericLiteral,\nvalue: ${n.value},\nisInteger?:${n.numberKind == Tokens.Integer ? true : false}`;

    default:
      return JSON.stringify(stmt, null, 3);

  }


}

function format_token(raw : Token) : string {

  return `Type: ${Tokens[raw.type]}, Value: '${raw.value}'`;

}

function loose_expr(context : string =  "<module>", p : Expr, inF? : boolean) : boolean {



  if(p.kind == "Program"){

    for(const stmt of (p as Program).body){

      if(isExpr(stmt) || stmt.kind == "ReturnStmt"){
        
        if((!inF && stmt.kind == "ReturnStmt")){

          makeError("Return expression found outside of function!", "Syntax");

        }
        else{

          makeError("Unassigned expression encountered!", "Syntax", stmt.ln)

        }

        e.push(stmt);
        return true;

      }
      else if(stmt.kind == "SelectionStmtDeclaration"){

        if(loose_expr(context, (stmt as SelectionStmtDeclaration), inF)){
          e.push(stmt);
          return true;

        }

      }
      else if(stmt.kind == "IterationStmt"){

        if(loose_expr(context, stmt as IterationStmt, inF)){
          e.push(stmt);
          return true;

        }

      }
      else if(stmt.kind == "FunctionDeclaration"){
        
        if(loose_expr(context, stmt as FunctionDeclaration, true)){

          

          e.push(stmt);
          return true;

        }

      }

    }

    return false;

  }
  else if(p.kind == "SelectionStmtDeclaration"){

    for(const stmt of (p as SelectionStmtDeclaration).body){



      for(const s of stmt[1][1]){

        if(isExpr(s) || (!inF && s.kind == "ReturnStmt")){



          e.push(s);

          if((!inF && s.kind == "ReturnStmt")){

            makeError("Return expression found outside of function!", "Syntax", s.ln, [initial_frame]);

          }
          else{

            makeError("Unassigned expression encountered!", "Syntax", s.ln, [initial_frame])

          }

          return true;

        }
        else if(s.kind == "SelectionStmtDeclaration"){

          if(loose_expr(context, (s as SelectionStmtDeclaration), inF)){
            e.push(stmt);
            return true;

          }

        }
        else if(s.kind == "IterationStmt"){

          if(loose_expr(context, s as IterationStmt, inF)){
            e.push(stmt);
            return true;

          }

        }
        else if(s.kind == "FunctionDeclaration"){

          if(loose_expr(context, s as FunctionDeclaration, true)){
            e.push(stmt);
            return true;

          }

        }

      }



    }

    return false;

  }
  else if(p.kind == "IterationStmt"){

    for(const stmt of (p as IterationStmt).body){

      if(isExpr(stmt) || (!inF && stmt.kind == "ReturnStmt")){

        if((!inF && stmt.kind == "ReturnStmt")){

          makeError("Return expression found outside of function!", "Syntax");

        }
        else{

          makeError("Unassigned expression encountered!", "Syntax", stmt.ln)

        }

        e.push(stmt);
        return true;

      }
      else if(stmt.kind == "SelectionStmtDeclaration"){

        if(loose_expr(context, (stmt as SelectionStmtDeclaration), inF)){
          e.push(stmt);
          return true;

        }

      }
      else if(stmt.kind == "IterationStmt"){

        if(loose_expr(context, stmt as IterationStmt, inF)){
          e.push(stmt);
          return true;

        }

      }
       else if(stmt.kind == "FunctionDeclaration"){

        if(loose_expr(context, stmt as FunctionDeclaration, inF)){
          e.push(stmt);
          return true;

        }

      }

    }

    return false;

  }
  else if(p.kind == "FunctionDeclaration"){
    
    const name = (p as FunctionDeclaration).name;

    for(const stmt of (p as FunctionDeclaration).body){

      

      if(isExpr(stmt)){
        
        makeError("Unassigned expression encountered!", "Syntax", stmt.ln, [initial_frame]);
        e.push(stmt);
        return true;

      }
      else if(stmt.kind == "SelectionStmtDeclaration"){
       
        if(loose_expr(name, (stmt as SelectionStmtDeclaration), true)){
          
          e.push(stmt);
          return true;

        }

      }
      else if(stmt.kind == "IterationStmt"){

        if(loose_expr(name, stmt as IterationStmt, true)){

          e.push(stmt);
          return true;

        }

      }
      else if(stmt.kind == "FunctionDeclaration"){
        
        if(loose_expr(name, stmt as FunctionDeclaration, true)){
          e.push(stmt);
          return true;

        }

      }

    }
    

    return false;

  }



}

function isExpr(stmt : Stmt) : boolean {




  switch(stmt.kind){

    case "BinaryExpr":
      return true;

    case "BooleanLiteral":
      return true;

    case "CallExpr":


      return false;

    case "Identifier":
      return true;


    case "CharString":
      return true;


    case "MemberExpr":
      return true;

    case "NumericLiteral":
      return true;

    case "ObjectLiteral":
      return true;

    case "StringLiteral":
      return true;

    case "UnaryExpr":
      return true;

    default:
      return false;



  }

}

