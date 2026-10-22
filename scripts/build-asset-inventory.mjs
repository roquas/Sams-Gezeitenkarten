// Read-only package inventory; output size follows the supplied catalog.
import fs from 'node:fs';
import path from 'node:path';
import {validateAssetFiles} from './validate-assets.mjs';
import {productionEnabled} from '../src/assets/library.mjs';
const filename=path.resolve(process.argv[2]??'assets/catalog/library.json');
const resourceRoot=path.resolve(process.argv[3]??'.');
const catalog=validateAssetFiles(JSON.parse(fs.readFileSync(filename)),resourceRoot);
console.log(JSON.stringify({schemaVersion:2,semanticVersion:catalog.semanticVersion,assets:catalog.assets.map(a=>({id:a.id,semanticClass:a.semanticClass,role:a.role,passable:a.passable,footprint:a.geometry.cells,file:a.image.path,enabledOn:catalog.backgrounds.filter(b=>productionEnabled(catalog,a.id,b.id)).map(b=>b.id)}))},null,2));
