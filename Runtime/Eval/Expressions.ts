import { Stmt, CallExpr, AssignmentExpr, BinaryExpr, Expr, Identifier, NumericLiteral,  StringLiteral, FunctionDeclaration, SelectionStmtDeclaration, IterationStmt, OutputExpr, InputExpr, FileUse, CharString, UnaryExpr, ReturnStmt, NewObjectLiteralExpr, NewMemberExpr, FileNameExpr, VarDeclaration  } from "../../Frontend/AST.js";
import Environment, { arityCheck, SetupGlobalScope } from "../Environment.js";
import { evaluate } from "../Interpreter.js";
import { Pause, primitiveValue, FileNameVal,NativeFnValue, MemberExprVal, NumberVal, RuntimeVal, MK_NULL, ValueType, BooleanVal, FunctionValue, StringVal, CharVal, NullVal, SelectionStmt, MK_STRING, MK_BOOL, MK_NUMBER, endClosureVal, NewObjectVal, MK_CHAR } from "../Value.js";
import { Token, tokenize, Tokens } from "../../Frontend/Lexer.js";
import { eval_var_declaration, MK_EMPTY, natives } from "./Statements.js";
import { UseFile,outputLog, errorLog, makeError, pauseLog, func_map, StackFrame, contexts } from "../../Main.js";
import PCON from "../../Frontend/PCON.js";


const pcon = new PCON;

export function eval_file_name_expr(astNode : FileNameExpr, env : Environment) : RuntimeVal {

  return {

    type: "file-name",
    value: astNode.value,
    ln: astNode.ln,

  } as FileNameVal;

}

const initial_stack = {

  ln: undefined,
  expr: undefined,
  context: "<module>"

} as StackFrame;

function eval_numeric_binary_expr(
  
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string,
  StackFrames : StackFrame[]
): NumberVal | StringVal | BooleanVal | NullVal {
  let resultType : "number" | "string" | "boolean";
  let result: number | string | boolean;
  if (operator == "+") {

    result = lhs.value + rhs.value;
    resultType = "number";

  } else if (operator == "-") {
    result = lhs.value - rhs.value;
    resultType = "number";

  } else if (operator == "*") {
    result = lhs.value * rhs.value;
    resultType = "number";

  } else if (operator == '%') {
    return makeError("Unrecognised operator '%'. Did you mean to use the 'MOD()' function?", "syntax", lhs.ln, StackFrames);

  } else if (operator == "/") {

    

      if(rhs.value == 0){
        return makeError("Division by zero!", "ZeroDivision", lhs.ln, StackFrames);
      }
      else{
        result = lhs.value / rhs.value;
        resultType = "number";
      }

  } else if (operator == '^'){


    const root = 1 / rhs.value;
    result = lhs.value ** rhs.value;

    if(isNaN(result)){

      return makeError("Result of runtime expression is non-real!", "math", lhs.ln, StackFrames);

    }
    else{

      
      resultType = "number";

    }


    

  } else if (operator == "<"){
    result = lhs.value < rhs.value;
    resultType = "boolean";

  } else if (operator == ">"){
    result = lhs.value > rhs.value;
    resultType = "boolean";

  } else if (operator == ">=" || operator == "≥"){
    result = lhs.value >= rhs.value;
    resultType = "boolean";

  } else if (operator == "<=" || operator == "≤"){
    result = lhs.value <= rhs.value;
    resultType = "boolean";

  } else if (operator == "="){
    result = lhs.value == rhs.value;
    resultType = "boolean"
  
  } else if (operator == '<>'){
    result = lhs.value !== rhs.value;
    resultType = "boolean"

  } else {
    return makeError("Unrecognised operator!", "runtime", lhs.ln, StackFrames);
  }

  let numberkind : NumberVal["numberKind"];

  if(isint(result.toString())){
    numberkind = Tokens.Integer;
  }
  else{
    numberkind = Tokens.Real;
  }
  
  switch(resultType){
    case "number":
      return { value: result as number, type: "number", numberKind: numberkind, ln: lhs.ln };

    case "boolean":
      return {value: result as boolean, type: "boolean", ln: lhs.ln} as BooleanVal;

    default:
      return makeError("Invalid result expression!", "runtime", lhs.ln, StackFrames);
  }
  
}


