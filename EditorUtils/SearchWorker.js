//import { tokenize, tokenize_line } from "../Frontend/Lexer.js";
export var Tokens;
(function (Tokens) {
    //Initialisers 
    Tokens[Tokens["Declare"] = 0] = "Declare";
    Tokens[Tokens["Constant"] = 1] = "Constant";
    //Variable reference
    Tokens[Tokens["Identifier"] = 2] = "Identifier";
    //Operators
    Tokens[Tokens["BinaryOperator"] = 3] = "BinaryOperator";
    Tokens[Tokens["UnaryOperator"] = 4] = "UnaryOperator";
    Tokens[Tokens["Assign"] = 5] = "Assign";
    Tokens[Tokens["Of"] = 6] = "Of";
    //Relational operators
    Tokens[Tokens["Equals"] = 7] = "Equals";
    Tokens[Tokens["NotEquals"] = 8] = "NotEquals";
    Tokens[Tokens["Greater"] = 9] = "Greater";
    Tokens[Tokens["Less"] = 10] = "Less";
    Tokens[Tokens["GreaterEquals"] = 11] = "GreaterEquals";
    Tokens[Tokens["LessEquals"] = 12] = "LessEquals";
    //Delimiters
    Tokens[Tokens["OpenSquareBracket"] = 13] = "OpenSquareBracket";
    Tokens[Tokens["CloseSquareBracket"] = 14] = "CloseSquareBracket";
    Tokens[Tokens["OpenBracket"] = 15] = "OpenBracket";
    Tokens[Tokens["CloseBracket"] = 16] = "CloseBracket";
    Tokens[Tokens["Colon"] = 17] = "Colon";
    Tokens[Tokens["Comma"] = 18] = "Comma";
    Tokens[Tokens["EOL"] = 19] = "EOL";
    Tokens[Tokens["EOF"] = 20] = "EOF";
    //DataTypes
    Tokens[Tokens["Real"] = 21] = "Real";
    Tokens[Tokens["Integer"] = 22] = "Integer";
    Tokens[Tokens["Boolean"] = 23] = "Boolean";
    Tokens[Tokens["Char"] = 24] = "Char";
    Tokens[Tokens["Any"] = 25] = "Any";
    Tokens[Tokens["String"] = 26] = "String";
    Tokens[Tokens["Null"] = 27] = "Null";
    //Selection
    Tokens[Tokens["If"] = 28] = "If";
    Tokens[Tokens["Then"] = 29] = "Then";
    Tokens[Tokens["Else"] = 30] = "Else";
    Tokens[Tokens["Elseif"] = 31] = "Elseif";
    Tokens[Tokens["Endif"] = 32] = "Endif";
    Tokens[Tokens["Case"] = 33] = "Case";
    Tokens[Tokens["Endcase"] = 34] = "Endcase";
    Tokens[Tokens["Otherwise"] = 35] = "Otherwise";
    //Iteration
    Tokens[Tokens["For"] = 36] = "For";
    Tokens[Tokens["Endfor"] = 37] = "Endfor";
    Tokens[Tokens["While"] = 38] = "While";
    Tokens[Tokens["Endwhile"] = 39] = "Endwhile";
    Tokens[Tokens["Repeat"] = 40] = "Repeat";
    Tokens[Tokens["Next"] = 41] = "Next";
    Tokens[Tokens["To"] = 42] = "To";
    Tokens[Tokens["Step"] = 43] = "Step";
    Tokens[Tokens["Until"] = 44] = "Until";
    Tokens[Tokens["Do"] = 45] = "Do";
    //Literals
    Tokens[Tokens["StringLiteral"] = 46] = "StringLiteral";
    Tokens[Tokens["NumericLiteral"] = 47] = "NumericLiteral";
    Tokens[Tokens["Array"] = 48] = "Array";
    //Methods
    Tokens[Tokens["Function"] = 49] = "Function";
    Tokens[Tokens["Endfunction"] = 50] = "Endfunction";
    Tokens[Tokens["Procedure"] = 51] = "Procedure";
    Tokens[Tokens["Endprocedure"] = 52] = "Endprocedure";
    Tokens[Tokens["Returns"] = 53] = "Returns";
    Tokens[Tokens["Return"] = 54] = "Return";
    Tokens[Tokens["Call"] = 55] = "Call";
    //Logical operators
    Tokens[Tokens["AND"] = 56] = "AND";
    Tokens[Tokens["OR"] = 57] = "OR";
    Tokens[Tokens["NOT"] = 58] = "NOT";
    //Interface
    Tokens[Tokens["Output"] = 59] = "Output";
    Tokens[Tokens["Input"] = 60] = "Input";
    Tokens[Tokens["Comment"] = 61] = "Comment";
    Tokens[Tokens["Openfile"] = 62] = "Openfile";
    Tokens[Tokens["Closefile"] = 63] = "Closefile";
    Tokens[Tokens["Readfile"] = 64] = "Readfile";
    Tokens[Tokens["Writefile"] = 65] = "Writefile";
    Tokens[Tokens["Read"] = 66] = "Read";
    Tokens[Tokens["Write"] = 67] = "Write";
    Tokens[Tokens["Filename"] = 68] = "Filename";
    //Other
    Tokens[Tokens["Ampersand"] = 69] = "Ampersand";
    Tokens[Tokens["Unrecognised"] = 70] = "Unrecognised";
})(Tokens || (Tokens = {}));
const KEYWORDS = {
    "DECLARE": Tokens.Declare,
    "CONSTANT": Tokens.Constant,
    "OF": Tokens.Of,
    "REAL": Tokens.Real,
    "INTEGER": Tokens.Integer,
    "BOOLEAN": Tokens.Boolean,
    "CHAR": Tokens.Char,
    "STRING": Tokens.String,
    "=": Tokens.Equals,
    "<>": Tokens.NotEquals,
    ">": Tokens.Greater,
    "<": Tokens.Less,
    ">=": Tokens.GreaterEquals,
    "<=": Tokens.LessEquals,
    "≥": Tokens.GreaterEquals,
    "≤": Tokens.LessEquals,
    ":": Tokens.Colon,
    ",": Tokens.Comma,
    "[": Tokens.OpenSquareBracket,
    "]": Tokens.CloseSquareBracket,
    "(": Tokens.OpenBracket,
    ")": Tokens.CloseBracket,
    "←": Tokens.Assign,
    "<--": Tokens.Assign,
    "IF": Tokens.If,
    "THEN": Tokens.Then,
    "ELSE": Tokens.Else,
    "ELSEIF": Tokens.Elseif,
    "ENDIF": Tokens.Endif,
    "CASE": Tokens.Case,
    "ENDCASE": Tokens.Endcase,
    "FOR": Tokens.For,
    "TO": Tokens.To,
    "ENDFOR": Tokens.Endfor,
    "WHILE": Tokens.While,
    "ENDWHILE": Tokens.Endwhile,
    "REPEAT": Tokens.Repeat,
    "NEXT": Tokens.Next,
    "OTHERWISE": Tokens.Otherwise,
    "STEP": Tokens.Step,
    "DO": Tokens.Do,
    "UNTIL": Tokens.Until,
    "ARRAY": Tokens.Array,
    "FUNCTION": Tokens.Function,
    "ENDFUNCTION": Tokens.Endfunction,
    "RETURNS": Tokens.Returns,
    "RETURN": Tokens.Return,
    "PROCEDURE": Tokens.Procedure,
    "ENDPROCEDURE": Tokens.Endprocedure,
    "CALL": Tokens.Call,
    "AND": Tokens.BinaryOperator,
    "OR": Tokens.BinaryOperator,
    "NOT": Tokens.NOT,
    "OUTPUT": Tokens.Output,
    "INPUT": Tokens.Input,
    "OPENFILE": Tokens.Openfile,
    "CLOSEFILE": Tokens.Closefile,
    "READFILE": Tokens.Readfile,
    "WRITEFILE": Tokens.Writefile,
    "WRITE": Tokens.Write,
    "READ": Tokens.Read,
    '&': Tokens.Ampersand,
    '%': Tokens.Unrecognised,
    ';': Tokens.Unrecognised,
};
function isskippable(str) {
    return str == " " || str == '\n' || str == '\t';
}
function isNumeric(str) {
    return !isNaN(Number(str)) && str.trim() !== '';
}
export function line_reader(src) {
    const split = src.split((/\r?\n/));
    return split;
}
function isIdentifiable(str) {
    return str == '.' || str == "_" || isAlpha(str) || !isNaN(Number(str)) && str.trim() !== "";
}
function isAlpha(str) {
    return /^[A-Za-z]+$/.test(str) || /[À-ÿ]/.test(str);
}
function isComparitive(str) {
    return str == '=' || str == '<' || str == '>' || str == '<=' || str == '>=';
}
export function tokenize_line(line, ln) {
    const adapted = line;
    const split_line = adapted.split('');
    let tokenList = [];
    let col = 1;
    let char = -1;
    while (split_line.length > 0) {
        let letter = split_line[0];
        char++;
        if (isskippable(letter)) {
            split_line.shift(); //Skips unnecessary whitespace
        }
        else if (letter == '/') {
            const division = {
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator],
                value: split_line.shift(),
                ln: ln,
                col: col,
            };
            if (split_line[0] == '/') {
                split_line.shift();
                let s = "";
                while (split_line.length > 0) {
                    s += split_line.shift();
                }
                tokenList.push({
                    type: Tokens.Comment,
                    value: s,
                    ln: ln,
                    col: col,
                });
            }
            else {
                tokenList.push(division);
            }
        }
        else if (letter == '.') {
            split_line.shift();
            if (split_line.length > 0 && isNumeric(split_line[0]) && split_line[0] !== ' ') {
                let num = '';
                while (split_line.length > 0 && !isNaN(Number(split_line[0]))) {
                    num += split_line.shift();
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
        }
        else if (letter == '+' || letter == '-') {
            if (tokenList.length > 0) {
                tokenList.push({
                    value: split_line.shift(),
                    type: Tokens.BinaryOperator,
                    typeName: Tokens[Tokens.BinaryOperator],
                    ln: ln,
                    col: col,
                });
            }
            else {
                tokenList.push({
                    value: split_line.shift(),
                    type: Tokens.UnaryOperator,
                    typeName: Tokens[Tokens.UnaryOperator],
                    ln: ln,
                    col: col,
                });
            }
        }
        else if (letter == '*' || letter == '/' || letter == '^') {
            const op = split_line.shift();
            tokenList.push({
                value: op,
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator],
                ln: ln,
                col: col,
            });
        }
        else if (letter == '>' || letter == '<') {
            let potentialComparitive = "";
            let assignToken = false;
            while (split_line.length > 0 && (split_line[0] == '-' || isComparitive(split_line[0]))) {
                potentialComparitive += split_line.shift();
                if (potentialComparitive == '<--') {
                    assignToken = true;
                    tokenList.push({
                        value: '←',
                        type: Tokens.Assign,
                        ln: ln,
                        col: col,
                    });
                    break;
                }
            }
            if (!assignToken) {
                tokenList.push({
                    value: potentialComparitive,
                    type: KEYWORDS[potentialComparitive],
                    typeName: Tokens[KEYWORDS[potentialComparitive]],
                    ln: ln,
                    col: col,
                });
            }
        }
        else if (letter in KEYWORDS) {
            tokenList.push({
                value: split_line.shift(),
                type: KEYWORDS[letter],
                typeName: Tokens[KEYWORDS[letter]], //For existing keycharacters
                ln: ln,
                col: col,
            });
        }
        else if (isAlpha(letter)) {
            let potentialWord = "";
            while (split_line.length > 0 && isIdentifiable(split_line[0])) {
                if (split_line[0] == '.') {
                    potentialWord += split_line.shift();
                    let filetype = "";
                    while (isAlpha(split_line[0]) && split_line.length > 0) {
                        potentialWord += split_line.shift();
                        filetype += potentialWord[potentialWord.length - 1];
                    }
                    if (filetype != "txt" && filetype != "pseudo") {
                    }
                }
                else {
                    potentialWord += split_line.shift();
                }
            }
            if (potentialWord in KEYWORDS) {
                tokenList.push({
                    value: potentialWord,
                    type: KEYWORDS[potentialWord],
                    typeName: Tokens[KEYWORDS[potentialWord]], //If word is a keyword
                    ln: ln,
                    col: col,
                });
            }
            else if (potentialWord.startsWith('"') && potentialWord.endsWith('"')) {
                const sliced = potentialWord.slice(1, -1);
                if (sliced.length == 1) {
                    throw "Single-characters are delimited by single quotes";
                }
                else {
                    tokenList.push({
                        value: potentialWord.slice(1, -1),
                        type: Tokens.StringLiteral,
                        typeName: Tokens[Tokens.StringLiteral],
                        ln: ln,
                        col: col,
                    });
                }
            }
            else if (potentialWord.startsWith("'") && !potentialWord.endsWith("'")) {
                const sliced = potentialWord.slice(1, -1);
                if (sliced.length > 1) {
                    throw "Multi-character string literals are delimited by double quotes";
                }
                else {
                    tokenList.push({
                        value: sliced,
                        type: Tokens.StringLiteral,
                        typeName: Tokens[Tokens.StringLiteral],
                        ln: ln,
                        col: col,
                    });
                }
            }
            else if (potentialWord.endsWith('.txt') || potentialWord.endsWith('.pseudo')) {
                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Filename,
                    typeName: Tokens[Tokens.Filename], //If filename
                    ln: ln,
                    col: col,
                });
            }
            else {
                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Identifier,
                    typeName: Tokens[Tokens.Identifier], //Otherwise identifier
                    ln: ln,
                    col: col,
                });
            }
        }
        else if (isNumeric(letter)) {
            let potentialNumber = "";
            let dpCount = 0;
            while (split_line.length > 0
                && (isNumeric(split_line[0])
                    || split_line[0] === '.')) {
                if (split_line[0] === '.') {
                    dpCount++;
                }
                potentialNumber += split_line.shift();
            }
            if (dpCount > 1) {
            }
            else {
                tokenList.push({
                    value: potentialNumber,
                    type: Tokens.NumericLiteral,
                    typeName: Tokens[Tokens.NumericLiteral], //Numeric literal
                    ln: ln,
                    col: col,
                });
            }
        }
        else if (letter == '"') {
            let potentialStringLiteral = split_line.shift();
            while (split_line.length > 0 && split_line[0] != '"') { //String literals with ""
                if (split_line[0] == '\\') {
                    split_line.shift();
                    if (split_line[0] == 'n')
                        potentialStringLiteral += '\\n';
                    else if (split_line[0] == 't')
                        potentialStringLiteral += '\\t';
                    split_line.shift();
                }
                else
                    potentialStringLiteral += split_line.shift();
            }
            if (split_line.length == 0) {
            }
            else {
                split_line.shift();
                potentialStringLiteral += '"';
                tokenList.push({
                    value: potentialStringLiteral.slice(1, -1),
                    type: Tokens.StringLiteral,
                    typeName: Tokens[Tokens.StringLiteral], //String literal
                    ln: ln,
                    col: col,
                });
            }
        }
        else if (letter == "'") {
            let potentialStringLiteral = split_line.shift(); //String literals with ''
            while (split_line.length > 0 && split_line[0] != "'") {
                potentialStringLiteral += split_line.shift();
            }
            if (split_line.length == 0) {
            }
            else {
                split_line.shift();
                potentialStringLiteral += "'";
                tokenList.push({
                    value: potentialStringLiteral.slice(1, -1),
                    type: Tokens.StringLiteral,
                    typeName: Tokens[Tokens.StringLiteral], //String literal
                    ln: ln,
                    col: col,
                });
            }
        }
        else {
            tokenList.push({
                value: split_line[0],
                type: Tokens.Unrecognised,
                ln: ln,
                col: col,
            });
            break;
        }
    }
    for (let i = 1; i < tokenList.length - 1; i++) {
        tokenList[i].col = i;
    }
    tokenList.push({
        value: "EOL",
        type: Tokens.EOL,
        typeName: Tokens[Tokens.EOL],
        ln: ln,
        col: col,
    });
    return tokenList;
}
export function tokenize(src) {
    const lines = line_reader(src);
    const tokenList = [];
    let i = 1;
    for (const line of lines) {
        let lineTokens = tokenize_line(line, i);
        if (line.trim() === "") {
            lineTokens = [{ type: Tokens.Comment, value: "" }];
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
function search(src, request) {
    const src_tokens = tokenize(src);
    const req_tokens = tokenize_line(request, 0);
    req_tokens.pop();
    let res = false;
    let ln = null;
    let ch = null;
    for (let i = 0; i <= src_tokens.length - req_tokens.length; i++) {
        let match = true;
        for (let j = 0; j < req_tokens.length; j++) {
            if (src_tokens[i + j].type != req_tokens[j].type || src_tokens[i + j].value != req_tokens[j].value || src_tokens[i + j].value.length != req_tokens[j].value.length) {
                match = false;
                ch = j;
                break;
            }
        }
        if (match) {
            res = true;
            ln = src_tokens[i + ch].ln - 1;
            break;
        }
    }
    return { match: res, ln: ln };
}
function findArrayPrim(codeVal, read) {
    if (search(codeVal, `DECLARE ${read} : ARRAY`).match) {
        let i = 0;
        const tkns = tokenize(codeVal);
        while (i < tkns.length - 3) {
            if (tkns[i].type == Tokens.Declare && tkns[i + 1].type == Tokens.Identifier && tkns[i + 1].value == read && tkns[i + 2].type == Tokens.Colon && tkns[i + 3].type == Tokens.Array) {
                break;
            }
            i++;
        }
        i += 3;
        const data_types = [Tokens.Integer, Tokens.Real, Tokens.Boolean, Tokens.String, Tokens.Char];
        while (!data_types.includes(tkns[i].type) && tkns[i].type != Tokens.EOL && i < tkns.length)
            i++;
        return data_types.includes(tkns[i].type) ? tkns[i].value : "none";
    }
    else
        return "none";
}
function tick(src, names) {
    const profile = [...names].map(name => {
        if (search(src, `DECLARE ${name} : INTEGER`).match)
            return { name: name, type: "variable", datatype: "INTEGER" };
        else if (search(src, `DECLARE ${name} : REAL`).match)
            return { name: name, type: "variable", datatype: "REAL" };
        else if (search(src, `DECLARE ${name} : BOOLEAN`).match)
            return { name: name, type: "variable", datatype: "BOOLEAN" };
        else if (search(src, `DECLARE ${name} : STRING`).match)
            return { name: name, type: "variable", datatype: "STRING" };
        else if (search(src, `DECLARE ${name} : CHAR`).match)
            return { name: name, type: "variable", datatype: "CHAR" };
        else if (search(src, `DECLARE ${name} : ARRAY`).match)
            return { name: name, type: "variable", datatype: "ARRAY OF " + findArrayPrim(src, name) };
        else if (search(src, `FUNCTION ${name} (`).match)
            return { name: name, type: "userFn", datatype: "FUNCTION", ln: search(src, `FUNCTION ${name} (`).ln };
        else if (search(src, `FOR ${name} ←`).match)
            return { name: name, type: "variable", datatype: "REAL" };
        else if (search(src, `PROCEDURE ${name} (`).match)
            return { name: name, type: "userFn", datatype: "PROCEDURE", ln: search(src, `PROCEDURE ${name} (`).ln };
        else if (search(src, `CONSTANT ${name} ←`).match)
            return { name: name, type: "constant" };
        else
            return { name: name, type: "none" };
    });
    return profile;
}
self.onmessage = function (e) {
    const res = tick(e.data.src, e.data.names);
    self.postMessage(res);
};
//Name handling
/*keywordList = [...native_keywords, ...vars, ...methods, ...constants, ...procedures];
                        
const codeVal = editor.getValue();

let mtd_dcl = null;

for(const fn of methods){

    

    if(!search(codeVal, `FUNCTION ${fn} (`).match)  ns.refresh("functions", fn);
    else { mtd_dcl = search(codeVal, `FUNCTION ${fn} (`).ln;}

    if(mtd_dcl != null) save_user_fn(editor.getLine(mtd_dcl));

}



for(const p of procedures){
    if(!search(codeVal, `PROCEDURE ${p} (`).match) ns.refresh("procedures", p);
    else mtd_dcl = search(codeVal, `PROCEDURE ${p} (`).ln;

    if(mtd_dcl != null) save_user_fn(editor.getLine(mtd_dcl));
}

for(const c of constants){

    if(!search(codeVal, `CONSTANT ${c} ←`).match){

        constTypeMap.delete(c);
        //constants = constants.filter(i => i != c);
        ns.refresh("constants", c);
    }

}


for(const v of vars){

    if(!search(codeVal, `DECLARE ${v} : INTEGER`).match
    && !search(codeVal, `DECLARE ${v} : REAL`).match
    && !search(codeVal, `DECLARE ${v} : BOOLEAN`).match
    && !search(codeVal, `DECLARE ${v} : STRING`).match
    && !search(codeVal, `DECLARE ${v} : CHAR`).match
    && findArrayPrim(codeVal, v) == "none"){

        vars = vars.filter(i => i != v);
        varTypeMap.delete(v);

    }
    

}

if (word) {
    
    const raw = JSON.stringify(word);


    let type = "variable";

    

    const is_fn = search(codeVal, `FUNCTION ${read} (`).match;
    

    const is_prcdr = search(codeVal, `PROCEDURE ${read} (`).match;
    

    const is_const = search(codeVal, `CONSTANT ${read} ←`).match;

    const is_var = search(codeVal, `DECLARE ${read} : INTEGER`).match
    || search(codeVal, `DECLARE ${read} : REAL`).match
    || search(codeVal, `DECLARE ${read} : BOOLEAN`).match
    || search(codeVal, `DECLARE ${read} : STRING`).match
    || search(codeVal, `DECLARE ${read} : CHAR`).match
    || findArrayPrim(codeVal, read) != "none";

    const is_file = codeVal.includes(`OPENFILE ${read}.txt FOR READ`) || codeVal.includes(`OPENFILE ${read}.txt FOR WRITE`)

    if(is_fn && !methods.includes(read)){
        methods.push(read);

    }

    else if(is_prcdr && !procedures.includes(read)) procedures.push(read);

    else if(is_const && !constants.includes(read)) constants.push(read);
    
    else if(is_var && !vars.includes(read)){



        vars.push(read);

        if(search(codeVal, `DECLARE ${read} : INTEGER`).match) varTypeMap.set(read, 'INTEGER');
        else if(search(codeVal, `DECLARE ${read} : REAL`).match) varTypeMap.set(read, 'REAL');
        else if(search(codeVal, `DECLARE ${read} : BOOLEAN`).match) varTypeMap.set(read, 'BOOLEAN');
        else if(search(codeVal, `DECLARE ${read} : STRING`).match) varTypeMap.set(read, 'STRING');
        else if(search(codeVal, `DECLARE ${read} : CHAR`).match) varTypeMap.set(read, 'CHAR');
        else if(findArrayPrim(codeVal, read) != "none") varTypeMap.set(read, 'ARRAY OF ' + findArrayPrim(codeVal, read));

    }

    if( methods.includes(read) || procedures.includes(read)) type = "userFn";

    
    else if(constants.includes(read))  type = "constant";
    

    prev_token = read;
    
    return type;

    
}

*/ 
