import { StringLiteral, VarDeclaration } from "../Frontend/AST.js";
import { Tokens } from "../Frontend/Lexer.js";
import { BooleanVal, MemberExprVal, MK_CHAR, MK_BOOL, MK_NATIVE_FN, MK_NULL, MK_NUMBER, MK_STRING, NativeFnValue, NumberVal, RuntimeVal, StringVal, ValueType, NewObjectVal } from "./Value.js";
import { conv_memex_to_val, adjust_index, isint, Confirm} from "./Eval/Expressions.js";
import { errorLog, makeError,  FileValues,  initial_frame, StackFrame} from "../Main.js";
import PCON  from "../Frontend/PCON.js";
const pcon = new PCON;

function levenshtein(str1, str2){
    
    const grid = []
    
    for(let i = 0; i < str1.length + 1; i++){
        const row = [];
        
        for(let j = 0; j < str2.length + 1; j++){
            row.push(j)
        }
        
        row[0] = i;
        
        grid.push(row);
        
    }
    
    for(let i = 1; i < str1.length + 1; i++){
        for(let j = 1; j < str2.length + 1; j++){
            if(str1[i-1] == str2[j-1]){
                
                grid[i][j]  = grid[i-1][j-1] 
                
            }
            else{
                
                grid[i][j] = 1 + Math.min(grid[i-1][j-1], grid[i][j-1], grid[i-1][j])
            }
            
        }
        
    }
    
    return grid[str1.length][str2.length]
    
}

function suggest(input : string, candidate : string) : string | null {

  if(!input || !candidate){

    return null;

  }

  const distance = levenshtein(input.toUpperCase(), candidate.toUpperCase());
  const threshold = Math.min(Math.floor(input.length / 2), 3);

  if(distance <= threshold || (input.toUpperCase() == candidate.toUpperCase())){

    return candidate;

  }
  else{
    return null;
  }


}

function best_match(input : string, candidates : string[]) : string | null {

  const data = new Map<number, string>();

  let foundmatch : boolean = false;

  for(const name of candidates){

    if(suggest(input, name)){

      data.set(levenshtein(input, name), name);
      foundmatch = true;
    }

  }

  if(foundmatch){
    const chosenKey = Math.min(...data.keys());
    const chosen = data.get(chosenKey);

    return chosen

  }
  else{

    return null;

  }



}




export function arityCheck(expected : number, got : number, ln: number){
  if(expected != got){
    return makeError(`Expected ${expected} arguments but got ${got}!`, "Type", ln);
  }
}