export async function concantate_exprs(exprs : Expr[], env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {

  let combined : StringVal = MK_STRING("");




  for(const expr of exprs){


    let test : RuntimeVal;


    if(expr.kind == "Identifier"){

      const name = (expr as Identifier).symbol;

      if(Array.from(func_map.keys()).includes(name)) test = MK_STRING(`[${func_map.get(name)}: ${name}]`);
      else if(natives.includes(name)) test = MK_STRING(`[FUNCTION: ${name}]`);
      else test = await evaluate(expr, env, StackFrames);

    }
    else test = await evaluate(expr, env, StackFrames);
    

    if(test.type == "null"){
      return MK_NULL();
    }
    
    let str = (convThisToStr(test)).value;

    if(test.type == "char" && str.startsWith("'") && str.endsWith("'")){

      str = str.slice(1,-1);

    }

    combined.value += str;


  }


  return combined;

}

let outputIndex = 0;
let outputInterval: number | undefined;

export function displayOutputMessages(messages: OutputExpr[], env: Environment, StackFrames : StackFrame[]) {
  outputIndex = 0;

  // Clear any previous interval
  if (outputInterval !== undefined) {
    clearInterval(outputInterval);
  }

  outputInterval = setInterval(() => {
    if (outputIndex >= messages.length) {
      // Stop the interval when all messages are processed
      clearInterval(outputInterval);
      outputInterval = undefined;
      return;
    }

    // Process one message per interval
    eval_output_expr(messages[outputIndex], env, StackFrames);
    outputIndex++;
  }, 50); // Adjust the interval (ms) as needed
}

export async function eval_output_expr(
  output: OutputExpr,
  env: Environment, StackFrames : StackFrame[]
) {
  let messageComponent: RuntimeVal = await concantate_exprs(output.value, env, StackFrames);


  if(kill_program()){
    return MK_NULL();
  }



  let message: string = convThisToStr(messageComponent).value;

  outputLog.push(message);



  access_console();



  return {
    type: "string",
    kind: "StringLiteral",
    value: (messageComponent as StringVal).value,
    ln: output.ln,
  } as StringVal;
}

function access_console(inruntime? : boolean) {



  const outLog = document.getElementById('console-content');
  const parent = document.getElementById('Output');
  if (!outLog) {
    console.error("Output log element not found!");
    return;
  }

  let adapted = "";
  if (kill_program()) {
    outLog.classList.add("console-error");
    adapted = errorLog[0];
  } else {
    outLog.classList.remove("console-error");

    for (const statement of outputLog) {
      const casted = String(JSON.stringify(statement));
      let trimmed =
        casted.startsWith("[") && casted.endsWith("]")
          ? casted.replace(/\\/g, "")
          : JSON.stringify(statement).slice(1, -1).replace(/\\/g, "");

      adapted += trimmed.replace(/"/g, "");
      adapted += "\n";
    }

    adapted = adapted.replace(/\\/g, "");

    


    
  }

  outLog.textContent = adapted;
  parent.scrollTop = outLog.scrollHeight;


}




function eval_logic_binary_expr(
  lhs:BooleanVal | NullVal,
  rhs:BooleanVal,
  operator:string,
  StackFrames : StackFrame[]
){
  let result: boolean | number | null;

  if(operator == "AND"){
    result = lhs.value && rhs.value;
  }
  else if(operator == "OR"){



    result = lhs.value || rhs.value;
  }
  else if(operator == "NOT"){



    result = !rhs.value;
  }
  else if(operator == "<>"){
    result = lhs.value !== rhs.value;
  }
  else if(operator == "="){
    result = lhs.value == rhs.value;
  }
  else if(operator == "<>"){

    result = lhs.value !== rhs.value;

  }
  else if(operator == '+' || operator == '-' || operator == '*' || operator == '/' || operator == '^' || operator == '%' || operator == 'MOD'){

    result = (eval_numeric_binary_expr(bool_to_int(lhs.value) as NumberVal, bool_to_int(rhs.value) as NumberVal, operator, StackFrames) as NumberVal).value;

  }
  else{
    return makeError("Cannot perform operation on operands of type BOOLEAN!", "type", lhs.ln, StackFrames);
  }

  return {value:result, type:"boolean"} as BooleanVal;
}

function eval_string_binary_expr(
  lhs:StringVal,
  rhs:StringVal,
  operator:string,
  env : Environment,
  StackFrames : StackFrame[]
){
  let resultType: "string" | "boolean";
  let result: string | boolean;

  if(operator == '='){
    


    result = lhs.value == rhs.value;
    resultType = "boolean";
  }
  else if(operator == '<>'){
    result = !(lhs.value == rhs.value);
    resultType = "boolean";
  }
  else if(operator == ','){

    let lVal = lhs.value;
    let rVal = rhs.value;

    if((lVal.startsWith('"') && lVal.endsWith('"')) || (lVal.startsWith("'") && lVal.endsWith("'"))){
      lVal = lVal.slice(1,-1);
    }

    if((rVal.startsWith('"') && rVal.endsWith('"')) || (rVal.startsWith("'") && rVal.endsWith("'"))){
      rVal = rVal.slice(1,-1);
    }

    result = lVal + rVal;
    resultType = "string";
  }
  else if(operator == '<'){
    result = lhs.value < rhs.value;
    resultType = "boolean";
  }
  else if(operator == '>'){
    result = lhs.value > rhs.value;
    resultType = "boolean";
  }
  else if(operator == '<='){
    result = lhs.value <= rhs.value;
    resultType = "boolean";
  }
  else if(operator == '>='){
    result = lhs.value >= rhs.value;
    resultType = "boolean";
  }
  else{



    return makeError(`Cannot use operator '${operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}`, "type", lhs.ln, );
  }


  if(resultType == "boolean"){
    return {value:result as boolean, type: "boolean"} as BooleanVal;
  }
  else if(resultType == "string"){
    return {value:result as string, type: "string", kind:"StringLiteral"} as StringVal;
  }
  else{
    return makeError("Invalid result expression!", "type", lhs.ln, StackFrames);
  }

}

export function isint(str) {
  const num = Number(str);
  return !isNaN(num) && Number.isInteger(num);
}


export async function eval_fileUse_expr(fileUse : FileUse, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal>{


  if(localStorage.getItem('Af') != "true"){

    if(fileUse.assigne.length != 1 || fileUse.assigne[0].kind != "Identifier"){

      return makeError("Multi-expression-kind file use statements have been turned off. File use statements may only take identifiers as input!", "type", fileUse.ln, StackFrames);

    }

  }


  if(env.resolve(fileUse.fileName, fileUse.ln, StackFrames, env)){
    if(fileUse.operation == "READ"){

          const raw = UseFile(fileUse.fileName, "READ", env, StackFrames) as string;
          let value : Expr;

          let badum : RuntimeVal;

          for(const expr of fileUse.assigne){
            const runtimeval = await evaluate(expr, env, StackFrames);

            if(kill_program()){
              return MK_NULL();
            }

            if(runtimeval.type == "Object"){

              let val = raw;

              if(val.startsWith('[') && val.endsWith(']')){
                val = val.slice(1,-1);
              }


              const obj = runtimeval as NewObjectVal;

              const str = {
                type: "string",
                kind: "StringLiteral",
                value: val,
              } as StringVal;



              const newObj = assignStringToObj(str, obj, env, StackFrames);

              if(kill_program()){
                return MK_NULL();
              }

              const assignmentExpr = {
                kind: "AssignmentExpr",
                assigne: expr,
                value: [newObj],
                ln: expr.ln,
              } as AssignmentExpr;

              badum = await eval_assignment_expr(assignmentExpr, env, StackFrames);
            }
            else{
              value = automaticAssignement(runtimeval, raw);

              const assignmentExpr = {
                kind: "AssignmentExpr",
                assigne: expr,
                value: [value]
              } as AssignmentExpr;

              badum = await eval_assignment_expr(assignmentExpr, env, StackFrames);
            }
          }

          return badum;


    }
    else{

      for(const expr of fileUse.assigne){
        let toAssign = await evaluate(expr, env, StackFrames);

        if(kill_program()){
          return MK_NULL();
        }

        toAssign = convThisToStr(toAssign) as StringVal;

        UseFile(fileUse.fileName, "WRITE", env, StackFrames,(toAssign as StringVal).value);
      }

      return MK_NULL();
    }
  }
  else{
    return makeError(`File ${fileUse.fileName} has not been opened in the current scope or does not exist!`, "name", fileUse.ln, StackFrames);
  }


  
}

function extractBracketedGroupsNested(input: string): string[] {
    const results: string[] = [];
    let depth = 0;
    let current = "";

    for (let char of input) {
        if (char === "[") {
            if (depth === 0) {
                current = ""; // start a new group
            }
            depth++;
            current += char;
        } else if (char === "]") {
            current += char;
            depth--;
            if (depth === 0) {
                results.push(current); // complete group
            }
        } else if (depth > 0) {
            current += char;
        }
    }

    return results;
}

function assignStringToObj(getting : StringVal, expecting : NewObjectVal, env : Environment, StackFrames : StackFrame[]) : NewObjectLiteralExpr {


  if(expecting.vals[0].type == "Object"){

    makeError("Cannot assign directly to multi-dimensional arrays!", "type", getting.ln, StackFrames);

  }


  const string = getting.value;
  const DT = expecting.dataType;
  let list : string[] = [];

  if(string.includes(',')){

    list = string.split(',');

  }
  else if(string.includes(' ')){
    list = string.split(' ');
  }
  else{

    if(expecting.vals.length == 1){
      list = [string.trim()];
    }
    else{
      list = string.split('');
    }


  }
  
  let valList : Expr[] = [];

  for(let item of list){
    item = item.trim();
    switch(DT){
      case Tokens.Integer:
        if(!isint(item)){
          makeError(`Item '${item}' of inputted array is not of type INTEGER!`, "type", getting.ln, StackFrames);
        }
        else{
          valList.push({kind: "NumericLiteral", numberKind: Tokens.Integer, value: Number(item)} as NumericLiteral);
        }

        break;

      case Tokens.Real:

        if(!isNumeric(item)){
          makeError(`Item '${item}' of inputted array is not of type REAL!`, "type", getting.ln, StackFrames);
        }
        else{
          valList.push({kind: "NumericLiteral", numberKind: Tokens.Real, value: Number(item)} as NumericLiteral);
        }

        break;


      case Tokens.Boolean:

        if(item.toUpperCase() != "TRUE" && item.toUpperCase() != "FALSE"){

          makeError(`Item '${item}' of inputted array is not of type BOOLEAN!`, "type", getting.ln, StackFrames);

        }
        else{
          valList.push({kind: "Identifier", symbol: item.toUpperCase()} as Identifier);
        }

        break;

      case Tokens.Char:

        if(item.length != 1){

          makeError(`Item ${item} is not of type CHAR!`, "type", getting.ln, StackFrames);

        }
        else{
          valList.push({kind: "CharString", text: item} as CharString);
        }

      default:
        valList.push({kind: "StringLiteral", text: item} as StringLiteral);

        

      }
  }

  const indexPair = new Map<number, [Expr, Expr]>();

  indexPair.set(1, [{kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.start} as NumericLiteral, {kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.end} as NumericLiteral])

    
  return {

    kind: "ObjectLiteral",
    exprs: valList,
    start: {kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.start} as NumericLiteral,
    end: {kind: "NumericLiteral", numberKind: Tokens.Integer, value: expecting.end} as NumericLiteral,
    indexPairs: indexPair,
    dataType: expecting.dataType,
    ln: getting.ln,
  } as NewObjectLiteralExpr;
  


}

function input_caster(expecting : RuntimeVal) : string{

  switch(expecting.type){
    case "number":
      return '0';

    case "string":
      return " ";

    case "char":
      return ' ';

    case "boolean":
      return "FALSE";

    case "Object":
      return MK_EMPTY_OBJECT_STRING((expecting as NewObjectVal));

    default:
      return "";


  }

}

function MK_EMPTY_OBJECT_STRING(expecting : NewObjectVal) : string {

  let conc : string = "";

  switch(expecting.dataType){

    case Tokens.Integer:
      for(const elm of expecting.vals){
        conc += '0,'

      }



      conc = conc.slice(0,-1);


      return conc;

    case Tokens.Real:
      for(const elm of expecting.vals){
        conc += '0,'
      }

      conc = conc.slice(0,-1);

      return conc;

    case Tokens.String:
      for(const elm of expecting.vals){
        conc += ' ,'

      }

      conc = conc.slice(0,-1);

      return conc;

    case Tokens.Char:

      for(const elm of expecting.vals){

        conc += ' ,';
      }

      conc = conc.slice(0,-1);

      return conc;

    case Tokens.Boolean:

      for(const elm of expecting.vals){

        conc += "FALSE,"

      }

      conc = conc.slice(0,-1);

      return conc;

    default:
      for(const elm of expecting.vals){

        conc += ' ,';
      }

      conc = conc.slice(0,-1);

      return conc;

  }

}

function automaticAssignement(assigne : RuntimeVal, value : string) : Expr {

  let toUse = assigne;
  if(toUse.type == "MemberExprVal"){
    toUse = conv_memex_to_val(toUse as MemberExprVal);
  }

  if(toUse.type == "number" && isNumeric(value)){
    return {
      kind: "NumericLiteral",
      numberKind: (isint(Number(value)))
      ? Tokens.Integer
      : Tokens.Real,
      value: Number(value)
    } as NumericLiteral;
  }
  else if(toUse.type == "boolean" && (value.toUpperCase() == "TRUE" || value.toUpperCase() == "FALSE")){
    return {
      kind: "Identifier",
      symbol: value.toUpperCase(),

    } as Identifier;
  }
  else if(toUse.type == "char" && value.length == 1){
    return {
      kind: "CharString",
      text: value,
    } as CharString;
  }
  else{
    return {
      kind: "StringLiteral",
      text: value
    } as StringLiteral;
  }

}

function confirm_object_literal(obj : NewObjectVal, env : Environment) : boolean {

  for(const item of obj.vals){

    if(!Confirm(item, obj.dataType, obj.ln, env, [initial_stack])){

      errorLog.pop();

      const thing = convThisToStr(item).value;

      errorLog.push(`Item '${thing}' in array does not match array type ${Tokens[obj.dataType].toUpperCase()}!`);

      return false;

    }


  }

  return true;

}


export async function eval_new_objectVal(expr : NewObjectLiteralExpr, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {




  if(expr.exprs.length == 0){

    let assigneObject : RuntimeVal = MK_EMPTY(expr.dataType);

    const dimensions = Array.from(expr.indexPairs.keys());

    let runtime_value : RuntimeVal;

    for(let i = dimensions.length; i > 0; i--){

      const start_comp = await evaluate(expr.indexPairs.get(i)[0], env, StackFrames);
      const start_val = (start_comp as NumberVal).value;

      const end_comp = await evaluate(expr.indexPairs.get(i)[1], env, StackFrames);
      const end_val = (end_comp as NumberVal).value;

      if(start_val > end_val){

        return makeError("End bound must be greater than start bound!", "index", expr.ln, StackFrames);

      }

      let list : RuntimeVal[] = [];
      


      for(let j = start_val; j <= end_val; j++){

        list.push(assigneObject);

      }

      runtime_value = {
        type: "Object",
        vals: list,
        dataType: expr.dataType,
        WereBoundsDeclared: true,
        start: start_val,
        end: end_val,
        ln: expr.ln,
      } as NewObjectVal;



      assigneObject = runtime_value;


    }

   if(!confirm_object_literal(runtime_value as NewObjectVal, env)){

    return MK_NULL();

   }
   else{



    return runtime_value;

   }

    


  }
  else{

    let list : RuntimeVal[] = [];

    for(const item of expr.exprs){

      list.push(await evaluate(item, env, StackFrames));

    }

    const DT = asses_dataType_fromRTV(list[0]);

    const obj =  {

      type: "Object",
      vals: list,
      dataType: DT,
      WereBoundsDeclared: false,
      start: 1,
      end: list.length,
      ln: expr.ln,

    } as NewObjectVal;

    if(!confirm_object_literal(obj, env)){

      return MK_NULL();

    }
    else{
      
      return obj;
    }


  }

}  


export async function eval_new_memberExpr(expr : NewMemberExpr, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal>{

  let object = await evaluate(expr.object, env, StackFrames);


  if(object.type == "string" && localStorage.getItem('Af') != "true"){

    return makeError('Substring access by index has been turned off. To access substring access by index, enable "Support Non-syllabus Features" in settings. You can also still use the "SUBSTRING" method.', "type", expr.ln, StackFrames);

  }

  for(let i = 0; i < expr.indexes.length; i++){

    const cur = expr.indexes[i];

    if(object.type == "Object"){

      let ix = await evaluate(cur, env, StackFrames);

      if(!Confirm(ix, Tokens.Integer, expr.ln, env, [initial_stack])){

        errorLog.pop();

        return makeError("Index could be not be resolved into an integer value!", "type", expr.ln, StackFrames);

      }

      let x = (ix as NumberVal).value;

      if(x > (object as NewObjectVal).end){


        return makeError("Index out of range!", "index", expr.ln, StackFrames);
      }




      x = adjust_index((object as NewObjectVal).start, (object as NewObjectVal).vals.length, x, expr.ln, StackFrames);




      

      if(kill_program()){
        return MK_NULL();
      }

      object = (object as NewObjectVal).vals[x];



    }
    else if(object.type == "string"){

      let ix = await evaluate(cur, env, StackFrames);

      if(!Confirm(ix, Tokens.Integer, expr.ln, env, [initial_stack])){

        return makeError("Index could be not be resolved into an integer value!", "type", expr.ln, StackFrames);

      }


      let x = (ix as NumberVal).value;

      x = adjust_index(1, (object as StringVal).value.length, x, expr.ln, StackFrames);

      if(kill_program()){
        return MK_NULL();
      }

      const char = (object as StringVal).value.charAt(x);

      object = MK_CHAR(char);

    }
    else{

      return makeError("Invalid object access!", "runtime", expr.ln, StackFrames);

    }


  }

  return object;


}


function asses_dataType_fromRTV(test : RuntimeVal) : Tokens {

  switch(test.type){

    case "Object":
      return (test as NewObjectVal).dataType;

    case "boolean":
      return Tokens.Boolean;

    case "char":
      return Tokens.Char;

    case "number":
      return (test as NumberVal).numberKind;

    case "string":
      return Tokens.String;

    default:
      return Tokens.Null;

  }

}


export async function eval_selectionStmt_expr(
  declaration: SelectionStmtDeclaration,
  env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {

    let result : RuntimeVal = {type: "end-closure"} as endClosureVal;

    let scopes : Environment[] = [];

    for(const condition of declaration.body.keys()){
      
      if(kill_program()){
        return null;
      }
     
      //const temp = StackFrames.pop();
      //StackFrames.push({expr: pcon.stringify(condition as Expr), ln: condition.ln, context: env.context})

      if(condition.kind == "DefaultCase" || (await evaluate(condition as Expr, env, StackFrames) as BooleanVal).value){
        //StackFrames.pop();
        //StackFrames.push(temp);
        
        scopes.push(new Environment(env.context, env));



        for(const stmt of declaration.body.get(condition)[1]){

          //StackFrames.push({context: env.context, expr: pcon.stringify(stmt), ln: stmt.ln} as StackFrame);

          if(kill_program()){
            return null;
          }



          if(stmt.kind == "SelectionStmtDeclaration"){
            const temp = stmt as SelectionStmtDeclaration;
            const result = await evaluate(temp, scopes[scopes.length - 1], StackFrames);
       

            if(temp.returns.length > 0 && result.type != "end-closure" && result.type !== "null"){

              return result;
            }
          }
          else if(stmt.kind == "IterationStmt"){
            const temp = stmt as IterationStmt;
            const result = await evaluate(temp, scopes[scopes.length - 1], StackFrames);
    
            if(temp.returnExpressions.length > 0 && result.type != "end-closure" && result.type !== "null"){
              return result;
            }
          }
          else if(stmt.kind == "ReturnStmt"){

            const result = await evaluate((stmt as ReturnStmt), scopes[scopes.length - 1], StackFrames);
          
            return result;
          }
          else{
            result = await evaluate(stmt, scopes[scopes.length - 1], StackFrames)
     
          }
        }



        
        return result;
      }
      else{

        //StackFrames.pop();
        //StackFrames.push(temp);

      }

    }


    
    return result;

  }

  

export function conv_memex_to_val(memex : MemberExprVal)
{

  

  switch(memex.valueType){
    case "number":
      const num = memex.value as number;
      return {
        type: "number",
        numberKind: isint(num)
        ? Tokens.Integer
        : Tokens.Real,
        value: num,
      } as NumberVal;

    case "string":

      if((memex.value as string).length == 1){
        
        return {
          type: "char",
          value: memex.value as string,
        } as CharVal;
      }
      else{

        return {
          type: "string",
          kind: "StringLiteral",
          value: memex.value as string,
        } as StringVal;
      }

      

    case "boolean":
      return {
        type: "boolean",
        value: memex.value as boolean,
      } as BooleanVal;

    case "char":
      return {
        type: "char",
        value: memex.value as string,
      } as CharVal;

    case "Object":



      return {
        type: "Object",
        vals: memex.value as primitiveValue[],
        start: memex.parentObject.start,
        end: (memex.value as primitiveValue[]).length,
        dataType: assess_dataType_fromstring(String((memex.value as primitiveValue[])[0])),
        WereBoundsDeclared: false,
        ln: memex.ln,
      } as NewObjectVal;




    default:

      return makeError("Invalid expression!", "type", memex.ln);
  }

  
}



async function getUserInput(promptMessage: string): Promise<string | null> {

  if(kill_program()){
    return null;
  }

    const modal = document.getElementById('input-modal') as HTMLDialogElement;
    const prmpt = document.getElementById('modal-title') as HTMLHeadingElement;
    const text_box = document.getElementById('input-box') as HTMLInputElement;
    const enter = document.getElementById('input-enter') as HTMLInputElement;
    const cancel = document.getElementById('input-cancel') as HTMLInputElement;

    let modalVisible = true;


  

    return new Promise((resolve) => {
        // Set the prompt text
        prmpt.innerHTML = promptMessage;
        text_box.value = ''; // clear previous input

        // Show modal
        modal.showModal();
        text_box.focus();

        // Handlers
        const submitHandler = () => {


            cleanup();
            resolve(text_box.value);
        };

        const cancelHandler = () => {
            cleanup();
            resolve(null);
        };

        const keyHandler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'escape') {


              cancelHandler();



            }
            if(e.key.toLowerCase() === "enter"){

              submitHandler();
              e.preventDefault();
              



            }
        };

        const cleanup = () => {
          modal.close();
          enter.removeEventListener('click', submitHandler);
          cancel.removeEventListener('click', cancelHandler);
          text_box.removeEventListener('keydown', keyHandler);


          
          modalVisible = false;
        };

        // Attach event listeners
        enter.addEventListener('click', submitHandler);
        cancel.addEventListener('click', cancelHandler);
        text_box.addEventListener('keydown', keyHandler);
    });
}

export async function emergency_pause(msg : string) : Promise<RuntimeVal> {

  pauseLog.push(msg);

  return MK_NULL()


}

export async function eval_input_expr(inpExpr : InputExpr, env : Environment, StackFrames : StackFrame[]) : Promise <RuntimeVal> {


  


  let prmptComponent : RuntimeVal = await concantate_exprs(inpExpr.promptMessage, env, StackFrames);

  if(prmptComponent.type == "MemberExprVal"){
    prmptComponent = conv_memex_to_val(prmptComponent as MemberExprVal);
  }

  let prmptText = String((prmptComponent as StringVal).value);

  if(prmptText.startsWith('"') && prmptText.endsWith('"')){
    prmptText = prmptText.slice(1,-1);
  }
  else if(prmptText.startsWith("'") && prmptText.endsWith("'")){
    prmptText = prmptText.slice(1,-1);
  }

  if(kill_program()){
    return MK_NULL();
  }

  
  const q = {kind: "OutputExpr", value: [{kind: "StringLiteral", text: prmptText} as StringLiteral], ln: inpExpr.ln} as OutputExpr;
  eval_output_expr(q, env, StackFrames);

  let val = await getUserInput(prmptText);

  

  const evaluatedAssigne = await evaluate(inpExpr.assigne[0], env, StackFrames);



  if(val === null){


    return await emergency_pause("\n** Input cancelled **");

  }
  else if(val == ""){

    

    val = input_caster(evaluatedAssigne);



  }




  const a = {kind: "OutputExpr", value: [{kind: "StringLiteral", text: '> ' + val, ln: inpExpr.ln} as StringLiteral], ln: inpExpr.ln} as OutputExpr;


  eval_output_expr(a, env, StackFrames);

  
  let badum : RuntimeVal;

  for(const expr of inpExpr.assigne){

    if(!resolve_var(expr, env, StackFrames) || kill_program()){
      return MK_NULL();
    }


    const evaluatedAssigne = await evaluate(expr, env, StackFrames);

    

    if(evaluatedAssigne.type == "Object"){

      if(val.startsWith('[') && val.endsWith(']')){
        val = val.slice(1,-1);
      }


      const obj = evaluatedAssigne as NewObjectVal;

      const str = {
        type: "string",
        kind: "StringLiteral",
        value: val,
      } as StringVal;

      const newObj = assignStringToObj(str, obj, env, StackFrames);

      if(kill_program()){
        return MK_NULL();
      }

      const assignmentExpr = {
        kind: "AssignmentExpr",
        assigne: expr,
        value: [newObj],
        ln: inpExpr.ln
      } as AssignmentExpr;

     

      badum = await eval_assignment_expr(assignmentExpr, env, StackFrames);

    }
    else{

      

      let aVal : Expr;

      const runTimeVal = await evaluate(expr, env, StackFrames);
      aVal = automaticAssignement(runTimeVal, val);

      const assignMentExpr = {
        kind: "AssignmentExpr",
        assigne: expr,
        value: [aVal],
        ln: inpExpr.ln,
      } as AssignmentExpr;

    

      
      badum = await eval_assignment_expr(assignMentExpr, env, StackFrames);

    
    }

    
  }

  return badum;


  

}

function Confirm_Input(raw : string, expecting : RuntimeVal) : boolean {

  switch(expecting.type){
    case "number":
      const nk = (expecting as NumberVal).numberKind;

      if(nk == Tokens.Integer){

        if(isint(Number(raw))){
          return true;
        }
        else{
          return false;
        }

      }
      else{

        if(isNumeric(raw)){
          return true;
        }
        else{
          return false;
        }

      }

    case "char":
      if(raw.length == 1){
        return true;
      }
      else{
        return false;
      }

    case "boolean":
      if(raw.toUpperCase() == "TRUE" || raw.toUpperCase() == "FALSE"){
        return true;
      }
      else{
        return false;
      }

    default:
      return true;
  }

}

function resolve_var(varExpr : Expr, env : Environment, StackFrames : StackFrame[]) : boolean{

  switch(varExpr.kind){
    case "Identifier":
      env.lookupVar((varExpr as Identifier).symbol, varExpr.ln, StackFrames, env);

      if(kill_program()){
        return false;
      }
      else{
        return true;
      }

    case "MemberExpr":
      env.lookupVar(((varExpr as NewMemberExpr).object as Identifier).symbol, varExpr.ln, StackFrames, env);

      if(kill_program()){
        return false;
      }
      else{
        return true;
      }

    case "AssignmentExpr":
      return resolve_var((varExpr as AssignmentExpr).assigne, env, StackFrames);
    
    default:
      return true;
  }

}

export async function eval_return_stmt(node : ReturnStmt, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {



  if(node.value.length == 1){
    const runtime = await evaluate(node.value[0], env, StackFrames);

    runtime.ln = node.ln;

    return runtime;

  }
  else{

    const runtime = await concantate_exprs(node.value, env, StackFrames);

    runtime.ln = node.ln;

    return runtime;

  }

}

export async function eval_iteration_Stmt(iterStmt : IterationStmt, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {

  let closures : Environment[] = [];


  if(pauseLog.length > 0){return MK_NULL()};
  
  const Limit = Infinity;
  switch(iterStmt.iterationKind){
    case "count-controlled":
      


      const scope = new Environment(env.context, env);
      //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.startVal)});
      let startVal : RuntimeVal = await evaluate(iterStmt.startVal, env, StackFrames);
      if(!startVal.ln) startVal.ln = iterStmt.ln;
      //StackFrames.pop();

      if(startVal.type == "MemberExprVal"){
        startVal = {
          type: "number",
          numberKind: Tokens.Integer,
          value: (startVal as MemberExprVal).value
        } as NumberVal;
      }
      else{
        startVal = {
          type: "number",
          numberKind: Tokens.Integer,
          value: (startVal as NumberVal).value,
        } as NumberVal
      }

      //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.endVal)});
      let endVal : RuntimeVal = await evaluate(iterStmt.endVal, env, StackFrames);
      //StackFrames.pop();

      if(endVal.type == "MemberExprVal"){
        endVal = {
          type: "number",
          numberKind: Tokens.Integer,
          value: (endVal as MemberExprVal).value
        } as NumberVal;
      }
      else{
        endVal = {
          type: "number",
          numberKind: Tokens.Integer,
          value: (endVal as NumberVal).value,
        } as NumberVal
      }

      
      
      if(startVal.type != "number"){

        //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.startVal)});
        return makeError("Start bound could not be resolved into a real value!", "type", iterStmt.ln, StackFrames);

      }

      if(endVal.type != "number"){

        //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.endVal)});
        return makeError("End bound could not be resolved into a real value!", "type", iterStmt.ln, StackFrames);

      }




      const varname = iterStmt.iterator.symbol;



      scope.declareVar(varname, startVal, false, env, StackFrames);


      let result : RuntimeVal = {type: "end-closure"} as endClosureVal;
      
      let step : RuntimeVal;

      

      if(iterStmt.step !== undefined){
        //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.step)});
        step = await evaluate(iterStmt.step, env, StackFrames);
   

        if(step.type != "number"){
          //StackFrames.push({ln: iterStmt.ln, context: env.context, expr: pcon.stringify(iterStmt.step)});
          return makeError("Step expression could not be resolved into a real value!", "type", iterStmt.ln, StackFrames);

        }
        else{
          step = {
            type: "number",
            numberKind: Tokens.Integer,
            value: (step as NumberVal).value,
          } as NumberVal;
        }

      }
      else{
        step = {
          type: "number",
          numberKind: Tokens.Integer,
          value: 1,
        } as NumberVal;
      }


      scope.assignVar(varname, {
        type: "number",
        numberKind: Tokens.Integer,
        value: (startVal as NumberVal).value,
      } as NumberVal, iterStmt.ln, StackFrames, env)



      const strt = Number((startVal as NumberVal).value);
      const end = (endVal as NumberVal).value;
      let stp = (step as NumberVal).value;




      scope.assignVar(varname, {
        type: "number",
        numberKind: Tokens.Integer,
        value: strt,
      } as NumberVal, iterStmt.ln, StackFrames, env)





      if(stp < 0){



        for(let i = strt; i >= end; i+=stp){

          scope.assignVar(varname, {
            type: "number",
            numberKind: Tokens.Integer,
            value: i,
          } as NumberVal, iterStmt.ln, StackFrames, env)


          closures = [new Environment(env.context,scope)];
    
          for(const stmt of iterStmt.body){

            if(kill_program()){
              return MK_NULL();
            }
            
            const currentEnv = closures[closures.length - 1];

            //StackFrames.push({expr: pcon.stringify(stmt), ln: stmt.ln, context: env.context} as StackFrame);

            if(stmt.kind == "SelectionStmtDeclaration"){
        
              result = await eval_selectionStmt_expr(stmt as SelectionStmtDeclaration, currentEnv, StackFrames);

          


              if(result){
                if(result.type !== "null" && (stmt as SelectionStmtDeclaration).returns.length > 0 && result.type != "end-closure"){


                  return result;
                }
              }
              
            }
            else if(stmt.kind == "IterationStmt"){

          
              result = await eval_iteration_Stmt(stmt as IterationStmt, currentEnv, StackFrames);

              const temp = stmt as IterationStmt;

              if(result){
                if(result.type !== "null" && temp.returnExpressions.length > 0 && result.type != "end-closure"){
                  return result;
                }
              }
              
            }
            else if(stmt.kind == "ReturnStmt"){

              return eval_return_stmt(stmt as ReturnStmt, currentEnv, StackFrames);

            }
            else if(stmt.kind == "ErrorExpr" || kill_program()){
              return MK_NULL();
            }
            else{
              result = await evaluate(stmt, currentEnv, StackFrames);

            }
          }

        
        }


        if(!result && strt < end){
          result = {type: "end-closure"} as endClosureVal;
        }

        return result;
      }
      else{


        for(let i = strt; i <= end; i+=stp){

          scope.assignVar(varname, MK_NUMBER(i, Tokens.Integer), iterStmt.ln, StackFrames, env);

          


          closures = [new Environment(env.context ,scope)];



          for(const stmt of iterStmt.body){

            
            if(kill_program()){

              return MK_NULL();

            }
            const currentEnv = closures[closures.length - 1];

            //StackFrames.push({expr: pcon.stringify(stmt), ln: stmt.ln, context: env.context})

            if(stmt.kind == "SelectionStmtDeclaration"){


              result = await eval_selectionStmt_expr(stmt as SelectionStmtDeclaration, currentEnv, StackFrames);
            

              if(result){
                if(result.type !== "null" && (stmt as SelectionStmtDeclaration).returns.length > 0 && result.type != "end-closure"){

                  
                  return result;
                }
              }

              
            }
            else if(stmt.kind == "IterationStmt"){


              result = await eval_iteration_Stmt(stmt as IterationStmt, currentEnv, StackFrames);

              const temp = stmt as IterationStmt;

              if(result){
                if(result.type !== "null" && temp.returnExpressions.length > 0 && result.type != "end-closure"){
                  return result;
                }
              }

              
            }
            else if(stmt.kind == "ReturnStmt"){

              return eval_return_stmt(stmt as ReturnStmt, currentEnv, StackFrames);

            }
            else if(stmt.kind == "ErrorExpr" || kill_program()){
              return MK_NULL();
            }
            else{


              result = await evaluate(stmt, currentEnv, StackFrames);


            }
          }


          const iterVal = (scope.lookupVar(varname, iterStmt.ln, StackFrames, env) as NumberVal).value;
          
          if(iterVal > (endVal as NumberVal).value){
            return result;
          }
        
        }

        if(!result && strt > end){
          result = {type: "end-closure"} as endClosureVal;
        }


        return result;
      }

      
      

    case "post-condition":
      
      const scpe = new Environment(env.context,env); 
      
      let condition : RuntimeVal = await evaluate(iterStmt.iterationCondition, env, StackFrames);

      if(condition.type == "MemberExprVal"){
        condition = conv_memex_to_val(condition as MemberExprVal);
      }

      let res : RuntimeVal = {type: "end-closure"} as endClosureVal;
      
      let iterations = 0;

      closures = [new Environment(env.context,scpe)];
      const current = closures[closures.length - 1];

      for(const stmt of iterStmt.body){

        //StackFrames.push({expr: pcon.stringify(stmt), ln: stmt.ln, context: env.context});


        res = await evaluate(stmt, current, StackFrames);


        if(stmt.kind == "ErrorExpr"){
          return MK_NULL();
        }
        if(stmt.kind == "SelectionStmtDeclaration" && (stmt as SelectionStmtDeclaration).returns){

         

          if(res.type != "null" && (stmt as SelectionStmtDeclaration).returns.length > 0 && res.type != "end-closure"){
            

            return res;
          }

        }

        else if(res.type != "null" && stmt.kind == "IterationStmt"){
          const temp = stmt as IterationStmt;

          if(temp.returnExpressions.length > 0 && res.type != "end-closure"){
            return res;
          }
        }
        else if(stmt.kind == "ReturnStmt"){
          const result = await evaluate((stmt as ReturnStmt), current, StackFrames);
          return result;
        }


        

      }

      
      //StackFrames.push({expr: pcon.stringify(iterStmt.iterationCondition), ln:iterStmt.ln, context: env.context});
      condition = await evaluate(iterStmt.iterationCondition, current, StackFrames);
      //StackFrames.pop();

      if(condition.type == "MemberExprVal"){
        condition = conv_memex_to_val(condition as MemberExprVal);
      }

      if(condition.type == "null"){

        condition = MK_BOOL(false);
      }
      else if(kill_program()){
        return MK_NULL();
      }

      do {

        closures = [new Environment(env.context,scpe)];
        const current = closures[closures.length - 1];

        for(const stmt of iterStmt.body){

          //StackFrames.push({expr: pcon.stringify(stmt), ln: stmt.ln, context: current.context});

          res = await evaluate(stmt, current, StackFrames);



          if(stmt.kind == "ErrorExpr" || kill_program()){
            return MK_NULL();
          }
          else if(stmt.kind == "SelectionStmtDeclaration" && (stmt as SelectionStmtDeclaration).returns){

            
            if(res.type != "null" && (stmt as SelectionStmtDeclaration).returns.length > 0 && res.type != "end-closure"){
              

              return res;
            }

          }

          else if(res.type != "null" && stmt.kind == "IterationStmt"){
            const temp = stmt as IterationStmt;

            if(temp.returnExpressions.length > 0 && res.type != "end-closure"){
              return res;
            }
          }
          else if(stmt.kind == "ReturnStmt"){
            const result = await evaluate((stmt as ReturnStmt), current, StackFrames);
            return result;
          }


          

        }

        

        condition = await evaluate(iterStmt.iterationCondition, current, StackFrames);

        if(condition.type == "MemberExprVal"){
          condition = conv_memex_to_val(condition as MemberExprVal);
        }



        if((condition as BooleanVal).value){

          if(iterStmt.returnExpressions.length > 0){
            return await evaluate(iterStmt.returnExpressions[0], current, StackFrames);
          }
          else{
            
            return res;
          }

          
        }

        if(condition.type == "null"){
          return makeError("Problem evaluating condition", "runtime", iterStmt.ln, StackFrames);
        }
        else if(kill_program()){
          return MK_NULL();
        }


        iterations ++;
        if(iterations > Limit){

          throw "Exceeded max excecution count. You may want to consider switching to a WHILE or FOR loop.";
        }
        
      } while(!(condition as BooleanVal).value);

      return MK_NULL();

    case "pre-condition":

      const schaufe = new Environment(env.context,env);

      //StackFrames.push({expr: pcon.stringify(iterStmt.iterationCondition), ln: iterStmt.ln, context: env.context});
      let kondition : RuntimeVal = await evaluate(iterStmt.iterationCondition, env, StackFrames);
      //StackFrames.pop();



      if(kondition.type == "MemberExprVal"){
        kondition = conv_memex_to_val(kondition as MemberExprVal);
      }

      let output : RuntimeVal = {type: "end-closure"} as endClosureVal;

      let iterats = 0;

      if(!(kondition as BooleanVal).value){
        return MK_NULL()
      }


      while((kondition as BooleanVal).value){

        

        kondition = await evaluate(iterStmt.iterationCondition, env, StackFrames);

        if(kondition.type == "MemberExprVal"){
          kondition = conv_memex_to_val(kondition as MemberExprVal);
        }

        if(!(kondition as BooleanVal).value){

          break;
        }

        closures = [new Environment(env.context,schaufe)];
        const current = closures[closures.length - 1];

        for(const stmt of iterStmt.body){

          //StackFrames.push({expr: pcon.stringify(stmt), ln: stmt.ln, context: current.context});

          if(stmt.kind == "SelectionStmtDeclaration" || stmt.kind == "IterationStmt"){

            //StackFrames.pop();

          }

          output = await evaluate(stmt, current, StackFrames);



          if(stmt.kind == "ErrorExpr" || kill_program()){
            return MK_NULL();
          }
          else if(stmt.kind == "SelectionStmtDeclaration"){
            if((stmt as SelectionStmtDeclaration).returns.length > 0 && output.type != "null" && output.type != "end-closure"){
              return output;
            }
          }
          else if(stmt.kind == "IterationStmt"){
            const temp = stmt as IterationStmt;

            if(temp.returnExpressions.length > 0 && output.type != "null" && output.type != "end-closure"){
              return output;
            }
          }
          else if(stmt.kind == "ReturnStmt"){
            const result = await evaluate((stmt as ReturnStmt), current, StackFrames);
            //StackFrames.pop();

            return result;
          }
          else{

            //StackFrames.pop();

          }



        }

        iterats++;
        if(iterats > Limit){
          throw "Exceeded iteration limit. Consider switching to a FOR or REPEAT loop.";
        }
      }

      if(iterats == 0){
          
        return MK_NULL();
      }
      else{
        
        const current = closures[closures.length - 1];

        if(iterStmt.returnExpressions.length > 0){
          return await evaluate(iterStmt.returnExpressions[0], current, StackFrames);
        }
        else{
          return output;
        }
        
      }


    default:
      return MK_NULL(); 
  }



}

function find_global_scope(env : Environment) : Environment{

  let curEnv = env;

  while(curEnv.parent !== undefined){
    curEnv = curEnv.parent;
  }

  return curEnv;
}



function bool_to_int(b : boolean) : RuntimeVal{

  if(b){
    return MK_NUMBER(1, Tokens.Integer);
  }
  else{
    return MK_NUMBER(0, Tokens.Integer);
  }

}

function is_string_any(obj : RuntimeVal) : boolean {

  return obj.type == "string" || obj.type == "char";


}

function turn_string(obj : RuntimeVal) : StringVal {

  if(obj.type == "string"){

    return obj as StringVal;

  }
  else if(obj.type == "char"){

    return {

      type: "string",
      value: (obj as CharVal).value,

    } as StringVal;

  }
  else{

    convThisToStr(obj);

  }

}

export async function eval_binary_expr(binop : BinaryExpr, env: Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {

  let lhs : RuntimeVal = await evaluate(binop.left, env, StackFrames);
  let rhs : RuntimeVal = await evaluate(binop.right, env, StackFrames);

  if(lhs.type === "null" && rhs.type === "null"){
    return MK_NULL();
  }

  const types = [lhs.type, rhs.type];

  if(is_string_any(lhs) && !is_string_any(rhs)){

    return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}`, "type", lhs.ln, StackFrames);


  }
  else if(!is_string_any(lhs) && is_string_any(rhs)){

    return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}`, "type", lhs.ln, StackFrames);

  }

  else if(is_string_any(lhs) && is_string_any(rhs)){

    return eval_string_binary_expr(
      convThisToStr(lhs),
      convThisToStr(rhs),
      binop.operator,
      env,
      StackFrames
    );

  }
  else if(types.includes("number")){

    if(lhs.type == "boolean"){
      lhs = bool_to_int((lhs as BooleanVal).value);
    }

    if(rhs.type == "boolean"){
      rhs = bool_to_int((rhs as BooleanVal).value);
    }

    if(lhs.type == "number" && rhs.type == "number"){

      return eval_numeric_binary_expr(
        lhs as NumberVal,
        rhs as NumberVal,
        binop.operator,
        StackFrames,
      );

    }
    else{

    
      return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}!`, "type", lhs.ln, StackFrames);

    }

  }
  else if(types.includes("boolean")){

    if(lhs.type == "number"){
      lhs = int_to_bool(lhs as NumberVal);
    }

    if(rhs.type == "number"){
      rhs = int_to_bool(rhs as NumberVal);
    }

    if(lhs.type == "boolean" && rhs.type == "boolean"){
      return eval_logic_binary_expr(
        lhs as BooleanVal,
        rhs as BooleanVal,
        binop.operator,
        StackFrames
      );
    }
    else{

      return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}!`, "type", lhs.ln, StackFrames);

    }


  }
  else{
    return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}!`, "type", lhs.ln, StackFrames);
  }

}

function out_type(raw : RuntimeVal) : string { //Function which converts OBJECT into ARRAY (for display purposes)

  switch(raw.type){

    case "Object":
      return "ARRAY";

    case "number":

      return Tokens[(raw as NumberVal).numberKind].toUpperCase();

    case "string":
      return "STRING";

    case "char":
      return "CHAR";

    case "boolean":
      return "BOOLEAN";

    case "MemberExprVal":
      const val = conv_memex_to_val(raw as MemberExprVal);

      return out_type(val);


    default:
      return raw.type.toUpperCase();


  }

}

function int_to_bool(n : NumberVal) : BooleanVal {

  if(n.value == 0){
    return MK_BOOL(false);
  }
  else{
    return MK_BOOL(true);
  }


}

export async function eval_bin_expr(binop: BinaryExpr, env: Environment, StackFrames : StackFrame[]): Promise<RuntimeVal> {
  



  let lhs : RuntimeVal = await evaluate(binop.left, env, StackFrames);
  let rhs : RuntimeVal = await evaluate(binop.right, env, StackFrames);



  if(lhs.type === "null" && rhs.type === "null"){
    return MK_NULL();
  }
  


  if(lhs.type == "MemberExprVal"){
    lhs = conv_memex_to_val(lhs as MemberExprVal);
  }

  if(rhs.type == "MemberExprVal"){
    rhs = conv_memex_to_val(rhs as MemberExprVal);
  }





  
  /*if((lhs.type == "string" && rhs.type != "string") || (lhs.type != "string" && rhs.type == "string") || (lhs.type == "char" && rhs.type != "char") || (lhs.type != "char" && rhs.type == "char")){

    return add_any(lhs, rhs);

  }
  else */
  
  if(binop.operator == "AND" || binop.operator == "OR"){
    return eval_logic_binary_expr(
      conv_bool(lhs),
      conv_bool(rhs),
      binop.operator,
      StackFrames
    );
  }
  else if((binop.operator == '+' || binop.operator == '-' || binop.operator == '*' || binop.operator == '/' || binop.operator == '%' || binop.operator == '^' || binop.operator == '>' || binop.operator == '<' || binop.operator == '>=' || binop.operator == '<=' || binop.operator == '≥' || binop.operator == '≤')){


    if(lhs.type == "boolean" && rhs.type == "boolean"){
      return eval_numeric_binary_expr(
        bool_to_int((lhs as BooleanVal).value) as NumberVal,
        bool_to_int((rhs as BooleanVal).value) as NumberVal,  
        binop.operator,
        StackFrames,
      );
    }
    else if(lhs.type == "boolean" && rhs.type == "number"){
      return eval_numeric_binary_expr(
        bool_to_int((lhs as BooleanVal).value) as NumberVal,
        rhs as NumberVal,  
        binop.operator,
        StackFrames,
      );
    }
    else if(lhs.type == "number" && rhs.type == "boolean"){
      return eval_numeric_binary_expr(
        lhs as NumberVal,
        bool_to_int((rhs as BooleanVal).value) as NumberVal,  
        binop.operator,
        StackFrames,
      );
    }
    else if(lhs.type == "number" && rhs.type == "number"){

      return eval_numeric_binary_expr(
        lhs as NumberVal,
        rhs as NumberVal,  
        binop.operator,
        StackFrames,
      );


    }




  }
  else if (lhs.type == "number" && rhs.type == "number") {
    return eval_numeric_binary_expr(
      lhs as NumberVal,
      rhs as NumberVal,
      binop.operator,
      StackFrames,
    );
  }
  else if((lhs.type == "string" && rhs.type == "string") || (lhs.type == "char" && rhs.type == "char")){
    return eval_string_binary_expr(
      
      lhs = convThisToStr(lhs),
      rhs = convThisToStr(rhs),
      binop.operator,
      env,
      StackFrames
    );
  }
  else if((lhs.type == "string" && rhs.type == "char") || (rhs.type == "string" && lhs.type == "char")){
    return eval_string_binary_expr(
      
      lhs = convThisToStr(lhs),
      rhs = convThisToStr(rhs),
      binop.operator,
      env,
      StackFrames
    );
  }
  else if(lhs.type == "boolean" && rhs.type == "boolean"){
    return eval_logic_binary_expr(
      lhs as BooleanVal,
      rhs as BooleanVal,
      binop.operator,
      StackFrames
    );
  }
  else if((lhs.type == "null") && rhs.type == "boolean" && (binop.operator) == "NOT"){
    
    return eval_logic_binary_expr(
      lhs as NullVal,
      rhs as BooleanVal,
      binop.operator,
      StackFrames,
    );
  }
  else if((lhs.type != "string" && lhs.type != "char") || (rhs.type != "string" && rhs.type != "char")){


    if(binop.operator == '+' || binop.operator == '&' ){
      return makeError(`Use ',' to concantenate multiple expressions into one string`, "syntax", binop.ln, StackFrames);
    }
    else{
      const types = [lhs.type, rhs.type];
      if(types.includes("string") || types.includes("string")){
        lhs = convThisToStr(lhs);
        rhs = convThisToStr(rhs);

        return eval_string_binary_expr(
          lhs as StringVal,
          rhs as StringVal,
          binop.operator,
          env,
          StackFrames
        );
      }
      else{

        //throw "Mal binary expression: " + JSON.stringify(binop.left);

        return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}`, "type", lhs.ln, StackFrames)
      }
    }




  }
  else{

    return makeError(`Cannot use operator '${binop.operator}' on operands of type ${out_type(lhs)} and ${out_type(rhs)}!`, "type", lhs.ln, StackFrames);
  }

}

