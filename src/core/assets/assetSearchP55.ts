/** P55: distinct exact-ID deep links; normal text search is unchanged. */
import type {Asset} from './model';

export const exactAssetSearchP55=(assetId:string)=>'asset-id:'+assetId;

export function matchesAssetSearchP55(asset:Asset,search:string):boolean {
 if(search.startsWith('asset-id:'))return asset.id===search.slice('asset-id:'.length);
 return `${asset.name} ${asset.group} ${asset.confidence} ${asset.source.path}`
  .toLowerCase().includes(search.toLowerCase());
}
