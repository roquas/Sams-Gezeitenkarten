// Domain-independent hashing/canonicalization; existing identity bytes stay unchanged.
import {createHash} from 'node:crypto';
const compare=(a,b)=>a<b?-1:a>b?1:0;
const assert=(ok,message)=>{if(!ok)throw new Error(`archive: ${message}`);};
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

// Deliberately narrower than general JSON: no floats, undefined or exotic objects.
export function canonicalJson(value){
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'){
  assert(Number.isSafeInteger(value),'canonical numbers must be safe integers');
  return JSON.stringify(value);
 }
 if(Array.isArray(value))return '['+Array.from(value,canonicalJson).join(',')+']';
 assert(value&&Object.getPrototypeOf(value)===Object.prototype,'canonical value must be plain JSON');
 return '{'+Object.keys(value).sort(compare).map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
}
