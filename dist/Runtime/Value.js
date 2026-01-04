import { Tokens } from "../Frontend/Lexer.js";
export function MK_NULL() {
    //console.log("Unfortunately I am also being excecuted :(");
    return { type: "null", value: null };
}
export function MK_BOOL(b = true) {
    return { type: "boolean", value: b };
}
export function MK_STRING(s) {
    return { type: "string", kind: "StringLiteral", value: s };
}
export function MK_CHAR(c) {
    return { type: "char", value: c };
}
export function MK_NUMBER(n = 0, overwriteNumberKind) {
    if (overwriteNumberKind != "Auto") {
        /*return {
          type: "number",
          numberKind: overwriteNumberKind,
          value: n
        } as NumberVal;*/
        if (!isint(n) && overwriteNumberKind == Tokens.Integer) {
            throw "Cannot assign integer type to real type number!";
        }
        return {
            type: "number",
            numberKind: overwriteNumberKind,
            value: n
        };
    }
    else {
        return { type: "number",
            numberKind: n.toString().includes('.') ? Tokens.Integer : Tokens.Real,
            value: n };
    }
}
function isint(str) {
    const num = Number(str);
    return !isNaN(num) && Number.isInteger(num);
}
export function MK_NATIVE_FN(call) {
    return { type: "native-fn", call };
}
