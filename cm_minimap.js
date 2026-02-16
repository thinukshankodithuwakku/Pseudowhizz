import { methods, constants, procedures } from "./Main.js";
const keywords = /^(READFILE|WRITEFILE|OPENFILE|CLOSEFILE|DECLARE|CONSTANT|OUTPUT|INPUT|FUNCTION|ENDFUNCTION|PROCEDURE|ENDPROCEDURE)$/;
const datatypes = /^(ARRAY|INTEGER|REAL|CHAR|STRING|BOOLEAN)$/;
const boolean = /^(TRUE|FALSE)$/;
const native = /^(LCASE|UCASE|NUM_TO_STR|STR_TO_NUM|SUBSTRING|EOF|ROUND|RANDOM|LENGTH)$/;
const control = /^(ELSEIF|IF|ELS\E|ENDIF|THEN|CASE|OF|ENDCASE|OTHERWISE|RETURNS|RETURN|READ|WRITE|STEP|FOR|TO|CALL|NEXT|WHILE|REPEAT|ENDWHILE|DO|UNTIL)$/;
const logical = /^(MOD|DIV|NOT|AND|OR|)$/;
export function mmp_tokenise_line(line, ch = 0) {
    const chars = line.split('');
    const Tokens = [];
    let start = ch;
    while (chars.length > 0) {
        if (chars[0] == ' ') {
            let holder = '';
            start = ch;
            while (chars[0] == ' ' && chars.length > 0) {
                holder += chars.shift();
                ch++;
            }
            Tokens.push({
                type: "whitespace",
                value: holder,
                start: start,
                end: ch,
            });
            ch++;
        }
        else if (/^[A-Za-z]+$/.test(chars[0])) {
            let holder = '';
            start = ch;
            while (/^[A-Za-z]+$/.test(chars[0]) && chars.length > 0) {
                holder += chars.shift();
                ch++;
            }
            let tokenType;
            if (keywords.test(holder))
                tokenType = "keyword";
            else if (control.test(holder))
                tokenType = "control";
            else if (datatypes.test(holder))
                tokenType = "datatype";
            else if (boolean.test(holder))
                tokenType = "boolean";
            else if (native.test(holder))
                tokenType = "function";
            else if (logical.test(holder))
                tokenType = "operator";
            else
                tokenType = "identifier";
            Tokens.push({
                type: tokenType,
                value: holder,
                start: start,
                end: ch,
            });
            ch++;
        }
        else if (chars[0] == '.') {
            start = ch;
            let holder = chars.shift();
            ch++;
            if (chars[0] && /^[0-9]$/.test(chars[0])) {
                while (/^[0-9]$/.test(chars[0]) && chars.length > 0) {
                    holder += chars.shift();
                    ch++;
                }
                Tokens.push({
                    type: "number",
                    value: holder,
                    start: start,
                    end: ch,
                });
            }
            else {
                Tokens.push({
                    type: "symbol",
                    value: holder,
                    start: start,
                    end: ch,
                });
            }
            ch++;
        }
        else if (/^[0-9]$/.test(chars[0])) {
            let holder = '';
            let dpCount = 0;
            start = ch;
            while ((/^[0-9]$/.test(chars[0]) || (chars[0] == '.' && dpCount == 0)) && chars.length > 0) {
                if (chars[0] == '.')
                    dpCount++;
                holder += chars.shift();
                ch++;
            }
            Tokens.push({
                type: "number",
                value: holder,
                start: start,
                end: ch,
            });
            ch++;
        }
        else if (chars[0] == '/') {
            chars.shift();
            start = ch;
            ch++;
            if (chars[0] == '/') {
                chars.shift();
                ch++;
                let holder = '//';
                while (chars.length > 0) {
                    holder += chars.shift();
                    ch++;
                }
                Tokens.push({
                    type: "comment",
                    value: holder,
                    start: start,
                    end: ch,
                });
            }
            else {
                Tokens.push({
                    type: "symbol",
                    value: '/',
                    start: start,
                    end: ch,
                });
            }
            ch++;
        }
        else if (chars[0] == '"') {
            start = ch;
            chars.shift();
            ch++;
            let holder = '';
            while (chars.length > 0 && chars[0] != '"') {
                holder += chars.shift();
                ch++;
            }
            if (chars[0] == '"') {
                chars.shift();
                ch++;
                Tokens.push({
                    type: "string",
                    value: `"${holder}"`,
                    start: start,
                    end: ch,
                });
            }
            else
                mmp_tokenise_line(holder, ch).forEach(tk => { if (tk.type !== "EOL")
                    Tokens.push(tk); });
            ch++;
        }
        else if (chars[0] == "'") {
            start = ch;
            chars.shift();
            let holder = '';
            while (chars.length > 0 && chars[0] != "'") {
                holder += chars.shift();
                ch++;
            }
            if (chars[0] == "'" && holder.length == 1) {
                chars.shift();
                Tokens.push({
                    type: "char",
                    value: `'${holder}'`,
                    start: start,
                    end: ch,
                });
            }
            else if (chars[0] == "'") {
                chars.shift();
                ch++;
                Tokens.push({
                    type: "symbol",
                    value: `'${holder}'`,
                    start: start,
                    end: ch,
                });
            }
            else
                mmp_tokenise_line(holder, ch).forEach(tk => { if (tk.type !== "EOL")
                    Tokens.push(tk); });
            ch++;
        }
        else {
            Tokens.push({
                type: "symbol",
                value: chars.shift(),
                start: ch,
                end: ch,
            });
            ch++;
        }
    }
    Tokens.push({ type: "EOL", value: "EOL", start: null, end: null });
    return Tokens;
}
function parse_primary(tk) {
    if (tk.type == "keyword") {
        return '<span class="cm-keyword">' + tk.value + '</span>';
    }
    else if (tk.type == "datatype") {
        return '<span class="cm-datatype">' + tk.value + '</span>';
    }
    else if (tk.type == "control") {
        return '<span class="cm-other-token">' + tk.value + '</span>';
    }
    else if (tk.type == "boolean") {
        return '<span class="cm-boolean">' + tk.value + '</span>';
    }
    else if (tk.type == "function") {
        return '<span class="cm-native">' + tk.value + '</span>';
    }
    else if (tk.type == "operator") {
        return '<span class="cm-logical">' + tk.value + '</span>';
    }
    else if (tk.type == "string") {
        return '<span class="cm-string">' + tk.value + '</span>';
    }
    else if (tk.type == "char") {
        return '<span class="cm-char">' + tk.value + '</span>';
    }
    else if (tk.type == "number") {
        return '<span class="cm-number" style="color: var(--number)">' + tk.value + '</span>';
    }
    else if (tk.type == "identifier") {
        if (methods.has(tk.value)) {
            return '<span class="cm-userFn">' + tk.value + '</span>';
        }
        else if (constants.has(tk.value)) {
            return '<span class="cm-constant">' + tk.value + '</span>';
        }
        else if (procedures.has(tk.value)) {
            return '<span class="cm-userFn">' + tk.value + '</span>';
        }
        else {
            return '<span class="cm-variable">' + tk.value + '</span>';
        }
    }
    else if (tk.type == "comment") {
        return '<span class="cm-comment">' + tk.value + '</span>';
    }
    else if (tk.type == "EOL") {
        return '\n';
    }
    else if (tk.type == "whitespace")
        return tk.value;
    else if (!tk.value || tk.value === undefined) {
        return "";
    }
    else {
        return '<span class="cm-other">' + tk.value + '</span>';
    }
}
function format_line(ln) {
    const tokens = mmp_tokenise_line(ln);
    const out = tokens.map(tk => parse_primary(tk)).join('');
    return out;
}
function format_src(src, txtFile) {
    const split = src.split('\n');
    let out = [];
    for (const ln of split) {
        out.push(!txtFile ? format_line(ln) : '<span class="cm-txt-norm">' + ln + '</span>');
    }
    return out;
}
let building = false;
function isLineHidden(cm, line) {
    if (line < 0 || line >= cm.lineCount())
        return false;
    const marks = cm.findMarksAt({ line, ch: 0 });
    for (const m of marks) {
        if (m.__isFold) {
            const range = m.find();
            if (range && range.from.line < line && line <= range.to.line) {
                return true;
            }
        }
    }
    return false;
}
export function build_map(cm, txtFile) {
    const src = cm.getValue();
    if (building)
        return;
    building = true;
    const map = document.getElementById('mini-map-content');
    map.innerHTML = '';
    if (localStorage.getItem('Mmp') == "true") {
        const lines = format_src(src, txtFile);
        let lineCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const ln = document.createElement("div");
            ln.className = "mini-map-line";
            ln.innerHTML = line;
            ln.id = "line-" + lineCount;
            const node = cm.lineInfo(i);
            if (node && node.wrapClass && node.wrapClass.includes('cm-line-folded'))
                ln.classList.add('cm-line-folded');
            else if (ln.classList.contains('cm-line-folded'))
                ln.classList.remove('cm-line-folded');
            const classNames = ['cm-s-idea', 'cm-s-darcula'];
            let add = !isLineHidden(cm, i);
            classNames.forEach(className => {
                const elements = document.querySelectorAll(`.${className}`);
                elements.forEach(el => {
                    el.appendChild(ln);
                });
            });
            if (add)
                map.appendChild(ln);
            lineCount++;
        }
    }
    building = false;
}
export function highlight_error_lines(errorLines) {
    const ln = errorLines[0];
    const target = document.getElementById('mini-map-content').querySelector(`#line-${ln - 1}`);
    if (target)
        target.classList.add('erroneous-line');
}
export function clear_error_lines() {
    for (const ln of document.getElementById('mini-map-content').children) {
        ln.classList.remove('erroneous-line');
    }
}
function normalize(raw) {
    if (raw.anchor.line < raw.head.line ||
        (raw.anchor.line === raw.head.line && raw.anchor.ch <= raw.head.ch)) {
        return { from: raw.anchor, to: raw.head };
    }
    else {
        return { from: raw.head, to: raw.anchor };
    }
}