export function eval_identifier(ident: Identifier, env: Environment, StackFrames : StackFrame[]): RuntimeVal {

  const val = env.lookupVar(ident.symbol, ident.ln, StackFrames, env);
  
  if(val.type == "null"){

    const names = Array.from(env.variables.keys());

    if(names.includes(ident.symbol)){

      if(kill_program()){
        return MK_NULL();
      }

      return env.variables.get(ident.symbol);

    }
    else{

      if(kill_program()){
        return MK_NULL();
      }

      return val;

    }

  }
  else{
    if(kill_program()){
      return MK_NULL();
    }



    return val;
  }


  
}




function cloneNewObjectVal(o: NewObjectVal): NewObjectVal {
  return {
    type: o.type,
    start: o.start,
    vals: o.vals.map(v =>
      v.type === "Object" ? cloneNewObjectVal(v as NewObjectVal) : v
    ),
    end: o.end,
    dataType: o.dataType,
    WereBoundsDeclared: o.WereBoundsDeclared,
    ln: o.ln,
  };
}


function dimension_count(obj : RuntimeVal) : number {

  let test : RuntimeVal = obj;
  let count : number = 0;

  while(test.type == "Object"){

    test = (test as NewObjectVal).vals[0];
    count++;

  }

  return count;

}

function eval_obj_assignment(obj: RuntimeVal, val: RuntimeVal, indexChain: number[], env : Environment, StackFrames : StackFrame[]): RuntimeVal {
  




  let fresh: RuntimeVal = cloneNewObjectVal(obj as NewObjectVal);

  let current: RuntimeVal = fresh;
  let parent: NewObjectVal | null = null;
  let x: number = -1;

  for (let i = 0; i < indexChain.length; i++) {
    if (current.type !== "Object") break;

    parent = current as NewObjectVal;



    x = indexChain[i];

    if(x > parent.end){

      return makeError("Index out of range!", "index", obj.ln, StackFrames);
    }

    x = adjust_index(parent.start, parent.vals.length, x, obj.ln, StackFrames);




    if(kill_program()){
      return MK_NULL();
    }

    if (i === indexChain.length - 1) {
      
      if(!val || !parent.vals[x]){
        //throw "Index out of range!";

        return makeError("Index out of range!", "index", obj.ln, StackFrames);
      }


      if(!ConfirmRaw(val, parent.vals[x], obj.ln, env, StackFrames)){

        return MK_NULL();

      }

      if(parent.vals[x].type == "Object" && val.type == "Object"){
        val = adapt_objectLiterals((val as NewObjectVal), (parent.vals[x] as NewObjectVal));
      }


      parent.vals[x] = val;
    } else {
      // walk deeper, making sure to clone on the way
      let next = parent.vals[x];
      if (next.type === "Object") {
        parent.vals[x] = cloneNewObjectVal(next as NewObjectVal);
        current = parent.vals[x];
      } else {
        // mismatch: expected object but hit primitive/null
        break;
      }
    }
  }

  return fresh;
}