export function SetupGlobalScope(){
  const env = new Environment("<module>");

    env.declareVar("TRUE", MK_BOOL(true), true, env, [initial_frame]);
    env.declareVar("FALSE", MK_BOOL(false), true, env, [initial_frame]);
    env.declareVar("NULL", MK_NULL(), true, env, [initial_frame]);



    env.declareVar("LENGTH", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(1, args.length, args[0].ln);

        if(errorLog.length > 0){
          return MK_NULL();
        }

        if(args[0].type == "Object" && localStorage.getItem('Af') != "true"){

          return makeError(`"LENGTH()" method only takes parameters of type STRING. To return array lengths, enable "Support Non-Syllabus Features" in settings.`, "Type", args[0].ln);

        }

        args = autoConvert(args);

        let subjectComponent = args[0] as RuntimeVal;
        let subject : any;
        let length : number;



        if(subjectComponent.type == "Object"){
          subject = (subjectComponent as NewObjectVal).vals;
          length = subject.length;
        }

        else if(subjectComponent.type == "string") {
          subject = (subjectComponent as StringVal).value;
          length = subject.length;
        }
        else if(subjectComponent.type == "char"){

          length = 1;

        }
        else if(subjectComponent.type == "MemberExprVal"){
          subjectComponent = conv_memex_to_val(subjectComponent as MemberExprVal);
          const func =  env.lookupVar("LENGTH", subjectComponent.ln, [initial_frame], env) as NativeFnValue;
          const result = func.call([subjectComponent], env);
          return result;

        }
        else{
          
          return makeError("LENGTH function only takes string (or object literal) parameters!", "Type", subjectComponent.ln) ;
        }

        return MK_NUMBER(length, Tokens.Integer);

      }),
    true, env, [initial_frame]);

    env.declareVar("UCASE",
      
      MK_NATIVE_FN((args, scope) => {

        arityCheck(1, args.length, args[0].ln);

        if(errorLog.length > 0){
          return MK_NULL();
        }

        args = autoConvert(args);

        if(args[0].type != "string" && args[0].type != "char"){
          return makeError("Argument is neither of string nor char type!", "Type", args[0].ln) ;
        }


        const text = (args[0] as StringVal).value;
        const cap = text.toUpperCase();

        if(cap.length == 1){
          return MK_CHAR(cap);
        }
        else{
          return MK_STRING(cap);
        }


      }),
    true, env, [initial_frame]);

    env.declareVar("LCASE",
      MK_NATIVE_FN((args, scope) => {
        arityCheck(1, args.length, args[0].ln);


        if(errorLog.length > 0){
          return MK_NULL();
        }

        if(args[0].type != "string" && args[0].type != "char"){
          return makeError("Argument is neither of STRING nor CHAR type!", "Type", args[0].ln) ;
        }


        args = autoConvert(args);
        const text = (args[0] as StringVal).value;
        const cap = text.toLowerCase();

        if(cap.length == 1){
          return MK_CHAR(cap);
        }
        else{
          return MK_STRING(cap);
        }

        
      }),
    true, env, [initial_frame]);
    
    env.declareVar("SUBSTRING",
      MK_NATIVE_FN((args, scope) => {
        arityCheck(3, args.length, args[0].ln);

        if(errorLog.length > 0){
          return MK_NULL();
        }

        
        args = autoConvert(args);

        if(args[0].type != "string" && args[0].type != "char"){
          return makeError("First argument of a 'SUBSTRING' function must be of type STRING", "Type", args[0].ln);
        }

        const text = (args[0] as StringVal).value;

        let start : number = ((args[1] as NumberVal).value);
        start = adjust_index(1, text.length, start, args[0].ln, [initial_frame]);


        if(errorLog.length > 0){
          return MK_NULL();
        }


        const end : number = ((args[2] as NumberVal).value);

        if(start + 1 < 1){
          return makeError("Start position must be above zero!", "Runtime", args[0].ln);
        }

        if(end < 1){
          return makeError("Number of characters to be extracted must be above zero!", "Runtime", args[0].ln);
        }


        const slice : string = text.substring(start, start + end);




        if(slice.length == 1){

          return MK_CHAR(slice);

        }
        else{
          return MK_STRING(slice);
        }

        
      }),
    true, env, [initial_frame])

    env.declareVar("ROUND",
      MK_NATIVE_FN((args, scope) => {
        arityCheck(2, args.length, args[0].ln);

        if(errorLog.length > 0){
          return MK_NULL();
        }


        args = autoConvert(args);
        if(args[0].type !== "number"){
          return makeError("Argument 1 is not of type REAL!", "Type", args[0].ln) ;
        }

        if(args[1].type == "number"){
          const runtimeval = args[1] as NumberVal;

          if(runtimeval.value < 0){

            return makeError("Argument 2 of a 'ROUND' function must be above zero!", "Runtime", args[0].ln);

          }


          if(!isint(runtimeval.value)){
            return makeError("Argument 2 of is not of type INTEGER!", "Type", args[0].ln) ;
          }
        }
        else{
          return makeError("Argument 2 of is not of type INTEGER!", "Type", args[0].ln) ;
        }

        const num = (args[0] as NumberVal).value;
        const dP = (args[1] as NumberVal).value;

        const rounded = RoundToPlaces(num, dP);

        const numberKind = (dP == 0)
        ? Tokens.Integer
        : Tokens.Real;

        return MK_NUMBER(rounded, numberKind);
      }),
    true, env, [initial_frame])

    env.declareVar("RANDOM",
      MK_NATIVE_FN((args, scope) => {
        args = autoConvert(args);
        if(args.length > 2 || args.length == 1){
          return makeError(`Expected 0 OR 2 arguments but got ${args.length}!`, "Runtime", args[0].ln);
        }


        if(args && args.length != 0 && localStorage.getItem('Af') != "true"){

          return makeError(`Expected 0 arguments but got ${args.length}!`, "Runtime", args[0].ln);

        }

        if(args.length == 0 || args == undefined){
          return MK_NUMBER(Math.random(), Tokens.Real);
        }
        else{


          if(args[0].type != "number"){
            return makeError("First argument is not of type REAL!", "Type", args[0].ln);
          }

          if(args[1].type != "number"){
            return makeError("Second argument is not of type REAL!", "Type", args[0].ln)
          }

          const start = (args[0] as NumberVal).value;
          const end = (args[1] as NumberVal).value;
          const gap = Math.abs(end - start);

          const rand = RoundToPlaces((Math.random() * gap) + Math.min(start, end) ,0)

          return MK_NUMBER(rand, Tokens.Real);
        }

      }),
    true, env, [initial_frame])

    env.declareVar("DIV", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(2, args.length, args[0].ln);

        if(errorLog.length > 0){
          return MK_NULL();
        }

        args = autoConvert(args);

        if(!isIntegerRuntime(args[0])){
          return makeError("First argument is not of type INTEGER!", "Type", args[0].ln);
        }
        
        if(!isIntegerRuntime(args[1])){
          return makeError("Second argument is not of type INTEGER!", "Type", args[0].ln);
        }

        const num1 = (args[0] as NumberVal).value;
        const num2 = (args[1] as NumberVal).value;

        return MK_NUMBER(Math.trunc(num1 / num2), Tokens.Integer);

      }),
    true, env, [initial_frame])

    env.declareVar("MOD", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(2,args.length, args[0].ln);


        if(errorLog.length > 0){
          return MK_NULL();
        }

        args = autoConvert(args);
        
        if(!isIntegerRuntime(args[0])){
          return makeError("First argument is not of type INTEGER!", "Type", args[0].ln);
        }
        
        if(!isIntegerRuntime(args[1])){
          return makeError("Second argument is not of type INTEGER!", "Type", args[0].ln);
        }
        


        const num1 = (args[0] as NumberVal).value;
        const num2 = (args[1] as NumberVal).value;

        return MK_NUMBER(num1 % num2, Tokens.Integer);

      }),
    true, env, [initial_frame])

    env.declareVar("NUM_TO_STR", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(1,args.length, args[0].ln);


        if(errorLog.length > 0){
          return MK_NULL();
        }

        if(localStorage.getItem('Af') == "true"){
          args = autoConvert(args);
          
          if(!Confirm(args[0], Tokens.Real, args[0].ln, env, [initial_frame])){
            return makeError("Expecting argument of type REAL", "Type", args[0].ln);
          }

        
          return MK_STRING((args[0] as NumberVal).value.toString());
        }
        else{

          return makeError('"NUM_TO_STR()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "Name", args[0].ln)

        }
      }),
    true, env, [initial_frame])

    env.declareVar("STR_TO_NUM", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(1,args.length, args[0].ln);


        if(errorLog.length > 0){
          return MK_NULL();
        }

        if(localStorage.getItem('Af') == "true"){
          args = autoConvert(args);
          
          if(!Confirm(args[0], Tokens.String, args[0].ln, env, [initial_frame])){
            return makeError("Expecting argument of type STRING", "Type", args[0].ln);
          }
        
          return MK_NUMBER(parseFloat((args[0] as StringVal).value), "Auto");

        }
        else{
          
          return makeError('"STR_TO_NUM()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "Name", args[0].ln);
        }

        


      

      }),
    true, env, [initial_frame])

    env.declareVar("EOF", 
      MK_NATIVE_FN((args, scope) => {
        arityCheck(1,args.length, args[0].ln);


        if(errorLog.length > 0){
          return MK_NULL();
        }

        if(localStorage.getItem('Af') != "true"){

          return makeError('EOF()" is a method part of the "Non-syllabus" collection. To call it, enable "Support Non-syllabus Features" in settings.', "Name", args[0].ln);
        

        }


        args = autoConvert(args);

        if(!Confirm(args[0], Tokens.String, args[0].ln, env, [initial_frame])){

          if(args[0].type == "file-name"){
            errorLog.pop();
            return makeError("Expecting file name in STRING format!", "Type");


          }
          else{

            errorLog.pop();
            return makeError("Expecting valid file name!", "Type");
          }

        }

        const flnm = (args[0] as StringVal).value.trim();

        if(flnm === ""){
          return makeError("Cannot read properties of undefined!", "Type", args[0].ln);
        }
        else if(! (extract_file_type(flnm) == "txt")){
          return makeError(`Invalid file type '.${extract_file_type(flnm)}'!`, "Type", args[0].ln);
        }
        
        scope.resolve(flnm, args[0].ln, [initial_frame], env);

        if(errorLog.length > 0){
          return MK_NULL();
        }



      
        return MK_BOOL(FileValues.get(flnm).length == 0);


      

      }),
    true, env, [initial_frame])

  
  return env;

}



