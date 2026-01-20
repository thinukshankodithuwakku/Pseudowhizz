import { makeError, commentLog } from "../Main.js";

let inF : boolean = false;

export enum Tokens {
    //Initialisers 
    Declare,  //0
    Constant,  //1



    //Variable reference
    Identifier,  //4

    //Operators
    BinaryOperator,
    UnaryOperator,  //5
    Assign,  //6
    Of,  //7

    //Relational operators
    Equals,  //8
    NotEquals,  //9
    Greater,  //10
    Less,  //11
    GreaterEquals,  //12
    LessEquals,  //13

    //Delimiters
    OpenSquareBracket,  //14
    CloseSquareBracket,  //15
    OpenBracket,  //16
    CloseBracket,  //17
    Colon,  //18
    Comma,  //19
    EOL,  //20
    EOF,  //21

    //DataTypes
    Real,  //22
    Integer,  //23
    Boolean,  //24
    Char,  //25
    Any,
    String,  //26
    Null,  //27

    //Selection
    If,  //28
    Then,  //29
    Else,
    Elseif,  //30
    Endif,  //31
    Case,  //32
    Endcase,  //33
    Otherwise,

    //Iteration
    For,  //34
    Endfor,  //35
    While,  //36
    Endwhile,  //37
    Repeat,  //38
    Next,
    To,
    Step,
    Until,
    Do,  //39

    //Literals
    StringLiteral,  //40
    NumericLiteral,  //41
    Array,

    //Methods
    Function,
    Endfunction,
    Procedure,
    Endprocedure,
    Returns,
    Return,
    Call,

    //Logical operators
    AND,
    OR,
    NOT,

    //Interface
    Output,
    Input,

    Comment,

    Openfile,
    Closefile,
    Readfile,
    Writefile,
    Read,
    Write,
    Filename,

    //Other
    Ampersand,
    Unrecognised,


}

const KEYWORDS: Record<string, Tokens> = {
    "DECLARE":Tokens.Declare,
    "CONSTANT":Tokens.Constant,

    "OF":Tokens.Of,

    "REAL":Tokens.Real,
    "INTEGER":Tokens.Integer,
    "BOOLEAN":Tokens.Boolean,
    "CHAR":Tokens.Char,

    "STRING":Tokens.String,


    "=":Tokens.Equals,
    "<>":Tokens.NotEquals,
    ">":Tokens.Greater,
    "<":Tokens.Less,
    ">=":Tokens.GreaterEquals,
    "<=":Tokens.LessEquals,

    "≥":Tokens.GreaterEquals,
    "≤":Tokens.LessEquals,

    ":":Tokens.Colon,
    ",":Tokens.Comma,
    "[":Tokens.OpenSquareBracket,
    "]":Tokens.CloseSquareBracket,
    "(":Tokens.OpenBracket,
    ")":Tokens.CloseBracket,

    "←":Tokens.Assign,
    "<--":Tokens.Assign,

    "IF":Tokens.If,
    "THEN":Tokens.Then,
    "ELSE":Tokens.Else,
    "ELSEIF":Tokens.Elseif,
    "ENDIF":Tokens.Endif,
    "CASE":Tokens.Case,
    "ENDCASE":Tokens.Endcase,

    "FOR":Tokens.For,
    "TO":Tokens.To,
    "ENDFOR":Tokens.Endfor,
    "WHILE":Tokens.While,
    "ENDWHILE":Tokens.Endwhile,
    "REPEAT":Tokens.Repeat,
    "NEXT":Tokens.Next,
    "OTHERWISE":Tokens.Otherwise,
    "STEP":Tokens.Step,
    "DO":Tokens.Do,

    "UNTIL":Tokens.Until,

    "ARRAY" : Tokens.Array,

    "FUNCTION":Tokens.Function,
    "ENDFUNCTION":Tokens.Endfunction,
    "RETURNS":Tokens.Returns,
    "RETURN":Tokens.Return,
    "PROCEDURE":Tokens.Procedure,
    "ENDPROCEDURE":Tokens.Endprocedure,
    "CALL":Tokens.Call,

    "AND":Tokens.BinaryOperator,
    "OR":Tokens.BinaryOperator,
    "NOT":Tokens.NOT,

    "OUTPUT":Tokens.Output,
    "INPUT":Tokens.Input,

    "OPENFILE":Tokens.Openfile,
    "CLOSEFILE":Tokens.Closefile,
    "READFILE":Tokens.Readfile,
    "WRITEFILE":Tokens.Writefile,
    "WRITE":Tokens.Write,
    "READ":Tokens.Read,

    '&':Tokens.Ampersand,
    '%':Tokens.Unrecognised,
    ';':Tokens.Unrecognised,


}

function splitWithSpaces(str) {
    return str.match(/\S+|\s+/g) || [];
}