export function eval_string_expr(str : string, env: Environment) : RuntimeVal {
  //return { type:"string" , kind: "StringLiteral", value: str } as RuntimeVal;

  if(str.length == 1){
    return {type:"char", value:str} as CharVal;
  }
  else{
    return {type: "string", kind: "StringLiteral", value: str} as StringVal;
  }
}



export async function eval_assignment_expr(node : AssignmentExpr, env : Environment, StackFrames : StackFrame[],permission?:boolean) : Promise<RuntimeVal> {


  const e = await evaluate(node.assigne, env, StackFrames);

  if(localStorage.getItem('Af') != "true" && e.type == "Object"){

    return makeError('Entire ARRAY assignment has been turned off. To allow entire ARRAY assignment, enable "Support Non-syllabus Features" in settings.', "type", node.ln, StackFrames);

  }

    
  let newVal : RuntimeVal = MK_STRING("");

  if(node.value.length == 1){
    newVal = await evaluate(node.value[0], env, StackFrames);
  }
  else{
    newVal = await concantate_exprs(node.value, env, StackFrames);
  }



    
  if(node.assigne.kind == "MemberExpr"){


    const par = (await evaluate((node.assigne as NewMemberExpr).object, env, StackFrames)).type;

      
    if(localStorage.getItem('Af') !== "true" && par == "string"){

      
      return makeError('Reassignment of characters has been turned off. To allow reassignment of characters, enable "Support Non-syllabus Features" in settings.', "type", node.ln, StackFrames);

    }


    const parent = await evaluate((node.assigne as NewMemberExpr).object, env, StackFrames);

    if(parent.type == "Object"){
      const object = await evaluate((node.assigne as NewMemberExpr).object, env, StackFrames) as NewObjectVal;
      let assigning : RuntimeVal;  

      if(node.value.length == 1){
        assigning = await evaluate(node.value[0], env, StackFrames);  
      }
      else{

        assigning = await concantate_exprs(node.value, env, StackFrames);

      }

        

      let indexChain : number[] = [];

      for(const expr of (node.assigne as NewMemberExpr).indexes){

        const test = await evaluate(expr, env, StackFrames);

        if(!Confirm(test, Tokens.Integer, expr.ln, env, StackFrames)){


          return makeError("Index could be not be resolved into an integer value!", "type", node.ln, StackFrames);

        }

        indexChain.push((test as NumberVal).value);

      }


      if(((node.assigne as NewMemberExpr).object).kind != "Identifier"){

        return makeError("Left hand side of assignment expression must be variable!", "type", node.ln, StackFrames);

      }

      const identifier = ((node.assigne as NewMemberExpr).object as Identifier).symbol;

      const result = eval_obj_assignment(object, assigning, indexChain, env, StackFrames);


      const var_env = env.resolve(identifier,node.ln, StackFrames, env);

      var_env.variables.set(identifier, structuredClone(result));


      return result;
    }
    else if(parent.type == "string"){

      if(((node.assigne as NewMemberExpr).object).kind != "Identifier"){

        return makeError("Cannot reassign to left hand side of assignment expr!", "runtime", node.ln, StackFrames);

      }


      const varname = ((node.assigne as NewMemberExpr).object as Identifier).symbol;

      let i : any = (node.assigne as NewMemberExpr).indexes[0]
      i = (await evaluate(i, env, StackFrames) as NumberVal).value;


      const val = await evaluate(node.value[0], env, StackFrames);

      env.assignVar(varname, eval_string_assignment(parent as StringVal ,val, i, StackFrames), node.ln, StackFrames, env)

      if(kill_program()){
        return MK_NULL();
      }

      return eval_string_assignment(parent as StringVal ,val, i, StackFrames);

    }
    else{
      return makeError("Immutable object!", "type", node.ln, StackFrames);
    }



  }
  else if(node.assigne.kind == "Identifier"){

    const varname = (node.assigne as Identifier).symbol;

    const varType = env.lookupVar(varname, node.ln, StackFrames, env);
    

    if(!ConfirmRaw(newVal,varType, node.ln, env, StackFrames)){



      let newValMsg = (newVal.type == "Object") ? String(Tokens[(newVal as NewObjectVal).dataType]) : String(newVal.type);
      let varValMsg = (varType.type == "Object") ? String(Tokens[(varType as NewObjectVal).dataType]) : String(varType.type);
      newValMsg = newValMsg.toUpperCase();
      varValMsg = varValMsg.toUpperCase();

      return makeError(`Cannot assign value of type ${newValMsg} to variable of type ${varValMsg}!`, "type", node.ln, StackFrames);
    }
    else{
      

      const assigne_dims = dimension_count(varType);
      const newVal_dims = dimension_count(newVal);

      if(assigne_dims != newVal_dims){


        return makeError(`Expecting array with ${assigne_dims} dimensions but got array with ${newVal_dims} dimensions!`, "runtime", node.ln, StackFrames);

      }


      if(varType.type == "Object" && newVal.type == "Object"){
        const varObj = varType as NewObjectVal;
        const newObj = newVal as NewObjectVal;




        if((varObj.vals.length != newObj.vals.length) && permission == undefined){
          return makeError(`Assigne has ${varObj.vals.length} elements but assigning array has ${newObj.vals.length} elements!`, "runtime", node.ln, StackFrames);
        }
      }
      
      const aC = auto_caster(newVal, varType);

      if(kill_program()){

        return MK_NULL();

      }

      env.assignVar(varname,aC, node.ln, StackFrames, env);
      return aC;
    }

  }
  else{

    return makeError("Operand not assignable!", "syntax", node.ln, StackFrames);
  }

  



}

