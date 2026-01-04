import { Token, tokenize_line, Tokens } from "./Frontend/Lexer.js";
import { methods, constants, procedures } from "./Main.js";
import { cur_fl } from "./Main.js";

function parse_primary(tk : Token) : string {

    const keywords = [
    "READFILE","WRITEFILE","OPENFILE","CLOSEFILE","DECLARE",
    "CONSTANT","OUTPUT","INPUT","FUNCTION","ENDFUNCTION",
    "PROCEDURE","ENDPROCEDURE"
    ];

    const datatypes = [
    "ARRAY","INTEGER","REAL","CHAR","STRING","BOOLEAN"
    ];

    const booleanValues = [
    "TRUE","FALSE"
    ];

    const native = [
    "LCASE","UCASE","NUM_TO_STR","STR_TO_NUM","SUBSTRING",
    "EOF","ROUND","RANDOM","LENGTH","MOD","DIV"
    ];

    const control = [
    "ELSEIF","IF","ELSE","ENDIF","THEN","CASE","OF","ENDCASE",
    "OTHERWISE","RETURNS","RETURN","READ","WRITE","STEP","FOR",
    "TO","CALL","NEXT","WHILE","REPEAT","ENDWHILE","DO","UNTIL"
    ];

    const logical = [
    "NOT","AND","OR"
    ];

    if(keywords.includes(tk.value)){

        return '<span class="cm-keyword">'+tk.value+'</span>';

    }
    else if(datatypes.includes(tk.value)){

        return '<span class="cm-datatype">'+tk.value+'</span>';

    }
    else if(control.includes(tk.value)){

        return '<span class="cm-other-token">'+tk.value+'</span>';

    }
    else if(booleanValues.includes(tk.value)){

        return '<span class="cm-boolean">'+tk.value+'</span>';

    }
    else if(native.includes(tk.value)){

        return '<span class="cm-native">'+tk.value+'</span>';

    }
    else if(logical.includes(tk.value)){

        return '<span class="cm-logical">'+tk.value+'</span>';

    }
    else if(tk.type == Tokens.StringLiteral){

        if(tk.value.length == 1){
            return '<span class="cm-char">'+tk.value+'</span>';
        }
        else{

            return '<span class="cm-string">'+tk.value+'</span>';
        }

    }
    else if(tk.type == Tokens.NumericLiteral){

        return '<span class="cm-number" style="color: var(--number)">'+tk.value+'</span>';

    }
    else if(tk.type == Tokens.Identifier){


        if(methods.includes(tk.value)){
            return '<span class="cm-userFn">'+tk.value+'</span>';
        }
        else if(constants.includes(tk.value)){
            return '<span class="cm-constant">'+tk.value+'</span>';
        }
        else if(procedures.includes(tk.value)){
            return '<span class="cm-userFn">'+tk.value+'</span>';
        }
        else{

            return '<span class="cm-variable">'+tk.value+'</span>';

        }

        

    }
    else if(tk.type == Tokens.Comment){

        return '<span class="cm-comment">'+tk.value+'</span>';

    }
    else if(tk.type == Tokens.EOL){


        return '\n'

    }
    else if(tk.type == Tokens.EOF || !tk.value || tk.value === undefined){

        return "";

    }
    else{


        return '<span class="cm-other">'+tk.value+'</span>';
    }
    


}

function extract_whitespace(ln : string) : string[] {

    let ws = [];

    const chars = ln.split('');

    let ws_tk = "";

    for(const char of chars){

        

        if(char === " "){

            ws_tk += " ";
        }
        else{

            if(ws_tk != ""){
                ws.push(ws_tk);
            }
            
            ws_tk = "";

        }

    }



    return ws;

}






function format_line(ln : string) : string {

    const tokens = tokenize_line(ln,1);



    let ws = ln.match(/\s+/g) as string[];
    if(!ws){
        ws = [];
    }


    ws.push("");



    let out = "";

    for(const tk of tokens){

        if(ln.startsWith(" ")){
            if(ws && ws.length > 0 && ws[0] != ""){
                out += ws.shift() + parse_primary(tk);
            }
            else{
                out += parse_primary(tk);
            }
        }
        else{
            if(ws && ws.length > 0 && ws[0] != ""){
                out += parse_primary(tk) + ws.shift();
            }
            else{
                out += parse_primary(tk);
            }
        }

        

        

    }


    return out;


}

function format_src(src : string, txtFile : boolean) : string[] {

    const split = src.split('\n');



    let out = [];

    for(const ln of split){

       out.push(!txtFile ? format_line(ln) : '<span class="cm-txt-norm">'+ln+'</span>');

    }

    return out;
}

let building = false;

export function build_map(src : string, txtFile : boolean) {

    if(building) return;

    building = true;
    const map = document.getElementById('mini-map-content');
    map.innerHTML = '';

    if(localStorage.getItem('Mmp') == "true"){

        const lines = format_src(src, txtFile);
        let lineCount = 0;

        for(const line of lines){
            
            const ln = document.createElement("div");
            ln.className = "mini-map-line";


            ln.innerHTML = line;
            ln.id = "line-" + lineCount;

            const classNames = ['cm-s-idea', 'cm-s-darcula'];

    
            classNames.forEach(className => {

                const elements = document.querySelectorAll(`.${className}`);
                

                elements.forEach(el => {
                    el.appendChild(ln); 
                });
            });

            map.appendChild(ln);
            lineCount++;

        }   

    }
    building = false;

}

export function highlight_error_lines(errorLines : number[]){

    const ln = errorLines[0];

    const target = document.getElementById('mini-map-content').querySelector(`#line-${ln - 1}`);

    if(target) target.classList.add('erroneous-line');


}

export function clear_error_lines(){

    for(const ln of document.getElementById('mini-map-content').children){

        ln.classList.remove('erroneous-line');

    }

}





