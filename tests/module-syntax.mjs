import {readdirSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
for(const file of readdirSync(root).filter(f=>f.endsWith('.js'))){
 const r=spawnSync(process.execPath,['--input-type=module','--check'],{input:readFileSync(new URL(file,root),'utf8'),encoding:'utf8'});
 assert.equal(r.status,0,`${file}: ${r.stderr}`);
}
console.log('All browser entrypoints and modules parse as ES modules');