function eval_string_assignment(assigne : StringVal, val : RuntimeVal, i : number, StackFrames : StackFrame[]) : RuntimeVal{




  let char : string;

  if(val.type == "string"){

    if((val as StringVal).value.length != 1){
      return makeError("Assigning value is not of type CHAR!", "type", assigne.ln, StackFrames);
    }

    char = (val as StringVal).value;
  }
  else if(val.type == "char"){
    

    char = (val as CharVal).value;

  }
  else{
      return makeError("Assigning value is not of type CHAR!", "type", assigne.ln, StackFrames);
  }


  let index = adjust_index(1, assigne.value.length, i, assigne.ln, StackFrames);

  if(kill_program()){
    return MK_NULL();
  }

  const new_str = replaceCharAt(assigne.value, index, char);

  return MK_STRING(new_str);


}

function replaceCharAt(str: string, index: number, replacement: string): string {
  if (index < 0 || index >= str.length) {
    throw new Error("Index out of range");
  }
  if (replacement.length !== 1) {
    throw new Error("Replacement must be a single character");
  }

  return str.substring(0, index) + replacement + str.substring(index + 1);
}


function auto_caster(getting : RuntimeVal, expecting : RuntimeVal) : RuntimeVal {
  if(expecting.type == "number"){
    return {
      type: "number",
      numberKind: (expecting as NumberVal).numberKind,
      value: (getting as NumberVal).value,
    } as NumberVal;
  }
  else if(expecting.type == "string"){
    if(getting.type == "string"){
      return getting;
    }
    else if(getting.type == "char"){
      return {
        type: "string",
        kind: "StringLiteral",
        value: (getting as CharVal).value,
      } as StringVal;
    }
    else{
      return makeError(`Cannot assign value of type ${getting.type} to data type STRING!`, "type", getting.ln);
    }
  }
  else if(expecting.type == "Object"){

    return {
        type: "Object",
        vals: (getting as NewObjectVal).vals,
        dataType: (expecting as NewObjectVal).dataType,
        WereBoundsDeclared: (expecting as NewObjectVal).WereBoundsDeclared,
        start: (expecting as NewObjectVal).start,
        end: (expecting as NewObjectVal).end

    } as NewObjectVal;

  }
  else{
    return getting;
  }
}

