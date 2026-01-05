import { methods, constants, procedures } from "./Main.js";

type tokenType = "keyword" | "control" | "string" | "char" | "identifier" | "datatype" | "number" | "boolean" | "symbol" | "whitespace" | "function" | "operator" | "comment" | "EOL";

interface mmpToken {

    type: tokenType,
    value: string,

}

const keywords = /^(READFILE|WRITEFILE|OPENFILE|CLOSEFILE|DECLARE|CONSTANT|OUTPUT|INPUT|FUNCTION|ENDFUNCTION|PROCEDURE|ENDPROCEDURE)$/i;
const datatypes = /^(ARRAY|INTEGER|REAL|CHAR|STRING|BOOLEAN)$/i;
const boolean = /^(TRUE|FALSE)$/i;
const native = /^(LCASE|UCASE|NUM_TO_STR|STR_TO_NUM|SUBSTRING|EOF|ROUND|RANDOM|LENGTH)$/i;
const control = /^(ELSEIF|IF|ELSE|ENDIF|THEN|CASE|OF|ENDCASE|OTHERWISE|RETURNS|RETURN|READ|WRITE|STEP|FOR|TO|CALL|NEXT|WHILE|REPEAT|ENDWHILE|DO|UNTIL)$/i;
const logical = /^(MOD|DIV|NOT|AND|OR|)$/i;


function mmp_tokenise_line(line : string){ //Special tokenizer just for the minimap

    const chars = line.split('');
    const Tokens : mmpToken[] = [];

    while(chars.length > 0){

        if(chars[0] == ' '){

            let holder = '';

            while(chars[0] == ' ' && chars.length > 0){

                holder += chars.shift();

            }

            Tokens.push({

                type: "whitespace",
                value: holder,

            })

        }
        else if(/^[A-Za-z]+$/.test(chars[0])){

            let holder = '';

            while(/^[A-Za-z]+$/.test(chars[0]) && chars.length > 0){

                holder += chars.shift();

            }

            let tokenType : tokenType;

            if(keywords.test(holder)) tokenType = "keyword";
            else if(control.test(holder)) tokenType = "control";
            else if(datatypes.test(holder)) tokenType = "datatype";
            else if(boolean.test(holder)) tokenType = "boolean";
            else if(native.test(holder)) tokenType = "function";
            else if(logical.test(holder)) tokenType = "operator";
            else tokenType = "identifier";

            Tokens.push({

                type: tokenType,
                value: holder,

            })

        }
        else if(chars[0] == '.'){

            let holder = chars.shift();

            if(chars[0] && /^[0-9]$/.test(chars[0])){

                while(/^[0-9]$/.test(chars[0]) && chars.length > 0){

                    holder += chars.shift();


                }

                Tokens.push({

                    type: "number",
                    value: holder,

                })

            }
            else{

                Tokens.push({

                    type: "symbol",
                    value: holder,

                })
            }
        }
        else if(/^[0-9]$/.test(chars[0])){

            let holder = '';

            let dpCount = 0;

            while((/^[0-9]$/.test(chars[0]) || (chars[0] == '.' && dpCount == 0)) && chars.length > 0){

                if(chars[0] == '.') dpCount++;

                holder += chars.shift();


            }

            Tokens.push({

                type: "number",
                value: holder,

            })

        }
        else if(chars[0] == '/'){

            chars.shift();

            if(chars[0] == '/'){

                chars.shift();

                let holder = '';

                while(chars.length > 0){

                    holder += chars.shift();

                }

                Tokens.push({

                    type: "comment",
                    value: holder,

                })

            }
            else{

                Tokens.push({

                    type: "symbol",
                    value: '/',

                })

            }

        }
        else if(chars[0] == '"'){

            chars.shift();

            let holder = '';

            while(chars.length > 0 && chars[0] != '"'){

                holder += chars.shift();

            }

            if(chars[0] == '"') chars.shift();

            Tokens.push({

                type: "string",
                value: holder,

            })

        }
        else if(chars[0] == "'"){

            chars.shift();

            let holder = '';

            while(chars.length > 0 && chars[0] != "'"){

                holder += chars.shift();

            }

            if(chars[0] == "'") chars.shift();

            Tokens.push({

                type: "char",
                value: holder,

            })

        }
        else{

            Tokens.push({

                type: "symbol",
                value: chars.shift(),

            })

        }

    }

    Tokens.push({type: "EOL", value: "EOL"});

    return Tokens;

}




function parse_primary(tk : mmpToken) : string {


    if(tk.type == "keyword"){

        return '<span class="cm-keyword">'+tk.value+'</span>';

    }
    else if(tk.type == "datatype"){

        return '<span class="cm-datatype">'+tk.value+'</span>';

    }
    else if(tk.type == "control"){

        return '<span class="cm-other-token">'+tk.value+'</span>';

    }
    else if(tk.type == "boolean"){

        return '<span class="cm-boolean">'+tk.value+'</span>';

    }
    else if(tk.type == "function"){

        return '<span class="cm-native">'+tk.value+'</span>';

    }
    else if(tk.type == "operator"){

        return '<span class="cm-logical">'+tk.value+'</span>';

    }
    else if(tk.type == "string"){
        return '<span class="cm-string">'+tk.value+'</span>';
    }
    else if(tk.type == "char"){
        return '<span class="cm-char">'+tk.value+'</span>';
    }
    else if(tk.type == "number"){
        return '<span class="cm-number" style="color: var(--number)">'+tk.value+'</span>';
    }
    else if(tk.type == "identifier"){


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
    else if(tk.type == "comment"){

        return '<span class="cm-comment">'+tk.value+'</span>';

    }
    else if(tk.type == "EOL"){


        return '\n'

    }
    else if(tk.type == "whitespace") return tk.value;
    else if(!tk.value || tk.value === undefined){

        return "";

    }
    else{


        return '<span class="cm-other">'+tk.value+'</span>';
    }
    


}

function format_line(ln : string) : string {

    const tokens = mmp_tokenise_line(ln);

    const out = tokens.map(tk => parse_primary(tk)).join('');

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