function fileUseFilter(line : string): string {

    if(line.includes("WRITEFILE") || line.includes("READFILE")){
        const sentence = splitWithSpaces(line.trim());
        let newStr : string[] = [];


        let doubleQuotes : boolean = false;
        let singleQuotes : boolean = false;

        
        if(sentence[0]){

            

            while(sentence[0] && !sentence[0].endsWith('.txt,') && !sentence[0].endsWith('.txt')){
                if(sentence[0] == '"'){
                    doubleQuotes = !doubleQuotes;
                }
                else if(sentence[0] == "'"){
                    singleQuotes = !singleQuotes;
                }

                newStr.push(sentence.shift());

            }

            if(!doubleQuotes && !singleQuotes){
                newStr.push('(');
            }
            

            while(sentence.length > 0){
                if(sentence[0] == '"'){
                    doubleQuotes = !doubleQuotes;
                }
                else if(sentence[0] == "'"){
                    singleQuotes = !singleQuotes;
                }
                newStr.push(sentence.shift());
            }

            if(!doubleQuotes && !singleQuotes){
                newStr.push(')');
            }
        }
        else{
            return line;
        }


        

        return newStr.join('');
    }
    else{
        return line;
    }



}



function commentFilter(line : string, translating?:boolean): string {


    if(translating){
        return line;
    }
    else{
        const filtered = line;

        return filtered;


        let slashCounter = 0;
        let instances : number[] = [];

        let singleQuotes : boolean = false;
        let doubleQuotes : boolean = false;

        for(let i = 0; i < filtered.length - 1; i++){
            if(filtered[i] == '"'){
                doubleQuotes = !doubleQuotes;
            }
            else if(filtered[i] == "'"){
                singleQuotes = !singleQuotes;
            }

            if(filtered[i] == '/' && !doubleQuotes && !singleQuotes){
                slashCounter ++;
                instances.push(i);
            }
            if(slashCounter >= 2){

                const comment = filtered.substring(Math.min(...instances) + 2, filtered.length);




                commentLog.push(comment);

                return filtered.substring(0, Math.min(...instances))
            }
            

        }


        return filtered;
    }




}


function splitCodeAndComment(line) {
    const index = line.indexOf("//"); // find where '//' starts
    if (index === -1) {
        return [line, ""]; // no comment found
    }

    const before = line.slice(0, index).trimEnd(); // remove trailing spaces before comment
    const after = line.slice(index); // include '//' and everything after
    return [before, after];
}





export function line_reader(src : string): string[] {
    const split: string[] = src.split((/\r?\n/));

    return split;
}

function isAlpha(str: string): boolean {
  return /^[A-Za-z]+$/.test(str) || /[À-ÿ]/.test(str);
}




function isIdentifiable(str: string): boolean {
  return  str == '.' || str == "_" || isAlpha(str) || !isNaN(Number(str)) && str.trim() !== "";
}

export interface Token {
    value: string ;
    type: Tokens;
    typeName?: string;
    ln: number;
    col: number;

}

function isskippable(str: string) {
  return str == " ";
}



function adapter(sentence : string) : string{

    
    return commentFilter(sentence, false);
}




function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && str.trim() !== '';
}


const unaryTokens : Tokens[] = [Tokens.NOT, Tokens.AND, Tokens.OR, Tokens.OpenBracket, Tokens.OpenSquareBracket,Tokens.Step,Tokens.Output ,Tokens.Return ,Tokens.Until ,Tokens.While ,Tokens.If ,Tokens.Of, Tokens.Comma,Tokens.Assign, Tokens.Greater, Tokens.GreaterEquals, Tokens.Less, Tokens.LessEquals, Tokens.Equals, Tokens.NotEquals, Tokens.BinaryOperator, Tokens.UnaryOperator];



function unary_adapter(src : Token[]) : Token[] {



    let use : Token[] = [];

    for(const token of src){

        use.push(token)
    }

    return use;

}


export function identifier_valid(test : string, ln : number) : boolean {

    if(test.includes('_')){
        makeError("Identifier names should not use an underscore", "syntax", ln);

        return false;
    }
    else if(/[À-ÿ]/.test(test)){
        makeError("Identifier names should not use accented characters", "syntax", ln);

        return false;
    }
    else if(test.toLowerCase() == test.toUpperCase()){


        makeError("Identifier names should not use unrecognised characters", "syntax", ln);



        return false;

    }
    else{
        return true;
    }


    

}



    

    