function ConfirmRaw(getting : RuntimeVal, expecting : RuntimeVal, ln : number, env : Environment, StackFrames : StackFrame[]) : boolean{

  let better = expecting;
  if(better.type == "MemberExprVal"){
    better = conv_memex_to_val(better as MemberExprVal);
  }




  if(getting.type == "Object" && expecting.type != "Object"){
    makeError(`Assigne is not an array!`, "type", ln);
    return false;
  }


  if(getting.type == "Object" && expecting.type == "Object"){

    if((getting as NewObjectVal).vals.length != (expecting as NewObjectVal).vals.length){


      makeError(`Expecting array with ${(expecting as NewObjectVal).vals.length} elements but got array with ${(getting as NewObjectVal).vals.length} elements!`, "runtime", ln, StackFrames);
      return false;

    }

  }

  switch(better.type){
    case "Object":

      if(getting.type != "Object"){
        makeError("Assigning value is not an array!", "type", ln, StackFrames);
        return false;
      }
      else{
        return Confirm(getting, (better as NewObjectVal).dataType, getting.ln, env, StackFrames);
      }

      

    case "boolean":
      return Confirm(getting, Tokens.Boolean, ln, env, StackFrames);

    case "char":
      return Confirm(getting, Tokens.Char,ln, env, StackFrames);

    case "number":
      return Confirm(getting, (better as NumberVal).numberKind, ln, env, StackFrames);

    case "string":
      return Confirm(getting, Tokens.String, ln, env, StackFrames);

    default:
      return true;
  }
}





/*function insertAtIndex(object : RuntimeVal, newVal : RuntimeVal, index : RuntimeVal, secondaryIndex? : RuntimeVal) : RuntimeVal{

  if(object.type == "Object"){
    if(!Confirm(newVal, (object as NewObjectVal).dataType, object.ln, env)){
      return makeError(`Value of data type ${out_type(newVal)} cannot be assigned to array
        of type ${Tokens[(object as NewObjectVal).dataType].toUpperCase()}!`, "type");
    }
    else{
      if(secondaryIndex == undefined){
        let tempArr = (object as NewObjectVal).vals;

        tempArr.splice((index as NumberVal).value, 1, newVal);

        let newObject = object as NewObjectVal;
        newObject.vals = tempArr;

        return newObject;
      

      }
      else{

        

        let parentObject = (object as NewObjectVal);
        
        let childObject = parentObject.vals[(index as NumberVal).value];

        if(childObject.type == "Object"){
          childObject = (childObject as NewObjectVal);

          if(!Confirm(newVal, (childObject as NewObjectVal).dataType, object.ln)){
            return makeError(`Cannot assign value of data type ${out_type(newVal)} to data type ${Tokens[(childObject as NewObjectVal).dataType].toUpperCase()}!`, "type", object.ln);
          }

          (childObject as NewObjectVal).vals[(secondaryIndex as NumberVal).value] = newVal;

          return parentObject;

        }
        else if(childObject.type == "string"){
          if(!Confirm(newVal, Tokens.Char, object.ln)){
            return makeError(`Cannot assign value of data type ${out_type(newVal)} to data type CHAR!`, "type", object.ln);
          }

          let str = (childObject as StringVal).value;

          const secInd = (secondaryIndex as NumberVal).value

          str = str.slice(0, secInd) + (newVal as CharVal).value + str.slice(secInd + 1);

          (childObject as StringVal).value = str;

          return parentObject;
        }
        else{
          return makeError("Expression is neither an array nor a string literal!", "type");
        }
        

      }
    }
  }
  else if(object.type == "string"){



    
    let aidVal = newVal;
    if((aidVal as StringVal).value.length == 1){
      aidVal = {type: "char", value: (aidVal as StringVal).value} as CharVal;
    }

    if(!Confirm(aidVal, Tokens.Char, object.ln)){
      return makeError(`Cannot assign value of data type ${out_type(aidVal)} to data type CHAR!`, "type");

    }
    else{

      if(secondaryIndex !== undefined){
        return makeError("Cannot access the substring of data type CHAR!", "type");
      }
      else{

        let newStr = String((object as StringVal).value);
        const indexVal = (index as NumberVal).value;
        newStr = newStr.slice(0,indexVal) + (newVal as CharVal).value + newStr.slice(indexVal + 1);

        return {
          type: "string",
          kind: "StringLiteral",
          value: newStr,
        } as StringVal;

      }

    }
  }

}*/

export function kill_program() : boolean {

  if(errorLog.length > 0 || pauseLog.length > 0){

    return true;

  }
  else{

    return false;

  }


}

function fill_empty_obj(dataType : Tokens.Real | Tokens.Integer | Tokens.Boolean | Tokens.String | Tokens.Char | Tokens.Any | Tokens.Null, start : number, end : number, innerStart? : number, innerEnd? : number) : NewObjectVal {

  let iterVal : RuntimeVal = MK_NULL();
  let elements : RuntimeVal[] = [];

    switch(dataType){
      case Tokens.String:
        iterVal = {
          type: "string",
          kind: "StringLiteral",
          value: " "
        } as StringVal;

        break;

      case Tokens.Char:
        iterVal = {
          type: "char",
          value: ' '
        } as CharVal;

        break;

      case Tokens.Integer:
        iterVal = {
          type: "number",
          numberKind: Tokens.Integer,
          value: 0
        } as NumberVal;

        break;

      case Tokens.Real:

        iterVal = {
          type: "number",
          numberKind: Tokens.Real,
          value: 0,
        } as NumberVal;

        break;

      case Tokens.Boolean:
        iterVal = {
          type: "boolean",
          value: false,
        } as BooleanVal;

        break;

      default:
        iterVal = MK_NULL();
    }

   

  const iterations = (end - start) + 1;   

  if(innerStart == undefined && innerEnd == undefined){

    for(let i = 0; i < iterations ; i++){
      elements.push(iterVal);
    }
  }
  else{
    for(let i = 0; i < iterations; i++){
      elements.push(fill_empty_obj(dataType, innerStart, innerEnd));
    }
  }  



  return {
    type: "Object",
    vals: elements,
    start: start,
    end: end,
    dataType: dataType,

  } as NewObjectVal;
}




export function conv_runtimeval_dt(r : RuntimeVal) : Tokens.String | Tokens.Char | Tokens.Integer | Tokens.Real | Tokens.Boolean | Tokens.Any | Tokens.Null{

  switch(r.type){
    case "MemberExprVal":
      const n = conv_memex_to_val(r as MemberExprVal);
      return(conv_runtimeval_dt(n));

    case "Object":
      return (r as NewObjectVal).dataType;

    case "boolean":
      return Tokens.Boolean

    case "char":
      return Tokens.Char

    case "string":
      return Tokens.String

    case "number":
      return (r as NumberVal).numberKind;

    default:
      return Tokens.Null;
  }
}



export function eval_char_string(expr : CharString, env : Environment) : RuntimeVal{

  return {
    type: "char",
    value: String(expr.text),
    ln: expr.ln,
  } as CharVal;

}

export function adjust_index(start:number, len:number, i:number, ln: number, StackFrames : StackFrame[]) : number{

  const newIndex = i - start;
  const end = (start + len) - 1;

  if(i < start || newIndex > end){
    

    makeError("Index out range!", "index", ln, StackFrames);
    
  }

  return newIndex;



  
}

function unwrap(str) : string {
  // Check if string is at least 2 chars and starts/ends with the same quote type
  if (
    typeof str === "string" &&
    str.length >= 2 &&
    ((str.startsWith('"') && str.endsWith('"')) ||
     (str.startsWith("'") && str.endsWith("'")))
  ) {
    return str.slice(1, -1); // Remove first and last char
  }
  return str;
}

function add_any(left : RuntimeVal, right : RuntimeVal) : StringVal{

  let l = convThisToStr(left);
  l.value = unwrap(l.value);

  let r = convThisToStr(right);
  r.value = unwrap(r.value);
  return {kind: "StringLiteral", type: "string", value: l.value + r.value} as StringVal;

}