function extract_file_type(raw) : string {

    let guess = "";

    raw = raw.split('');

    let i = raw.length - 1;

    if(!raw.includes('.')){

        return 'none';

    }
    else{
        while(raw[i] != '.'){

            guess = raw[i] + guess;
            i--;

        }

        return guess;
    }

}

function isIntegerRuntime(val : RuntimeVal) : boolean {
  if(val.type == "number"){
    const temp = val as NumberVal;

    if(isint(temp.value)){
      return true;
    }
    else{
      
      return false;
    }
  }
  else{

    return false;
  }
}

function autoConvert(args : RuntimeVal[]) : RuntimeVal[]{

  let sorted : RuntimeVal[] = [];

  for(const arg of args){
    if(arg.type == "MemberExprVal"){
      let clean : RuntimeVal = arg;

      while(clean.type == "MemberExprVal"){
        clean = conv_memex_to_val(clean as MemberExprVal);
      }

      sorted.push(clean);
    }
    else{
      sorted.push(arg);
    }
  }

  return sorted;

}

export default class Environment {

  public parent?: Environment;
  public variables: Map<string, RuntimeVal>;
  public constants: Set<string>
  public outputLog : string[] = [];
  public context : string = "";


  

  constructor(context : string, parentENV?: Environment) {

    const global = parentENV ? true : false;
    this.parent = parentENV;
    this.variables = new Map();
    this.context = context;

    this.constants = new Set();


  }

  

