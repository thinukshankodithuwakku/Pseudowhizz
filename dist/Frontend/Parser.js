import { lineNumbers, Tokens, tokenize } from "./Lexer.js";
import { errorLog, makeError } from "../Main.js";
export default class Parser {
    constructor() {
        this.tokens = [];
    }
    parse_Stmt() {
        if (errorLog.length > 0) {
            console.log("When parsing stmt, error log was: " + errorLog);
            return {
                kind: "ErrorExpr",
            };
        }
        else {
            let parsedStmt;
            switch (this.at().type) {
                case Tokens.Declare:
                    console.log("Attempt at declaring variable");
                    parsedStmt = this.parse_var_declaration();
                    break;
                case Tokens.Constant:
                    console.log("Attempt at declaring constant");
                    parsedStmt = this.parse_var_declaration();
                    break;
                case Tokens.Function:
                    console.log("Attempt at declaring function");
                    parsedStmt = this.parse_fn_declaration();
                    break;
                case Tokens.Procedure:
                    console.log("Attempt at declaring procedure");
                    parsedStmt = this.parse_fn_declaration();
                    break;
                case Tokens.If:
                    console.log("Attempt at declaring if statement");
                    parsedStmt = this.parse_selectionStmt_declaration();
                    break;
                case Tokens.Case:
                    console.log("Attempt at declaring case statement");
                    parsedStmt = this.parse_selectionStmt_declaration();
                    break;
                case Tokens.For:
                    console.log("Attempt at declaring FOR loop");
                    parsedStmt = this.parse_iterationStmt();
                    break;
                case Tokens.Repeat:
                    console.log("Attempt at declaring repeat loop");
                    parsedStmt = this.parse_iterationStmt();
                    break;
                case Tokens.While:
                    console.log("Attempt at declaring while loop");
                    parsedStmt = this.parse_iterationStmt();
                    break;
                case Tokens.Output:
                    console.log("Attempt at outputting");
                    parsedStmt = this.parse_output_expr();
                    break;
                case Tokens.Input:
                    console.log("Attempt at inputting");
                    parsedStmt = this.parse_input_expr();
                    break;
                case Tokens.Openfile:
                    parsedStmt = this.parse_file_expr();
                    break;
                case Tokens.Closefile:
                    parsedStmt = this.parse_file_expr();
                    break;
                case Tokens.Readfile:
                    parsedStmt = this.parse_file_use_expr();
                    break;
                case Tokens.Writefile:
                    parsedStmt = this.parse_file_use_expr();
                    break;
                case Tokens.UnaryOperator:
                    parsedStmt = this.parse_unary_expression();
                    break;
                case Tokens.NOT:
                    parsedStmt = this.parse_logic_expression();
                    break;
                case Tokens.Return:
                    this.eat();
                    const returnStmt = {
                        kind: "ReturnStmt",
                        value: this.parse_expr(),
                    };
                    parsedStmt = returnStmt;
                    break;
                default:
                    parsedStmt = this.parse_expr();
            }
            return parsedStmt;
        }
    }
    parse_file_use_expr() {
        const operation = (this.eat().value == "READFILE")
            ? "READ"
            : "WRITE";
        if (this.at().type == Tokens.OpenBracket) {
            this.eat();
        }
        const fileName = this.expect(Tokens.Filename, "Invalid file type, or file does not exist!").value;
        console.log("Expecting comma, but got " + Tokens[this.at().type]);
        this.expect(Tokens.Comma, "Expecting comma here!");
        let assigne = [];
        while (this.not_eol()) {
            assigne.push(this.parse_expr());
            if (this.at().type == Tokens.Comma) {
                this.eat();
                if (!this.not_eol()) {
                    return this.MK_Err("Expression expected!");
                }
            }
        }
        if (this.at().type == Tokens.CloseBracket) {
            this.eat();
        }
        const fileUseExpr = {
            kind: "FileUse",
            operation: operation,
            fileName: fileName,
            assigne: assigne,
        };
        return fileUseExpr;
    }
    parse_file_expr() {
        const operation = this.eat().value; //Consumes the OPEN or CLOSE token
        const fileName = this.expect(Tokens.Filename, "Invalid file name!").value;
        if (operation == "OPENFILE") {
            this.expect(Tokens.For, "Expecting 'FOR' keyword here!");
            const mode = this.eat().value;
            this.expect(Tokens.EOL, "Expecting new line!");
            const fileExpr = {
                kind: "FileExpr",
                operation: (operation == "OPENFILE")
                    ? "OPEN"
                    : "CLOSE",
                mode: mode,
                fileName: fileName,
            };
            return fileExpr;
        }
        else {
            const fileExpr = {
                kind: "FileExpr",
                operation: "CLOSE",
                fileName: fileName
            };
            return fileExpr;
        }
    }
    not_eof() {
        return this.tokens.length > 0 && this.tokens[0].type != Tokens.EOF;
    }
    at() {
        return this.tokens[0];
    }
    eat() {
        const wouldBe = this.tokens.shift();
        lineNumbers.shift();
        return wouldBe;
    }
    show_ln() {
        return lineNumbers.shift();
    }
    expect(type, errMsg) {
        //console.log(this.tokens)
        const prev = this.tokens.shift();
        const ln = this.show_ln();
        if (!prev || prev.type != type) {
            this.MK_Err(errMsg);
        }
        return prev;
    }
    scanValidDataType() {
        for (let i = 0; i < this.tokens.length; i++) {
            if (this.isValidDataType(this.tokens[i])) {
                switch (this.tokens[i].type) {
                    case Tokens.Any:
                        return Tokens.Any;
                    case Tokens.Real:
                        return Tokens.Real;
                    case Tokens.Integer:
                        return Tokens.Integer;
                    case Tokens.String:
                        return Tokens.String;
                    case Tokens.Char:
                        return Tokens.Char;
                    case Tokens.Boolean:
                        return Tokens.Boolean;
                    default:
                        return Tokens.Null;
                }
            }
            else if (this.tokens[i].type === Tokens.EOL
                || this.tokens[i].type == Tokens.EOF) {
                return Tokens.Null;
            }
        }
    }
    produceAST(src) {
        this.tokens = tokenize(src);
        if (this.tokens[this.tokens.length - 1].type !== Tokens.EOF) {
            this.tokens.push({
                value: "EOF",
                type: Tokens.EOF,
                typeName: Tokens[Tokens.EOF],
            });
        }
        const program = {
            kind: "Program",
            body: [],
        };
        let parseCapacity = 0;
        let stmt;
        stmt = {
            kind: "NullLiteral",
            value: null,
        };
        while (this.not_eof() && parseCapacity < 100 && errorLog.length == 0 && (stmt.kind !== "ErrorExpr")) {
            if (errorLog.length > 0) {
                console.log("Error detected!");
            }
            stmt = this.parse_Stmt();
            if (stmt == null) {
                stmt = {
                    kind: "NullLiteral",
                    value: null,
                };
            }
            program.body.push(stmt);
            parseCapacity++;
        }
        if (errorLog.length > 0) {
            console.log("When producing AST, error occured...");
            const err = { kind: "ErrorExpr" };
            const errProgram = { kind: "Program", body: [err] };
            return errProgram;
        }
        else {
            console.log("PROGRAM: " + JSON.stringify(program));
            return program;
        }
    }
    parse_input_expr(message) {
        if (this.at().type == Tokens.Input) {
            this.eat(); //Consumes the 'INPUT' token
            if (!this.not_eol()) {
                return this.MK_Err(`Expression expected!`);
            }
            else {
                let assigne = [];
                while (this.not_eol()) {
                    assigne.push(this.parse_expr());
                    if (this.at().type == Tokens.Comma) {
                        this.eat();
                        if (!this.not_eol()) {
                            return this.MK_Err("Expression expected!");
                        }
                    }
                }
                this.expect(Tokens.EOL, "Expecting end of line!");
                const assignmentExpr = {
                    kind: "InputExpr",
                    assigne: assigne,
                    promptMessage: message,
                };
                return assignmentExpr;
            }
        }
        else {
            return this.parse_Stmt();
        }
    }
    parse_iterationStmt() {
        const rawKeyword = this.eat().value;
        let iterationKind = "";
        switch (rawKeyword) {
            case "FOR":
                iterationKind = "count-controlled";
                break;
            case "WHILE":
                iterationKind = "pre-condition";
                break;
            case "REPEAT":
                iterationKind = "post-condition";
                break;
            default:
                return this.MK_Err("Not a valid iteration kind!");
        }
        if (iterationKind == "count-controlled") {
            const iterator = {
                kind: "Identifier",
                symbol: this.expect(Tokens.Identifier, "Expecting identifier name!").value,
            };
            this.expect(Tokens.Assign, "Expecting assignment token!");
            const startVal = this.parse_expr();
            this.expect(Tokens.To, "Expecting 'TO' keyword here!");
            const endVal = this.parse_expr();
            let step;
            if (this.at().type == Tokens.Step) {
                this.eat(); //Consumes the STEP token
                step = this.parse_expr();
            }
            this.expect(Tokens.EOL, "Expecting new line!");
            let body = [];
            let returnExpressions = [];
            while (this.not_eof() && this.at().type !== Tokens.Next) {
                while (this.at().type === Tokens.EOL) {
                    this.eat();
                }
                if (this.at().type !== Tokens.Next) {
                    if (this.at().type == Tokens.Return) {
                        this.eat();
                        if (!this.not_eol()) {
                            return this.MK_Err(`Expression expected!`);
                        }
                        else {
                            const parsed = this.parse_Stmt();
                            if (parsed.kind == "ErrorExpr") {
                                return parsed;
                            }
                            else {
                                returnExpressions.push(parsed);
                                body.push(parsed);
                            }
                        }
                    }
                    else {
                        const parsed = this.parse_Stmt();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else if (parsed.kind == "SelectionStmtDeclaration") {
                            if (parsed.returns.length > 0) {
                                for (const expr of parsed.returns) {
                                    returnExpressions.push(expr);
                                }
                            }
                            body.push(parsed);
                        }
                        else if (parsed.kind == "IterationStmt") {
                            if (parsed.returnExpressions.length > 0) {
                                for (const expr of parsed.returnExpressions) {
                                    returnExpressions.push(expr);
                                }
                            }
                            body.push(parsed);
                        }
                        else {
                            body.push(parsed);
                        }
                    }
                }
            }
            body.push({ kind: "EndClosureExpr" });
            this.expect(Tokens.Next, "Expecting next keyword!");
            if (this.at().type != Tokens.Identifier) {
                return this.MK_Err("Identifier expected or none provided!");
            }
            const endIterator = {
                kind: "Identifier",
                symbol: this.expect(Tokens.Identifier, "Expecting identifier name!").value,
            };
            if (iterator.symbol != endIterator.symbol) {
                return this.MK_Err(`Identifier '${iterator.symbol}' does not match identifier '${endIterator.symbol}'`);
            }
            const iterationStmt = {
                kind: "IterationStmt",
                iterationKind: "count-controlled",
                iterator: iterator,
                startVal: startVal,
                endVal: endVal,
                step: (step != undefined)
                    ? step
                    : {
                        kind: "NumericLiteral",
                        numberKind: Tokens.Integer,
                        value: 1
                    },
                body: body,
                returnExpressions: returnExpressions,
            };
            return iterationStmt;
        }
        else if (iterationKind == "post-condition") {
            this.expect(Tokens.EOL, "Expecting new line!");
            let body = [];
            let returnExpressions = [];
            while (this.not_eof() && this.at().type !== Tokens.Until) {
                while (this.at().type == Tokens.EOL) {
                    this.eat();
                }
                if (this.at().type !== Tokens.Until) {
                    if (this.at().type == Tokens.Return) {
                        this.eat();
                        if (!this.not_eol()) {
                            return this.MK_Err("Expression expected!");
                        }
                        else {
                            const parsed = this.parse_expr();
                            if (parsed.kind == "ErrorExpr") {
                                return parsed;
                            }
                            else {
                                returnExpressions.push(parsed);
                                body.push(parsed);
                            }
                        }
                    }
                    else {
                        const parsed = this.parse_Stmt();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else {
                            body.push(parsed);
                        }
                    }
                }
            }
            body.push({ kind: "EndClosureExpr" });
            this.expect(Tokens.Until, "Expecting 'UNTIL' keyword here!");
            const condition = this.parse_expr();
            const repeatLoop = {
                kind: "IterationStmt",
                iterationKind: "post-condition",
                iterationCondition: condition,
                body: body,
                returnExpressions: returnExpressions,
            };
            return repeatLoop;
        }
        else if (iterationKind == "pre-condition") {
            const condition = this.parse_expr();
            this.expect(Tokens.Do, "Expecting 'DO' keyword here!");
            this.expect(Tokens.EOL, "Expecting new line!");
            let body = [];
            let returnExpressions = [];
            while (this.not_eof() && this.at().type !== Tokens.Endwhile) {
                while (this.at().type == Tokens.EOL) {
                    this.eat();
                }
                if (this.at().type !== Tokens.Endwhile) {
                    if (this.at().type == Tokens.Return) {
                        this.eat();
                        if (!this.not_eol()) {
                            return this.MK_Err("Expression expected!");
                        }
                        const parsed = this.parse_expr();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else {
                            returnExpressions.push(parsed);
                            body.push(parsed);
                        }
                    }
                    else {
                        const parsed = this.parse_Stmt();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else {
                            body.push(parsed);
                        }
                    }
                }
            }
            body.push({ kind: "EndClosureExpr" });
            this.expect(Tokens.Endwhile, "Expecting 'ENDWHILE' keyword after while loop declaration!");
            const whileLoop = {
                kind: "IterationStmt",
                iterationKind: "pre-condition",
                iterationCondition: condition,
                body: body,
                returnExpressions: returnExpressions,
            };
            return whileLoop;
        }
        else {
            return this.MK_Err("Invalid iteration statement!");
        }
    }
    not_eol() {
        console.log("Not eol has been called!");
        if (this.at().type === Tokens.EOL || this.at().type === Tokens.EOF) {
            console.log("Unexpected end of line!");
            return false;
        }
        else {
            console.log(`True because ${Tokens[this.at().type]} is EOL`);
            return true;
        }
    }
    classify(thing) {
        if (thing.kind == "BinaryExpr"
            || thing.kind == "BooleanLiteral"
            || thing.kind == "CharString"
            || thing.kind == "Identifier"
            || thing.kind == "MemberExpr"
            || thing.kind == "NullLiteral"
            || thing.kind == "NumericLiteral"
            || thing.kind == "ObjectLiteral"
            || thing.kind == "StringLiteral") {
            return "Expr";
        }
        else if (thing.kind == "CallExpr") {
            const temp = thing;
            if (temp.wasCallKeywordUsed) {
                return "Stmt";
            }
            else {
                return "Expr";
            }
        }
        else {
            return "Stmt";
        }
    }
    currentTokenName() {
        return Tokens[this.at().type];
    }
    parse_selectionStmt_declaration() {
        const ifStatement = this.eat().type == Tokens.If; //consume the IF/CASE token
        let body = new Map();
        let Statements = [];
        let ReturnExpressions = [];
        if (ifStatement) {
            const condition = this.parse_expr();
            if (this.at().type == Tokens.EOL) {
                this.eat();
            }
            this.expect(Tokens.Then, "Expecting 'THEN' keyword!");
            this.expect(Tokens.EOL, "Expecting new line!");
            while (this.at().type == Tokens.EOL) {
                this.eat();
            }
            Statements = [];
            //let ReturnExpressions : Stmt[] = [];
            while (this.at().type !== Tokens.Else && this.at().type !== Tokens.Endif && this.at().type !== Tokens.Elseif) {
                while (this.at().type == Tokens.EOL) {
                    this.eat();
                }
                if (this.at().type !== Tokens.Endif && this.at().type !== Tokens.Elseif && this.at().type !== Tokens.Else) {
                    let returning;
                    returning = false;
                    if (this.at().type == Tokens.Return) {
                        returning = true;
                        this.eat();
                        if (!this.not_eol()) {
                            return this.MK_Err("Expression expected!");
                        }
                    }
                    const parsed = this.parse_Stmt();
                    if (parsed.kind == "ErrorExpr") {
                        return parsed;
                    }
                    else {
                        Statements.push(parsed);
                        if (returning) {
                            ReturnExpressions.push(parsed);
                        }
                    }
                }
            }
            Statements.push({ kind: "EndClosureExpr" });
            body.set(condition, Statements);
            console.log("Just before: " + JSON.stringify(this.tokens));
            Statements = [];
            while (this.at().type == Tokens.EOL) {
                this.eat();
            }
            if (this.at().type == Tokens.Elseif) {
                while (this.not_eof() && this.at().type !== Tokens.Else && this.at().type !== Tokens.Endif) {
                    Statements = [];
                    this.eat(); // Consumes the elseif
                    const condition = this.parse_expr();
                    if (this.at().type == Tokens.EOL) {
                        this.eat();
                    }
                    this.expect(Tokens.Then, "Expecting 'THEN' token here!");
                    this.expect(Tokens.EOL, "Expecting new line!");
                    if (this.at().type == Tokens.Else) {
                        break;
                    }
                    while (this.not_eof() && this.at().type !== Tokens.Elseif && this.at().type !== Tokens.Endif && this.at().type !== Tokens.Else) {
                        while (this.at().type == Tokens.EOL) {
                            this.eat();
                        }
                        let returning = false;
                        let parsed;
                        if (this.at().type == Tokens.Else || this.at().type == Tokens.Elseif || this.at().type == Tokens.Endif) {
                            break;
                        }
                        if (this.at().type == Tokens.Return) {
                            returning = true;
                            this.eat();
                            parsed = {
                                kind: "ReturnStmt",
                                value: this.parse_expr(),
                            };
                        }
                        else {
                            parsed = this.parse_Stmt();
                        }
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else {
                            Statements.push(parsed);
                            if (returning) {
                                ReturnExpressions.push(parsed);
                            }
                        }
                    }
                    Statements.push({ kind: "EndClosureExpr" });
                    body.set(condition, Statements);
                }
            }
            Statements = [];
            if (this.at().type == Tokens.Else) {
                this.eat();
                this.expect(Tokens.EOL, `Expecting new line!`);
                while (this.not_eof() && this.at().type !== Tokens.Endif) {
                    while (this.at().type == Tokens.EOL) {
                        this.eat();
                    }
                    if (this.at().type !== Tokens.Endif) {
                        let returning;
                        returning = false;
                        if (this.at().type == Tokens.Return) {
                            returning = true;
                            this.eat();
                        }
                        const parsed = this.parse_Stmt();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        else {
                            Statements.push(parsed);
                            if (returning) {
                                ReturnExpressions.push(parsed);
                            }
                        }
                    }
                }
                const mkTrue = {
                    kind: "Identifier",
                    symbol: "TRUE",
                };
                Statements.push({ kind: "EndClosureExpr" });
                body.set(mkTrue, Statements);
            }
            console.log("Token list before endif/newline: " + JSON.stringify(this.tokens));
            if (this.at().type !== Tokens.Endif && this.at().type !== Tokens.EOL && this.not_eof()) {
                console.log("Got: " + Tokens[this.at().type]);
                this.expect(Tokens.EOL, "Expecting new line before ENDIF token!");
            }
            this.expect(Tokens.Endif, "Expecting 'ENDIF' token after if statement declaration!");
            console.log("First log: " + JSON.stringify(ReturnExpressions));
        }
        else {
            this.expect(Tokens.Of, "Expecting 'OF' keyword!");
            let condition;
            if (!this.not_eol()) {
                return this.MK_Err("Name expected!");
            }
            const name = this.parse_expr();
            this.expect(Tokens.EOL, `Expecting new line but got ${Tokens[this.at().type]} instead!`);
            if (!this.not_eol()) {
                return this.MK_Err("Expression expected!");
            }
            else {
                const expr = this.parse_expr();
                condition = {
                    kind: "BinaryExpr",
                    left: name,
                    right: expr,
                    operator: '='
                };
                this.expect(Tokens.Colon, "Expecting colon!");
                if (!this.not_eol() || this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise) {
                    return this.MK_Err("Statements expected!");
                }
                let parsed = this.parse_Stmt();
                if (parsed.kind == "ErrorExpr") {
                    return parsed;
                }
                while (this.classify(parsed) == "Stmt") {
                    if (parsed.kind == "ReturnStmt") {
                        ReturnExpressions.push(parsed);
                    }
                    Statements.push(parsed);
                    //this.expect(Tokens.EOL, `Expecting new line but got ${this.currentTokenName()} instead!`);
                    while (this.at().type == Tokens.EOL) {
                        this.eat();
                    }
                    if (this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise) {
                        break;
                    }
                    parsed = this.parse_Stmt();
                    if (parsed.kind == "ErrorExpr") {
                        return parsed;
                    }
                }
                body.set(condition, Statements);
                while (this.at().type == Tokens.EOL) {
                    this.eat();
                }
                console.log("Token just before the next stage: " + this.currentTokenName());
                let check;
                if (this.classify(parsed) == "Stmt" && this.at().type !== Tokens.Otherwise && this.at().type !== Tokens.Endcase) {
                    check = this.parse_Stmt();
                }
                else if (this.classify(parsed) == "Expr") {
                    check = parsed;
                }
                while (this.at().type !== Tokens.Otherwise && this.at().type !== Tokens.Endcase) {
                    if (this.classify(check) == "Expr") {
                        Statements = [];
                        condition = {
                            kind: "BinaryExpr",
                            left: name,
                            right: check,
                            operator: '='
                        };
                        this.expect(Tokens.Colon, "Colon expected!");
                        parsed = this.parse_Stmt();
                        while (this.classify(parsed) == "Stmt") {
                            if (parsed.kind == "ReturnStmt") {
                                ReturnExpressions.push(parsed);
                            }
                            Statements.push(parsed);
                            //this.expect(Tokens.EOL, "Expecting new line!");
                            while (this.at().type == Tokens.EOL) {
                                this.eat();
                            }
                            if (this.at().type == Tokens.Endcase || this.at().type == Tokens.Otherwise) {
                                break;
                            }
                            parsed = this.parse_Stmt();
                            if (parsed.kind == "ErrorExpr") {
                                return parsed;
                            }
                        }
                        body.set(condition, Statements);
                        if (this.classify(parsed) == "Expr") {
                            check = parsed;
                        }
                        else {
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }
                while (this.at().type == Tokens.EOL) {
                    this.eat();
                }
                if (this.at().type == Tokens.Otherwise) {
                    Statements = [];
                    this.eat();
                    if (!this.not_eol || this.at().type == Tokens.Endcase) {
                        return this.MK_Err("Statements expected!");
                    }
                    else {
                        console.log("Attempting to parse otherwise statements...");
                        console.log("Token before parsing otherwise statements: " + this.currentTokenName());
                        let parsed = this.parse_Stmt();
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        console.log("Token just before this lieblinge loop: " + this.currentTokenName());
                        while (this.classify(parsed) == "Stmt") {
                            if (parsed.kind == "ReturnStmt") {
                                ReturnExpressions.push(parsed.value);
                            }
                            console.log("Result of parsed otherwise: " + JSON.stringify(parsed));
                            Statements.push(parsed);
                            //this.expect(Tokens.EOL, "Expecting new line!");
                            while (this.at().type == Tokens.EOL) {
                                this.eat();
                            }
                            if (this.at().type == Tokens.Endcase) {
                                break;
                            }
                            else {
                                parsed = this.parse_Stmt();
                                if (parsed.kind == "ErrorExpr") {
                                    return parsed;
                                }
                            }
                        }
                        const MK_TRUE = {
                            kind: "Identifier",
                            symbol: "TRUE"
                        };
                        body.set(MK_TRUE, Statements);
                        console.log("Otherwise statements: " + JSON.stringify(Statements));
                    }
                }
            }
        }
        while (this.at().type == Tokens.EOL) {
            this.eat();
        }
        if (!ifStatement) {
            this.expect(Tokens.Endcase, "Expecting 'ENDCASE' token!");
        }
        console.log("Case statement body: " + JSON.stringify(Array.from(body.entries())));
        const ifStmt = {
            kind: "SelectionStmtDeclaration",
            body: body,
            returns: (ReturnExpressions.length > 0)
                ? ReturnExpressions
                : [],
        };
        //throw "The if statement returns: " + JSON.stringify(ReturnExpressions);
        console.log("Body of if statement" + JSON.stringify(Array.from(body.entries())[2]));
        return ifStmt;
    }
    conv_tk_to_expr(tk) {
        switch (tk) {
            case Tokens.String:
                return {
                    kind: "StringLiteral",
                    text: "",
                };
            case Tokens.Char:
                return {
                    kind: "CharString",
                    text: ''
                };
            case Tokens.Integer:
                return {
                    kind: "NumericLiteral",
                    numberKind: Tokens.Integer,
                    value: 0
                };
            case Tokens.Real:
                return {
                    kind: "NumericLiteral",
                    numberKind: Tokens.Real,
                    value: 0,
                };
            case Tokens.Boolean:
                return {
                    kind: "Identifier",
                    symbol: "FALSE",
                };
            default:
                return {
                    kind: "NullLiteral",
                    value: null,
                };
        }
    }
    parse_fn_declaration() {
        const procedure = (this.eat().type == Tokens.Procedure);
        const name = this.expect(Tokens.Identifier, "Expecting identifier here!").value;
        let parameters = new Map();
        let returnType;
        let returnExpressions = [];
        if (this.at().type == Tokens.OpenBracket) {
            this.eat(); //Consumes the ( token
            while (this.not_eof() && this.at().type !== Tokens.CloseBracket) {
                if (this.at().type == Tokens.Identifier) {
                    const paramName = [];
                    while (this.not_eol() && this.at().type != Tokens.Colon) {
                        paramName.push(this.expect(Tokens.Identifier, "Name expected!").value);
                        if (this.at().type == Tokens.Comma) {
                            this.eat();
                            if (!this.not_eol() || this.at().type == Tokens.Colon) {
                                return this.MK_Err("Name expected!");
                            }
                        }
                    }
                    let paramType;
                    this.expect(Tokens.Colon, "Expecting colon here!");
                    if (this.isValidDataType(this.at())) {
                        paramType = this.conv_tk_to_expr(this.eat().type);
                        console.log("In the parser, param type is: " + JSON.stringify(paramType));
                        for (const name of paramName) {
                            parameters.set(name, paramType);
                        }
                    }
                    else if (this.at().type == Tokens.Array) {
                        this.eat();
                        if (this.at().type == Tokens.OpenSquareBracket) {
                            this.eat();
                            if (!this.not_eol() || this.at().type == Tokens.CloseSquareBracket) {
                                return this.MK_Err("Array bounds expected!");
                            }
                            this.parse_expr();
                            this.expect(Tokens.Colon, "Expecting colon!");
                            this.parse_expr();
                            this.expect(Tokens.CloseSquareBracket, "Expecting closing square brackets!");
                            return this.MK_Err("Remove array bounds to ensure any array length can be accepted.");
                        }
                        else {
                            this.expect(Tokens.Of, "Expecting 'OF' keyword!");
                            if (!(this.isValidDataType(this.at()))) {
                                this.MK_Err(`Invalid data type '${this.at().value}'!`);
                            }
                            const rawObj = {
                                kind: "ObjectLiteral",
                                dataType: this.eat().type,
                            };
                            for (const name of paramName) {
                                parameters.set(name, rawObj);
                            }
                        }
                    }
                    else {
                        return this.MK_Err("Expecting either valid data type, or ARRAY keyword!");
                    }
                    continue;
                }
                else if (this.at().type === Tokens.Comma) {
                    this.eat();
                    continue;
                }
                else {
                    return this.MK_Err("Expecting either parameters, comma or blank!");
                }
            }
            this.expect(Tokens.CloseBracket, "Expecting close brackets here!");
        }
        if (!procedure) {
            this.expect(Tokens.Returns, `Expecting returns keyword, but got '${Tokens[this.at().type]}' instead!`);
            if (this.isValidDataType(this.at())) {
                returnType = this.conv_tk_to_expr(this.eat().type);
            }
            else if (this.at().type == Tokens.Array) {
                this.eat();
                this.expect(Tokens.Of, "Expecting 'OF' token!");
                if (!this.isValidDataType(this.at())) {
                    return this.MK_Err(`Invalid return type '${this.at().value}'!`);
                }
                returnType = {
                    kind: "ObjectLiteral",
                    dataType: this.eat().type,
                };
            }
            else {
                return this.MK_Err(`Expecting either valid return type, or ARRAY keyword!`);
            }
        }
        else {
            if (this.at().type == Tokens.Returns) {
                return this.MK_Err("Procedures cannot return a value!");
            }
        }
        this.expect(Tokens.EOL, "Expecting new line!");
        const body = [];
        let iterations = 0;
        while (this.not_eof() &&
            (this.at().type !== Tokens.Endfunction) && this.at().type !== Tokens.Endprocedure) {
            iterations++;
            while (this.at().type === Tokens.EOL) {
                this.eat();
            }
            let parsed;
            if (this.at().type == Tokens.Return) {
                console.log("Parsing return?");
                if (procedure) {
                    return this.MK_Err("Procedures cannot return a value!");
                }
                else {
                    if (this.at().type == Tokens.Return) {
                        console.log("Return keyword found!");
                    }
                    this.eat();
                    if (!this.not_eol()) {
                        return this.MK_Err("Expression expected!");
                    }
                    else {
                        console.log("Token which parse_stmt will now parse:" + Tokens[this.at().type]);
                        parsed = this.parse_Stmt();
                        console.log("Parsed return expression: " + JSON.stringify(parsed));
                        if (parsed.kind == "ErrorExpr") {
                            return parsed;
                        }
                        //Error seems to be here...
                        if (this.at().type === Tokens.EOL) {
                            this.eat();
                            returnExpressions.push(parsed);
                        }
                        parsed = {
                            kind: "ReturnStmt",
                            value: parsed,
                        };
                        body.push(parsed);
                    }
                }
            }
            else if (this.at().type == Tokens.If || this.at().type == Tokens.Case) {
                parsed = this.parse_selectionStmt_declaration();
                if (parsed.returns !== undefined) {
                    for (const stmt of parsed.returns) {
                        returnExpressions.push(stmt);
                    }
                }
                if (errorLog.length > 0) {
                    return null;
                }
                body.push(parsed);
            }
            else if (this.at().type == Tokens.For || this.at().type == Tokens.While || this.at().type == Tokens.Repeat) {
                parsed = this.parse_iterationStmt();
                const temp = parsed;
                if (temp.returnExpressions !== undefined) {
                    if (temp.returnExpressions.length > 0) {
                        for (const stmt of temp.returnExpressions) {
                            returnExpressions.push(stmt);
                        }
                    }
                }
                body.push(parsed);
            }
            else {
                console.log("Tokens before parsing declaration: " + JSON.stringify(this.tokens));
                const parsed = this.parse_Stmt();
                if (parsed.kind == "ErrorExpr") {
                    return parsed;
                }
                else {
                    body.push(parsed);
                    console.log("Error log: " + errorLog);
                }
                console.log("Tokens after parsing declaration: " + JSON.stringify(this.tokens));
            }
            console.log("Previous: " + Tokens[this.at().type]);
            while (this.at().type === Tokens.EOL) {
                this.eat();
            }
        }
        while (this.at().type === Tokens.EOL) {
            this.eat();
        }
        if (procedure) {
            this.expect(Tokens.Endprocedure, "Expecting 'ENDPROCEDURE' keyword after procedure declaration!");
        }
        else {
            this.expect(Tokens.Endfunction, "Expecting 'ENDFUNCTION' keyword after function declaration!");
        }
        while (this.at().type === Tokens.EOL) {
            this.eat();
        }
        console.log("Function body: " + JSON.stringify(body));
        const fn = {
            kind: "FunctionDeclaration",
            parameters: parameters,
            name: name,
            body: body,
            returns: (procedure)
                ? Tokens.Null
                : returnType,
            isProcedure: procedure,
            expectedArguments: parameters.size,
            returnExpressions: returnExpressions,
        };
        if (!procedure && returnExpressions.length == 0) {
            return this.MK_Err("Functions that are not procedures must return a value!");
        }
        const displayparams = [...fn.parameters.entries()];
        //console.log("Fixed params: " + displayparams);
        return fn;
    }
    isValidDataType(check) {
        const validDataTypes = new Set([
            Tokens.Integer,
            Tokens.Real,
            Tokens.String,
            Tokens.Char,
            Tokens.Boolean,
            Tokens.Any,
            Tokens.Null,
        ]);
        return validDataTypes.has(check.type);
    }
    parse_var_declaration() {
        console.log("Parsed var declaration!");
        const isConstant = this.eat().type == Tokens.Constant;
        let identifier = [];
        while (this.at().type != Tokens.Colon && this.at().type != Tokens.Array && this.at().type != Tokens.Assign) {
            const ident = this.expect(Tokens.Identifier, "Name expected!").value;
            identifier.push(ident);
            if (this.at().type == Tokens.Comma) {
                this.eat();
            }
            else if (this.at().type == Tokens.Colon || this.at().type == Tokens.Array || this.at().type == Tokens.Assign) {
                break;
            }
            else {
                return this.MK_Err("Expecting comma!");
            }
        }
        let DT;
        //e.g DECLARE Score : INTEGER
        if (this.at().type == Tokens.Colon) {
            if (isConstant) {
                return this.MK_Err("Must not have colon after constant declaration!");
            }
            else {
                this.eat(); //consume the : token
                if (this.at().type == Tokens.Array) {
                    this.eat(); //consume the ARRAY token
                    const val = this.parse_obj_expr();
                    return {
                        kind: "VarDeclaration",
                        constant: false,
                        identifier: identifier,
                        dataType: val.dataType,
                        value: val,
                    };
                }
                else {
                    if (this.isValidDataType(this.at())) {
                        DT = this.eat().type;
                        if (this.at().type == Tokens.EOL) {
                            this.eat();
                            const varDec = {
                                kind: "VarDeclaration",
                                constant: false,
                                identifier: identifier,
                                dataType: DT,
                            };
                            console.log("Declared variable: " + JSON.stringify(varDec));
                            console.log("Token after var declaration: " + Tokens[this.at().type]);
                            return varDec;
                        }
                        else {
                            return this.MK_Err("New line expected!");
                        }
                    }
                    else if (this.at().type == Tokens.EOL) {
                        return this.MK_Err("Expect datatype after non-constant variable declaration!");
                    }
                    else {
                        return this.MK_Err(`Invalid data type: ${this.eat().value}!`);
                    }
                }
            }
        }
        else if (this.at().type == Tokens.Assign) {
            this.eat(); //consume the ← token
            if (this.at().type == Tokens.EOF || this.at().type == Tokens.EOL) {
                return this.MK_Err(`Must assign constant "${identifier}" a value!`);
            }
            const val = this.parse_expr(); //consume and parse the set value
            if (this.at().type != Tokens.EOL) {
                return this.MK_Err(`Expected end of line after constant declaration!`);
            }
            else {
                return {
                    kind: "VarDeclaration",
                    constant: true,
                    identifier: identifier,
                    dataType: Tokens.Any,
                    value: val,
                };
            }
        }
        else if (isConstant && !(this.at().type == Tokens.Assign || this.at().type == Tokens.EOL)) {
            return this.MK_Err("Must use ← when assigning constants!");
            this.eat();
        }
        else if (!isConstant) {
            return this.MK_Err("Must follow non-constant variable declaration with colon!");
        }
        else {
            return this.MK_Err("Did not complete variable/constant setup!");
        }
    }
    parse_expr(StringJoining) {
        if (this.at().type == Tokens.UnaryOperator) {
            return this.parse_unary_expression();
        }
        else {
            return this.parse_assignment_expr();
        }
    }
    parse_output_expr() {
        this.eat();
        console.log("Token just before not_eol is called: " + Tokens[this.at().type]);
        if (!this.not_eol()) {
            console.log("No expression provided for output!");
            return this.MK_Err("Expression expected!");
        }
        else {
            console.log("Apparently the expression is " + Tokens[this.at().type]);
            console.log("NOT Got to the end of line? " + this.not_eol());
            const outputExpr = {
                kind: "OutputExpr",
                value: this.parse_expr(),
            };
            if (this.at().type == Tokens.EOL) {
                this.eat();
                if (this.at().type == Tokens.Input) {
                    const textComponent = (outputExpr.value);
                    return this.parse_input_expr(textComponent);
                }
                else {
                    console.log("Exited parsing output!");
                    return outputExpr;
                }
            }
            else {
                return outputExpr;
            }
        }
    }
    parse_assignment_expr(StringJoining) {
        const left = this.parse_obj_expr();
        //console.log("I think this is: " + JSON.stringify(left));
        if (this.at().type == Tokens.Assign) {
            this.eat(); //Advance past ← token
            const value = this.parse_assignment_expr(StringJoining);
            return {
                value,
                assigne: left,
                kind: "AssignmentExpr",
            };
        }
        return left;
    }
    parse_obj_expr() {
        if (this.at().type == Tokens.OpenSquareBracket) {
            let is2DArr = false;
            let declaring = "Value";
            this.eat();
            let expressions = [];
            let start;
            let end;
            let dataType;
            let innerStart;
            let innerEnd;
            while (this.not_eof() && this.not_eol() && this.at().type !== Tokens.CloseSquareBracket) {
                const parsed = this.parse_expr();
                if (this.at().type == Tokens.Comma && declaring == "Value") {
                    this.eat();
                    expressions.push(parsed);
                }
                else if (this.at().type == Tokens.Colon) {
                    expressions = [];
                    this.eat();
                    declaring = "Range";
                    start = parsed;
                    end = this.parse_expr();
                    if (this.at().type == Tokens.Comma) {
                        this.eat();
                        is2DArr = true;
                        innerStart = this.parse_expr();
                        this.expect(Tokens.Colon, "Expecting colon!");
                        innerEnd = this.parse_expr();
                        break;
                    }
                    else {
                        break;
                    }
                }
                else {
                    if (declaring == "Value") {
                        expressions.push(parsed);
                    }
                    break;
                }
            }
            this.expect(Tokens.CloseSquareBracket, "Expecting close square brackets!");
            console.log("RAW expressions: " + JSON.stringify(expressions));
            if (declaring == "Range") {
                this.expect(Tokens.Of, "Expecting 'OF' keyword!");
                const validTypes = [Tokens.Char, Tokens.String, Tokens.Integer, Tokens.Real, Tokens.Boolean];
                if (!validTypes.includes(this.at().type)) {
                    return this.MK_Err(`'${this.at().value}' is not a valid data type!`);
                }
                else {
                    dataType = (this.eat().type);
                }
            }
            else {
                dataType = Tokens.Any;
            }
            const obj = {
                kind: "ObjectLiteral",
                elements: expressions,
                start: start,
                end: end,
                innerStart: innerStart,
                innerEnd: innerEnd,
                dataType: dataType,
                is2dArr: is2DArr,
                declaring: declaring,
            };
            return obj;
        }
        else {
            return this.parse_logic_expression();
        }
    }
    parse_logic_expression(StringJoining) {
        console.log("Tokens before literally anything: " + JSON.stringify(this.tokens));
        let left;
        if (this.at().type == Tokens.NOT) {
            left = { kind: "NullLiteral", value: null };
        }
        else {
            console.log("Token in this case: " + this.at().value);
            left = this.parse_comparitive_expression();
        }
        console.log("Binop left when parsing: " + JSON.stringify(left));
        while (this.at().type === Tokens.AND || this.at().type === Tokens.OR || this.at().type === Tokens.NOT) {
            const operator = this.eat().value;
            const right = this.parse_comparitive_expression();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_comparitive_expression(StringJoining) {
        let left = this.parse_additive_expression(StringJoining);
        //console.log("Left(1): " + JSON.stringify(left));
        while (this.at().value == "<>" || this.at().value == "<" || this.at().value == ">" || this.at().value == "<=" || this.at().value == ">=" || this.at().value == "=") {
            const operator = this.eat().value;
            const right = this.parse_additive_expression();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }
        console.log("Left: " + JSON.stringify(left));
        return left;
    }
    parse_unary_expression() {
        const operator = this.eat().value;
        const right = this.parse_expr();
        const zero = {
            kind: "NumericLiteral",
            numberKind: Tokens.Integer,
            value: 0
        };
        return {
            kind: "BinaryExpr",
            operator: operator,
            left: zero,
            right: right,
        };
    }
    parse_additive_expression(StringJoining) {
        let left = this.parse_multiplicative_expression();
        while (this.at().value == '+' || this.at().value == '-') {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expression();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
            };
        }
        return left;
    }
    parse_multiplicative_expression() {
        let left = this.parse_exponential_expression();
        while (this.at().value == '*' || this.at().value == '/') {
            const operator = this.eat().value;
            const right = this.parse_exponential_expression();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            };
        }
        return left;
    }
    parse_exponential_expression() {
        let left = this.parse_call_member_expr();
        while (this.at().value == '^') {
            const operator = this.eat().value;
            const right = this.parse_call_member_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator
            };
        }
        //console.log("Left(3): " + JSON.stringify(left));
        return left;
    }
    parse_call_member_expr() {
        if (this.at().type == Tokens.Call) {
            this.eat();
            const member = this.parse_member_expression();
            const procedure = member;
            //This may be the cause of any problems, but I did it to allow calling procedures without brackets
            if (this.at().type == Tokens.OpenBracket || this.at().type == Tokens.EOL) {
                return this.parse_call_expr(member, true);
            }
            return member;
        }
        else {
            const member = this.parse_member_expression();
            console.log("Member: " + JSON.stringify(member));
            if (this.at().type == Tokens.OpenBracket) {
                return this.parse_call_expr(member, false);
            }
            return member;
        }
    }
    parse_call_expr(caller, wasCallKeywordUsed) {
        console.log("Trying to pass call expression...");
        let args = [];
        if (this.at().type == Tokens.OpenBracket) {
            args = this.parse_args();
        }
        let call_expr = {
            kind: "CallExpr",
            caller,
            args: args,
            wasCallKeywordUsed: wasCallKeywordUsed,
        };
        console.log("The call expression in question: " + JSON.stringify(call_expr));
        return call_expr;
    }
    parse_args() {
        this.expect(Tokens.OpenBracket, "Expecting open brackets!");
        const args = this.at().type == Tokens.CloseBracket
            ? []
            : this.parse_arguments_list();
        this.expect(Tokens.CloseBracket, "Expecting close brackets here!");
        return args;
    }
    parse_arguments_list() {
        const args = [this.parse_expr()];
        while (this.at().type == Tokens.Comma && this.eat()) {
            args.push(this.parse_expr());
        }
        return args;
    }
    MK_Err(message) {
        makeError(message + ` (Ln ${this.show_ln()})`);
        return {
            kind: "ErrorExpr"
        };
    }
    parse_member_expression() {
        let object = this.parse_primary_expression();
        console.log("Object: " + JSON.stringify(object));
        if (this.at().type == Tokens.OpenSquareBracket) {
            console.log("Member expression identified!");
            this.eat(); //Consumes the [ token
            const indexComponent = this.parse_expr();
            if (this.at().type == Tokens.CloseSquareBracket) {
                this.eat();
                object = {
                    kind: "MemberExpr",
                    object: object,
                    indexComponent: indexComponent
                };
            }
            else if (this.at().type == Tokens.Comma) {
                this.eat(); //consume the , token
                const sIC = this.parse_expr();
                this.expect(Tokens.CloseSquareBracket, "Expecting close square brackets here!");
                object = {
                    kind: "MemberExpr",
                    object: object,
                    indexComponent: indexComponent,
                    secondaryIndexComponent: sIC
                };
            }
            else {
                return this.MK_Err("Expecting either close square brackets or comma!");
            }
        }
        return object;
    }
    parse_primary_expression() {
        const tk = this.at().type;
        console.log("I believe token to be: " + JSON.stringify(Tokens[tk]));
        switch (tk) {
            case Tokens.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                };
            case Tokens.Boolean:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                };
            case Tokens.StringLiteral:
                console.log("Value: " + JSON.stringify(this.at().value));
                return {
                    kind: "StringLiteral",
                    text: this.eat().value,
                };
            case Tokens.NumericLiteral:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                };
            case Tokens.OpenBracket:
                this.eat(); //remove opening bracket
                const value = this.parse_expr();
                this.expect(Tokens.CloseBracket, "Expected closing brackets!");
                return value;
            case Tokens.EOL:
                this.eat();
                return null;
            case Tokens.EOF:
                console.log(JSON.stringify(this.tokens));
                console.log("(Unexpected?) End of file reached...");
                return null;
            default:
                return this.MK_Err(`Unexpected token found during parsing ${this.at().value}`);
        }
    }
}
function isNumeric(str) {
    return !isNaN(Number(str)) && str.trim() !== '';
}