export function Confirm(runtimeval : RuntimeVal, returnType : Tokens, ln:number, env : Environment, StackFrames : StackFrame[]) : boolean{
  let evaluatedType : Tokens.Char | Tokens.String | Tokens.Integer | Tokens.Real | Tokens.Boolean | Tokens.Any | Tokens.Null;


  switch(runtimeval.type){
    case "MemberExprVal":
      const memex = conv_memex_to_val(runtimeval as MemberExprVal);
      return Confirm(memex, returnType, ln, env, StackFrames);


    case "Object":
      evaluatedType = (runtimeval as NewObjectVal).dataType;
      break;

    case "boolean":
      evaluatedType = Tokens.Boolean
      break;

    case "string":
      const stringText = (runtimeval as StringVal).value;

      if(stringText.length == 1){
        evaluatedType = Tokens.Char;
      }
      else{
        evaluatedType = Tokens.String;
      }
      break;

    case "char":
      evaluatedType = Tokens.Char;
      break;

    case "number":
      const num = (runtimeval as NumberVal).value

      if(isint(num)){
        evaluatedType = Tokens.Integer;
      }
      else{
        evaluatedType = Tokens.Real;
      }
      break;

    default:
      evaluatedType = Tokens.Null;


  }





  if(evaluatedType !== returnType){
    if(returnType == Tokens.Real && evaluatedType == Tokens.Integer){

      return true;
    }
    else if(returnType == Tokens.String && evaluatedType == Tokens.Char){
      return true;
    }
    else{
      if(returnType == Tokens.Any){
        return true;
      }
      else{

        makeError(`Value is not of type ${Tokens[returnType].toUpperCase()}!`, "type",runtimeval.ln, StackFrames);
        return false;
      }
      
    }
  }
  else{
    return true
  }

}