  public declareVar(varname: string, value: RuntimeVal, isConstant : boolean, env : Environment,StackFrame : StackFrame[]): RuntimeVal {
    
    

    if (this.variables.has(varname) && !varname.endsWith('.txt')) {
      

      StackFrame.push({expr: varname, ln: value.ln, context: env.context})

      if(varname == "TRUE" || varname == "FALSE"){

        return makeError(`'${varname}' is a reserved keyword. Please try a different name!`, "Runtime", value.ln)

      }
      else{

        return makeError(`Cannot re-declare variable ${varname} as it already is defined.`, "Runtime", value.ln) ;

      }


      
    }
    
    this.variables.set(varname, value);

    if(isConstant){
        this.constants.add(varname);
    }


    return value;
  }

  public assignVar(varname: string, value: RuntimeVal, ln : number,  StackFrames : StackFrame[], callEnv : Environment): RuntimeVal {



    const env = this.resolve(varname,ln, StackFrames, callEnv);

    if(env.constants.has(varname)){


      return makeError(`Cannot assign to '${varname}' because it is a constant!`, "Type", ln, StackFrames) ;
    }

    env.variables.set(varname, value);
    return value;
  }

  public lookupVar(varname: string, ln : number, StackFrames : StackFrame[], callEnv : Environment): RuntimeVal {
    const env = this.resolve(varname, ln, StackFrames, callEnv);

    if(errorLog.length > 0){



      return MK_NULL();
    }

    const lookup = env.variables.get(varname) as RuntimeVal;


    return lookup;
  }

  public resolve(varname: string, ln: number, StackFrames : StackFrame[], env : Environment): Environment {

    
    if (this.variables.has(varname) && this !== undefined) {
      
      return this;
    }

    if (this.parent == undefined && !this.variables.has(varname)) {


      const names = Array.from(this.variables.keys());

      const suggestion = best_match(varname, names);

      
      const frame = {expr: varname, ln: ln, context: env.context};

      if(StackFrames[StackFrames.length - 1].ln != frame.ln){

        StackFrames.push(frame);

      }

      

      if(suggestion){

        makeError(`Cannot find name '${varname}'. Did you mean '${suggestion}'?`, "Name", ln, StackFrames);

      }
      else{

    
        makeError(`Cannot find name '${varname}'!`, "Name", ln, StackFrames) ;
      }

      
      

      
    }

    else if(this.parent !== undefined){
      
      return this.parent.resolve(varname, ln, StackFrames, env);
    }

    else{
      throw "Parent environment or environment itself is undefined!";
    }

    
  }
}



function RoundToPlaces(num : number, dP : number){
  return Math.round((num * (10 ** dP))) / (10 ** dP);

}