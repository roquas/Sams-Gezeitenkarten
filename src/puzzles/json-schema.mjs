// Small JSON Schema evaluator for exactly the vocabulary used above; no DOM or eval.
export function schemaErrors(value,schema={},path='$'){
 const errors=[],fail=message=>errors.push(`${path}: ${message}`);
 if(schema.oneOf){if(schema.oneOf.filter(s=>schemaErrors(value,s,path).length===0).length!==1)fail('keine eindeutig passende Variante (Hinweistyp/Parameter prüfen)');return errors;}
 if('const' in schema&&value!==schema.const)fail(`erwartet ${JSON.stringify(schema.const)}`);
 if(schema.enum&&!schema.enum.includes(value))fail('unbekannter Wert');
 const type=Array.isArray(value)?'array':value===null?'null':typeof value;
 if(schema.type&&!(schema.type==='integer'?Number.isSafeInteger(value):type===schema.type)){fail(`erwartet ${schema.type}`);return errors;}
 if(type==='number'){
  if(!Number.isFinite(value))fail('keine endliche Zahl');
  if(schema.minimum!==undefined&&value<schema.minimum)fail('zu klein');
  if(schema.exclusiveMinimum!==undefined&&value<=schema.exclusiveMinimum)fail('zu klein');
  if(schema.maximum!==undefined&&value>schema.maximum)fail('zu groß');
 }
 if(type==='string'){
  if(schema.minLength!==undefined&&value.length<schema.minLength)fail('Text fehlt');
  if(schema.maxLength!==undefined&&value.length>schema.maxLength)fail('Text zu lang');
  if(schema.pattern&&!new RegExp(schema.pattern).test(value))fail('ungültiges Format');
 }
 if(type==='array'){
  if(value.length<(schema.minItems??0)||value.length>(schema.maxItems??Infinity))fail('ungültige Anzahl');
  if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail('doppelte Werte');
  value.forEach((v,i)=>errors.push(...schemaErrors(v,schema.items??{},`${path}[${i}]`)));
 }
 if(type==='object'){
  for(const key of schema.required??[])if(!Object.hasOwn(value,key))fail(`Pflichtfeld ${key} fehlt`);
  for(const [key,v] of Object.entries(value)){
   if(schema.propertyNames)errors.push(...schemaErrors(key,schema.propertyNames,`${path}.${key}`));
   if(Object.hasOwn(schema.properties??{},key))errors.push(...schemaErrors(v,schema.properties[key],`${path}.${key}`));
   else if(schema.additionalProperties===false)fail(`unbekanntes Feld ${key}`);
   else if(typeof schema.additionalProperties==='object')errors.push(...schemaErrors(v,schema.additionalProperties,`${path}.${key}`));
  }
 }
 return errors;
}