async function maxeval(expr : Expr, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {
  const temp = await evaluate(expr, env, StackFrames);
  
  if(temp.type == "MemberExprVal"){
    return conv_memex_to_val(temp as MemberExprVal);
  }
  else{
    return temp;
  }
}

export const fn_args_size : Record<string, number> = {

  "SUBSTRING":3,
  "LCASE":1,
  "UCASE":1,
  "ROUND":2,
  "EOF":1,
  "LENGTH":1,
  "DIV":2,
  "MOD":2,
  "NUM_TO_STR":1,
  "STR_TO_NUM":1,

}

function eval_native_fn(name : string, args : RuntimeVal[], ln : number, env : Environment, StackFrames : StackFrame[]) : RuntimeVal{

  //Despite the name, eval_native_fn does not physically evaluate - It is a monitoring system rather than a control system

  if(name != "RANDOM" && args.length != fn_args_size[name]){



    return makeError(`Expecting ${fn_args_size[name]} arguments but got ${args.length}!`, "type", ln,  StackFrames);

  }

  switch(name){

    case "SUBSTRING":
      if(args[0].type != "string" && args[0].type != "char"){


        return makeError("First argument of a 'SUBSTRING' function must be of type STRING", "type", ln, StackFrames);

      }

      const text = (args[0] as StringVal).value;

      let start : number = ((args[1] as NumberVal).value);
      start = adjust_index(1, text.length, start, args[0].ln, StackFrames);


      if(errorLog.length > 0){
        return MK_NULL();
      }


      const end : number = ((args[2] as NumberVal).value);

      if(start + 1 < 1){
        return makeError("Start position must be above zero!", "runtime", ln);
      }

      if(end < 1){
        return makeError("Number of characters to be extracted must be above zero!", "runtime", ln);
      }


      const val = args[0].type == "string" ? (args[0] as StringVal).value : (args[0] as CharVal).value;


      if((args[1] as NumberVal).value + (args[2] as NumberVal).value - 1  > val.length){

        return makeError("Substring index out of range!", "index", ln, StackFrames);

      }

      break;

    case "LCASE":

      if(args[0].type != "string" && args[0].type != "char"){

        return makeError("'LCASE' argument must be of type STRING or CHAR!", "type", ln, StackFrames);

      }

      break;

    case "UCASE":

      if(args[0].type != "string" && args[0].type != "char"){

        return makeError("'UCASE' argument must be of type STRING or CHAR!", "type", ln, StackFrames);

      }

      break;

    case "MOD":

      if(args[0].type != "number"){

        return makeError("First argument of 'MOD' function must be a REAL or INTEGER value", "type", ln, StackFrames);

      }

      if(args[1].type != "number"){

        return makeError("Second argument of 'MOD' function must be a REAL or INTEGER value", "type", ln, StackFrames);

      }

      if((args[1] as NumberVal).value == 0){

        return makeError("Second argument of 'MOD' function is zero!", "ZeroDivision", ln, StackFrames)

      }

      break;

    case "DIV":

      if(args[0].type != "number"){

        return makeError("First argument of 'DIV' function must be a REAL or INTEGER value", "type", ln, StackFrames);

      }

      if(args[1].type != "number"){

        return makeError("Second argument of 'DIV' function must be a REAL or INTEGER value", "type", ln, StackFrames);

      }

      if((args[1] as NumberVal).value == 0){

        return makeError("Second argument of 'DIV' function is zero!", "ZeroDivision", ln, StackFrames)

      }

      break;

    case "EOF":

      if(localStorage.getItem('Af') != "true"){

        return makeError('EOF()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "name", ln, StackFrames);
    
      }

      if(!Confirm(args[0], Tokens.String, args[0].ln, env, StackFrames)){

          if(args[0].type == "file-name"){
            errorLog.pop();
            return makeError("Expecting file name in STRING format!", "type", ln, StackFrames);


          }
          else{

            errorLog.pop();
            return makeError("Expecting valid file name!", "type", ln, StackFrames);
          }

        }

      break;


    case "STR_TO_NUM":
      if(localStorage.getItem('Af') == "true"){
        
        if(!Confirm(args[0], Tokens.String, ln, env, StackFrames)){
          return makeError("Expecting argument of type STRING", "type", ln, StackFrames);
        }
      


      }
      else{
        
        return makeError('"STR_TO_NUM()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "name", ln, StackFrames);
      }

      break;

    case "NUM_TO_STR":
      if(localStorage.getItem('Af') == "true"){
        
        if(!Confirm(args[0], Tokens.Real, ln, env, StackFrames)){
          return makeError("Expecting argument of type REAL", "type", ln, StackFrames);
        }

      }
      else{

        return makeError('"NUM_TO_STR()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "name", ln, StackFrames)

      }

      break;

    case "LENGTH":
      if(args[0].type == "Object" && localStorage.getItem('Af') != "true"){

        return makeError(`"LENGTH()" method only takes arguments of type STRING. To return array lengths, enable "Support Non-Syllabus Features" in settings.`, "type", ln, StackFrames);

      }

      let subjectComponent = args[0] as RuntimeVal;

      const accepted = ["Object", "string", "char"];

      if(!accepted.includes(subjectComponent.type)){
        
        return makeError("LENGTH function only takes STRING or ARRAY arguments!", "type", ln, StackFrames) ;
      }

      break;

    case "ROUND":
      if(args[0].type !== "number"){
          return makeError("Argument 1 is not of type REAL!", "type", ln, StackFrames) ;
        }

      if(args[1].type == "number"){
        const runtimeval = args[1] as NumberVal;

        if(runtimeval.value < 0){

          return makeError("Argument 2 of a 'ROUND' function must be above zero!", "runtime", ln, StackFrames);

        }


        if(!isint(runtimeval.value)){
          return makeError("Argument 2 of is not of type INTEGER!", "type", ln, StackFrames) ;
        }
      }
      else{
        return makeError("Argument 2 of is not of type INTEGER!", "type", ln, StackFrames) ;
      }

      break;

    case "RANDOM":
      if(args && args.length != 0 && localStorage.getItem('Af') != "true"){

        return makeError(`Expected 0 arguments but got ${args.length}!`, "runtime", ln, StackFrames);

      }
      else if(localStorage.getItem('Af') == "true"){

        if(args && (args.length == 1 || args.length > 2)){

          return makeError(`Expected 0 or 2 arguments but got 1!`, "runtime", ln, StackFrames);

        }

      }

      if(localStorage.getItem('Af') == "true"){

        if(args[0] && args[0].type != "number"){

          return makeError("First argument of RANDOM function must be a REAL or INTEGER value!");

        }

        if(args[1] && args[1].type != "number"){

          return makeError("Second argument of RANDOM function must be a REAL or INTEGER value!");

        }

      }

      break;

    default:
      return null;
  }

}


export async function eval_call_expr(expr : CallExpr, env : Environment, StackFrames : StackFrame[]): Promise<RuntimeVal> {
  

  //StackFrames.push({expr: pcon.stringify(expr), ln: expr.ln, context: env.context} as StackFrame);



  const name = (expr.callee as Identifier).symbol;
  const runtime = env.lookupVar(name, expr.ln, StackFrames, env);


  if(errorLog.length > 0){

    return MK_NULL();

  }

  if(runtime.type != "function" && runtime.type != "native-fn"){

    return makeError(`'${name}' is not callable!`, "type", expr.ln, StackFrames);

  }

  const args = await Promise.all(expr.args.map(async (arg) => maxeval(arg, env, StackFrames)));

  const fn = await evaluate(expr.callee, env, StackFrames);
  


  if(kill_program()){
    return MK_NULL();
  }

  

  if(fn.type == "native-fn"){

    const nativeFnValue = fn as NativeFnValue;

    //StackFrames.pop();

    eval_native_fn(name, args, expr.ln, env, StackFrames);

    if(errorLog.length > 0){

      return MK_NULL();

    }

    const result = nativeFnValue.call(args, env);
	  return result;
  }
  else if(fn.type = "function"){
    
    const func = fn as FunctionValue;
    const funcProcComponent = eval_identifier(expr.callee as Identifier, env, StackFrames) as FunctionValue ;


    if(expr.wasCallKeywordUsed && !funcProcComponent.isProcedure){
      return makeError("Do not use 'CALL' keyword on functions!", "syntax", expr.ln, StackFrames);
    }

    if(!expr.wasCallKeywordUsed && funcProcComponent.isProcedure){
      return makeError("Must use 'CALL' keyword when calling procedures!", "syntax", expr.ln, StackFrames) ;
    }
    
    
    const scope = new Environment(name,func.declarationEnv);



    if(func.parameters.size != args.length){
      return makeError(`Expected ${func.parameters.size} arguments, but got ${args.length}`, "type", expr.ln, StackFrames);
    }

    if(func.parameters !== null){
      if(func.parameters.size > 0){



        for(let i = 0; i < args.length; i++){
          let arg = args[i];
          const parameter = Array.from(func.parameters.entries())[i];

          if(arg.type == "MemberExprVal"){
            arg = conv_memex_to_val(arg as MemberExprVal);
          }

          let paramType : RuntimeVal;
          
          if(parameter[1].kind == "ObjectLiteral"){

            if(arg.type != "Object"){
              return makeError("Expecting argument to be array!", "type", expr.ln, StackFrames);
            }

            if(!Confirm(arg, (parameter[1] as NewObjectLiteralExpr).dataType, expr.ln, env, StackFrames)){
              return makeError(`Array is not of type ${Tokens[(parameter[1] as NewObjectLiteralExpr).dataType].toUpperCase()}!`, "type", expr.ln, StackFrames)
            }

            paramType = {
              type: "Object",
              vals: (arg as NewObjectVal).vals,
              start: (arg as NewObjectVal).start,
              end: (arg as NewObjectVal).end,
              dataType: (parameter[1] as NewObjectLiteralExpr).dataType,
            } as NewObjectVal;

          } 
          else{
            paramType = await evaluate(parameter[1], scope, StackFrames);
           
          }
          

          if(!ConfirmRaw(arg, paramType, expr.ln, env, StackFrames)){

            let paramTypeMsg = String(paramType.type);

            if(paramTypeMsg == "number"){
              paramTypeMsg = Tokens[(paramType as NumberVal).numberKind];
            }
            else if(paramTypeMsg == "Object"){
              paramTypeMsg = Tokens[(paramType as NewObjectVal).dataType];
            }

            paramTypeMsg = paramTypeMsg.toUpperCase();

            if(errorLog.length == 0){
              return makeError(`Argument '${JSON.stringify((arg as StringVal).value)}' is not of type ${paramTypeMsg}!`, "type", expr.ln, StackFrames);
            }
            else{
              return MK_NULL();
            }
            
          }


          
        }

        for (let i = 0; i < func.parameters.size; i++){
      
          const varname = Array.from(func.parameters.keys())[i];
          scope.declareVar(varname, args[i], false, env, StackFrames);
        }

   
      }
    }

    

    

    let result : RuntimeVal = MK_NULL();
    


    for(const stmt of func.body){

      const Frame = {context: name, ln: stmt.ln, expr: pcon.stringify(stmt)} as StackFrame;

      //StackFrames.push(Frame);



      
      if(stmt.kind == "SelectionStmtDeclaration"){


        
        //StackFrames.pop();
        result = await evaluate(stmt, scope, StackFrames);
        


        //const selec_bod = Array.from((stmt as SelectionStmtDeclaration).body);

    
        if(result){
          if(result.type !== "null" &&  (stmt as SelectionStmtDeclaration).returns.length > 0 && result.type != "end-closure"){


            const returnType = await evaluate(func.returnType, scope, StackFrames);

            if(!func.isProcedure){


              if(returnType.type == "Object"){

                //StackFrames.push({expr: pcon.stringify(func.returnType), ln: returnType.ln, context: env.context} )

                const confirmed = await confirmForReturning(result, func.returnType, scope, StackFrames);

                if(!confirmed){
                  return MK_NULL();
                }
                else{
                  return result;
                }

              }
              else{

                const rt = conv_runtimeval_dt(returnType);

                //StackFrames.push(Frame);
  
                if(Confirm(result, rt, expr.ln, env, StackFrames)){
 
                  return result;
                }
                else{

                  

                  return makeError(`Returned value is not of type ${Tokens[rt]}!`, "type", stmt.ln, StackFrames);
                }


              }



              
            }
            else{
              return makeError("Procedures may not return a value!", "runtime", stmt.ln, StackFrames);
            }
          }
        }

        

        
      }
      else if(stmt.kind == "IterationStmt"){


        //StackFrames.pop();
        result = await evaluate(stmt, scope, StackFrames);
        const temp = stmt as IterationStmt;
        


        if(result){
          
          if(result.type !== "null" && temp.returnExpressions.length > 0 && result.type != "end-closure"){
          
            
            if(!func.isProcedure){

              const confirmed = await confirmForReturning(result, func.returnType, scope, StackFrames);

              if(!confirmed){
                return MK_NULL();
              }
              else{
                return result;
              }
            }
            else{
              return makeError("Procedures may not return a value!", "runtime", result.ln, StackFrames);
            }
          }
        }



      }
      else if(stmt.kind == "ReturnStmt"){
       
        if(func.isProcedure){
          return makeError("Procedures may not return a value!", "runtime", stmt.ln, StackFrames);
        }
        else{
          //StackFrames.pop();
          result = await eval_return_stmt(stmt as ReturnStmt, scope, StackFrames);
          
          
          const confirmed = await confirmForReturning(result, func.returnType, scope, StackFrames);


          if(!confirmed){

            return MK_NULL();
          }
          else{

            
            return result;
          }


          
        }


      }
      else{
        
        //StackFrames.push({context: name, ln: stmt.ln, expr: pcon.stringify(stmt)} as StackFrame)
        result = await evaluate(stmt, scope, StackFrames);
        //StackFrames.pop();
      }


    }

    
      if(!func.isProcedure){
        for(const expr of func.returnExpressions){
          result = await evaluate(expr, scope, StackFrames);

          if(result){
            if(result.type == "MemberExprVal"){
              result = conv_memex_to_val(result as MemberExprVal);
            }
          }
          

          const returnType = conv_runtimeval_dt(await evaluate(func.returnType, scope, StackFrames));

          const returnToken = conv_dt_runtimeval(returnType);
          result = auto_caster(result, returnToken);


          if(!func.isProcedure && !kindMatchesToken(result, returnType,env)){
             makeError( `Return type is not ${result.type},
            !`, "type", expr.ln, StackFrames);
          }
        }
      }


    return result;
    
  }
  else{
    return makeError(`Function does not exist!`, "name", expr.ln);
  }



}


async function confirmForReturning(getting:RuntimeVal, expecting:Expr, env : Environment, StackFrames : StackFrame[]) : Promise<boolean> {



  const return_type = out_type(await evaluate(expecting, env, StackFrames));

  if(expecting.kind == "ObjectLiteral"){

    if(getting.type != "Object"){
      makeError("Value returned is not an array!", "type", getting.ln, StackFrames);
    }

    const r = (expecting as NewObjectLiteralExpr).dataType;


    
    if(Confirm(getting, r, getting.ln, env, StackFrames)){
      return true;
    }
    else{

      

      errorLog.pop();
      makeError(`Returned value is not of type ${return_type}`, "type", getting.ln, StackFrames);
      return false;
    }


  }
  else{
    const rtv = await evaluate(expecting, env, StackFrames);



    if(ConfirmRaw(getting, rtv, getting.ln, env, StackFrames)){
      return true;
    }
    else{

      
      errorLog.pop();
      makeError(`Returned value is not of type ${return_type}`, "type", getting.ln, StackFrames);
      return false;
    }
  }

}

function conv_dt_runtimeval(dt : Tokens.Integer | Tokens.Real | Tokens.Boolean | Tokens.Char | Tokens.String | Tokens.Any | Tokens.Null) : RuntimeVal {

  switch(dt){
    case Tokens.Integer:
      return {type: "number", numberKind: dt, value: 0} as NumberVal;

    case Tokens.Real:
      return {type: "number", numberKind: dt, value: 0} as NumberVal;

    case Tokens.String:
      return {type: "string", kind: "StringLiteral", value: " "} as StringVal;

    case Tokens.Char:
      return {type: "char", value: ' '} as CharVal;

    case Tokens.Boolean:
      return {type: "boolean", value: false} as BooleanVal;

    default:
      return MK_NULL();
  }

}


function assess_dataType_fromstring(str : string) 
: Tokens.Any
  | Tokens.Integer
  | Tokens.Real
  | Tokens.String
  | Tokens.Char
  | Tokens.Boolean
  | Tokens.Null{

    if(str.startsWith('"') && str.endsWith('"')){
      return Tokens.String;
    }
    else if(str.startsWith("'") && str.endsWith("'")){
      return Tokens.Char;
    }
    else if(isNumeric(str)){

      if(isint(Number(str))){
        return Tokens.Integer;
      }
      else{
        return Tokens.Real;
      }
    }
    else if(str == "TRUE" || str == "FALSE"){
      return Tokens.Boolean;
    }
    else if(str == "NULL"){
      return Tokens.Null;
    }
    else{
      return Tokens.Any;
    }

}



function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && str.trim() !== '';
}

async function kindMatchesToken(val : RuntimeVal, tk :
  Tokens.Integer
  | Tokens.Real
  | Tokens.Boolean
  | Tokens.String
  | Tokens.Char
  | Tokens.Any
  | Tokens.Null, env : Environment
) : Promise<boolean>{

  
  
  const kind = val.type;

  switch(kind){

    case "string":
      if(tk == Tokens.String){
        return true;
      }
      else{
        return false
      }


    case "char":
      if(tk == Tokens.Char){
        return true;
      }
      else{
        return false;
      }


    case "number":
      const numKind = (val as NumberVal).numberKind;

      if(tk == numKind){
        return true
      }
      else{
        return false
      }


    case "boolean":
      if(tk == Tokens.Boolean){
        return true
      }
      else{
        return false
      }


    case "null":
      if(tk == Tokens.Null){
        return true
      }
      else{
        return false
      }


    case "Object":
      if(tk == (val as NewObjectVal).dataType){
        return true
      }
      else{
        return false
      }

    case "MemberExprVal":
      const temp = conv_memex_to_val(val as MemberExprVal);

      return kindMatchesToken(temp, tk, env);

    case "function":

      const rtv = await evaluate((val as FunctionValue).returnType, env, [initial_stack]);
      const rtk = conv_runtimeval_dt(rtv);

      if(tk == rtk){
        return true;
      }
      else{
        return false;
      }

    case "native-fn":

      return true;
      

    default:
      return false;

  }
}

export async function eval_unary_expr(unaryExpr : UnaryExpr, env : Environment, StackFrames : StackFrame[]) : Promise<RuntimeVal> {



  let val = await evaluate(unaryExpr.right, env, StackFrames);
  if(val.type == "MemberExprVal"){
    val = conv_memex_to_val(val as MemberExprVal);
  }


  if(unaryExpr.operator == '+' || unaryExpr.operator == '-' || unaryExpr.operator == '.'){
    
    if(val.type != "number"){

      return makeError("Expecting operand of type REAL", "type", unaryExpr.ln);

    }
    else{
      return eval_unary_numeric_expr(unaryExpr.operator, (val as NumberVal).value, unaryExpr.ln);
    }
    
    
  }
  else if(unaryExpr.operator == 'NOT'){

    return eval_unary_logic_expr(unaryExpr.operator, (conv_bool(val).value), unaryExpr.ln);

    
  }

}

function conv_bool(any : RuntimeVal) : BooleanVal {

  if(any.type == "boolean"){
    return any as BooleanVal;
  }
  else if(any.type == "number"){

    if((any as NumberVal).value){
      return MK_BOOL(true);
    }
    else{
      return MK_BOOL(false);
    }

  }
  else if(any.type == "string"){

    if((any as StringVal).value){
      return MK_BOOL(true);
    }
    else{
      return MK_BOOL(false);
    }

  }
  else if(any.type == "char"){

    if((any as CharVal).value){
      return MK_BOOL(true);
    }
    else{
      return MK_BOOL(false);
    }

  }
  else if(any.type == "Object"){

    if((any as NewObjectVal).vals){
      return MK_BOOL(true);
    }
    else{
      return MK_BOOL(false);
    }

  }
  else if(any.type == "null"){
    return MK_BOOL(false);
  }
  else{
    return MK_BOOL(false);
  }



}

function eval_unary_numeric_expr(opeator : string, rhs : number, ln : number) : RuntimeVal {

  switch(opeator){
    case '+':
      return MK_NUMBER(rhs, "Auto");

    case '-':
      return MK_NUMBER(-rhs, "Auto")

    case '.':

  

      const float = Number('0.' + String(rhs));

      return MK_NUMBER(float, Tokens.Real);


    default: 
      return makeError("Unrecognised numeric operator!", "runtime",ln);
  }
}

function eval_unary_logic_expr(operator : string, rhs : boolean, ln : number) : RuntimeVal {

  switch(operator){
    case 'NOT':

      


      return MK_BOOL(!rhs);

    default:
      return makeError("Unrecognised logic operator!", "runtime", ln);
  }


}

function adapt_objectLiterals(getting : NewObjectVal, expecting : NewObjectVal) : NewObjectVal {

  let adapted : NewObjectVal = getting;


  adapted.start = expecting.start;
  adapted.end = expecting.end;
  adapted.WereBoundsDeclared = expecting.WereBoundsDeclared;

  return adapted;


}


function stringifyPlus(str : any, rTVT : RuntimeVal) : string{
  let toUse = JSON.stringify(str);

  if(toUse.startsWith('"') && toUse.endsWith('"') && rTVT.type !== "string"){
    toUse = toUse.slice(1,-1);
  }
  else if(toUse.startsWith("'") && toUse.endsWith("'") && rTVT.type !== "char"){
    toUse = toUse.slice(1,-1);
  }
  else if(toUse.startsWith['['] && toUse.endsWith(']') && rTVT.type !== "Object"){
    toUse = toUse.slice(1,-1);
  }
  else if(toUse.startsWith('"') && toUse.endsWith('"') && rTVT.type == "Object"){

    toUse = toUse.slice(1,-1);
  }

  return toUse;
}

function CustomWrap(symbol : string, word : string){
  if(!(word.startsWith(symbol) && word.endsWith(symbol))){
    return symbol + word + symbol;
  }
  else{
    return word
  }
}

function convThisToStr(val : RuntimeVal) : StringVal{
  let value : string = "";



  switch(val.type){
    case "string":

      value = (val as StringVal).value;

      

      break;

    case "MemberExprVal":

      let memex : RuntimeVal = val;
      
      if(memex.type == "MemberExprVal"){
        memex = conv_memex_to_val(memex as MemberExprVal);
      }



      return convThisToStr(memex);
       


    case "Object":

      const obj = val as NewObjectVal;



      value = '[';

      for(const item of obj.vals){

        value += (convThisToStr(item).value) + ','

      }

      value = value.slice(0,-1);
      value += ']';

      
      break;

    case "boolean":

      

      value = String((val as BooleanVal).value).toUpperCase();


      break;

    case "char":
      value = String((val as CharVal).value);

      break;

    case "number":
      value = String((val as NumberVal).value);
      break;

    default:
      value = JSON.stringify(val);
  }


  const new_stringval =  MK_STRING(value);



  return new_stringval;
}