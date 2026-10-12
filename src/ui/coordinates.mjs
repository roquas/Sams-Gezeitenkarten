export const LETTERS="ABCDE", GREEK_SYMBOLS=["α","β","γ","δ","ε"], GREEK=["Alpha","Beta","Gamma","Delta","Epsilon"], ROWCOLORS=[{name:"Cyan",short:"C",hex:"#28b9c5"},{name:"Magenta",short:"M",hex:"#c74c99"},{name:"Violett",short:"V",hex:"#8761ba"},{name:"Blau",short:"B",hex:"#4178b8"},{name:"Orange",short:"O",hex:"#d28a39"}];
export const pretty=id=>GREEK[LETTERS.indexOf(id[0])]+" / "+ROWCOLORS[Number(id.slice(1))-1].name;

export function coordinateMarkup(id){
 if(!/^[A-E][1-5]$/.test(id))return '';
 const q=LETTERS.indexOf(id[0]),row=ROWCOLORS[Number(id[1])-1],label=pretty(id);
 return `<span class="coord-inline" role="img" data-coordinate="${id}" aria-label="${label}" title="${label}"><span class="greek-badge" aria-hidden="true">${GREEK_SYMBOLS[q]}</span><span class="color-badge" style="--swatch:${row.hex}" aria-hidden="true">${row.short}</span></span>`;
}
export function coordinateTextMarkup(text){
 text=text.replace(/([αβγδε])\s*\/\s*([CMVBO])\b/g,(_,col,row)=>GREEK[GREEK_SYMBOLS.indexOf(col)]+'/'+ROWCOLORS.find(c=>c.short===row).name);
 return text.replace(/\b(Alpha|Beta|Gamma|Delta|Epsilon)\s*\/\s*(Cyan|Magenta|Violett|Blau|Orange)\b|\b([A-E][1-5])\b/g,(_,col,row,id)=>coordinateMarkup(id||LETTERS[GREEK.indexOf(col)]+(ROWCOLORS.findIndex(c=>c.name===row)+1)));
}
