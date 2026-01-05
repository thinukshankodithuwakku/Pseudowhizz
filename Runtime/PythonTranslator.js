import { MK_NULL, MK_NUMBER } from "./Value.js";
import { evaluate } from "../Runtime/Interpreter.js";
import { Tokens } from "../Frontend/Lexer.js";
import { conv_runtimeval_dt, eval_assignment_expr, isint, fn_args_size } from "./Eval/Expressions.js";
import { eval_var_declaration } from "./Eval/Statements.js";
const initial_frame = {
    expr: undefined,
    ln: undefined,
    context: "<module>",
};
let l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
let f = ["file20", "file19", "file18", "file17", "file16", "file15", "file14", "file13", "file12", "file11", "file10", "file9", "file8", "file7", "file6", "file5", "file4", "file3", "file2", "file1"];
let delimeters = [' ', ',', '|', '#', '.', '/'];
let natives = ["UCASE", "LCASE", "LENGTH", "SUBSTRING", "RANDOM", "STR_TO_NUM", "NUM_TO_STR", "DIV", "MOD", "ROUND"];
let custom_file_map = new Map();
let var_type_map = new Map();
let arr_bound_map = new Map();
let iterators = [];
const tab = "    ";
const variables = new Map();
let randomUsed = false;
export async function produce_py_program(program, env) {
    l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
    f = ["file20", "file19", "file18", "file17", "file16", "file15", "file14", "file13", "file12", "file11", "file10", "file9", "file8", "file7", "file6", "file5", "file4", "file3", "file2", "file1"];
    iterators = [];
    natives = ["UCASE", "LCASE", "LENGTH", "SUBSTRING", "RANDOM", "STR_TO_NUM", "NUM_TO_STR", "DIV", "MOD", "ROUND"];
    custom_file_map = new Map();
    let p = "# ** Python Representation Result ** \n\n# IMPORTANT! Always manually review translated scripts before excecution\n\n";
    let program_block = "";
    let errorRaised = false;
    randomUsed = false;
    for (const stmt of program.body) {
        if (stmt.kind == "ErrorExpr") {
            errorRaised = true;
            program_block = "";
            p = '# Cannot finish translation due to a potential syntax error\n# Evaluate your program first and check that there are no errors before translating!';
            break;
        }
        else {
            program_block += await translate("", stmt, env);
        }
    }
    if (randomUsed && !errorRaised) {
        program_block = 'import random\n\n' + program_block;
    }
    return p + program_block;
}
async function translate(lead, astNode, env) {
    let e;
    if (!astNode) {
        return "None";
    }
    switch (astNode.kind) {
        case "Program":
            return await produce_py_program(astNode, env);
        case "CommentExpr":
            const out = astNode.value.trim() !== "" ? lead + '#' + astNode.value + '\n' : "";
            return out;
        case "AssignmentExpr":
            const expr = astNode;
            const m = lead + await trans_assign_expr(lead, expr, env);
            return m;
        case "BinaryExpr":
            return await trans_binary_expr(lead, astNode, env);
        case "Identifier":
            const id = astNode;
            let name = id.symbol;
            l = l.filter(c => c != name);
            f = f.filter(c => c != name);
            if (name == "TRUE") {
                name = "True";
            }
            else if (name == "FALSE") {
                name = "False";
            }
            return name;
        case "NumericLiteral":
            const n = astNode;
            return n.value.toString();
        case "StringLiteral":
            const s = astNode;
            return `"${s.text}"`;
        case "CharString":
            const c = astNode;
            return `'${c.text}'`;
        case "InputExpr":
            return await trans_input_expr(lead, astNode, env);
        case "OutputExpr":
            e = astNode;
            const as = e.value;
            const mes = (await trans_concat(lead, as, env, ','))[0];
            const rohe = lead + 'print(' + mes.trim() + ')';
            return add_comment(rohe, e.comment);
        case "MemberExpr":
            return await trans_memberExpr(lead, astNode, env);
        case "ObjectLiteral":
            const object = astNode;
            const start = await evaluate(object.start, env, [initial_frame]);
            const end = await evaluate(object.end, env, [initial_frame]);
            const val = await evaluate(object, env, [initial_frame]);
            return await trans_object_literal(lead, object, env);
        case "VarDeclaration":
            return lead + await trans_varDecl(lead, astNode, env);
        case "FunctionDeclaration":
            return await trans_fnDecl(lead, astNode, env);
        case "ReturnStmt":
            const ret = astNode;
            return lead + 'return ' + (await trans_concat(lead, ret.value, env, ','))[0] + '\n';
        case "SelectionStmtDeclaration":
            return await trans_selectionStmt(lead, astNode, env);
        case "IterationStmt":
            return await trans_iter_stmt(lead, astNode, env);
        case "CallExpr":
            const call = astNode;
            if (call.wasCallKeywordUsed) {
                return lead + await trans_call_expr(lead, astNode, env);
            }
            else {
                return await trans_call_expr(lead, astNode, env);
            }
        case "UnaryExpr":
            return await trans_unary_expr(lead, astNode, env);
        case "FileExpr":
            return lead + await trans_file_expr(astNode, env);
        case "FileUse":
            return await trans_file_use_expr(lead, astNode, env);
        case "NullLiteral":
            return "";
        case "EndClosureExpr":
            return "";
        default:
            throw "Cannot translate unknown AST node of kind: " + astNode.kind;
    }
}
async function trans_unary_expr(lead, e, env) {
    const modulus = await translate(lead, e.right, env);
    let out = "";
    switch (e.operator) {
        case "NOT":
            out = "not " + modulus;
            break;
        case '-':
            out = '-' + modulus;
            break;
        case '+':
            out = modulus;
            break;
        default:
            out = modulus;
    }
    if (e.bracket) {
        return `(${out})`;
    }
    else {
        return out;
    }
}
function unload_type_iterator(e) {
    const iterator = e.iterator;
    if (typeof iterator == "string") {
        if (e.type == "") {
            return `[${e.iterator} for ${e.iterator} in ${e.name}.split('${e.delimeter}')]`;
        }
        else {
            return `[${e.type}(${e.iterator}) for ${e.iterator} in ${e.name}.split('${e.delimeter}')]`;
        }
    }
    else {
        const x = e.iterator;
        const i = unload_type_iterator(iterator);
        return `[${i} for ${x.name} in ${e.name}.split('${e.delimeter}')]`;
    }
}
async function trans_input_expr(lead, e, env) {
    const target = e.assigne[0];
    const assigne = e.assigne[0];
    let msg = e.promptMessage.length > 0 ? (await trans_concat(lead, e.promptMessage, env, '+'))[0] : '';
    const a = await translate(lead, e.assigne[0], env);
    const assigne_type = await resolve_data_type(assigne, env);
    let caster = "";
    let raw = "";
    switch (assigne_type) {
        case Tokens.Integer:
            caster = "int";
            break;
        case Tokens.Real:
            caster = "float";
            break;
        case Tokens.Boolean:
            caster = "bool";
            break;
        default:
            caster = "";
            break;
    }
    msg = msg.trim();
    const first = e.assigne[0];
    let evald_asgn = await evaluate(first, env, [initial_frame]);
    if (evald_asgn.type == "null") {
        if (first.kind == "Identifier" && ((Array.from(env.variables.keys())).includes(first.symbol))) {
            evald_asgn = env.variables.get(first.symbol);
        }
    }
    let result_chunk = msg.slice(0, -1) + ' \\n"';
    if (!result_chunk.startsWith('input(') && !result_chunk.endsWith(')')) {
        result_chunk = `input(${result_chunk})`;
    }
    const orig_l = l;
    const orig_d = delimeters;
    if (caster == "") {
        if (evald_asgn.type == "Object") {
            const orig = {
                type: caster,
                iterator: l.pop(),
                name: result_chunk,
                delimeter: ',',
            };
            let focus = orig;
            evald_asgn = evald_asgn.vals[0];
            while (evald_asgn.type == "Object") {
                focus.iterator = {
                    type: caster,
                    iterator: l.pop(),
                    name: focus.iterator,
                    delimeter: delimeters.pop(),
                };
                focus = focus.iterator;
                evald_asgn = evald_asgn.vals[0];
            }
            result_chunk = unload_type_iterator(orig);
            l = orig_l;
            delimeters = orig_d;
        }
        raw = lead + `${a} = ${result_chunk}`;
        return add_comment(raw, e.comment);
    }
    else {
        if (evald_asgn.type == "Object") {
            let iterator = l.pop();
            let name = result_chunk;
            const orig = {
                type: caster,
                iterator: iterator,
                name: name,
                delimeter: ',',
            };
            let focus = orig;
            evald_asgn = evald_asgn.vals[0];
            while (evald_asgn.type == "Object") {
                focus.iterator = {
                    type: caster,
                    iterator: l.pop(),
                    name: focus.iterator,
                    delimeter: delimeters.pop(),
                };
                focus = focus.iterator;
                evald_asgn = evald_asgn.vals[0];
            }
            let assignment = unload_type_iterator(orig);
            raw = lead + `${a} = ${assignment}`;
            l = orig_l;
            delimeters = orig_d;
        }
        else {
            raw = lead + `${a} = ${caster}(${result_chunk})`;
        }
        return add_comment(raw, e.comment);
    }
}
function MK_type_iterator(val, name, type) {
    if (val.type == "Object") {
        const obj = val;
        return {
            type: type,
            iterator: MK_type_iterator(obj.vals[0], name, type),
            name: name,
            delimeter: delimeters.pop(),
        };
    }
    else {
        return l.pop();
    }
}
async function trans_assign_expr(lead, a, env) {
    await eval_assignment_expr(a, env, [initial_frame]);
    const left = (await translate(lead, a.assigne, env)).trim();
    const right = (await trans_concat(lead, a.value, env, '+'))[0].trim();
    let out = "";
    if (a.value[0].kind == "BinaryExpr") {
        const b = a.value[0];
        const bl = (await translate(lead, b.left, env)).trim();
        if (left == bl) {
            return add_comment(`${left} ${b.operator}= ${await translate(lead, b.right, env)}`, a.comment);
        }
        else {
            return add_comment(`${left} = ${right}`, a.comment);
        }
    }
    else {
        return add_comment(`${left} = ${right}`, a.comment);
    }
}
async function cast(lead, expr, require, env) {
    const caster = type_to_caster(require);
    if (await resolve_data_type(expr, env) == require) {
        return await translate(lead, expr, env);
    }
    else {
        const raw = await translate(lead, expr, env);
        ;
        return `${caster}(${raw})`;
    }
}
async function resolve_data_type(e, env, custom_map) {
    if (e.kind == "Identifier") {
        const name = e.symbol;
        if (iterators.includes(name)) {
            return Tokens.Integer;
        }
        else {
            return var_type_map.get(e.symbol);
        }
    }
    else if (e.kind == "MemberExpr") {
        const object = e.object;
        return resolve_data_type(object, env);
    }
    else if (e.kind == "CallExpr") {
        const name = e.callee.symbol;
        switch (name) {
            case "SUBSTRING":
                return Tokens.String;
            case "LCASE":
                return Tokens.String;
            case "UCASE":
                return Tokens.String;
            case "LENGTH":
                return Tokens.Integer;
            case "RANDOM":
                if (e.args.length == 0) {
                    return Tokens.Real;
                }
                else {
                    return Tokens.Integer;
                }
            case "ROUND":
                const places = await evaluate(e.args[1], env, [initial_frame]);
                if (places.value == 0) {
                    return Tokens.Integer;
                }
                else {
                    return Tokens.Real;
                }
            case "EOF":
                return Tokens.Boolean;
            case "NUM_TO_STR":
                return Tokens.String;
            case "STR_TO_NUM":
                return Tokens.Real;
            case "DIV":
                return Tokens.Integer;
            case "MOD":
                return Tokens.Integer;
            default:
                return var_type_map.get(name);
        }
    }
    else if (e.kind == "ObjectLiteral") {
        const obj = e;
        if (obj.dataType && obj.dataType != Tokens.Null) {
            return obj.dataType;
        }
        else {
            const first = await evaluate(obj.exprs[0], env, [initial_frame]);
            return conv_runtimeval_dt(first);
        }
    }
    else {
        const rt_val = await evaluate(e, env, [initial_frame]);
        return conv_runtimeval_dt(rt_val);
    }
}
async function trans_binary_expr(lead, b, env) {
    const left = (await translate(lead, b.left, env)).trim();
    const right = (await translate(lead, b.right, env)).trim();
    const op = trans_operator(b.operator);
    if (b.bracket) {
        return `(${left} ${op} ${right})`;
    }
    else {
        return `${left} ${op} ${right}`;
    }
}
async function trans_native(lead, c, env) {
    const name = c.callee.symbol;
    const t_args = [];
    if (name == "RANDOM") {
        t_args.push(c.args[0] ? await translate(lead, c.args[0], env) : '');
        t_args.push(c.args[1] ? await translate(lead, c.args[1], env) : '');
    }
    else {
        for (let i = 0; i < fn_args_size[name]; i++) {
            if (c.args[i]) {
                t_args.push(await translate(lead, c.args[i], env));
            }
            else {
                t_args.push('');
            }
        }
    }
    switch (name) {
        case "UCASE":
            return `${t_args[0]}.upper()`;
        case "LCASE":
            return `${t_args[0]}.lower()`;
        case "LENGTH":
            return `len(${t_args[0]})`;
        case "SUBSTRING":
            let start = t_args[1].trim();
            let raw_end = t_args[2];
            let end = c.args[1] && c.args[2] ? calc_plus(calc_i(start, '1'), raw_end) : '';
            return `${t_args[0]}[${calc_i(start, '1')}:${end}]`;
        case "RANDOM":
            randomUsed = true;
            if (c.args.length == 2) {
                const expr = [t_args[0], t_args[1]].filter(item => item !== '').join(', ');
                return `random.randint(${expr})`;
            }
            else if (c.args.length == 1) {
                return `random.randint(${t_args[0]})`;
            }
            else {
                return `random.random()`;
            }
        case "STR_TO_NUM":
            const numType = c.args[0] ? await resolve_data_type(c.args[0], env) : Tokens.Real;
            if (numType == Tokens.Integer) {
                return `int(${t_args[0]})`;
            }
            else {
                return `float(${t_args[0]})`;
            }
        case "NUM_TO_STR":
            return `str(${t_args[0]})`;
        case "DIV":
            return `${t_args[0]} // ${t_args[1]}`;
        case "MOD":
            return `${t_args[0]} % ${t_args[1]}`;
        case "ROUND":
            const val = t_args[0];
            const places = t_args[1];
            const expr = [val, places].filter(item => item !== '').join(', ');
            if (places === '0') {
                return `int(round(${expr}))`;
            }
            else {
                return `round(${expr})`;
            }
        case "EOF":
            const nameExpr = c.args[0];
            let name = nameExpr ? custom_file_map.get(nameExpr.text) : '';
            if (!name || name == '') {
                name = f[f.length - 1];
            }
            return `${name}.readLine() == ''`;
        default:
            return await trans_concat(lead, c.args, env, ',')[0];
    }
}
async function is_pure_string(E, env) {
    for (const e of E) {
        const type = await resolve_data_type(e, env);
        if (type != Tokens.String && type != Tokens.Char) {
            return false;
        }
    }
    return true;
}
async function MK_Concat_any(lead, E, env) {
    if (E.length == 1) {
        const type = await resolve_data_type(E[0], env);
        if (type == Tokens.String || type == Tokens.Char) {
            return await translate(lead, E[0], env);
        }
        else {
            return `str(${await translate(lead, E[0], env)})`;
        }
    }
    else {
        if (await is_pure_string(E, env)) {
            let out = "";
            for (let i = 0; i < E.length; i++) {
                const e = E[i];
                out += await translate(lead, e, env);
                if (i != E.length - 1) {
                    out += ', ';
                }
            }
            return out;
        }
        else {
            let out = 'f"';
            for (const e of E) {
                out += await conv_to_str(lead, e, env);
            }
            out += '"';
            return out;
        }
    }
}
function type_to_caster(t) {
    switch (t) {
        case Tokens.Integer:
            return "int";
        case Tokens.Real:
            return "float";
        case Tokens.String:
            return "str";
        case Tokens.Char:
            return "str";
        case Tokens.Boolean:
            return "bool";
        default:
            return "";
    }
}
function removeIfExists(array, element) {
    const index = array.indexOf(element); // find the index of the element
    if (index !== -1) { // if it exists
        array.splice(index, 1); // remove it
        return true; // indicate it was removed
    }
    return false; // element not found
}
function add_comment(raw, comment) {
    if (!comment || comment.trim() === "") {
        return raw + '\n';
    }
    else {
        return `${raw} #${comment}\n`;
    }
}
async function trans_file_use_expr(lead, fu, env) {
    const files = Array.from(custom_file_map.keys());
    const m = fu.operation == "READ" ? 'r' : fu.operation == "WRITE" ? 'w' : '';
    if (files.includes(fu.fileName)) {
        const name = custom_file_map.get(fu.fileName);
        if (m == 'r') {
            let out = "";
            for (const expr of fu.assigne) {
                const caster = type_to_caster(await resolve_data_type(expr, env));
                const assigne = await translate(lead, expr, env);
                if (caster == "" || caster == "str") {
                    out += lead + `${assigne} = ${name}.read()`;
                }
                else {
                    out += lead + `${assigne} = ${caster}(${name}.read())`;
                }
            }
            return add_comment(out, fu.comment);
        }
        else if (m == 'w') {
            const assigne = await MK_Concat_any(lead, fu.assigne, env);
            const out = lead + `${name}.write(${assigne})`;
            return add_comment(out, fu.comment);
        }
    }
    else {
        const n = l.pop();
        custom_file_map.set(fu.fileName, n);
        let out = lead + `with open("${fu.fileName}", '${m}') as ${n}:\n`;
        out += lead + '    ' + await trans_file_use_expr(lead, fu, env);
        return out;
    }
}
function get_tab_space(s) {
    const match = s.match(/^\s*/);
    return match ? match[0] : "";
}
function trans_file_expr(fl, env) {
    const m = (fl.mode == "READ") ? 'r' : (fl.mode == "WRITE") ? 'w' : '';
    const o = (fl.operation == "OPEN") ? 'open' : (fl.operation == "CLOSE") ? 'close' : '';
    let out = "";
    if (o == 'open') {
        const r = f.pop();
        custom_file_map.set(fl.fileName, r);
        out = add_comment(`${r} = ${o}("${fl.fileName}", '${m}')`, fl.comment);
    }
    else if (o == 'close') {
        out = add_comment(`${custom_file_map.get(fl.fileName)}.close()`, fl.comment);
        f.push(custom_file_map.get(fl.fileName));
    }
    return out;
}
async function trans_call_expr(lead, c, env) {
    const n = await evaluate(c.callee, env, [initial_frame]);
    const name = await translate(lead, c.callee, env);
    if (n.type == "native-fn" || natives.includes(name)) {
        return await trans_native(lead, c, env);
    }
    else {
        let out = await translate(lead, c.callee, env) + '(';
        for (let i = 0; i < c.args.length; i++) {
            const a = c.args[i];
            out += await translate(lead, a, env);
            if (i != c.args.length - 1) {
                out += ', ';
            }
        }
        out += ')';
        if (c.comment) {
            out += ' #' + c.comment;
        }
        if (c.wasCallKeywordUsed) {
            out += '\n';
        }
        return out;
    }
}
function find_comment(stmt) {
    switch (stmt.kind) {
        case "AssignmentExpr":
            return stmt.comment;
        case "CallExpr":
            return stmt.comment;
        case "CommentExpr":
            return stmt.value;
        case "FileExpr":
            return stmt.comment;
        case "FileUse":
            return stmt.comment;
        case "InputExpr":
            return stmt.comment;
        case "OutputExpr":
            return stmt.comment;
        case "ReturnStmt":
            return stmt.comment;
        case "VarDeclaration":
            return stmt.comment;
        default:
            return undefined;
    }
}
async function trans_selectionStmt(lead, s, env) {
    let out = "";
    if (s.case) {
        const conds = Array.from(s.body.keys());
        const cond = conds[0];
        const i = await translate(lead, cond.left, env);
        out += add_comment(lead + `match ${i}:`, s.header_comment);
        for (const c of conds) {
            if (c.kind == "Identifier" && c.symbol == "TRUE") {
                const raw = lead + '  case _:';
                out += add_comment(raw, s.body.get(c)[0]);
                for (const stmt of s.body.get(c)[1]) {
                    let msg = await translate(lead + '    ', stmt, env);
                    if (!msg.endsWith('\n')) {
                        msg += '\n';
                    }
                    out += msg;
                }
            }
            else {
                const raw = lead + '  case ' + await translate(lead, c.right, env) + ':';
                out += add_comment(raw, s.body.get(c)[0]);
                for (const stmt of s.body.get(c)[1]) {
                    let msg = await translate(lead + tab, stmt, env);
                    if (!(msg.endsWith('\n'))) {
                        msg += '\n';
                    }
                    out += msg;
                }
            }
        }
        if (s.footer_comment) {
            out += `${lead}#${s.footer_comment}\n\n`;
        }
        return out;
    }
    else {
        const conds = Array.from(s.body.keys());
        for (const c of conds) {
            if (c == conds[0]) {
                const expr = lead + 'if ' + await translate(lead, c, env) + ':';
                out += add_comment(expr, s.header_comment);
                for (let i = 0; i < s.body.get(c)[1].length; i++) {
                    const stmt = s.body.get(c)[1][i];
                    out += (await translate(lead + tab, stmt, env)).trimEnd();
                    if (i != (s.body.get(c)[1].length - 1)) {
                        out += '\n';
                    }
                }
            }
            else if (c.kind == "Identifier" && c.symbol == "TRUE") {
                const raw = lead + 'else:';
                out += add_comment(raw, s.body.get(c)[0]);
                for (let i = 0; i < s.body.get(c)[1].length; i++) {
                    const stmt = s.body.get(c)[1][i];
                    out += (await translate(lead + tab, stmt, env)).trimEnd();
                    if (i != (s.body.get(c)[1].length - 1)) {
                        out += '\n';
                    }
                }
            }
            else {
                const raw = lead + 'elif ' + await translate(lead, c, env) + ':';
                out += add_comment(raw, s.body.get(c)[0]);
                for (let i = 0; i < s.body.get(c)[1].length; i++) {
                    const stmt = s.body.get(c)[1][i];
                    out += (await translate(lead + tab, stmt, env)).trimEnd();
                    if (i != (s.body.get(c)[1].length - 1)) {
                        out += '\n';
                    }
                }
            }
        }
        if (s.footer_comment) {
            out += `${lead}#${s.footer_comment}\n\n`;
        }
        return out;
    }
}
async function trans_iter_stmt(lead, i, env) {
    let out = "";
    switch (i.iterationKind) {
        case "count-controlled":
            const step = i.step ? await evaluate(i.step, env, [initial_frame]) : MK_NUMBER(1, Tokens.Integer);
            if (isint(step.value)) {
                iterators.push(i.iterator.symbol);
            }
            let bit = "";
            const end = (await translate(lead, i.endVal, env)).trim();
            if (i.endVal.kind == "NumericLiteral") {
                bit = (i.endVal.value + 1).toString();
            }
            else {
                bit = end.endsWith("- 1") ? end.slice(0, -3) : end + " + 1";
            }
            bit = bit.trimEnd();
            const decl = { kind: "VarDeclaration",
                constant: false,
                identifier: [i.iterator.symbol],
                dataType: Tokens.Integer
            };
            await eval_var_declaration(decl, env, [initial_frame]);
            const chunk = step.value === 1
                ? `for ${i.iterator.symbol} in range(${(await translate(lead, i.startVal, env)).trim()}, ${bit}):`
                : `for ${i.iterator.symbol} in range(${(await translate(lead, i.startVal, env)).trim()}, ${bit}, ${step.value}):`;
            const expr = lead + chunk;
            out += add_comment(expr, i.header_comment);
            for (let j = 0; j < i.body.length; j++) {
                const s = i.body[j];
                out += await translate(lead + tab, s, env);
                if (j != (i.body.length - 1) && !out.endsWith('\n')) {
                    out += '\n';
                }
            }
            if (i.footer_comment) {
                out += `${lead}#${i.footer_comment}\n\n`;
            }
            iterators.pop();
            env.variables.delete(i.iterator.symbol);
            return out;
        case "pre-condition":
            out += add_comment(lead + `while ${await translate(lead, i.iterationCondition, env)}:`, i.header_comment);
            for (let j = 0; j < i.body.length; j++) {
                const s = i.body[j];
                out += await translate(lead + tab, s, env);
                if (j != i.body.length - 1 && !out.endsWith('\n')) {
                    out += '\n';
                }
            }
            if (i.footer_comment) {
                out += `${lead}#${i.footer_comment}\n\n`;
            }
            return out;
        case "post-condition":
            out += add_comment(lead + 'while True:', i.header_comment);
            for (let j = 0; j < i.body.length; j++) {
                const s = i.body[j];
                out += await translate(lead + tab, s, env);
                if (j != i.body.length - 1 && !out.endsWith('\n')) {
                    out += '\n';
                }
            }
            out += lead + tab + 'if ' + await translate(lead, i.iterationCondition, env) + ': break\n';
            if (i.footer_comment) {
                out += `${lead}#${i.footer_comment}\n\n`;
            }
            return out;
    }
}
function type_to_expr(type) {
    switch (type) {
        case Tokens.Integer:
            return { kind: "NumericLiteral", value: 0, numberKind: Tokens.Integer };
        case Tokens.Real:
            return { kind: "NumericLiteral", value: 0.0, numberKind: Tokens.Real };
        case Tokens.String:
            return { kind: "StringLiteral", text: "" };
        case Tokens.Char:
            return { kind: "CharString", text: "" };
        case Tokens.Boolean:
            return { kind: "Identifier", symbol: "FALSE" };
        default:
            return { kind: "NullLiteral", ln: 0 };
    }
}
async function trans_fnDecl(lead, f, env) {
    const original = new Map(var_type_map);
    const params = Array.from(f.parameters.keys());
    for (const p of params) {
        var_type_map.set(p, await resolve_data_type(f.parameters.get(p), env));
    }
    const returner = f.isProcedure ? MK_NULL() : await evaluate(f.returns, env, [initial_frame]);
    const typ = conv_runtimeval_dt(returner);
    var_type_map.set(f.name, typ);
    let out = 'def ' + f.name + '(';
    for (let i = 0; i < (f.parameters ? f.parameters.size : 0); i++) {
        const p = Array.from(f.parameters.keys())[i].split(':');
        out += p[0];
        if (i != (f.parameters.size - 1)) {
            out += ', ';
        }
        let expr = f.parameters.get(Array.from(f.parameters.keys())[i]);
        if (expr.kind == "ObjectLiteral") {
            expr = {
                kind: "ObjectLiteral",
                dataType: expr.dataType,
                indexPairs: new Map(),
                exprs: [],
                start: { kind: "NumericLiteral", value: 0, numberKind: Tokens.Integer },
                end: { kind: "NumericLiteral", value: 5, numberKind: Tokens.Integer },
                ln: expr.ln,
            };
            expr.indexPairs.set(1, [{ kind: "NumericLiteral", value: 0, numberKind: Tokens.Integer },
                { kind: "NumericLiteral", value: 0, numberKind: Tokens.Integer }]);
        }
        variables.set(p[0], expr);
    }
    out += add_comment('):', f.header_comment);
    for (let i = 0; i < f.body.length; i++) {
        const s = f.body[i];
        out += await translate(lead + tab, s, env);
        if (i != f.body.length - 1 && !out.endsWith('\n')) {
            out += '\n';
        }
    }
    if (f.footer_comment) {
        out += `#${f.footer_comment}\n\n`;
    }
    var_type_map = original;
    return out;
}
async function conv_to_int(lead, e, env) {
    switch (e.kind) {
        case "NumericLiteral":
            const num = e.numberKind;
            if (num == Tokens.Integer) {
                return String(e.value);
            }
            else {
                if (isint(e.value)) {
                    return String(e.value);
                }
                else {
                    return `int(${e.value})`;
                }
            }
        default:
            const val = await evaluate(e, env, [initial_frame]);
            const text = await translate(lead, e, env);
            if (val.type == "number") {
                if (val.numberKind == Tokens.Integer) {
                    return `${text}`;
                }
                else {
                    return `int(${text})`;
                }
            }
            else {
                return `int(${text})`;
            }
    }
}
async function trans_varDecl(lead, v, env) {
    const declaration = await eval_var_declaration(v, env, [initial_frame]);
    let over = "";
    let value = "";
    for (const name of v.identifier) {
        l = l.filter(c => c != name);
        f = f.filter(c => c != name);
        var_type_map.set(name, v.dataType);
        if (v.value) {
            variables.set(name, v.value[0]);
            const sec = await trans_concat(lead, v.value, env, ',');
            value = sec[0];
            if (value.startsWith('round(') && value.endsWith(')')) {
                const arg_check = value.split(',').length == 2;
                if (arg_check && value.charAt(value.length - 2) === '0') {
                    var_type_map.set(name, Tokens.Integer);
                }
            }
        }
        else {
            switch (v.dataType) {
                case Tokens.Real:
                    value = "0.0";
                    break;
                case Tokens.Integer:
                    value = "0";
                    break;
                case Tokens.Boolean:
                    value = "False";
                    break;
                case Tokens.String:
                    value = '""';
                    break;
                case Tokens.Char:
                    value = "''";
                    break;
                default:
                    value = "None";
                    break;
            }
        }
    }
    const msg = v.identifier.join(' = ') + ' = ' + value;
    over += add_comment(msg, v.comment);
    return over;
}
async function trans_object_literal(lead, o, env) {
    if (o.exprs && o.exprs.length > 0) {
        let out = '[';
        for (let i = 0; i < o.exprs.length; i++) {
            const e = o.exprs[i];
            out += await translate(lead, e, env);
            if (i != o.exprs.length - 1) {
                out += ', ';
            }
        }
        out += ']';
        return out;
    }
    else {
        let out = "";
        const is = l.reverse();
        const ds = Array.from(o.indexPairs.keys());
        let filler = "";
        switch (o.dataType) {
            case Tokens.String:
                filler = '""';
                break;
            case Tokens.Char:
                filler = "''";
                break;
            case Tokens.Integer:
                filler = '0';
                break;
            case Tokens.Real:
                filler = '0.0';
                break;
            case Tokens.Boolean:
                filler = "False";
                break;
            default:
                filler = "None";
        }
        let start = o.indexPairs.get(ds[ds.length - 1])[0];
        let end = o.indexPairs.get(ds[ds.length - 1])[1];
        const text_start = await translate(lead, start, env);
        const text_end = calc_plus(await translate(lead, end, env), '1');
        out = filler;
        for (let i = ds.length - 1; i >= 0; i--) {
            start = o.indexPairs.get(ds[i])[0];
            end = o.indexPairs.get(ds[i])[1];
            const text_start = await conv_to_int(lead, start, env);
            const text_end = calc_plus(await conv_to_int(lead, end, env), '1');
            out = `[${out} for ${is.shift()} in range(${text_start}, ${text_end})]`;
        }
        l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
        return out;
    }
}
function isNumeric(value) {
    return /^-?\d+$/.test(value);
}
function simplify_adjustment(lhs, op, rhs) {
    if (rhs == '0') {
        return lhs;
    }
    else if (lhs == '0') {
        return rhs;
    }
    else if (isNumeric(lhs) && isNumeric(rhs)) {
        const l_val = Number(lhs);
        const r_val = Number(rhs);
        if (op == '+') {
            return String(l_val + r_val);
        }
        else if (op == '-') {
            return String(l_val - r_val);
        }
        else {
            return `${lhs} ${op} ${rhs}`;
        }
    }
    else {
        return `${lhs} ${op} ${rhs}`;
    }
}
async function adjust_index(i, o, env) {
    const lhs = i;
    const rhs = String(o.start);
    const op = '-';
    return simplify_adjustment(lhs, op, rhs);
}
function calc_any(lhs, rhs, op) {
    switch (op) {
        case '+':
            return calc_plus(lhs, rhs);
        case '-':
            return calc_i(lhs, rhs);
        default:
            return `${lhs} ${op} ${rhs}`;
    }
}
function calc_i(lhs, rhs) {
    if (isNumeric(lhs) && isNumeric(rhs)) {
        return String(Number(lhs) - Number(rhs));
    }
    else if (lhs === '0') {
        return rhs;
    }
    else if (rhs === '0') {
        return lhs;
    }
    else {
        if (lhs.endsWith(`+ ${rhs}`)) {
            return lhs.slice(0, -3).trimEnd();
        }
        else if (lhs.startsWith(`${rhs} +`)) {
            return lhs.slice(4, lhs.length - 1);
        }
        else {
            return `${lhs} - ${rhs}`;
        }
    }
}
function calc_plus(lhs, rhs) {
    if (isNumeric(lhs) && isNumeric(rhs)) {
        return String(Number(lhs) + Number(rhs));
    }
    else if (lhs === '0') {
        return rhs;
    }
    else if (rhs === '0') {
        return lhs;
    }
    else {
        if (lhs.endsWith(`- ${rhs}`)) {
            return lhs.slice(0, -3).trimEnd();
        }
        else {
            return `${lhs} + ${rhs}`;
        }
    }
}
async function trans_memberExpr(lead, m, env) {
    let e = await translate(lead, m.object, env);
    const name = m.object.symbol;
    const obj = variables.get(name);
    if (!obj) {
        return "#Evaluation Error: Object not found!";
    }
    for (let i = 0; i < m.indexes.length; i++) {
        const ind = m.indexes[i];
        let start = await translate(lead, obj.indexPairs.get(i + 1)[0], env);
        let concept = await translate(lead, ind, env);
        concept = calc_i(concept, start);
        if (await resolve_data_type(ind, env) == Tokens.Integer) {
            e += '[' + concept + ']';
        }
        else {
            const evl = await evaluate(ind, env, [initial_frame]);
            if (evl.type == "number" && evl.numberKind == Tokens.Integer) {
                e += '[' + concept + ']';
            }
            else {
                e += '[int(' + concept + ')]';
            }
        }
    }
    return e;
}
async function conv_to_str(lead, e, env) {
    const out = await translate(lead, e, env);
    switch (e.kind) {
        case "NumericLiteral":
            const num = e.value;
            return String(num);
        case "CommentExpr":
            return '#' + e.value;
        case "StringLiteral":
            return `${e.text}`;
        case "CharString":
            return `${e.text}`;
        default:
            return `{${out}}`;
    }
}
async function trans_concat(lead, c, env, op) {
    if (!c || c.length == 1) {
        if (!c) {
            throw new Error("C is undefined");
        }
        return [await translate(lead, c[0], env), ""];
    }
    else {
        let result = 'f"';
        let comment = "";
        for (let i = 0; i < c.length; i++) {
            const expr = c[i];
            result += await conv_to_str(lead, expr, env);
        }
        result += '"';
        const out = comment !== "" ? [result, comment] : [result, ""];
        return out;
    }
}
function trans_operator(op) {
    switch (op) {
        case "AND":
            return 'and';
        case "OR":
            return 'or';
        case "NOT":
            return 'not';
        case "=":
            return '==';
        case "←":
            return '=';
        case "<>":
            return '!=';
        case "≤":
            return '<=';
        case "≥":
            return '>=';
        case '^':
            return '**';
        default:
            return op;
    }
}
