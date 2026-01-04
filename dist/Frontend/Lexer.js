import { makeError } from "../Main.js";
export var Tokens;
(function (Tokens) {
    //Initialisers 
    Tokens[Tokens["Declare"] = 0] = "Declare";
    Tokens[Tokens["Constant"] = 1] = "Constant";
    //Variable reference
    Tokens[Tokens["Identifier"] = 2] = "Identifier";
    //Manipulators
    Tokens[Tokens["BinaryOperator"] = 3] = "BinaryOperator";
    Tokens[Tokens["UnaryOperator"] = 4] = "UnaryOperator";
    Tokens[Tokens["Assign"] = 5] = "Assign";
    Tokens[Tokens["Of"] = 6] = "Of";
    //Verifiers
    Tokens[Tokens["Equals"] = 7] = "Equals";
    Tokens[Tokens["NotEquals"] = 8] = "NotEquals";
    Tokens[Tokens["Greater"] = 9] = "Greater";
    Tokens[Tokens["Less"] = 10] = "Less";
    Tokens[Tokens["GreaterEquals"] = 11] = "GreaterEquals";
    Tokens[Tokens["LessEquals"] = 12] = "LessEquals";
    //Containment
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
    //Conditionals
    Tokens[Tokens["If"] = 28] = "If";
    Tokens[Tokens["Then"] = 29] = "Then";
    Tokens[Tokens["Else"] = 30] = "Else";
    Tokens[Tokens["Elseif"] = 31] = "Elseif";
    Tokens[Tokens["Endif"] = 32] = "Endif";
    Tokens[Tokens["Case"] = 33] = "Case";
    Tokens[Tokens["Endcase"] = 34] = "Endcase";
    Tokens[Tokens["Otherwise"] = 35] = "Otherwise";
    //Loops
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
    //Functions & Procedures
    Tokens[Tokens["Function"] = 49] = "Function";
    Tokens[Tokens["Endfunction"] = 50] = "Endfunction";
    Tokens[Tokens["Procedure"] = 51] = "Procedure";
    Tokens[Tokens["Endprocedure"] = 52] = "Endprocedure";
    Tokens[Tokens["Returns"] = 53] = "Returns";
    Tokens[Tokens["Return"] = 54] = "Return";
    Tokens[Tokens["Call"] = 55] = "Call";
    //Logic operators
    Tokens[Tokens["AND"] = 56] = "AND";
    Tokens[Tokens["OR"] = 57] = "OR";
    Tokens[Tokens["NOT"] = 58] = "NOT";
    //User
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
    ":": Tokens.Colon,
    ",": Tokens.Comma,
    "[": Tokens.OpenSquareBracket,
    "]": Tokens.CloseSquareBracket,
    "(": Tokens.OpenBracket,
    ")": Tokens.CloseBracket,
    "←": Tokens.Assign,
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
    "AND": Tokens.AND,
    "OR": Tokens.OR,
    "NOT": Tokens.NOT,
    "OUTPUT": Tokens.Output,
    "INPUT": Tokens.Input,
    "OPENFILE": Tokens.Openfile,
    "CLOSEFILE": Tokens.Closefile,
    "READFILE": Tokens.Readfile,
    "WRITEFILE": Tokens.Writefile,
    "WRITE": Tokens.Write,
    "READ": Tokens.Read,
};
function splitWithSpaces(str) {
    return str.match(/\S+|\s+/g) || [];
}
//console.log(fileUseFilter("This is a simple sentence :)"));
function fileUseFilter(line) {
    if (line.includes("WRITEFILE") || line.includes("READFILE")) {
        const sentence = splitWithSpaces(line.trim());
        let newStr = [];
        let doubleQuotes = false;
        let singleQuotes = false;
        if (sentence[0] == undefined) {
            console.log("Sentence daran: " + sentence[0]);
        }
        if (sentence[0]) {
            while (!sentence[0].endsWith('.txt,') && !sentence[0].endsWith('.txt')) {
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
        return newStr.join('');
    }
    else {
        return line;
    }
}
function commentFilter(line) {
    const filtered = fileUseFilter(line);
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
            return filtered.substring(0, Math.min(...instances));
        }
    }
    return filtered;
}
//console.log(commentFilter("LACKLUSTER Display /monkey/ //COMMENT"));
export function find_indentation_level(line) {
    for (let i = 0; i < line.length; i++) {
        if (line[i] !== ' ' && line[i] !== '\t') {
            return i;
        }
    }
    return line.length;
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
    let newString = "";
    const toUse = commentFilter(sentence);
    for (let i = 0; i < toUse.length; i++) {
        const split = toUse.trim().split(' ')[0];
        if (split == "DECLARE" || split == "CONSTANT" || split == "INPUT" || split == "READFILE" || split == "WRITEFILE") {
            return sentence;
        }
        else {
            if (toUse[i] == ',') {
                let openBracketCount = 0;
                let flag = false;
                let doubleQuotes = false;
                let singleQuotes = false;
                let nBGF = 0;
                for (let j = i; j >= 0; j--) {
                    if (toUse[j] == ']') {
                        flag = true;
                        continue;
                    }
                    else if ((toUse[j] == ')') && !doubleQuotes && !singleQuotes) {
                        nBGF++;
                        continue;
                    }
                    else if (toUse[j] == '(' && !doubleQuotes && !singleQuotes) {
                        nBGF--;
                    }
                    else if (toUse[j] == "'") {
                        singleQuotes = !singleQuotes;
                        continue;
                    }
                    else if (toUse[j] == '"' && !doubleQuotes) {
                        doubleQuotes = true;
                        continue;
                    }
                    else if (toUse[j] == '"' && doubleQuotes) {
                        doubleQuotes = false;
                        continue;
                    }
                    else if (toUse[j] == '[' && flag) {
                        flag = false;
                        continue;
                    }
                    else if (toUse[j] == '[' && !flag && !doubleQuotes
                        && !singleQuotes) {
                        openBracketCount++;
                        continue;
                    }
                }
                const DQB = doubleQuotes;
                //console.log("Double quotes going back: " + doubleQuotes)
                let closeBracketCount = 0;
                let nBGB = 0;
                flag = false;
                doubleQuotes = false;
                for (let j = i; j < toUse.length; j++) {
                    if (toUse[j] == '[' && !flag) {
                        flag = true;
                        continue;
                    }
                    else if (toUse[j] == '(' && !doubleQuotes && !singleQuotes) {
                        nBGB++;
                        continue;
                    }
                    else if (toUse[j] == ')' && !doubleQuotes && !singleQuotes) {
                        nBGB--;
                        continue;
                    }
                    else if (toUse[j] == "'") {
                        singleQuotes = !singleQuotes;
                        continue;
                    }
                    else if (toUse[j] == '"' && !doubleQuotes) {
                        doubleQuotes = true;
                        continue;
                    }
                    else if (toUse[j] == '"' && doubleQuotes) {
                        doubleQuotes = false;
                        continue;
                    }
                    else if (toUse[j] == ']' && flag) {
                        flag = false;
                        continue;
                    }
                    else if (toUse[j] == ']' && !flag && !doubleQuotes
                        && !singleQuotes) {
                        //console.log("Could i be excecuted?")
                        closeBracketCount++;
                        continue;
                    }
                }
                const DQF = doubleQuotes;
                //console.log("Double quotes going forward: " + doubleQuotes)
                if ((closeBracketCount == openBracketCount &&
                    closeBracketCount > 0 && openBracketCount > 0) || (DQB && DQF)
                    || (nBGB == nBGF && nBGB != 0 && nBGF != 0)) {
                    newString += ',';
                }
                else {
                    newString += '+';
                }
            }
            else {
                newString += toUse[i];
            }
        }
    }
    return newString;
}
//console.log(adapter("DIV(2,3)"));
//console.log(adapter('"This is a test", Tst[1], Tst[1,2], div(2,3), "helo("'))
function isNumeric(str) {
    return !isNaN(Number(str)) && str.trim() !== '';
}
const unaryTokens = [Tokens.OpenBracket, Tokens.OpenSquareBracket, Tokens.Step, Tokens.Output, Tokens.Return, Tokens.Until, Tokens.While, Tokens.If, Tokens.Of, Tokens.Comma, Tokens.Assign, Tokens.Greater, Tokens.GreaterEquals, Tokens.Less, Tokens.LessEquals, Tokens.Equals, Tokens.NotEquals, Tokens.BinaryOperator, Tokens.UnaryOperator];
export let lineNumbers = [];
export function tokenize_line(line) {
    const adapted = adapter(line);
    const split_line = adapted.split('');
    const tokenList = [];
    while (split_line.length > 0) {
        let letter = split_line[0];
        if (isskippable(letter)) {
            split_line.shift(); //Skips unnecessary whitespace
        }
        else if (letter == '+' || letter == '-') {
            if (tokenList.length > 0) {
                const rec = tokenList[tokenList.length - 1].type;
                if (unaryTokens.includes(rec)) {
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.UnaryOperator,
                        typeName: Tokens[Tokens.UnaryOperator],
                    });
                }
                else {
                    tokenList.push({
                        value: split_line.shift(),
                        type: Tokens.BinaryOperator,
                        typeName: Tokens[Tokens.BinaryOperator],
                    });
                }
            }
            else {
                tokenList.push({
                    value: split_line.shift(),
                    type: Tokens.UnaryOperator,
                    typeName: Tokens[Tokens.UnaryOperator],
                });
            }
        }
        else if (letter == '*' || letter == '/' || letter == '^') {
            tokenList.push({
                value: split_line.shift(),
                type: Tokens.BinaryOperator,
                typeName: Tokens[Tokens.BinaryOperator], //Binary operators
            });
            //console.log("Plus being tokenized correctly");
        }
        else if (letter == '>' || letter == '<') {
            let potentialComparitive = "";
            while (split_line.length > 0 && isComparitive(split_line[0])) {
                //console.log(split_line[0] + "is comparitive, so I'm tacking it on...");
                potentialComparitive += split_line.shift();
            }
            tokenList.push({
                value: potentialComparitive,
                type: KEYWORDS[potentialComparitive],
                typeName: Tokens[KEYWORDS[potentialComparitive]],
            });
        }
        else if (letter in KEYWORDS) {
            tokenList.push({
                value: split_line.shift(),
                type: KEYWORDS[letter],
                typeName: Tokens[KEYWORDS[letter]], //For existing keycharacters
            });
        }
        else if (isAlpha(letter)) {
            let potentialWord = "";
            while (split_line.length > 0 && isIdentifiable(split_line[0])) {
                potentialWord += split_line.shift();
            }
            if (potentialWord in KEYWORDS) {
                tokenList.push({
                    value: potentialWord,
                    type: KEYWORDS[potentialWord],
                    typeName: Tokens[KEYWORDS[potentialWord]], //If word is a keyword
                });
            }
            else if (potentialWord.startsWith('"') && potentialWord.endsWith('"')) {
                const sliced = potentialWord.slice(1, -1);
                if (sliced.length == 1) {
                    throw "Single-characters are delimited by singe quotes";
                }
                else {
                    tokenList.push({
                        value: potentialWord.slice(1, -1),
                        type: Tokens.StringLiteral,
                        typeName: Tokens[Tokens.StringLiteral],
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
                    });
                }
            }
            else if (potentialWord.endsWith('.txt')) {
                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Filename,
                    typeName: Tokens[Tokens.Filename], //Otherwise identifier
                });
            }
            else {
                tokenList.push({
                    value: potentialWord,
                    type: Tokens.Identifier,
                    typeName: Tokens[Tokens.Identifier], //Otherwise identifier
                });
                if (potentialWord.includes('_')) {
                    makeError("Identifier names should not use an underscore");
                }
                else if (/[À-ÿ]/.test(potentialWord)) {
                    makeError("Identifier names should not use accented characters");
                }
            }
        }
        else if (!isNaN(Number(letter))) {
            let potentialNumber = "";
            while (split_line.length > 0
                && (!isNaN(Number(split_line[0]))
                    || split_line[0] === '.')) {
                potentialNumber += split_line.shift();
            }
            tokenList.push({
                value: potentialNumber,
                type: Tokens.NumericLiteral,
                typeName: Tokens[Tokens.NumericLiteral], //Numeric literal
            });
        }
        else if (letter == '"') {
            let potentialStringLiteral = split_line.shift();
            while (split_line.length > 0 && split_line[0] != '"') { //String literals with ""
                potentialStringLiteral += split_line.shift();
            }
            split_line.shift();
            potentialStringLiteral += '"';
            tokenList.push({
                value: potentialStringLiteral.slice(1, -1),
                type: Tokens.StringLiteral,
                typeName: Tokens[Tokens.StringLiteral], //String literal
            });
        }
        else if (letter == "'") {
            let potentialStringLiteral = split_line.shift(); //String literals with ''
            while (split_line.length > 0 && split_line[0] != "'") {
                potentialStringLiteral += split_line.shift();
            }
            split_line.shift();
            potentialStringLiteral += "'";
            if (potentialStringLiteral.length != 3) {
                console.log("Potential string: " + potentialStringLiteral);
                makeError('Multicharacter string literals must be delimited by double quotes (" ") ');
            }
            tokenList.push({
                value: potentialStringLiteral.slice(1, -1),
                type: Tokens.StringLiteral,
                typeName: Tokens[Tokens.StringLiteral], //String literal
            });
        }
        else {
            throw "Unrecognised character: " + letter; //Unrecognised
        }
    }
    tokenList.push({
        value: "EOL",
        type: Tokens.EOL,
        typeName: Tokens[Tokens.EOL],
    });
    return tokenList;
}
export function tokenize(src) {
    lineNumbers = [];
    const lines = line_reader(src);
    const tokenList = [];
    let i = 1;
    for (const line of lines) {
        const lineTokens = tokenize_line(line);
        for (let j = 0; j < lineTokens.length; j++) {
            lineNumbers.push(i);
        }
        i++;
        if (line.trim() === "")
            continue;
        tokenList.push(...tokenize_line(line));
    }
    console.log("Numerated: " + lineNumbers);
    tokenList.push({
        value: "EOF",
        type: Tokens.EOF,
        typeName: Tokens[Tokens.EOF],
    });
    return tokenList;
}
function isComparitive(str) {
    return str == '=' || str == '<' || str == '>' || str == '<=' || str == '>=';
}
