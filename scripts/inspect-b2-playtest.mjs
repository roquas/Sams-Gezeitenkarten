import {readPlaytestSource,contentHash} from './lib/b2-playtest.mjs';
import {clueStatistics} from './lib/clue-presentation.mjs';
const {registry,rows}=readPlaytestSource(),name=process.argv[2];
if(name==='--statistics'){
 console.log(JSON.stringify({stockId:registry.stockId,candidates:clueStatistics(rows.flatMap(r=>r.definition.logic.clues))},null,2));
}else{
 const binding=registry.entries.find(e=>e.testName===name);
 if(!binding)throw Error('Aufruf: npm run inspect:b2 -- <Testname aus der Entwicklerauswahl> oder --statistics');
 const candidate=rows.find(r=>r.fingerprints.variant===binding.fingerprints.variant);
 if(!candidate||contentHash(candidate)!==binding.contentSha256)throw Error('B2 candidate changed');
 console.log(JSON.stringify({stockId:registry.stockId,binding,candidate},null,2));
}
