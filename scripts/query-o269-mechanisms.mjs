#!/usr/bin/env node
/** Read-only evidence catalogue query. Does not open original game files. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateMechanismRegistry,selectMechanisms} from '../src/core/research/mechanismEvidenceRegistry.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const registry=validateMechanismRegistry(JSON.parse(fs.readFileSync(path.join(root,'research_outputs/O269_MK_DOS_MECHANISM_REGISTRY.json'),'utf8')));
const args=process.argv.slice(2);
const get=x=>{const i=args.indexOf(x);return i<0?undefined:args[i+1]};
const game=get('--game'), category=get('--category'), id=get('--id');
if(args.includes('--help')){
 console.log('Usage: node --experimental-strip-types scripts/query-o269-mechanisms.mjs [--game mk1|mk2] [--category graphics|resource|animation|stage|authoring|runtime] [--id mk2.palette_dac] [--json]');
 process.exit(0);
}
if(game && !['mk1','mk2'].includes(game))throw Error(`unknown game ${game}`);
const selected=selectMechanisms(registry,{game,category}).filter(m=>!id||m.id===id);
if(args.includes('--json'))console.log(JSON.stringify(selected,null,2));
else if(!selected.length)console.log('No scoped, evidence-backed mechanisms matched this query.');
else for(const m of selected){
 console.log(`${m.id} [${m.confidence}]`);console.log(`  ${m.claim}`);
 for(const e of m.evidence)console.log(`  Evidence: ${e.path} (${e.kind})`);
 for(const limit of m.limitations)console.log(`  Limit: ${limit}`);
}
