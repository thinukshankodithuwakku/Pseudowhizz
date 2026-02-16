import { MK_NULL, MK_NUMBER } from "./Value.js";
import { evaluate } from "./Interpreter.js";
import { Tokens } from "../Frontend/Lexer.js";
import { errorLog, makeError } from "../Main.js";
import { conv_runtimeval_dt, eval_assignment_expr, isint, fn_args_size } from "./Eval/Expressions.js";
import { eval_var_declaration } from "./Eval/Statements.js";
const initial_frame = {
    expr: undefined,
    ln: undefined,
    context: "<module>",
};
let natives = ["UCASE", "LCASE", "LENGTH", "SUBSTRING", "RANDOM", "STR_TO_NUM", "NUM_TO_STR", "DIV", "MOD", "ROUND", "EOF"];
export class PyT {
    constructor() {
        this.l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
        this.f = ["file20", "file19", "file18", "file17", "file16", "file15", "file14", "file13", "file12", "file11", "file10", "file9", "file8", "file7", "file6", "file5", "file4", "file3", "file2", "file1"];
        this.delimeters = [' ', ',', '|', '#', '.', '/'];
        this.custom_file_map = new Map();
        this.var_type_map = new Map();
        this.arr_bound_map = new Map();
        this.iterators = [];
        this.tab = "    ";
        this.variables = new Map();
        this.randomUsed = false;
    }
    async produce_py_program(program, env) {
        this.l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
        this.f = ["file20", "file19", "file18", "file17", "file16", "file15", "file14", "file13", "file12", "file11", "file10", "file9", "file8", "file7", "file6", "file5", "file4", "file3", "file2", "file1"];
        this.iterators = [];
        natives = ["UCASE", "LCASE", "LENGTH", "SUBSTRING", "RANDOM", "STR_TO_NUM", "NUM_TO_STR", "DIV", "MOD", "ROUND"];
        this.custom_file_map = new Map();
        let p = "# ** Python Representation Result ** \n\n# IMPORTANT! Always manually review translated scripts before excecution\n\n";
        let program_block = "";
        let errorRaised = false;
        this.randomUsed = false;
        for (const stmt of program.body) {
            if (stmt.kind == "ErrorExpr") {
                errorRaised = true;
                program_block = "";
                p = '# Cannot finish translation due to a potential syntax error\n# Evaluate your program first and check that there are no errors before translating!';
                break;
            }
            else {
                program_block += await this.translate("", stmt, env);
            }
        }
        if (this.randomUsed && !errorRaised) {
            program_block = 'import random\n\n' + program_block;
        }
        return p + program_block;
    }
    async translate(lead, astNode, env) {
        let e;
        if (!astNode) {
            return "None";
        }
        switch (astNode.kind) {
            case "Program":
                return await this.produce_py_program(astNode, env);
            case "CommentExpr":
                const out = astNode.value.trim() !== "" ? lead + '#' + astNode.value + '\n' : "";
                return out;
            case "AssignmentExpr":
                const expr = astNode;
                const m = lead + await this.trans_assign_expr(lead, expr, env);
                return m;
            case "BinaryExpr":
                return await this.trans_binary_expr(lead, astNode, env);
            case "Identifier":
                const id = astNode;
                let name = id.symbol;
                this.l = this.l.filter(c => c != name);
                this.f = this.f.filter(c => c != name);
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
                return await this.trans_input_expr(lead, astNode, env);
            case "OutputExpr":
                e = astNode;
                const as = e.value;
                const mes = (await this.trans_concat(lead, as, env, ','))[0];
                const rohe = lead + 'print(' + mes.trim() + ')';
                return this.add_comment(rohe, e.comment);
            case "MemberExpr":
                return await this.trans_memberExpr(lead, astNode, env);
            case "ObjectLiteral":
                const object = astNode;
                const start = await evaluate(object.start, env, [initial_frame]);
                const end = await evaluate(object.end, env, [initial_frame]);
                const val = await evaluate(object, env, [initial_frame]);
                return await this.trans_object_literal(lead, object, env);
            case "VarDeclaration":
                return lead + await this.trans_varDecl(lead, astNode, env);
            case "FunctionDeclaration":
                return await this.trans_fnDecl(lead, astNode, env);
            case "ReturnStmt":
                const ret = astNode;
                return lead + 'return ' + (await this.trans_concat(lead, ret.value, env, ','))[0] + '\n';
            case "SelectionStmtDeclaration":
                return await this.trans_selectionStmt(lead, astNode, env);
            case "IterationStmt":
                return await this.trans_iter_stmt(lead, astNode, env);
            case "CallExpr":
                const call = astNode;
                if (call.wasCallKeywordUsed) {
                    return lead + await this.trans_call_expr(lead, astNode, env);
                }
                else {
                    return await this.trans_call_expr(lead, astNode, env);
                }
            case "UnaryExpr":
                return await this.trans_unary_expr(lead, astNode, env);
            case "FileExpr":
                return lead + await this.trans_file_expr(astNode, env);
            case "FileUse":
                return await this.trans_file_use_expr(lead, astNode, env);
            case "NullLiteral":
                return "";
            case "EndClosureExpr":
                return "";
            default:
                throw "Cannot translate unknown AST node of kind: " + astNode.kind;
        }
    }
    async trans_unary_expr(lead, e, env) {
        const modulus = await this.translate(lead, e.right, env);
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
    unload_type_iterator(e) {
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
            const i = this.unload_type_iterator(iterator);
            return `[${i} for ${x.name} in ${e.name}.split('${e.delimeter}')]`;
        }
    }
    async trans_input_expr(lead, e, env) {
        const target = e.assigne[0];
        const assigne = e.assigne[0];
        let msg = e.promptMessage.length > 0 ? (await this.trans_concat(lead, e.promptMessage, env, '+'))[0] : '';
        const a = await this.translate(lead, e.assigne[0], env);
        const assigne_type = await this.resolve_data_type(assigne, env);
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
        const orig_l = this.l;
        const orig_d = this.delimeters;
        if (caster == "") {
            if (evald_asgn.type == "Object") {
                const orig = {
                    type: caster,
                    iterator: this.l.pop(),
                    name: result_chunk,
                    delimeter: ',',
                };
                let focus = orig;
                evald_asgn = evald_asgn.vals[0];
                while (evald_asgn.type == "Object") {
                    focus.iterator = {
                        type: caster,
                        iterator: this.l.pop(),
                        name: focus.iterator,
                        delimeter: this.delimeters.pop(),
                    };
                    focus = focus.iterator;
                    evald_asgn = evald_asgn.vals[0];
                }
                result_chunk = this.unload_type_iterator(orig);
                this.l = orig_l;
                this.delimeters = orig_d;
            }
            raw = lead + `${a} = ${result_chunk}`;
            return this.add_comment(raw, e.comment);
        }
        else {
            if (evald_asgn.type == "Object") {
                let iterator = this.l.pop();
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
                        iterator: this.l.pop(),
                        name: focus.iterator,
                        delimeter: this.delimeters.pop(),
                    };
                    focus = focus.iterator;
                    evald_asgn = evald_asgn.vals[0];
                }
                let assignment = this.unload_type_iterator(orig);
                raw = lead + `${a} = ${assignment}`;
                this.l = orig_l;
                this.delimeters = orig_d;
            }
            else {
                raw = lead + `${a} = ${caster}(${result_chunk})`;
            }
            return this.add_comment(raw, e.comment);
        }
    }
    MK_type_iterator(val, name, type) {
        if (val.type == "Object") {
            const obj = val;
            return {
                type: type,
                iterator: this.MK_type_iterator(obj.vals[0], name, type),
                name: name,
                delimeter: this.delimeters.pop(),
            };
        }
        else {
            return this.l.pop();
        }
    }
    async trans_assign_expr(lead, a, env) {
        await eval_assignment_expr(a, env, [initial_frame]);
        const left = (await this.translate(lead, a.assigne, env)).trim();
        const right = (await this.trans_concat(lead, a.value, env, '+'))[0].trim();
        let out = "";
        if (a.value[0].kind == "BinaryExpr") {
            const b = a.value[0];
            const bl = (await this.translate(lead, b.left, env)).trim();
            if (left == bl) {
                return this.add_comment(`${left} ${b.operator}= ${await this.translate(lead, b.right, env)}`, a.comment);
            }
            else {
                return this.add_comment(`${left} = ${right}`, a.comment);
            }
        }
        else {
            return this.add_comment(`${left} = ${right}`, a.comment);
        }
    }
    async cast(lead, expr, require, env) {
        const caster = this.type_to_caster(require);
        if (await this.resolve_data_type(expr, env) == require) {
            return await this.translate(lead, expr, env);
        }
        else {
            const raw = await this.translate(lead, expr, env);
            ;
            return `${caster}(${raw})`;
        }
    }
    async resolve_data_type(e, env, custom_map) {
        if (e.kind == "Identifier") {
            const name = e.symbol;
            if (this.iterators.includes(name)) {
                return Tokens.Integer;
            }
            else {
                return this.var_type_map.get(e.symbol);
            }
        }
        else if (e.kind == "MemberExpr") {
            const object = e.object;
            return this.resolve_data_type(object, env);
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
                    return this.var_type_map.get(name);
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
    async trans_binary_expr(lead, b, env) {
        const left = (await this.translate(lead, b.left, env)).trim();
        const right = (await this.translate(lead, b.right, env)).trim();
        const op = this.trans_operator(b.operator);
        if (b.bracket) {
            return `(${left} ${op} ${right})`;
        }
        else {
            return `${left} ${op} ${right}`;
        }
    }
    async trans_native(lead, c, env) {
        const name = c.callee.symbol;
        const t_args = [];
        if (name == "RANDOM") {
            t_args.push(c.args[0] ? await this.translate(lead, c.args[0], env) : '');
            t_args.push(c.args[1] ? await this.translate(lead, c.args[1], env) : '');
        }
        else {
            for (let i = 0; i < fn_args_size[name]; i++) {
                if (c.args[i]) {
                    t_args.push(await this.translate(lead, c.args[i], env));
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
                let end = c.args[1] && c.args[2] ? this.calc_plus(this.calc_i(start, '1'), raw_end) : '';
                return `${t_args[0]}[${this.calc_i(start, '1')}:${end}]`;
            case "RANDOM":
                this.randomUsed = true;
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
                const numType = c.args[0] ? await this.resolve_data_type(c.args[0], env) : Tokens.Real;
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
                let name = nameExpr ? this.custom_file_map.get(nameExpr.text) : '';
                if (!name || name == '') {
                    name = this.f[this.f.length - 1];
                }
                return `${name}.readLine() == ''`;
            default:
                return await this.trans_concat(lead, c.args, env, ',')[0];
        }
    }
    async is_pure_string(E, env) {
        for (const e of E) {
            const type = await this.resolve_data_type(e, env);
            if (type != Tokens.String && type != Tokens.Char) {
                return false;
            }
        }
        return true;
    }
    async MK_Concat_any(lead, E, env) {
        if (E.length == 1) {
            const type = await this.resolve_data_type(E[0], env);
            if (type == Tokens.String || type == Tokens.Char) {
                return await this.translate(lead, E[0], env);
            }
            else {
                return `str(${await this.translate(lead, E[0], env)})`;
            }
        }
        else {
            if (await this.is_pure_string(E, env)) {
                let out = "";
                for (let i = 0; i < E.length; i++) {
                    const e = E[i];
                    out += await this.translate(lead, e, env);
                    if (i != E.length - 1) {
                        out += ', ';
                    }
                }
                return out;
            }
            else {
                let out = 'f"';
                for (const e of E) {
                    out += await this.conv_to_str(lead, e, env);
                }
                out += '"';
                return out;
            }
        }
    }
    type_to_caster(t) {
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
    removeIfExists(array, element) {
        const index = array.indexOf(element); // find the index of the element
        if (index !== -1) { // if it exists
            array.splice(index, 1); // remove it
            return true; // indicate it was removed
        }
        return false; // element not found
    }
    add_comment(raw, comment) {
        if (!comment || comment.trim() === "") {
            return raw + '\n';
        }
        else {
            return `${raw} #${comment}\n`;
        }
    }
    async trans_file_use_expr(lead, fu, env) {
        const files = Array.from(this.custom_file_map.keys());
        const m = fu.operation == "READ" ? 'r' : fu.operation == "WRITE" ? 'w' : '';
        if (files.includes(fu.fileName)) {
            const name = this.custom_file_map.get(fu.fileName);
            if (m == 'r') {
                let out = "";
                for (const expr of fu.assigne) {
                    const caster = this.type_to_caster(await this.resolve_data_type(expr, env));
                    const assigne = await this.translate(lead, expr, env);
                    if (caster == "" || caster == "str") {
                        out += lead + `${assigne} = ${name}.read()`;
                    }
                    else {
                        out += lead + `${assigne} = ${caster}(${name}.read())`;
                    }
                }
                return this.add_comment(out, fu.comment);
            }
            else if (m == 'w') {
                const assigne = await this.MK_Concat_any(lead, fu.assigne, env);
                const out = lead + `${name}.write(${assigne})`;
                return this.add_comment(out, fu.comment);
            }
        }
        else {
            const n = this.l.pop();
            this.custom_file_map.set(fu.fileName, n);
            let out = lead + `with open("${fu.fileName}", '${m}') as ${n}:\n`;
            out += lead + '    ' + await this.trans_file_use_expr(lead, fu, env);
            return out;
        }
    }
    get_tab_space(s) {
        const match = s.match(/^\s*/);
        return match ? match[0] : "";
    }
    trans_file_expr(fl, env) {
        const m = (fl.mode == "READ") ? 'r' : (fl.mode == "WRITE") ? 'w' : '';
        const o = (fl.operation == "OPEN") ? 'open' : (fl.operation == "CLOSE") ? 'close' : '';
        let out = "";
        if (o == 'open') {
            const r = this.f.pop();
            this.custom_file_map.set(fl.fileName, r);
            out = this.add_comment(`${r} = ${o}("${fl.fileName}", '${m}')`, fl.comment);
        }
        else if (o == 'close') {
            out = this.add_comment(`${this.custom_file_map.get(fl.fileName)}.close()`, fl.comment);
            this.f.push(this.custom_file_map.get(fl.fileName));
        }
        return out;
    }
    async trans_call_expr(lead, c, env) {
        const n = await evaluate(c.callee, env, [initial_frame]);
        const name = await this.translate(lead, c.callee, env);
        if (n.type == "native-fn" || natives.includes(name)) {
            return await this.trans_native(lead, c, env);
        }
        else {
            let out = await this.translate(lead, c.callee, env) + '(';
            for (let i = 0; i < c.args.length; i++) {
                const a = c.args[i];
                out += await this.translate(lead, a, env);
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
    find_comment(stmt) {
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
    async trans_selectionStmt(lead, s, env) {
        let out = "";
        if (s.case) {
            const conds = Array.from(s.body.keys());
            const cond = conds[0];
            const i = await this.translate(lead, cond.left, env);
            out += this.add_comment(lead + `match ${i}:`, s.header_comment);
            for (const c of conds) {
                if (c.kind == "Identifier" && c.symbol == "TRUE") {
                    const raw = lead + '  case _:';
                    out += this.add_comment(raw, s.body.get(c)[0]);
                    for (const stmt of s.body.get(c)[1]) {
                        let msg = await this.translate(lead + '    ', stmt, env);
                        if (!msg.endsWith('\n')) {
                            msg += '\n';
                        }
                        out += msg;
                    }
                }
                else {
                    const raw = lead + '  case ' + await this.translate(lead, c.right, env) + ':';
                    out += this.add_comment(raw, s.body.get(c)[0]);
                    for (const stmt of s.body.get(c)[1]) {
                        let msg = await this.translate(lead + this.tab, stmt, env);
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
                    const expr = lead + 'if ' + await this.translate(lead, c, env) + ':';
                    out += this.add_comment(expr, s.header_comment);
                    for (let i = 0; i < s.body.get(c)[1].length; i++) {
                        const stmt = s.body.get(c)[1][i];
                        out += (await this.translate(lead + this.tab, stmt, env)).trimEnd();
                        if (i != (s.body.get(c)[1].length - 1)) {
                            out += '\n';
                        }
                    }
                }
                else if (c.kind == "DefaultCase") {
                    const raw = lead + 'else:';
                    out += this.add_comment(raw, s.body.get(c)[0]);
                    for (let i = 0; i < s.body.get(c)[1].length; i++) {
                        const stmt = s.body.get(c)[1][i];
                        out += (await this.translate(lead + this.tab, stmt, env)).trimEnd();
                        if (i != (s.body.get(c)[1].length - 1)) {
                            out += '\n';
                        }
                    }
                }
                else {
                    const raw = lead + 'elif ' + await this.translate(lead, c, env) + ':';
                    out += this.add_comment(raw, s.body.get(c)[0]);
                    for (let i = 0; i < s.body.get(c)[1].length; i++) {
                        const stmt = s.body.get(c)[1][i];
                        out += (await this.translate(lead + this.tab, stmt, env)).trimEnd();
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
    async trans_iter_stmt(lead, i, env) {
        let out = "";
        switch (i.iterationKind) {
            case "count-controlled":
                const step = i.step ? await evaluate(i.step, env, [initial_frame]) : MK_NUMBER(1, Tokens.Integer);
                if (isint(step.value)) {
                    this.iterators.push(i.iterator.symbol);
                }
                let bit = "";
                const end = (await this.translate(lead, i.endVal, env)).trim();
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
                    ? `for ${i.iterator.symbol} in range(${(await this.translate(lead, i.startVal, env)).trim()}, ${bit}):`
                    : `for ${i.iterator.symbol} in range(${(await this.translate(lead, i.startVal, env)).trim()}, ${bit}, ${step.value}):`;
                const expr = lead + chunk;
                out += this.add_comment(expr, i.header_comment);
                for (let j = 0; j < i.body.length; j++) {
                    const s = i.body[j];
                    out += await this.translate(lead + this.tab, s, env);
                    if (j != (i.body.length - 1) && !out.endsWith('\n')) {
                        out += '\n';
                    }
                }
                if (i.footer_comment) {
                    out += `${lead}#${i.footer_comment}\n\n`;
                }
                this.iterators.pop();
                env.variables.delete(i.iterator.symbol);
                return out;
            case "pre-condition":
                out += this.add_comment(lead + `while ${await this.translate(lead, i.iterationCondition, env)}:`, i.header_comment);
                for (let j = 0; j < i.body.length; j++) {
                    const s = i.body[j];
                    out += await this.translate(lead + this.tab, s, env);
                    if (j != i.body.length - 1 && !out.endsWith('\n')) {
                        out += '\n';
                    }
                }
                if (i.footer_comment) {
                    out += `${lead}#${i.footer_comment}\n\n`;
                }
                return out;
            case "post-condition":
                out += this.add_comment(lead + 'while True:', i.header_comment);
                for (let j = 0; j < i.body.length; j++) {
                    const s = i.body[j];
                    out += await this.translate(lead + this.tab, s, env);
                    if (j != i.body.length - 1 && !out.endsWith('\n')) {
                        out += '\n';
                    }
                }
                out += lead + this.tab + 'if ' + await this.translate(lead, i.iterationCondition, env) + ': break\n';
                if (i.footer_comment) {
                    out += `${lead}#${i.footer_comment}\n\n`;
                }
                return out;
        }
    }
    type_to_expr(type) {
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
    async trans_fnDecl(lead, f, env) {
        const original = new Map(this.var_type_map);
        const params = Array.from(f.parameters.keys());
        for (const p of params) {
            this.var_type_map.set(p, await this.resolve_data_type(f.parameters.get(p), env));
        }
        const returner = f.isProcedure ? MK_NULL() : await evaluate(f.returns, env, [initial_frame]);
        const typ = conv_runtimeval_dt(returner);
        this.var_type_map.set(f.name, typ);
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
            this.variables.set(p[0], expr);
        }
        out += this.add_comment('):', f.header_comment);
        for (let i = 0; i < f.body.length; i++) {
            const s = f.body[i];
            out += await this.translate(lead + this.tab, s, env);
            if (i != f.body.length - 1 && !out.endsWith('\n')) {
                out += '\n';
            }
        }
        if (f.footer_comment) {
            out += `#${f.footer_comment}\n\n`;
        }
        this.var_type_map = original;
        return out;
    }
    async conv_to_int(lead, e, env) {
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
                const text = await this.translate(lead, e, env);
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
    async trans_varDecl(lead, v, env) {
        const declaration = await eval_var_declaration(v, env, [initial_frame]);
        let over = "";
        let value = "";
        for (const name of v.identifier) {
            this.l = this.l.filter(c => c != name);
            this.f = this.f.filter(c => c != name);
            this.var_type_map.set(name, v.dataType);
            if (v.value) {
                this.variables.set(name, v.value[0]);
                const sec = await this.trans_concat(lead, v.value, env, ',');
                value = sec[0];
                if (value.startsWith('round(') && value.endsWith(')')) {
                    const arg_check = value.split(',').length == 2;
                    if (arg_check && value.charAt(value.length - 2) === '0') {
                        this.var_type_map.set(name, Tokens.Integer);
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
        over += this.add_comment(msg, v.comment);
        return over;
    }
    async trans_object_literal(lead, o, env) {
        if (o.exprs && o.exprs.length > 0) {
            let out = '[';
            for (let i = 0; i < o.exprs.length; i++) {
                const e = o.exprs[i];
                out += await this.translate(lead, e, env);
                if (i != o.exprs.length - 1) {
                    out += ', ';
                }
            }
            out += ']';
            return out;
        }
        else {
            let out = "";
            const is = this.l.reverse();
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
            const text_start = await this.translate(lead, start, env);
            const text_end = this.calc_plus(await this.translate(lead, end, env), '1');
            out = filler;
            for (let i = ds.length - 1; i >= 0; i--) {
                start = o.indexPairs.get(ds[i])[0];
                end = o.indexPairs.get(ds[i])[1];
                const text_start = await this.translate(lead, start, env);
                const text_end = this.calc_plus(await this.conv_to_int(lead, end, env), '1');
                out = `[${out} for ${is.shift()} in range(${text_start}, ${text_end})]`;
            }
            this.l = ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a', 'z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q', 'p', 'o', 'n', 'm', 'l', 'k', 'j', 'i'];
            return out;
        }
    }
    isNumeric(value) {
        return /^-?\d+$/.test(value);
    }
    simplify_adjustment(lhs, op, rhs) {
        if (rhs == '0') {
            return lhs;
        }
        else if (lhs == '0') {
            return rhs;
        }
        else if (this.isNumeric(lhs) && this.isNumeric(rhs)) {
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
    async adjust_index(i, o, env) {
        const lhs = i;
        const rhs = String(o.start);
        const op = '-';
        return this.simplify_adjustment(lhs, op, rhs);
    }
    calc_any(lhs, rhs, op) {
        switch (op) {
            case '+':
                return this.calc_plus(lhs, rhs);
            case '-':
                return this.calc_i(lhs, rhs);
            default:
                return `${lhs} ${op} ${rhs}`;
        }
    }
    calc_i(lhs, rhs) {
        if (this.isNumeric(lhs) && this.isNumeric(rhs)) {
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
    calc_plus(lhs, rhs) {
        if (this.isNumeric(lhs) && this.isNumeric(rhs)) {
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
    async trans_memberExpr(lead, m, env) {
        let e = await this.translate(lead, m.object, env);
        const name = m.object.symbol;
        const obj = this.variables.get(name);
        if (!obj) {
            return "#Evaluation Error: Object not found!";
        }
        for (let i = 0; i < m.indexes.length; i++) {
            const ind = m.indexes[i];
            let start = await this.translate(lead, obj.indexPairs.get(i + 1)[0], env);
            let concept = await this.translate(lead, ind, env);
            concept = this.calc_i(concept, start);
            if (await this.resolve_data_type(ind, env) == Tokens.Integer) {
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
    async conv_to_str(lead, e, env) {
        const out = await this.translate(lead, e, env);
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
    async trans_concat(lead, c, env, op) {
        if (!c || c.length == 1) {
            if (!c) {
                throw new Error("C is undefined");
            }
            return [await this.translate(lead, c[0], env), ""];
        }
        else {
            let result = 'f"';
            let comment = "";
            for (let i = 0; i < c.length; i++) {
                const expr = c[i];
                result += await this.conv_to_str(lead, expr, env);
            }
            result += '"';
            const out = comment !== "" ? [result, comment] : [result, ""];
            return out;
        }
    }
    trans_operator(op) {
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
}
export class JST {
    constructor() {
        this.var_map = new Map();
        this.imports = new Set();
        this.files = new Set();
        this.module_ref = {
            "readline-sync": 'rl',
            "fs": "fs",
        };
    }
    async trans_ternary_expr(tab, expr) {
        let out = tab + `${await this.translate('', expr.assigne)} = `;
        const stringConds = [];
        for (const cond of expr.conditions) {
            stringConds.push(await this.translate('', cond));
        }
        out += stringConds.join(' ? ') + ' : ' + await this.conc(expr.default);
        return out;
    }
    async produce_JS_program(p) {
        let program = '';
        if (errorLog.length > 0 || p.body.filter(stmt => stmt.kind == "ErrorExpr").length > 0)
            return '// Cannot finish translation due to a potential syntax error\n// Evaluate your program first and check that there are no errors before translating!';
        for (const stmt of p.body) {
            const res = await this.translate('', stmt);
            program += res;
        }
        if ([...this.imports].length > 0)
            program = [...this.imports].map(i => `const ${this.module_ref[i]} = require("${i}")`).join('\n') + '\n\n' + program;
        program = "// ## JavaScript representation result ##\n\n// IMPORTANT! Always manually review translated scripts before excecution\n\n" + program;
        if (errorLog.length > 0) {
            program = "// Cannot finish translation due to a potential runtime error.\n// Evaluate your program first and check that there are no errors before translating!";
        }
        return program;
    }
    async translate(tab, stmt, ixOvwrt = false) {
        switch (stmt.kind) {
            case "Program":
                return await this.produce_JS_program(stmt);
            case "NumericLiteral":
                return stmt.value.toString();
            case "StringLiteral":
                return `"${stmt.text}"`;
            case "Identifier":
                const name = stmt.symbol;
                if (name == "TRUE")
                    return 'true';
                else if (name == "FALSE")
                    return 'false';
                return name;
            case "CharString":
                return `'${stmt.text}'`;
            case "ObjectLiteral":
                return await this.trans_obj_literal(stmt);
            case "VarDeclaration":
                return await this.trans_var_decl(tab, stmt);
            case "BinaryExpr":
                return await this.trans_binary_expr('', stmt);
            case "UnaryExpr":
                return await this.trans_unary_expr('', stmt);
            case "AssignmentExpr":
                return await this.trans_assignment_expr(tab, stmt);
            case "OutputExpr":
                return await this.trans_output_expr(tab, stmt);
            case "InputExpr":
                return await this.trans_input_expr(tab, stmt);
            case "CallExpr":
                return await this.trans_call_expr(tab, stmt);
            case "MemberExpr":
                return await this.trans_member_expr(stmt, ixOvwrt);
            case "ReturnStmt":
                return await this.trans_return_stmt(tab, stmt);
            case "IterationStmt":
                return await this.trans_iter_stmt(tab, stmt);
            case "SelectionStmtDeclaration":
                return await this.trans_selection_stmt(tab, stmt);
            case "FunctionDeclaration":
                return await this.trans_fn_declaration(tab, stmt);
            case "FileExpr":
                return await this.trans_file_expr(tab, stmt);
            case "FileUse":
                return await this.trans_fileUse_expr(tab, stmt);
            case "CommentExpr":
                if (stmt.value.trim() === '')
                    return '';
                return tab + `//${stmt.value}\n`;
            default:
                return '';
        }
    }
    async unpack_operands(expr) {
        if (expr.kind == "BinaryExpr") {
            const be = expr;
            const operands = [];
            if (be.left.kind == "BinaryExpr") {
                const sub = await this.unpack_operands(be.left);
                sub.forEach(e => operands.push(e));
            }
            else {
                const raw = await this.translate('', be.left);
                operands.push(raw);
            }
            if (be.right.kind == "BinaryExpr") {
                const sub = await this.unpack_operands(be.right);
                sub.forEach(e => operands.push(e));
            }
            else {
                const raw = await this.translate('', be.right);
                if (be.operator == '-')
                    operands.push('-' + raw);
                else
                    operands.push(raw);
            }
            return operands;
        }
        else {
            return [await this.translate('', expr)];
        }
    }
    async trans_member_expr(expr, ixOvwrt = false) {
        let out = await this.translate('', expr.object);
        if (!this.var_map.get(expr.object.symbol)) {
            makeError(`Cannot find name '${this.var_map.get(expr.object.symbol)}'!`, "Name");
            return '';
        }
        for (let i = 0; i < expr.indexes.length; i++) {
            const start = this.var_map.get(expr.object.symbol)[1].indexPairs
                ? await this.translate('', this.var_map.get(expr.object.symbol)[1].indexPairs.get(i + 1)[0])
                : '1';
            const raw = await this.translate('', expr.indexes[i]);
            const operands = await this.unpack_operands(expr.indexes[i]);
            const ix = start == '0' ? raw : this.eval_safe([...operands, `-${start}`]);
            out += `[${ix}]`;
        }
        return out;
    }
    async trans_native_fn(call) {
        const name = call.callee.symbol.toUpperCase();
        switch (name) {
            case "LCASE":
                return `${await this.translate('', call.args[0])}.toLowerCase()`;
            case "UCASE":
                return `${await this.translate('', call.args[0])}.toUpperCase()`;
            case "LENGTH":
                return `${await this.translate('', call.args[0])}.length`.trim();
            case "RANDOM":
                if (call.args.length == 2 && call.args[0] && call.args[1]) {
                    const min = await this.translate('', call.args[0]);
                    const max = await this.translate('', call.args[1]);
                    const up = this.eval_safe([max, `-${min}`]);
                    const out = min == '0'
                        ? `Math.round(Math.random() * (${up}))`
                        : `Math.round(Math.random() * (${up})) + ${min}`;
                    return out;
                }
                return `Math.random()`;
            case "STR_TO_NUM":
                return `parseFloat(${await this.translate('', call.args[0])})`;
            case "NUM_TO_STR":
                return `${await this.translate('', call.args[0])}.toString()`;
            case "SUBSTRING":
                const end = this.eval_safe([await this.translate('', call.args[1]), await this.translate('', call.args[2]), '1']);
                return `${await this.translate('', call.args[0])}.substring(${await this.translate('', call.args[1])}, ${end})`;
            case "ROUND":
                if (await this.translate('', call.args[1]) == '0') {
                    return `Math.round(${await this.translate('', call.args[0])})`;
                }
                const obj = await this.translate('', call.args[0]);
                const dP = await this.translate('', call.args[1]);
                return `Math.round((${obj} * (10 ** ${dP}))) / (10 ** ${dP})`;
            case "DIV":
                return `Math.floor(${await this.translate('', call.args[0])} / ${await this.translate('', call.args[1])})`;
            case "MOD":
                return `(${await this.translate('', call.args[0])} % ${await this.translate('', call.args[1])})`;
            case "EOF":
                this.imports.add('fs');
                const name = call.args[0].text;
                const ref = this.files.has(name) ? this.parse_file_name(name) : `fs.readFileSync(${await this.translate('', call.args[0])}, 'utf-8').split('\\n')`;
                return `${ref}.length === 0`;
            default:
                return await this.translate('', call);
        }
    }
    eval_safe(args) {
        const exprs = args.filter(arg => Number.isNaN(Number(arg)))
            .map(expr => expr.startsWith('-') ? '- ' + expr.slice(1) : '+ ' + expr);
        const nums = args.filter(arg => !Number.isNaN(Number(arg))).map(Number);
        let sum = nums.reduce((a, n) => a + n).toString();
        if (sum.startsWith('-'))
            sum = ' - ' + sum.slice(1);
        else
            sum = ' + ' + sum;
        const e = exprs.join(' ');
        let out = '';
        if (sum.trim() == '0' || sum.trim() == '+ 0' || sum.trim() == '- 0') {
            let out_e = e.trim();
            if (out_e.startsWith('+') || out_e.startsWith('-'))
                out_e = out_e.slice(1).trim();
            return out_e;
        }
        if (e.startsWith('-') && !sum.trim().startsWith('-'))
            out = ((sum.trim().startsWith('+') ? sum.slice(1).trim() + ' ' : sum.trim() + ' ') + e).trim();
        else
            out = (e + sum).trim();
        if (out.startsWith('+'))
            out = out.slice(1).trim();
        return out;
    }
    async trans_obj_literal(expr) {
        const empty_array = (expr.start.kind == "NumericLiteral" && expr.start.value == 1) && (expr.end.kind == "NumericLiteral" && expr.end.value == 1) && expr.exprs.length == 0;
        if (empty_array || expr.exprs && expr.exprs.length > 0)
            return `[${await this.conc(expr.exprs)}]`;
        let filler = '';
        switch (expr.dataType) {
            case Tokens.Integer:
                filler = '0';
                break;
            case Tokens.Real:
                filler = '0.0';
                break;
            case Tokens.Boolean:
                filler = 'false';
                break;
            case Tokens.String:
                filler = '""';
                break;
            case Tokens.Char:
                filler = `''`;
                break;
            default:
                filler = 'null';
        }
        const dims = Array.from(expr.indexPairs.keys());
        let ub = await this.translate('', expr.indexPairs.get(dims[dims.length - 1])[1]);
        let lb = await this.translate('', expr.indexPairs.get(dims[dims.length - 1])[0]);
        let range = lb == '0' ? ub : this.eval_safe([ub, `-${lb}`, '1']);
        let out = `Array(${range}).fill(${filler})`;
        if (dims.length == 1)
            return out;
        for (let i = dims.length - 2; i >= 0; i--) {
            ub = await this.translate('', expr.indexPairs.get(dims[i])[1]);
            lb = await this.translate('', expr.indexPairs.get(dims[i])[0]);
            range = lb == '0' ? ub : this.eval_safe([ub, `-${lb}`, '1']);
            out = `Array.from({length: ${range}}, () => ${out})`;
        }
        return out;
    }
    async conc(exprs, m = ',') {
        const translated_exprs = [];
        for (const e of exprs) {
            translated_exprs.push(await this.translate('', e));
        }
        const out = translated_exprs.join(`${m} `);
        return out;
    }
    async trans_var_decl(tab, decl) {
        let out = tab + ((decl.constant) ? 'const ' : 'let ');
        out += decl.identifier.join(', ');
        if (decl.value)
            out += ' = ' + await this.conc(decl.value);
        if (out.endsWith('\n'))
            out = out.slice(0, -1);
        out += ';';
        decl.identifier.forEach(name => this.var_map.set(name, [decl.dataType, decl.value[0]]));
        return this.add_comment(out, decl.comment);
    }
    async trans_assignment_expr(tab, expr) {
        if (expr.value.length == 1 && expr.value[0].kind == "BinaryExpr"
            && JSON.stringify(expr.value[0].left) === JSON.stringify(expr.assigne)) {
            const lhs = await this.translate('', expr.assigne);
            const op = ' ' + this.trans_op(expr.value[0].operator) + '= ';
            const rhs = await this.translate('', expr.value[0].right);
            if (rhs.trim() == '1' && op.trim() == '+=')
                return this.add_comment(tab + lhs + '++', expr.comment);
            else if (rhs.trim() == '1' && op.trim() == '-=')
                return this.add_comment(tab + lhs + '--', expr.comment);
            let out = tab + lhs + op + rhs;
            return this.add_comment(out, expr.comment);
        }
        else {
            let out = tab + await this.translate('', expr.assigne) + ' = ' + await this.conc(expr.value, ' +') + ';';
            return this.add_comment(out, expr.comment);
        }
    }
    async trans_output_expr(tab, expr) {
        let out = tab + 'console.log(' + await this.conc(expr.value) + ');';
        return this.add_comment(out, expr.comment);
    }
    type_to_caster(tk) {
        switch (tk) {
            case Tokens.Integer:
                return 'parseInt';
            case Tokens.Real:
                return 'parseFloat';
            case Tokens.String:
                return 'String';
            case Tokens.Char:
                return 'String';
            case Tokens.Boolean:
                return 'Boolean';
            default:
                return '';
        }
    }
    resolve_data_type(expr) {
        switch (expr.kind) {
            case "NumericLiteral":
                return expr.numberKind;
            case "StringLiteral":
                return Tokens.String;
            case "CharString":
                return Tokens.Char;
            case "Identifier":
                const name = expr.symbol;
                if (name == "TRUE" || name == "FALSE")
                    return Tokens.Boolean;
                if (!this.var_map.get(name)) {
                    makeError(`Cannot find name '${this.var_map.get(name)}'!`, "Name");
                }
                return this.var_map.get(name)[0];
            case "ObjectLiteral":
                return expr.dataType;
            case "CallExpr":
                const call = expr;
                const call_name = call.callee.symbol.toUpperCase();
                switch (call_name) {
                    case "LCASE":
                        return Tokens.String;
                    case "UCASE":
                        return Tokens.String;
                    case "LENGTH":
                        return Tokens.Integer;
                    case "RANDOM":
                        return call.args.length == 2 ? Tokens.Integer : Tokens.Real;
                    case "STR_TO_NUM":
                        return Tokens.Real;
                    case "NUM_TO_STR":
                        return Tokens.String;
                    case "SUBSTRING":
                        return Tokens.String;
                    case "ROUND":
                        return Tokens.Real;
                    case "DIV":
                        return Tokens.Integer;
                    case "MOD":
                        return Tokens.Integer;
                    case "EOF":
                        return Tokens.Boolean;
                    default:
                        if (!this.var_map.get(call.callee.symbol)) {
                            makeError(`Cannot find name '${this.var_map.get(call.callee.symbol)}'!`, "Name");
                        }
                        return this.var_map.get(call.callee.symbol)[0];
                }
            default:
                return Tokens.Any;
        }
    }
    async trans_input_expr(tab, expr) {
        this.imports.add('readline-sync');
        let out = tab + `${await this.translate('', expr.assigne[0])} = rl.question(${await this.conc(expr.promptMessage)});`;
        if (this.resolve_data_type(expr.assigne[0]) != Tokens.String && this.resolve_data_type(expr.assigne[0]) != Tokens.Char && this.type_to_caster(this.resolve_data_type(expr.assigne[0])) != '') {
            out = tab + `${await this.translate('', expr.assigne[0])} = ${this.type_to_caster(this.resolve_data_type(expr.assigne[0]))}(rl.question(${await this.conc(expr.promptMessage)}));`;
        }
        return this.add_comment(out, expr.comment);
    }
    async trans_call_expr(tab, expr) {
        const name = expr.callee.symbol.toUpperCase();
        const e = natives.includes(name) ? await this.trans_native_fn(expr) : expr.callee.symbol + '(' + await this.conc(expr.args) + ')';
        let out = tab + e;
        if (expr.wasCallKeywordUsed) {
            out + ';';
            return this.add_comment(out, expr.comment);
        }
        else {
            return out;
        }
    }
    async trans_binary_expr(tab, expr) {
        let raw = `${await this.translate(tab, expr.left)} ${this.trans_op(expr.operator)} ${await this.translate(tab, expr.right)}`;
        if (expr.bracket)
            raw = `(${raw})`;
        return raw;
    }
    async trans_unary_expr(tab, expr) {
        const op = expr.operator == '+' ? '' : this.trans_op(expr.operator);
        let raw = `${op}${await this.translate(tab, expr.right)}`;
        if (expr.bracket)
            raw = `(${raw})`;
        return raw;
    }
    async trans_return_stmt(tab, stmt) {
        let out = tab + 'return ' + await this.conc(stmt.value) + ';';
        return this.add_comment(out, stmt.comment);
    }
    async trans_iter_stmt(tab, stmt) {
        let out = '';
        switch (stmt.iterationKind) {
            case "count-controlled":
                let step = '';
                if (stmt.step) {
                    const str = (await this.translate(tab, stmt.step)).trim();
                    if (str == '-1')
                        step = '--';
                    else if (str.startsWith('-'))
                        step = `-= ${str.slice(1)}`;
                    else if (str == '1')
                        step = '++';
                    else
                        step = `+= ${str}`;
                }
                else
                    step = '++';
                let op = step.startsWith('-') ? '>=' : '<=';
                const i = stmt.iterator.symbol;
                out = tab + this.add_comment(`for(let ${i} = ${await this.translate('', stmt.startVal)}; ${i} ${op} ${await this.translate('', stmt.endVal)}; ${i}${step}) {`, stmt.header_comment);
                for (const s of stmt.body) {
                    if (s.kind != "EndClosureExpr")
                        out += await this.translate(tab + '    ', s);
                }
                if (stmt.body.filter(s => s.kind != "EndClosureExpr").length == 1 && (!stmt.footer_comment || stmt.footer_comment.trim() == '')) {
                    return tab + this.add_comment(`for(let ${i} = ${await this.translate('', stmt.startVal)}; ${i} ${op} ${await this.translate('', stmt.endVal)}; ${i}${step}) ${await this.translate('', stmt.body[0])}`, stmt.header_comment);
                }
                out += tab + this.add_comment('}', stmt.footer_comment);
                return out;
            case "pre-condition":
                out = tab + this.add_comment(`while(${await this.translate(tab, stmt.iterationCondition)}) {`, stmt.header_comment);
                if ((!stmt.footer_comment || stmt.footer_comment.trim() == '') && stmt.body.filter(s => s.kind != "EndClosureExpr").length == 1)
                    return this.add_comment(`while(${await this.translate(tab, stmt.iterationCondition)}) ${await this.translate('', stmt.body[0])}`, stmt.header_comment);
                for (const s of stmt.body) {
                    if (s.kind != "EndClosureExpr")
                        out += await this.translate(tab + '    ', s);
                }
                out += tab + this.add_comment('}', stmt.footer_comment);
                return out;
            case "post-condition":
                out = tab + this.add_comment('do {', stmt.header_comment);
                for (const s of stmt.body) {
                    if (s.kind != "EndClosureExpr")
                        out += await this.translate(tab + '    ', s);
                }
                out += tab + this.add_comment(`} while(${await this.negate_condition(stmt.iterationCondition)});`, stmt.footer_comment);
                return out;
            default:
                return '';
        }
    }
    inverse_op(op) {
        switch (op) {
            case '=':
                return '!=';
            case '<>':
                return '==';
            case '>':
                return '<=';
            case '<':
                return '>=';
            case '<=':
                return '>';
            case '>=':
                return '<';
            default:
                return op;
        }
    }
    async negate_condition(c) {
        if (c.kind != "BinaryExpr")
            return await this.translate('', c);
        const cond = c;
        const lhs = await this.translate('', cond.left);
        const rhs = await this.translate('', cond.right);
        const inv = this.inverse_op(cond.operator);
        if (cond.operator == inv)
            return `!(${lhs} ${cond.operator} ${rhs})`;
        else
            return `${lhs} ${inv} ${rhs}`;
    }
    async trans_selection_stmt(tab, stmt) {
        if (stmt.case) {
            const conds = [...stmt.body.keys()];
            const identifier = (await this.translate('', conds[0].left)).trim();
            let out = tab + this.add_comment(`switch(${identifier}) {`, stmt.header_comment);
            for (const cond of conds) {
                if (cond.kind == "DefaultCase") {
                    out += tab + '    ' + this.add_comment(`default:`, stmt.body.get(cond)[0]);
                    for (const s of stmt.body.get(cond)[1]) {
                        out += await this.translate(tab + '        ', s);
                    }
                }
                else {
                    const return_used = stmt.body.get(cond)[1].map(stmt => stmt.kind).includes("ReturnStmt");
                    const case_val = (await this.translate('', cond.right)).trim();
                    out += tab + '    ' + this.add_comment(`case ${case_val}:`, stmt.body.get(cond)[0]);
                    for (const s of stmt.body.get(cond)[1]) {
                        out += await this.translate(tab + '        ', s);
                    }
                    if (!return_used)
                        out += tab + '        ' + 'break;\n';
                }
            }
            out += tab + this.add_comment('}', stmt.footer_comment);
            return out;
        }
        else {
            const conds = [...stmt.body.keys()];
            let out = '';
            for (let i = 0; i < conds.length; i++) {
                const cond = conds[i];
                if (i == 0) {
                    out += tab + this.add_comment(`if(${await this.translate(tab, cond)}) {`, stmt.body.get(cond)[0]);
                }
                else if (cond.kind == "DefaultCase") {
                    out += tab + this.add_comment(`else {`, stmt.body.get(cond)[0]);
                }
                else {
                    out += tab + this.add_comment(`else if(${await this.translate(tab, cond)}) {`, stmt.body.get(cond)[0]);
                }
                for (const s of stmt.body.get(cond)[1]) {
                    out += await this.translate(tab + '  ', s);
                }
                out += tab + '}';
                if (i != conds.length - 1)
                    out += '\n';
            }
            return this.add_comment(out, stmt.footer_comment);
        }
    }
    async trans_fn_declaration(tab, decl) {
        this.var_map.set(decl.name, [this.resolve_data_type(decl.returns), decl]);
        let out = tab + `function ${decl.name}(`;
        out += decl.parameters ? [...decl.parameters.keys()].join(', ') : '';
        for (const param of [...decl.parameters.keys()]) {
            const expr = decl.parameters.get(param);
            let dataType;
            switch (expr.kind) {
                case "ObjectLiteral":
                    dataType = expr.dataType;
                    break;
                case "StringLiteral":
                    dataType = Tokens.String;
                    break;
                case "CharString":
                    dataType = Tokens.Char;
                    break;
                case "NumericLiteral":
                    dataType = expr.numberKind;
                    break;
                case "Identifier":
                    dataType = Tokens.Boolean;
                    break;
                default:
                    dataType = Tokens.Null;
            }
            this.var_map.set(param, [dataType, expr]);
        }
        out += this.add_comment(') {', decl.header_comment);
        for (const stmt of decl.body) {
            out += await this.translate(tab + '    ', stmt, true);
        }
        out += tab + this.add_comment('}', decl.footer_comment);
        for (const param of [...decl.parameters.keys()])
            this.var_map.delete(param);
        return out;
    }
    trans_op(op) {
        switch (op) {
            case 'AND':
                return '&&';
            case 'OR':
                return '||';
            case 'NOT':
                return '!';
            case '^':
                return '**';
            case '=':
                return '==';
            case '<>':
                return '!=';
            case "≤":
                return '<=';
            case "≥":
                return '>=';
            default:
                return op;
        }
    }
    parse_file_name(raw) {
        let acc = '';
        const raw_spl = raw.split('');
        while (raw_spl.length > 0 && raw_spl[0] != '.') {
            acc += raw_spl.shift();
        }
        return acc;
    }
    async trans_file_expr(tab, expr) {
        this.imports.add('fs');
        this.files.add(expr.fileName);
        let out = tab + `const ${this.parse_file_name(expr.fileName)} = fs.readFileSync("${expr.fileName}", 'utf-8').split('\\n');`;
        return this.add_comment(out, expr.comment);
    }
    async trans_fileUse_expr(tab, expr) {
        this.imports.add('fs');
        let out = '';
        const name = this.parse_file_name(expr.fileName);
        if (!this.files.has(expr.fileName)) {
            this.files.add(expr.fileName);
            out = tab + `const ${this.parse_file_name(expr.fileName)} = fs.readFileSync("${expr.fileName}", 'utf-8').split('\\n');\n`;
        }
        const names_array = [];
        for (const assigne of expr.assigne) {
            names_array.push(await this.translate('', assigne));
        }
        let names = names_array.join(' = ');
        if (expr.operation == "READ") {
            out += tab + `${names} = ${name}.shift();`;
        }
        else {
            out = tab + `fs.writeFileSync("${expr.fileName}", ${await this.conc(expr.assigne)} + '\\n');`;
        }
        return this.add_comment(out, expr.comment);
    }
    add_comment(raw, comment) {
        return comment && comment.trim() !== '' && comment.trim() !== '\n' && comment.trim() !== '\t' ? `${raw} //${comment}\n` : raw + '\n';
    }
}
