import {pathToFileURL} from 'node:url';
import {readPlaytestSource,validatePlaytestBindings,parsePlaytestArgs} from './lib/b2-playtest.mjs';
import {clueStatistics} from './lib/clue-presentation.mjs';
import {playtestClueReport,renderClueReport} from './lib/b2-diagnostics.mjs';

export function main(argv=process.argv.slice(2)){
 const {stock,args}=parsePlaytestArgs(argv),name=args[0];
 if(args.length!==1)throw Error('Aufruf: npm run inspect:b2 -- [--stock S01|S02|BC] <Testname|--statistics|--report|--report-markdown>');
 if(name==='--report')return playtestClueReport(stock);
 if(name==='--report-markdown')return renderClueReport(playtestClueReport(stock));
 const source=readPlaytestSource(stock),{registry,rows}=source,byVariant=validatePlaytestBindings(source);
 if(name==='--statistics')return {stockId:registry.stockId,candidates:clueStatistics(rows.flatMap(r=>r.definition.logic.clues))};
 const binding=registry.entries.find(e=>e.testName===name);
 if(!binding)throw Error('Unbekannter B2-Testname: '+name);
 return {stockId:registry.stockId,binding,candidate:byVariant.get(binding.fingerprints.variant)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const result=main();process.stdout.write(typeof result==='string'?result:JSON.stringify(result,null,2)+'\n');}
 catch(error){console.error(error.message);process.exitCode=1;}
}