export function tokenize_line(line : string, ln : number): Token[] {
    const adapted = adapter(line);
    const split_line = adapted.split('');

    let tokenList : Token[] = [];

    let col = 1;
    let char = -1;

    while(split_line.length > 0){
        
        let letter = split_line[0];
        char++;

        if(isskippable(letter)){
            split_line.shift(); //Skips unnecessary whitespace
        }
        else if(letter == '/'){


            const division = {
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator],
                value: split_line.shift(),
                ln: ln,
                col: col,

            } as Token;

            if(split_line[0] == '/'){

                split_line.shift();

                let s = "";

                while(split_line.length > 0){

                    s += split_line.shift();

                }


                tokenList.push({
                    type: Tokens.Comment,
                    value: s,
                    ln: ln,
                    col: col,
                })

            }
            else{

                tokenList.push(division);
            }

        }
        
        else if(letter == '.'){

            split_line.shift();



            if(split_line.length > 0 && isNumeric(split_line[0]) && split_line[0] !== ' '){

                let num = '';



                while(split_line.length > 0 && !isNaN(Number(split_line[0]))){
                    num += split_line.shift();

                    if(split_line[0] == '.'){
                        makeError(`Unexpected decimal point in numeric literal!`, "syntax", ln);
                        break;
                    }
                }

                num = '0.' + num;

                tokenList.push({
                    value: num,
                    type: Tokens.NumericLiteral,
                    typeName: Tokens[Tokens.NumericLiteral],
                    ln: ln,
                    col: col,
                });
            }
            else{

                makeError(`Expecting numeric literal following decimal point!`, "syntax", ln);


            }




        }

        else if(letter == '+' || letter == '-'){
            
            if(tokenList.length > 0){
                const rec = tokenList[tokenList.length - 1].type;
                if(unaryTokens.includes(rec)){
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.UnaryOperator,
                        typeName: Tokens[Tokens.UnaryOperator],
                        ln: ln,
                        col: col,
                    });
                }
                else{
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.BinaryOperator,
                        typeName: Tokens[Tokens.BinaryOperator],
                        ln: ln,
                        col: col,
                    });
                }
            }
            else{
                tokenList.push({
                    value: split_line.shift(),
                    type: Tokens.UnaryOperator,
                    typeName: Tokens[Tokens.UnaryOperator],
                    ln: ln,
                    col: col,
                });
            }

        }
        
        else if(letter == '*' || letter == '/' || letter == '^'){

            const op = split_line.shift();

            tokenList.push({
                value: op,
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator], 
                ln: ln,
                col: col,
            });

            if(split_line[0] == '*' && op == '*'){

                makeError("Unexpected token '*'. Did you mean to use the '^' operator? ", "syntax", ln);

            }



        }
        else if(letter == '>' || letter == '<'){
            let potentialComparitive = "";
            let assignToken = false;
            while(split_line.length > 0 && (split_line[0] == '-' || isComparitive(split_line[0]))){
                
                potentialComparitive += split_line.shift();

                if(potentialComparitive == '<--'){
                    assignToken = true;
                    tokenList.push({
                        value: '←',
                        type: Tokens.Assign,
                        ln: ln,
                        col: col,
                    })

                    break;

                }

            }

            if(!assignToken){
                tokenList.push({
                    value: potentialComparitive,
                    type: KEYWORDS[potentialComparitive],
                    typeName: Tokens[KEYWORDS[potentialComparitive]],
                    ln: ln,
                    col: col,
                })
            }
            

            
            
        }

        else if(letter in KEYWORDS){

            

            tokenList.push({
                value: split_line.shift(),
                type: KEYWORDS[letter],
                typeName: Tokens[KEYWORDS[letter]], //For existing keycharacters
                ln: ln,
                col: col,
            });
        }
        else if(isAlpha(letter)){
            let potentialWord = "";
            while (split_line.length > 0 && isIdentifiable(split_line[0])) {

                if(split_line[0] == '.'){
                    potentialWord += split_line.shift();

                    let filetype = "";

                    while(isAlpha(split_line[0]) && split_line.length > 0){


                        potentialWord += split_line.shift();
                        filetype += potentialWord[potentialWord.length - 1];
                    }

                    if(filetype != "txt" && filetype != "pseudo"){
                        makeError(`Unrecognised filetype '.${filetype}'!`, "type", ln);
                    }



                }
                else{
                    potentialWord += split_line.shift();
                }

                


                

            }



            if(potentialWord in KEYWORDS){

                if(KEYWORDS[potentialWord] == Tokens.Function){

                    inF = true;

                }
                else if(KEYWORDS[potentialWord] == Tokens.Endfunction){

                    inF = false;

                }
                

                tokenList.push({
                    value: potentialWord,
                    type: KEYWORDS[potentialWord],
                    typeName: Tokens[KEYWORDS[potentialWord]],  //If word is a keyword
                    ln: ln,
                    col: col,
                });
            }
            else if(potentialWord.startsWith('"') && potentialWord.endsWith('"')){

                const sliced = potentialWord.slice(1,-1);

                if(sliced.length == 1){
                    throw "Single-characters are delimited by single quotes";
                }
                else{
                    tokenList.push({
                        value: potentialWord.slice(1,-1),
                        type: Tokens.StringLiteral,
                        typeName: Tokens[Tokens.StringLiteral],
                        ln: ln,
                        col: col,
                    })
                }

                
            }
            else if(potentialWord.startsWith("'") && !potentialWord.endsWith("'")){
                const sliced = potentialWord.slice(1,-1);

                if(sliced.length > 1){
                    throw "Multi-character string literals are delimited by double quotes"
                }
                else{
                    tokenList.push({
                        value: sliced,
                        type: Tokens.StringLiteral,
                        typeName: Tokens[Tokens.StringLiteral],
                        ln: ln,
                        col: col,
                    })
                }
            }
            else if(potentialWord.endsWith('.txt') || potentialWord.endsWith('.pseudo')){
                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Filename,
                    typeName: Tokens[Tokens.Filename],  //If filename
                    ln: ln,
                    col: col,
                });
            }
            else {


                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Identifier,
                    typeName: Tokens[Tokens.Identifier],  //Otherwise identifier
                    ln: ln,
                    col: col,
                });



                

            }
        }
        else if(isNumeric(letter)){
            let potentialNumber = "";

            let dpCount = 0;

            while (split_line.length > 0 
                && (isNumeric(split_line[0]) 
                || split_line[0] === '.')) {

                if(split_line[0] === '.'){
                    dpCount++;
                }

                potentialNumber += split_line.shift();
            }

            if(dpCount > 1){
                makeError(`Unexpected decimal point in numeric literal!`, "syntax", ln);
            }
            else{
                tokenList.push({
                    value: potentialNumber,
                    type: Tokens.NumericLiteral,
                    typeName: Tokens[Tokens.NumericLiteral],  //Numeric literal
                    ln: ln,
                    col: col,
                })


            }




            
        }


        
        else if( letter == '"'){
            let potentialStringLiteral = split_line.shift(); 
            while( split_line.length > 0 && split_line[0] != '"'){ //String literals with ""
                potentialStringLiteral += split_line.shift();
            }

            if(split_line.length == 0){
                makeError(`Unterminated string literal!`, "syntax", ln);

            }
            else{
                split_line.shift();
                potentialStringLiteral += '"'; 
                tokenList.push({
                    value: potentialStringLiteral.slice(1,-1),
                    type: Tokens.StringLiteral,
                    typeName: Tokens[Tokens.StringLiteral], //String literal
                    ln: ln,
                    col: col,
                });
            }


        }
        else if( letter == "'"){
            let potentialStringLiteral = split_line.shift();  //String literals with ''
            while( split_line.length > 0 && split_line[0] != "'"){
                potentialStringLiteral += split_line.shift();
            }

            if(split_line.length == 0){
                makeError(`Unterminated string literal!`, "syntax", ln);

            }
            else{
                split_line.shift();


                potentialStringLiteral += "'"; 

                if(potentialStringLiteral.length != 3){

                    makeError(`Multicharacter string literals must be delimited by double quotes (" ")`, "syntax", ln);
                }

                tokenList.push({
                    value: potentialStringLiteral.slice(1,-1),
                    type: Tokens.StringLiteral,
                    typeName: Tokens[Tokens.StringLiteral], //String literal
                    ln: ln,
                    col: col,
                });
            }


        }

        else{


            tokenList.push({
                    value: split_line[0],
                    type: Tokens.Unrecognised,
                    ln: ln,
                    col: col,
                }); 

            tokenList = unary_adapter(tokenList);
            break;
        }

        tokenList = unary_adapter(tokenList);
        


    }



    for(let i = 1; i < tokenList.length - 1; i++){


        tokenList[i].col = i;

    }


    tokenList.push({
        value: "EOL",
        type: Tokens.EOL,
        typeName: Tokens[Tokens.EOL],
        ln: ln,
        col: col,
    })



    return tokenList;

    

}



export function tokenize(src : string): Token[] {


    
    const lines = line_reader(src);
    const tokenList: Token[] = [];

    let i = 1;

    for(const line of lines){

        let lineTokens = tokenize_line(line, i);



        

        
        if(line.trim() === ""){

            lineTokens = [{type: Tokens.Comment, value: ""} as Token];
            //If this causes issues later on, replace with continue;
            
        } 
        tokenList.push(...lineTokens);

        i++;

        
    }

    i--;

    tokenList.push({
        value: "EOF",
        type: Tokens.EOF,
        typeName: Tokens[Tokens.EOF],
        ln: i,
        col: 1,
    });




  return tokenList;
}

function isComparitive(str : string) : boolean{
    return str == '=' || str == '<' || str == '>' || str == '<=' || str == '>='; 
}




