import { makeError } from "../Main.js";

export enum Tokens {
    //Initialisers 
    Declare,  //0
    Constant,  //1



    //Variable reference
    Identifier,  //4

    //Manipulators
    BinaryOperator,
    UnaryOperator,  //5
    Assign,  //6
    Of,  //7

    //Verifiers
    Equals,  //8
    NotEquals,  //9
    Greater,  //10
    Less,  //11
    GreaterEquals,  //12
    LessEquals,  //13

    //Containment
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

    //Conditionals
    If,  //28
    Then,  //29
    Else,
    Elseif,  //30
    Endif,  //31
    Case,  //32
    Endcase,  //33
    Otherwise,

    //Loops
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

    //Functions & Procedures
    Function,
    Endfunction,
    Procedure,
    Endprocedure,
    Returns,
    Return,
    Call,

    //Logic operators
    AND,
    OR,
    NOT,

    //User
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

    Ampersand,

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



function commentFilter(line : string): string {

    const filtered = fileUseFilter(line);


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
            return filtered.substring(0, Math.min(...instances))
        }
        

    }


    return filtered;


}





export function line_reader(src : string): string[] {
    const split: string[] = src.split((/\r?\n/));

    return split;
}

function isAlpha(str: string): boolean {
  return /^[A-Za-z]+$/.test(str) || /[À-ÿ]/.test(str);
}




function isIdentifiable(str: string): boolean {
  return  str=='.' || str == "_" || isAlpha(str) || !isNaN(Number(str)) && str.trim() !== "";
}

export interface Token {
    value: string ;
    type: Tokens;
    typeName?: string;
    ln: number;
    col: number;
}

function isskippable(str: string) {
  return str == " " || str == "\n" || str == "\t";
}



function adapter(sentence : string) : string{

    
    return commentFilter(sentence);
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


export function identifier_valid(test : string) : boolean {

    if(test.includes('_')){
        makeError("Identifier names should not use an underscore", "syntax");

        return false;
    }
    else if(/[À-ÿ]/.test(test)){
        makeError("Identifier names should not use accented characters", "syntax");

        return false;
    }
    else if(test.toLowerCase() == test.toUpperCase()){


        makeError("Identifier names should not use unrecognised characters", "syntax");



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


    while(split_line.length > 0){
        
        let letter = split_line[0];

        if(isskippable(letter)){
            split_line.shift(); //Skips unnecessary whitespace
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
            tokenList.push({
                value: split_line.shift(),
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator], 
                ln: ln,
                col: col,
            });


        }
        else if(letter == '>' || letter == '<'){
            let potentialComparitive = "";
            while(split_line.length > 0 && isComparitive(split_line[0])){
                
                potentialComparitive += split_line.shift();
            }

            
            tokenList.push({
                value: potentialComparitive,
                type: KEYWORDS[potentialComparitive],
                typeName: Tokens[KEYWORDS[potentialComparitive]],
                ln: ln,
                col: col,
            })
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
                potentialWord += split_line.shift();
            }

            if(potentialWord in KEYWORDS){
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
                    throw "Single-characters are delimited by singe quotes";
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
                    typeName: Tokens[Tokens.Filename],  //Otherwise identifier
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
        else if(!isNaN(Number(letter))){
            let potentialNumber = "";
            while (split_line.length > 0 
                && (!isNaN(Number(split_line[0])) 
                || split_line[0] === '.')) {
                potentialNumber += split_line.shift();
            }

            tokenList.push({
                value: potentialNumber,
                type: Tokens.NumericLiteral,
                typeName: Tokens[Tokens.NumericLiteral],  //Numeric literal
                ln: ln,
                col: col,
            })
            
        }
        
        else if( letter == '"'){
            let potentialStringLiteral = split_line.shift(); 
            while( split_line.length > 0 && split_line[0] != '"'){ //String literals with ""
                potentialStringLiteral += split_line.shift();
            }

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
        else if( letter == "'"){
            let potentialStringLiteral = split_line.shift();  //String literals with ''
            while( split_line.length > 0 && split_line[0] != "'"){
                potentialStringLiteral += split_line.shift();
            }

            split_line.shift();
            potentialStringLiteral += "'"; 

            if(potentialStringLiteral.length != 3){

                makeError('Multicharacter string literals must be delimited by double quotes (" ") ', "syntax");
            }

            tokenList.push({
                value: potentialStringLiteral.slice(1,-1),
                type: Tokens.StringLiteral,
                typeName: Tokens[Tokens.StringLiteral], //String literal
                ln: ln,
                col: col,
            });
        }

        else{
            throw "Unrecognised character: " + letter; //Unrecognised
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

        const lineTokens = tokenize_line(line, i);



        

        
        if(line.trim() === "") continue;
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




