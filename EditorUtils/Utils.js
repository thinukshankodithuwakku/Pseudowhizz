import { tokenize_line, Tokens } from "../Frontend/Lexer.js";
const natives = ["SUBSTRING", "LENGTH", "LCASE", "UCASE", "ROUND", "RANDOM", "EOF", "NUM_TO_STR", "STR_TO_NUM", "MOD", "DIV"];
const FnDescRec = {
    "SUBSTRING": "Returns a string of length <length> starting at position <start>.",
    "LENGTH": "Returns the integer value representing the length of string.",
    "LCASE": "Returns the string/character with all characters in lower case.",
    "UCASE": "Returns the string/character with all characters in upper case.",
    "ROUND": "Returns the value of the identifier rounded to <places> number of decimal places.",
    "RANDOM": "Returns a random number between 0 and 1 inclusive.",
    "EOF": "Returns TRUE if there are no more lines to read (or if an empty file has been opened in READ mode) and FALSE otherwise.",
    "NUM_TO_STR": "Returns a string representation of a numerical value.",
    "STR_TO_NUM": "Returns a numeric representation of a string.",
    "MOD": "Returns the remainder of <identifier1> divided by <identifier2>",
    "DIV": "Returns the quotient of <identifier1> divided by <identifier2> with the fractional part discarded.",
    "None": "[Blank]"
};
const FnArgDesc = {
    "SUBSTRING": ["String to extract from.", "1-based start index (inclusive).", "Length of extraction."],
    "LENGTH": ["Input string."],
    "LCASE": ["Input string."],
    "UCASE": ["Input string."],
    "ROUND": ["Number to be rounded.", "Number of decimal places."],
    "RANDOM": ["Returns a random number between 0 and 1 inclusive."],
    "EOF": ["Name of file to check."],
    "NUM_TO_STR": ["Input number."],
    "STR_TO_NUM": ["Input string."],
    "MOD": ["Dividend.", "Divisor."],
    "DIV": ["Dividend.", "Divisor."],
    "None": ["[Blank]"]
};
const FnTempRec = {
    "SUBSTRING": "SUBSTRING(<identifier> : STRING, <start> : INTEGER, <length> : INTEGER) RETURNS STRING",
    "LENGTH": "LENGTH(<identifier> : INTEGER) RETURNS INTEGER",
    "LCASE": "LCASE(<identifier> : STRING|CHAR) RETURNS STRING|CHAR",
    "UCASE": "UCASE(<identifier> : STRING|CHAR) RETURNS STRING|CHAR",
    "RANDOM": "RANDOM() RETURNS REAL",
    "ROUND": "ROUND(<identifier> : REAL, <places> : INTEGER) RETURNS REAL",
    "MOD": "MOD(<identifier1> : INTEGER|REAL, <identifier2> : INTEGER|REAL) RETURNS INTEGER",
    "DIV": "DIV(<identifier1> : INTEGER|REAL, <identifier2> : INTEGER|REAL) RETURNS INTEGER",
    "EOF": "EOF(<filename> : STRING) RETURNS BOOLEAN",
    "NUM_TO_STR": "NUM_TO_STR(<number> : INTEGER|REAL) RETURNS STRING",
    "STR_TO_NUM": "STR_TO_NUM(<string> : STRING|CHAR) RETURNS REAL",
    "None": "None",
};
function spit_html(func_name, current_parameter) {
    switch (func_name) {
        case "RANDOM":
            return {
                bef: "RANDOM() RETURNS REAL",
                hl: '',
                aft: '',
            };
        case "SUBSTRING":
            if (current_parameter == 0) {
                return {
                    bef: "SUBSTRING(",
                    hl: "<identifier> : STRING",
                    aft: ", <start> : INTEGER, <length> : INTEGER) RETURNS STRING",
                };
            }
            else if (current_parameter == 1) {
                return {
                    bef: "SUBSTRING(<identifier> : STRING, ",
                    hl: "<start> : INTEGER",
                    aft: ", <length> : INTEGER) RETURNS STRING",
                };
            }
            else {
                return {
                    bef: "SUBSTRING(<identifier> : STRING, <start> : INTEGER, ",
                    hl: "<length> : INTEGER",
                    aft: ") RETURNS STRING",
                };
            }
        case "LENGTH":
            return {
                bef: "LENGTH(",
                hl: "<identifier> : INTEGER",
                aft: ") RETURNS INTEGER"
            };
        case "UCASE":
            return {
                bef: "UCASE(",
                hl: "<identifier> : STRING|CHAR",
                aft: ") RETURNS STRING|CHAR"
            };
        case "LCASE":
            return {
                bef: "LCASE(",
                hl: "<identifier> : STRING|CHAR",
                aft: ") RETURNS STRING|CHAR"
            };
        case "ROUND":
            if (current_parameter == 0) {
                return {
                    bef: "ROUND(",
                    hl: "<identifier> : REAL",
                    aft: ", <places> : INTEGER) RETURNS REAL",
                };
            }
            else {
                return {
                    bef: "ROUND(<identifier> : REAL, ",
                    hl: "<places> : INTEGER",
                    aft: ") RETURNS REAL",
                };
            }
        case "MOD":
            if (current_parameter == 0) {
                return {
                    bef: "MOD(",
                    hl: "<identifier1> : INTEGER|REAL",
                    aft: ", <identifier2> : INTEGER|REAL) RETURNS INTEGER",
                };
            }
            else {
                return {
                    bef: "MOD(<identifier1> : INTEGER|REAL, ",
                    hl: "<identifier2> : INTEGER|REAL",
                    aft: ") RETURNS INTEGER",
                };
            }
        case "DIV":
            if (current_parameter == 0) {
                return {
                    bef: "DIV(",
                    hl: "<identifier1> : INTEGER|REAL",
                    aft: ", <identifier2> : INTEGER|REAL) RETURNS INTEGER",
                };
            }
            else {
                return {
                    bef: "DIV(<identifier1> : INTEGER|REAL, ",
                    hl: "<identifier2> : INTEGER|REAL",
                    aft: ") RETURNS INTEGER",
                };
            }
        case "EOF":
            return {
                bef: "EOF(",
                hl: "<filename> : STRING",
                aft: ") RETURNS BOOLEAN",
            };
        case "NUM_TO_STR":
            return {
                bef: "NUM_TO_STR(",
                hl: "<number> : INTEGER|REAL",
                aft: ") RETURNS STRING",
            };
        case "STR_TO_NUM":
            return {
                bef: "STR_TO_NUM(",
                hl: "<string> : STRING|CHAR",
                aft: ") RETURNS INTEGER|REAL",
            };
    }
}
export class DescBox {
    constructor(cm) {
        this.active = false;
        this.descBox = document.createElement("div");
        const name = document.createTextNode("None");
        const name_cont = document.createElement("div");
        name_cont.classList.add("desc-box-header");
        name_cont.appendChild(name);
        const desc = document.createTextNode(FnDescRec["None"]);
        const desc_cont = document.createElement("div");
        desc_cont.classList.add('desc-box-body');
        desc_cont.appendChild(desc);
        this.descBox.appendChild(name_cont);
        const hr = document.createElement("hr");
        hr.classList.add('desc-box-hr');
        this.descBox.appendChild(hr);
        this.close();
        this.descBox.appendChild(desc_cont);
        this.descBox.classList.add('desc-box');
        document.documentElement.appendChild(this.descBox);
    }
    scan(fn_name) {
        for (const name of natives)
            if (fn_name.endsWith(name))
                return name;
        return null;
    }
    tick(fn_name, co_ords, parameter) {
        const name = this.scan(fn_name);
        if (name == null)
            return;
        if (!(name in FnDescRec))
            return;
        const target = document.getElementsByClassName('desc-box-header')[0];
        if (parameter || parameter == 0) {
            if (parameter > FnArgDesc[name].length - 1) {
                this.close();
                return;
            }
            const info = spit_html(name, parameter);
            target.innerHTML = '';
            target.appendChild(document.createTextNode(info.bef));
            const span = document.createElement("span");
            span.className = "hint-match";
            span.textContent = info.hl;
            target.appendChild(span);
            target.appendChild(document.createTextNode(info.aft));
            document.getElementsByClassName('desc-box-body')[0].textContent = '';
            if (name != "RANDOM") {
                document.getElementsByClassName('desc-box-body')[0].appendChild(document.createTextNode(FnArgDesc[name][parameter]));
                document.getElementsByClassName('desc-box-body')[0].appendChild(document.createElement("br"));
                document.getElementsByClassName('desc-box-body')[0].appendChild(document.createElement("br"));
            }
            document.getElementsByClassName('desc-box-body')[0].appendChild(document.createTextNode(FnDescRec[name]));
        }
        else {
            Array.from(target.children).forEach(child => {
                child.innerHTML = '';
            });
            const desc = FnDescRec[name];
            this.descBox.childNodes[0].childNodes[0].nodeValue = FnTempRec[name];
            this.descBox.childNodes[2].childNodes[0].nodeValue = desc;
        }
        const line_height = co_ords.bottom - co_ords.top;
        this.descBox.style.left = co_ords.left + 'px';
        this.descBox.style.top = (co_ords.top + line_height) + 'px';
        this.open();
    }
    countParameters(line, co_ords, offset, source) {
        let func_name = "";
        let i = line.length - 1;
        const chars = line.split('');
        const double_quotes = chars.filter(char => char == '"').length;
        const single_quotes = chars.filter(char => char == "'").length;
        if (double_quotes % 2 == 1 && source != "arrow")
            return;
        chars.pop();
        if (chars.join('').endsWith('//') && source != "arrow")
            return;
        else if (chars.join('').endsWith("'") && single_quotes % 2 == 1 && source != "arrow")
            return;
        const tokens = tokenize_line(line, 0);
        let slice = [];
        i = tokens.length - 1;
        let bracs = 0;
        while (i >= 0) {
            if (tokens[i].type == Tokens.CloseBracket)
                bracs--;
            else if (tokens[i].type == Tokens.OpenBracket)
                bracs++;
            else if (tokens[i].type == Tokens.Identifier && bracs == 1) {
                func_name = tokens[i].value;
                slice = tokens.slice(i, tokens.length);
                break;
            }
            i--;
        }
        slice.pop();
        let currentParameter = 0;
        i = slice.length - 1;
        bracs = 0;
        let sqrBracs = 0;
        while (i >= 0) {
            const at = slice[i];
            if (at.type == Tokens.CloseBracket)
                bracs--;
            else if (at.type == Tokens.OpenBracket)
                bracs++;
            else if (at.type == Tokens.CloseSquareBracket)
                sqrBracs--;
            else if (at.type == Tokens.OpenSquareBracket)
                sqrBracs++;
            else if (at.type == Tokens.Comma && bracs == 0 && sqrBracs == 0)
                currentParameter++;
            i--;
        }
        currentParameter += offset;
        this.tick(func_name, co_ords, currentParameter);
        return currentParameter;
    }
    close() {
        this.active = false;
        this.descBox.classList.add("desc-box-off");
    }
    open() {
        this.active = true;
        this.descBox.classList.remove("desc-box-off");
    }
}
let highlightMarkers = [];
export function select_all(editor, selection) {
    highlightMarkers.forEach(marker => marker.clear());
    highlightMarkers = [];
    const word = selection.text;
    if (!word || word.length == 0 || word.trim() == "")
        return;
    const src = editor.getValue().split('\n');
    const matches = [];
    let ln = 0;
    src.forEach(line => {
        if (line.length >= word.length) {
            line = line.split('');
            for (let i = 0; i < line.length; i++) {
                const match = line.slice(i, i + word.length).join('');
                const original = ln == selection.from.line && i == selection.from.ch;
                if (match == word)
                    matches.push({
                        anchor: { line: ln, ch: i },
                        head: { line: ln, ch: i + word.length },
                    });
            }
        }
        ln++;
    });
    const selectedClass = matches.length == 1 ? 'cm-line-highlight' : 'cm-line-multi-highlight';
    matches.forEach(m => {
        const marker = editor.markText(m.anchor, m.head, { className: selectedClass });
        highlightMarkers.push(marker);
    });
}
export function highlight_all_tokens(editor, curTkMarks, token) {
    function isAlpha(char) {
        return (/^[A-Za-z]$/).test(char);
    }
    const nonHighlightableTokens = ['number', 'comment', 'keyword'];
    const string = token.string;
    if (curTkMarks) {
        curTkMarks.forEach(marker => marker.clear());
        curTkMarks.length = 0;
    }
    for (let line = 0; line < editor.lineCount(); line++) {
        let tokens = editor.getLineTokens(line); // returns array of tokens
        tokens = tokens.filter(tk => tk.string.trim() !== '');
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const highlight = !(editor.getSelection().length > 0 || (token.string.length == 1 && !isAlpha(token.string)) || nonHighlightableTokens.includes(token.type) || token.string.trim() === '');
            if (token.string === string && highlight) {
                let className = "cm-cursor-token";
                const names = ["variable", "constant", "userFn"];
                const prevToken = i > 0 ? tokens[i - 1] : { string: "N/A" };
                const nxtToken = i < tokens.length - 1 ? tokens[i + 1] : { string: "N/A" };
                if (names.includes(token.type)) {
                    switch (token.type) {
                        case "variable":
                            if (nxtToken.string == '<--' || nxtToken.string == "←")
                                className = "cm-token-def";
                            else {
                                const ln = tokenize_line(editor.getLine(line), line);
                                let isFirstParam = false;
                                if (ln.length >= 4 && (ln.map(tk => tk.value).includes('FUNCTION') || ln.map(tk => tk.value).includes('PROCEDURE')) && (ln[0].value == 'FUNCTION' || ln[0].value == 'PROCEDURE')) {
                                    if (ln[1].type == Tokens.Identifier && ln[2].type == Tokens.OpenBracket && ln[3].value == token.string)
                                        isFirstParam = true;
                                }
                                if (isFirstParam)
                                    className = "cm-token-def";
                            }
                            break;
                        case "constant":
                            if (prevToken.string == 'CONSTANT' && (nxtToken.string == '<--' || nxtToken.string == "←"))
                                className = "cm-token-def";
                            break;
                        case "userFn":
                            if (prevToken.string == 'FUNCTION' || prevToken.string == 'PROCEDURE')
                                className = "cm-token-def";
                            break;
                        default:
                            className = "cm-cursor-token";
                    }
                }
                else
                    className = "cm-cursor-token";
                const marker = editor.markText({ line: line, ch: token.start }, { line: line, ch: token.end }, { className: className });
                curTkMarks.push(marker);
            }
        }
    }
}
