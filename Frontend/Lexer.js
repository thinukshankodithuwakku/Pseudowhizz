import { makeError, commentLog } from "../Main.js";
let inF = false;
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
function splitWithSpaces(str) {
    return str.match(/\S+|\s+/g) || [];
}
function fileUseFilter(line) {
    if (line.includes("WRITEFILE") || line.includes("READFILE")) {
        const sentence = splitWithSpaces(line.trim());
        let newStr = [];
        let doubleQuotes = false;
        let singleQuotes = false;
        if (sentence[0]) {
            while (sentence[0] && !sentence[0].endsWith('.txt,') && !sentence[0].endsWith('.txt')) {
                if (sentence[0] == '"') {
                    doubleQuotes = !doubleQuotes;
                }
                else if (sentence[0] == "'") {
                    singleQuotes = !singleQuotes;
                }
                newStr.push(sentence.shift());
            }
            if (!doubleQuotes && !singleQuotes) {
                newStr.push('(');
            }
            while (sentence.length > 0) {
                if (sentence[0] == '"') {
                    doubleQuotes = !doubleQuotes;
                }
                else if (sentence[0] == "'") {
                    singleQuotes = !singleQuotes;
                }
                newStr.push(sentence.shift());
            }
            if (!doubleQuotes && !singleQuotes) {
                newStr.push(')');
            }
        }
        else {
            return line;
        }
        return newStr.join('');
    }
    else {
        return line;
    }
}
function commentFilter(line, translating) {
    if (translating) {
        return line;
    }
    else {
        const filtered = line;
        return filtered;
        let slashCounter = 0;
        let instances = [];
        let singleQuotes = false;
        let doubleQuotes = false;
        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] == '"') {
                doubleQuotes = !doubleQuotes;
            }
            else if (filtered[i] == "'") {
                singleQuotes = !singleQuotes;
            }
            if (filtered[i] == '/' && !doubleQuotes && !singleQuotes) {
                slashCounter++;
                instances.push(i);
            }
            if (slashCounter >= 2) {
                const comment = filtered.substring(Math.min(...instances) + 2, filtered.length);
                commentLog.push(comment);
                return filtered.substring(0, Math.min(...instances));
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
export function line_reader(src) {
    const split = src.split((/\r?\n/));
    return split;
}
function isAlpha(str) {
    return /^[A-Za-z]+$/.test(str) || /[À-ÿ]/.test(str);
}
function isIdentifiable(str) {
    return str == '.' || str == "_" || isAlpha(str) || !isNaN(Number(str)) && str.trim() !== "";
}
function isskippable(str) {
    return str == " " || str == "\n" || str == "\t";
}
function adapter(sentence) {
    return commentFilter(sentence, false);
}
function isNumeric(str) {
    return !isNaN(Number(str)) && str.trim() !== '';
}
const unaryTokens = [Tokens.NOT, Tokens.AND, Tokens.OR, Tokens.OpenBracket, Tokens.OpenSquareBracket, Tokens.Step, Tokens.Output, Tokens.Return, Tokens.Until, Tokens.While, Tokens.If, Tokens.Of, Tokens.Comma, Tokens.Assign, Tokens.Greater, Tokens.GreaterEquals, Tokens.Less, Tokens.LessEquals, Tokens.Equals, Tokens.NotEquals, Tokens.BinaryOperator, Tokens.UnaryOperator];
function unary_adapter(src) {
    let use = [];
    for (const token of src) {
        use.push(token);
    }
    return use;
}
export function identifier_valid(test, ln) {
    if (test.includes('_')) {
        makeError("Identifier names should not use an underscore", "syntax", ln);
        return false;
    }
    else if (/[À-ÿ]/.test(test)) {
        makeError("Identifier names should not use accented characters", "syntax", ln);
        return false;
    }
    else if (test.toLowerCase() == test.toUpperCase()) {
        makeError("Identifier names should not use unrecognised characters", "syntax", ln);
        return false;
    }
    else {
        return true;
    }
}
export function tokenize_line(line, ln) {
    const adapted = adapter(line);
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
                    if (split_line[0] == '.') {
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
            else {
                makeError(`Expecting numeric literal following decimal point!`, "syntax", ln);
            }
        }
        else if (letter == '+' || letter == '-') {
            if (tokenList.length > 0) {
                const rec = tokenList[tokenList.length - 1].type;
                if (unaryTokens.includes(rec)) {
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.UnaryOperator,
                        typeName: Tokens[Tokens.UnaryOperator],
                        ln: ln,
                        col: col,
                    });
                }
                else {
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.BinaryOperator,
                        typeName: Tokens[Tokens.BinaryOperator],
                        ln: ln,
                        col: col,
                    });
                }
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
            if (split_line[0] == '*' && op == '*') {
                makeError("Unexpected token '*'. Did you mean to use the '^' operator? ", "syntax", ln);
            }
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
                        makeError(`Unrecognised filetype '.${filetype}'!`, "type", ln);
                    }
                }
                else {
                    potentialWord += split_line.shift();
                }
            }
            if (potentialWord in KEYWORDS) {
                if (KEYWORDS[potentialWord] == Tokens.Function) {
                    inF = true;
                }
                else if (KEYWORDS[potentialWord] == Tokens.Endfunction) {
                    inF = false;
                }
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
                makeError(`Unexpected decimal point in numeric literal!`, "syntax", ln);
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
                potentialStringLiteral += split_line.shift();
            }
            if (split_line.length == 0) {
                makeError(`Unterminated string literal!`, "syntax", ln);
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
                makeError(`Unterminated string literal!`, "syntax", ln);
            }
            else {
                split_line.shift();
                potentialStringLiteral += "'";
                if (potentialStringLiteral.length != 3) {
                    makeError(`Multicharacter string literals must be delimited by double quotes (" ")`, "syntax", ln);
                }
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
            tokenList = unary_adapter(tokenList);
            break;
        }
        tokenList = unary_adapter(tokenList);
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
function isComparitive(str) {
    return str == '=' || str == '<' || str == '>' || str == '<=' || str == '>=';
}
