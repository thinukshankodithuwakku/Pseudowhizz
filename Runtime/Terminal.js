const keywords = ["OPENFILE", "CLOSEFILE", "READ", "WRITE", "REPEAT", "UNTIL", "CALL", "CASE", "OTHERWISE", "OUTPUT", "INPUT", "DECLARE", "CONSTANT", "IF", "ELSEIF", "THEN", "ELSE", "ENDIF", "WHILE", "ENDWHILE", "FOR", "ENDFOR", "STEP", "FUNCTION", "ENDFUNCTION", "PROCEDURE", "ENDPROCEDURE", "RETURN", "RETURNS", "AND", "OR", "NOT", "TRUE", "FALSE", "INTEGER", "REAL", "STRING", "ARRAY", "OF", "BOOLEAN"].sort();
const symbols = ["←", "+", "-", "*", "/", "=", "<>", "<", ">", "<=", ">=", "^"];
const methods = ["SUBSTRING", "LENGTH", "ROUND", "RANDOM", "MOD", "DIV", "NUM_TO_STR", "STR_TO_NUM", "EOF"].sort();
export default class Terminal {
    constructor(box) {
        this.avoid = ["help(copyright)", "help(credits)", "help()", "help(help)", "help(keywords)", "help(symbols)", "help(modules)", "help(quit)"];
        this.block_descs = new Map();
        this.timeout = 60 * 1000;
        this.console = box;
        this.block_descs.set("IF", 'The "IF" statement\n******************\n\nThe "IF" statement is used to conditionally execute a block of code. An "ELSEIF" branch can be added if the first condition is not met. If all branch conditions evaluate to FALSE, the block of the "ELSE" clause, if present, is excecuted. An if statement is terminated with the keyword "ENDIF".\n');
        this.block_descs.set("CASE", 'The "CASE" statement\n********************\n\nThe "CASE" statement is used to conditionally execute a block of code, where the subject variable evaluates to the expression given by the branch condition. The subject of the case statement follows the "CASE" keyword. If the subject does not evaluate to any of the branch expressions, the block of the "OTHERWISE" clause, if present, is excecuted. A CASE statement is terminated with the keyword "ENDCASE".\n');
        this.block_descs.set("FUNCTION", 'Function declarations\n*********************\n\nFunctions are declared with the "FUNCTION" keyword, followed by the function name, a parenthesized, comma-separated list of parameters, the "RETURNS" keyword, and the return datatype. The block of the function follows, and is terminated with the keyword "ENDFUNCTION".\n\nExample: FUNCTION Greet(Name : STRING) RETURNS STRING\n              RETURN "Hello, ", Name\n          ENDFUNCTION\n');
        this.block_descs.set("PROCEDURE", 'Procedure declarations\n**********************\n\nProcedures are declared with the "PROCEDURE" keyword, followed by the procedure name, and (optionally) a parenthesized, comma-separated list of parameters. The block of the procedure follows, and is terminated with the keyword "ENDPROCEDURE".\n\nExample: "PROCEDURE" Greet(Name : STRING)\n              OUTPUT "Hello, ", Name\n          ENDPROCEDURE.\nProcedures may NOT return a value.\n');
        this.block_descs.set("WHILE", 'Pre-conditional loops\n****************\n\n"WHILE" loops are used to execute a block of code while the loop condition evaluates to TRUE. The loop condition follows the "WHILE" keyword, followed by the "DO" keyword. A "WHILE" loop is terminated with the keyword "ENDWHILE".\n');
        this.block_descs.set("REPEAT", 'Post-conditional loops\n*****************\n\n"REPEAT" loops are used to execute a block of code at least once, and while the loop condition evaluates to FALSE. A "REPEAT" loop is terminated with the keyword "UNTIL" followed by the condition expression.\n');
        this.block_descs.set("FOR", 'Count-controlled loops\n**********************\n\n"FOR" loops are used to execute a block of code a set number of times. The loop iterator, initial value and terminal value are declared in the "FOR" statement, with the syntax: FOR <identifier> ← <initial value> TO <terminal value>. An optional "STEP" keyword can be used to specify the increment value for each iteration. If no step value is specified, the default step is 1. A "FOR" loop is terminated with the keyword "NEXT" and then the iterator.\n');
        this.block_descs.set("OPENFILE", 'File handling\n*************\n\nFiles are opened with the "OPENFILE" keyword, followed by the filename in double quotes, the "FOR" keyword and the read/write mode. When finished with a file, it should be closed with the "CLOSEFILE" keyword, followed by the filename in double quotes.\n');
        this.block_descs.set("←", "Assignment operator\n*******************\n\nThe '←' symbol is used to assign a value to a variable. The variable to which the value is being assigned is placed on the left side of the operator, and the value or expression being assigned is placed on the right side.\n\nExample: Age ← 21\n");
        this.std_out("Pseudowhizz 1.1.2");
        this.main('Type "help", "copyright" or "credits" for more information.');
    }
    race(promise, ms) {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
            timer = window.setTimeout(() => {
                reject(new Error("Session killed due to timeout."));
            }, ms);
        });
        return Promise.race([
            promise.finally(() => clearTimeout(timer)),
            timeoutPromise
        ]);
    }
    split_into_collumns(list, colHeight) {
        while (list.length % colHeight != 0)
            list.push('');
        const cols = [];
        for (let i = 0; i < list.length / colHeight; i++) {
            cols.push(list.slice(i * colHeight, (i + 1) * colHeight));
        }
        return cols;
    }
    cancel(msg) {
        const wrapper = this.console.children[this.console.children.length - 1];
        const line = wrapper.children[1];
        if (line)
            line.disabled = true;
        this.std_out(msg);
    }
    async main(msg) {
        let res = null;
        try {
            res = (await this.race(this.ask(msg), this.timeout)).trim();
        }
        catch (e) {
            this.cancel(e.message);
        }
        if (!res)
            return;
        if (!this.avoid.includes(res) && res.startsWith('help(') && res.endsWith(')')) {
            res = res.slice(5, -1).trim();
            this.process_help_request(res);
        }
        else {
            switch (res) {
                case "help":
                    this.help_handler("Type help() for interactive help, or help(keyword) for help on a specific keyword.");
                    break;
                case "copyright":
                    this.main("Copyright (c) 2026 Pseudowhizz. All rights reserved.");
                    break;
                case "credits":
                    this.main("Credits go towards CIE for the documentation of the pseudocode that Pseudowhizz uses.\nFor more information, please see the 0478 specification provided below.");
                    break;
                case "help()":
                    this.help_handler('Welcome to the Pseudowhizz help service.\n\nEnter the name of any keyword, symbol or method to learn more about them.\nTo get a list of all available keywords, modules or symbols, enter "keywords", "modules" or "symbols".\n\nTo quit this service at any time, enter "quit".');
                    break;
                case "quit":
                    this.main("Use quit() to exit");
                    break;
                case "quit()":
                    this.main("** Process Exited - Return Code: 0 **\n\n");
                    break;
                default:
                    this.main(`No information found for '${res}'. Type "help", "copyright" or "credits" for more options.`);
            }
        }
    }
    process_help_request(res) {
        let cols;
        let row;
        switch (res) {
            case "quit":
                this.main("Use quit() to exit");
                break;
            case "quit()":
                this.main("** Process Exited - Return Code: 0 **\n\n");
                break;
            case "symbols":
                this.std_out("This is a list of the Pseudocode symbols. Enter any symbol to get more help.\n\n");
                cols = this.split_into_collumns(symbols, 6);
                row = document.createElement('div');
                row.classList.add('cnsl-ln', 'help-row');
                cols.forEach(col => {
                    const colEl = document.createElement('div');
                    colEl.classList.add('cnsl-ln', 'help-col');
                    col.forEach(keyword => {
                        const kwEl = document.createElement('div');
                        kwEl.classList.add('help-kw');
                        kwEl.textContent = keyword;
                        colEl.appendChild(kwEl);
                    });
                    row.appendChild(colEl);
                });
                this.console.appendChild(row);
                this.help_handler('\n');
                break;
            case "keywords":
                this.std_out("This is a list of the Pseudocode keywords. Enter any keyword to get more help.\n\n");
                cols = this.split_into_collumns(keywords, 9);
                row = document.createElement('div');
                row.classList.add('cnsl-ln', 'help-row');
                cols.forEach(col => {
                    const colEl = document.createElement('div');
                    colEl.classList.add('cnsl-ln', 'help-col');
                    col.forEach(keyword => {
                        const kwEl = document.createElement('div');
                        kwEl.classList.add('help-kw');
                        kwEl.textContent = keyword;
                        colEl.appendChild(kwEl);
                    });
                    row.appendChild(colEl);
                });
                this.console.appendChild(row);
                this.help_handler('\n');
                break;
            case "modules":
                this.std_out("This is a list of the Pseudocode built-in modules. Enter any module to get more help.\n\n");
                cols = this.split_into_collumns(methods, 3);
                row = document.createElement('div');
                row.classList.add('cnsl-ln', 'help-row');
                cols.forEach(col => {
                    const colEl = document.createElement('div');
                    colEl.classList.add('cnsl-ln', 'help-col');
                    col.forEach(keyword => {
                        const kwEl = document.createElement('div');
                        kwEl.classList.add('help-kw');
                        kwEl.textContent = keyword;
                        colEl.appendChild(kwEl);
                    });
                    row.appendChild(colEl);
                });
                this.console.appendChild(row);
                this.help_handler('\n');
                break;
            case "SUBSTRING":
                this.help_handler("Help on built-in module SUBSTRING in module built-ins:\n\nSUBSTRING(<expr>, <start index>, <length>)\n\nReturns the substring of the provided expression starting at the provided 1-based index, and with the provided length.\n\nExample: SUBSTRING(\"Hello World\", 7, 5) returns \"World\"\n");
                break;
            case "LENGTH":
                this.help_handler('Help on built-in module LENGTH in module built-ins:\n\nLENGTH(<expr>)\n\nReturns the length of the provided expression. Can be STRING or ARRAY (Pseudowhizz only).\n\nExample: LENGTH("Hello") returns 5\n');
                break;
            case "ROUND":
                this.help_handler('Help on built-in module ROUND in module built-ins:\n\nROUND(<expr>, <decimal places>)\n\nReturns the value of the provided expression rounded to the specified number of decimal places.\n\nExample: ROUND(3.14159, 2) returns 3.14\n');
                break;
            case "RANDOM":
                this.help_handler('Help on built-in module RANDOM in module built-ins:\n\nRANDOM()\n\nReturns a random REAL value between 0 and 1.\n\nExample: RANDOM() * 10 may return any real number between 1 and 10, such as 4.39285\n');
                break;
            case "MOD":
                this.help_handler('Help on built-in module MOD in module built-ins:\n\nMOD(<expr>, <expr>)\n\nReturns the modulus of the first expression by the second expression. \n\nExample: MOD(10, 3) returns 1\n');
                break;
            case "DIV":
                this.help_handler('Help on built-in module DIV in module built-ins:\n\nDIV(<expr>, <expr>)\n\nReturns the floored division of the first expression by the second expression. \n\nExample: DIV(10, 3) returns 3\n');
                break;
            case "NUM_TO_STR":
                this.help_handler('Help on built-in module NUM_TO_STR in module built-ins:\n\nNUM_TO_STR(<expr>)\n\nReturns the string representation of the provided numeric expression.\n\nExample: NUM_TO_STR(3.14) returns "3.14"\n');
                break;
            case "STR_TO_NUM":
                this.help_handler('Help on built-in module STR_TO_NUM in module built-ins:\n\nSTR_TO_NUM(<expr>)\n\nReturns the numeric representation of the provided string expression, if it exists. If the string cannot be converted to a number, an error is thrown.\n\nExample: STR_TO_NUM("3.14") returns 3.14\n');
                break;
            case "EOF":
                this.help_handler('Help on built-in module EOF in module built-ins:\n\nEOF(<filename>)\n\nReturns TRUE if the end of the specified file has been reached, and FALSE otherwise.\n\nExample: EOF("Sample.txt") may return TRUE if the end of Sample.txt has been reached, and FALSE otherwise.\n');
                break;
            case "AND":
                this.help_handler("AND\nLogical operators\n*****************\n\nAND takes two operands and returns TRUE if both operands evalaute as truthy, and FALSE otherwise.\n");
                break;
            case "OR":
                this.help_handler("OR\nLogical operators\n****************\n\nOR takes two operands and returns TRUE if at least one operand evalaute as truthy, and FALSE otherwise.\n");
                break;
            case "NOT":
                this.help_handler("NOT\nLogical operators\n****************\n\nNOT takes one operand and returns TRUE if the operand evaluates as falsy, and FALSE if the operand evaluates as truthy.\n");
                break;
            case "ARRAY":
                this.help_handler("ARRAY\nData Types\n**********\n\nDenotes a variable with datatype ARRAY. An array is a collection of objects of a secondary data type (primitive or ARRAY).\n");
                break;
            case "BOOLEAN":
                this.help_handler("BOOLEAN\nData Types\n**********\n\nDenotes a variable with datatype BOOLEAN. A BOOLEAN variable refers to the values TRUE and FALSE.\n");
                break;
            case "INTEGER":
                this.help_handler("INTEGER\nData Types\n**********\n\nDenotes a variable with datatype INTEGER. An INTEGER variable refers to whole number values.\n");
                break;
            case "REAL":
                this.help_handler("REAL\nData Types\n**********\n\nDenotes a variable with datatype REAL. An REAL variable refers to the set of real numbers.\n");
                break;
            case "STRING":
                this.help_handler("STRING\nData Types\n**********\n\nDenotes a variable with datatype STRING. A STRING variable refers to a literal of characters.\n");
                break;
            case "CHAR":
                this.help_handler("CHAR\nData Types\n**********\n\nDenotes a variable with datatype CHAR. A CHAR variable refers to a single character.\n");
                break;
            case "CALL":
                this.help_handler("CALL <name>(<param>, ...)\n\nUsed to initiate, and initiate only procedures. Can be used with or without arguments.\n\nExample: CALL Greet(Name)\n");
                break;
            case "CLOSEFILE":
                this.help_handler("CLOSEFILE(<filename>)\n\nCloses the currently open file specified.\n\nExample: CLOSEFILE(\"Sample.txt\")\n");
                break;
            case "CONSTANT":
                this.help_handler('CONSTANT <name> ← <value>\n\nUsed to declare a constant with the specified name and value.\n\nExample: CONSTANT Pi ← 3.14\n');
                break;
            case "IF":
                this.help_handler(this.block_descs.get("IF"));
                break;
            case "ELSEIF":
                this.help_handler(this.block_descs.get("IF"));
                break;
            case "ELSE":
                this.help_handler(this.block_descs.get("IF"));
                break;
            case "ENDIF":
                this.help_handler(this.block_descs.get("IF"));
                break;
            case "CASE":
                this.help_handler(this.block_descs.get("CASE"));
                break;
            case "OTHERWISE":
                this.help_handler(this.block_descs.get("CASE"));
                break;
            case "ENDCASE":
                this.help_handler(this.block_descs.get("CASE"));
                break;
            case "FUNCTION":
                this.help_handler(this.block_descs.get("FUNCTION"));
                break;
            case "ENDFUNCTION":
                this.help_handler(this.block_descs.get("FUNCTION"));
                break;
            case "RETURNS":
                this.help_handler(this.block_descs.get("FUNCTION"));
                break;
            case "RETURN":
                this.help_handler("RETURN <expr>\n\nRETURN may only be used in function definitions or closures nested inside function definitions. The expression following the RETURN keyword is evaluated and returned as the output of the function.\n");
                break;
            case "help()":
                this.help_handler('Welcome to the Pseudowhizz help service.\n\nEnter the name of any keyword, symbol or method to learn more about them.\nTo get a list of all available keywords, modules or symbols, enter "keywords", "modules" or "symbols".\n\nTo quit this service at any time, enter "quit".');
                break;
            case "OUTPUT":
                this.help_handler("OUTPUT <expr>,<expr>\nPrints the values to the console.");
                break;
            case "INPUT":
                this.help_handler("INPUT <identifier>\nReads the value of user input into the provided identifier.\nAutomatically casts to the appropriate data type.\n\nExample: INPUT Age\n");
                break;
            case "DECLARE":
                this.help_handler("DECLARE <name> : <datatype>\nDeclares a variable with the specified name and datatype.\n\nExample: DECLARE Name : STRING");
                break;
            case "PROCEDURE":
                this.help_handler(this.block_descs.get("PROCEDURE"));
                break;
            case "ENDPROCEDURE":
                this.help_handler(this.block_descs.get("PROCEDURE"));
                break;
            case "WHILE":
                this.help_handler(this.block_descs.get("WHILE"));
                break;
            case "DO":
                this.help_handler(this.block_descs.get("WHILE"));
                break;
            case "ENDWHILE":
                this.help_handler(this.block_descs.get("WHILE"));
                break;
            case "REPEAT":
                this.help_handler(this.block_descs.get("REPEAT"));
                break;
            case "UNTIL":
                this.help_handler(this.block_descs.get("REPEAT"));
                break;
            case "FOR":
                this.help_handler(this.block_descs.get("FOR"));
                break;
            case "NEXT":
                this.help_handler(this.block_descs.get("FOR"));
                break;
            case "TO":
                this.help_handler(this.block_descs.get("FOR"));
                break;
            case "STEP":
                this.help_handler(this.block_descs.get("FOR"));
                break;
            case "OPENFILE":
                this.help_handler(this.block_descs.get("OPENFILE"));
                break;
            case "READ":
                this.help_handler(this.block_descs.get("OPENFILE"));
                break;
            case "WRITE":
                this.help_handler(this.block_descs.get("OPENFILE"));
                break;
            case "READFILE":
                this.help_handler("READFILE <filename>, <identifier>\n\nReads the contents of the specified file into a provided identifier.\n\nExample: READFILE \"Sample.txt\", LineOfText \n");
                break;
            case "WRITEFILE":
                this.help_handler("WRITEFILE <filename>, <identifier>\n\nOverwrites the contents of a file with the value of the provided identifier.\n\nExample: WRITEFILE \"Sample.txt\", LineOfText \n");
                break;
            case '←':
                this.help_handler(this.block_descs.get("←"));
                break;
            case '<--':
                this.help_handler(this.block_descs.get("←"));
                break;
            case '<=':
                this.help_handler("Relational operators\n********************\n\nThe '<=' symbol returns TRUE if the left operand is less than or equal to the right operand.\n");
                break;
            case '>=':
                this.help_handler("Relational operators\n********************\n\nThe '>=' symbol returns TRUE if the left operand is greater than or equal to the right operand.\n");
                break;
            case '≤':
                this.help_handler("Relational operators\n********************\n\nThe '≤' symbol returns TRUE if the left operand is less than or equal to the right operand.\n");
                break;
            case '≥':
                this.help_handler("Relational operators\n********************\n\nThe '≥' symbol returns TRUE if the left operand is greater than or equal to the right operand.\n");
                break;
            case '<>':
                this.help_handler("Relational operators\n********************\n\nThe '<>' symbol returns TRUE if the left operand is not equal to the right operand.\n");
                break;
            case '<':
                this.help_handler("Relational operators\n********************\n\nThe '<' symbol returns TRUE if the left operand is less than the right operand.\n");
                break;
            case '>':
                this.help_handler("Relational operators\n********************\n\nThe '>' symbol returns TRUE if the left operand is greater than the right operand.\n");
                break;
            case '+':
                this.help_handler("Mathematical operators\n*****************\n\nThe '+' symbol is used to perform addition between two numeric expressions.\n");
                break;
            case '-':
                this.help_handler("Mathematical operators\n*****************\n\nThe '-' symbol is used to perform subtraction between two numeric expressions.\n");
                break;
            case '*':
                this.help_handler("Mathematical operators\n*****************\n\nThe '*' symbol is used to perform multiplication between two numeric expressions.\n");
                break;
            case '/':
                this.help_handler("Mathematical operators\n*****************\n\nThe '/' symbol is used to perform division between two numeric expressions.\n");
                break;
            case '^':
                this.help_handler("Mathematical operators\n*****************\n\nThe '^' symbol is used to perform exponentiation between two numeric expressions.\n");
                break;
            default:
                this.help_handler(`No Pseudocode documentation found for '${res}'.\nEnter help() to get the ineractive help service`);
        }
    }
    async help_handler(msg) {
        let res = null;
        try {
            res = (await this.race(this.ask(msg, 'help>'), this.timeout));
        }
        catch (e) {
            this.cancel(e.message);
        }
        if (!res)
            return;
        if (!this.avoid.includes(res) && res.startsWith("help(") && res.endsWith(")")) {
            this.process_help_request(res.slice(5, -1));
        }
        else
            this.process_help_request(res);
    }
    scroll_btm() {
        const parent = document.getElementById('console-body');
        parent.scrollTop = parent.scrollHeight;
    }
    throw_err(msg, kind) {
        const ln = document.createElement('div');
        ln.classList.add('cnsl-ln', 'error');
        ln.textContent = `${kind}: ${msg}`;
        this.console.appendChild(ln);
    }
    async ask(msg, chev = '>') {
        this.std_out(msg);
        return await this.std_in(chev);
    }
    std_out(msg) {
        const ln = document.createElement('div');
        ln.classList.add('cnsl-ln');
        ln.textContent = msg;
        this.console.appendChild(ln);
        this.console.scrollTop = this.console.scrollHeight;
        this.scroll_btm();
    }
    async std_in(chev = '>') {
        const inputLn = document.createElement('input');
        inputLn.classList.add('cnsl-ln', 'input');
        inputLn.type = 'text';
        const marker = document.createElement('span');
        marker.classList.add('cnsl-ln', 'input-marker');
        marker.textContent = chev;
        const wrpr = document.createElement('div');
        wrpr.classList.add('cnsl-ln', 'wrpr');
        wrpr.appendChild(marker);
        wrpr.appendChild(inputLn);
        this.console.appendChild(wrpr);
        inputLn.focus();
        const inp = await new Promise(resolve => {
            function handler(e) {
                if (e.key === "Enter") {
                    inputLn.removeEventListener("keydown", handler);
                    resolve(inputLn.value ?? null);
                }
                else if (e.key.toLowerCase() == 'escape') {
                    resolve(inputLn.value);
                    return;
                }
            }
            inputLn.addEventListener("keydown", handler);
        });
        inputLn.disabled = true;
        if (inputLn.value == null)
            inputLn.value = '';
        return inp;
    }
}
