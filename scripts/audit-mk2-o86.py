#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,sys,zipfile,io,binascii
package=Path(sys.argv[1]); reportp=Path(sys.argv[2]); out=Path(sys.argv[3]); report=json.loads(reportp.read_text())
checks=[]
def ck(i,ok,d=''): checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def sha(b): return hashlib.sha256(b).hexdigest()
expected={
 'packages/slot_00_HH0_RGBA.zip':('1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2',77,72,'HH0.GRA',0),
 'packages/slot_01_LK0_RGBA.zip':('04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836',77,72,'LK0.GRA',1),
 'packages/slot_02_JC0_RGBA.zip':('d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7',75,70,'JC0.GRA',2),
 'packages/slot_03_BA0_RGBA.zip':('8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133',93,88,'BA0.GRA',3),
 'packages/slot_04_FN4_RGBA.zip':('f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726',59,54,'FN4.GRA',4),
 'packages/slot_05_FN6_RGBA.zip':('68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3',97,92,'FN6.GRA',5),
 'packages/slot_16_FN4_RGBA.zip':('f15d5425f359ab6db21a31d82650ecd2c90105c9036194d1ef1e61e91e9079ff',59,54,'FN4.GRA',16),
}
raw=package.read_bytes();ck('outer_sha_matches_report',sha(raw)==report['package']['sha256'],sha(raw));ck('outer_size_matches_report',len(raw)==report['package']['byteLength'],len(raw))
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 names=z.namelist();ck('outer_entry_count',len(names)==9,len(names));ck('outer_no_duplicates',len(names)==len(set(names)),names);ck('outer_exact_names',set(names)==set(expected)|{'manifest/verified_fighter_resources.json','README.md'},names)
 for n in names:
  info=z.getinfo(n);data=z.read(n);ck(f'outer_store_{n}',info.compress_type==zipfile.ZIP_STORED,info.compress_type);ck(f'outer_crc_{n}',binascii.crc32(data)&0xffffffff==info.CRC,hex(info.CRC))
 manifest=json.loads(z.read('manifest/verified_fighter_resources.json'));readme=z.read('README.md').decode('utf-8')
 ck('manifest_format',manifest['format']=='mk2_o86_verified_identity_resource_rgba_manifest_v1',manifest.get('format'));ck('manifest_fixture_count',manifest['fixtureCount']==7,manifest.get('fixtureCount'));ck('manifest_total_pngs',manifest['totalPngCount']==502,manifest.get('totalPngCount'));ck('manifest_nested_entries',manifest['nestedLogicalEntryCount']==537,manifest.get('nestedLogicalEntryCount'))
 b=manifest['boundaries'];ck('manifest_no_new_palette',b['newPaletteOwnershipPromoted'] is False,b);ck('manifest_no_sibling_ownership',b['siblingResourceOwnershipPromoted'] is False,b);ck('manifest_no_human_names',b['humanFighterNamesPromoted'] is False,b);ck('manifest_no_player_labels',b['playerNumberLabelsPromoted'] is False,b);ck('manifest_no_mode4',b['mode4MeaningPromoted'] is False,b);ck('manifest_no_mk1',b['mk1AssumptionsImported'] is False,b)
 ck('readme_boundaries',all(s in readme for s in ['does not recompute or strengthen palette ownership','No sibling resources','human fighter names','MK1-derived assumptions']),readme[:220])
 fixture_by_path={x['nestedPackagePath']:x for x in manifest['fixtures']}
 for path,(ehash,ecount,epng,res,slot) in expected.items():
  tag=f'slot{slot:02}_{res}'
  data=z.read(path);ck(f'{tag}_nested_sha',sha(data)==ehash,sha(data));fx=fixture_by_path.get(path);ck(f'{tag}_manifest_row',fx is not None,fx)
  if fx:
   ck(f'{tag}_slot',fx['identitySlot']==slot,fx['identitySlot']);ck(f'{tag}_resource',fx['resourceName']==res,fx['resourceName']);ck(f'{tag}_nested_hash_manifest',fx['nestedPackageSha256']==ehash,fx['nestedPackageSha256']);ck(f'{tag}_png_manifest',fx['pngCount']==epng,fx['pngCount']);ck(f'{tag}_entries_manifest',fx['nestedEntryCount']==ecount,fx['nestedEntryCount']);ck(f'{tag}_semantics',fx['paletteSemanticContexts']==['DEFAULT_CHARACTER_PALETTE','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE'],fx['paletteSemanticContexts'])
  with zipfile.ZipFile(io.BytesIO(data)) as nz:
   nn=nz.namelist();pngs=[x for x in nn if x.lower().endswith('.png')];ck(f'{tag}_nested_entry_count',len(nn)==ecount,len(nn));ck(f'{tag}_nested_png_count',len(pngs)==epng,len(pngs));ck(f'{tag}_nested_no_duplicates',len(nn)==len(set(nn)),len(nn));ck(f'{tag}_nested_store_only',all(nz.getinfo(x).compress_type==zipfile.ZIP_STORED for x in nn),'all store')
ck('report_verdict',report['decision']['verdict']=='MK2_SEVEN_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION',report['decision']['verdict']);ck('report_no_new_palette',report['decision']['newPaletteOwnershipPromoted'] is False,report['decision']);ck('report_no_sibling',report['decision']['siblingResourceOwnershipPromoted'] is False,report['decision']);ck('report_no_human_names',report['decision']['humanFighterNamesPromoted'] is False,report['decision']);ck('report_totals',report['package']['totalPngCount']==502 and report['package']['nestedLogicalEntryCount']==537,report['package'])
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o86_independent_audit_v1','source':'independent Python ZIP/manifest audit over accepted nested O74/O76/O77/O79/O81/O83/O85 package identities; does not call TypeScript O86 implementation','packageSha256':sha(raw),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'exactAcceptedNestedPackagesPreserved':not failed,'totalVerifiedPngs':502,'newPaletteOwnershipPromoted':False,'siblingResourceOwnershipPromoted':False,'humanFighterNamesPromoted':False,'verdict':'MK2_O86_INDEPENDENT_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['packageSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed: print(json.dumps(failed,indent=2));sys.exit(1)
