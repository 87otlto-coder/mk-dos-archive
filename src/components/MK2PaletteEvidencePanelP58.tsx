import React from 'react';
import type { MK2PaletteEvidenceP58 } from './mk2PaletteEvidenceP58';
import { StageThumbnailP57 } from './StageThumbnailP57';

export function MK2PaletteEvidencePanelP58({stage,evidence,onOpen}:{
 stage:string;evidence:MK2PaletteEvidenceP58;onOpen:(assetID:string)=>void;
}){
 const forest=stage==='FOREST.GRA' ? evidence.forestComparisons : [];
 const floor=evidence.screenshotFloors.get(stage);
 if(!forest.length&&!floor)return null;
 return <details className="mw-p58-compare">
  <summary>Compare original palette evidence ({floor?1:forest.length} source {floor?'floor':'setups'})</summary>
  <div className="mw-p58-compare-body">
   {forest.map(pair=><div className="mw-p58-pair" key={pair.key}>
    <strong>{pair.label}</strong>
    <div className="mw-p58-pair-images">
     <div><span>Original indexed values — diagnostic grayscale</span>
      <div className="mw-p58-image"><StageThumbnailP57 visual={{asset:pair.diagnostic,title:pair.diagnostic.name,
       evidence:'Original source index values; not gameplay RGB'}}/></div>
      <button className="mw-text-button" onClick={()=>onOpen(pair.diagnostic.id)}>Inspect original indices</button>
     </div>
     <div><span>Source-linked colour candidate — NOT runtime palette</span>
      <div className="mw-p58-image"><StageThumbnailP57 visual={{asset:pair.candidate,title:pair.candidate.name,
       evidence:'Source-linked palette candidate only; native DAC unknown'}}/></div>
      <button className="mw-text-button" onClick={()=>onOpen(pair.candidate.id)}>Inspect candidate RGB</button>
     </div>
    </div>
    <p>{pair.limitation}</p>
   </div>)}
   {floor&&<div className="mw-p58-pair">
    <strong>{stage} — screenshot-witnessed original floor strip</strong>
    <div className="mw-p58-image"><StageThumbnailP57 visual={{asset:floor.asset,title:floor.asset.name,
      evidence:floor.limitation}}/></div>
    <p>{floor.limitation}</p>
    <button className="mw-text-button" onClick={()=>onOpen(floor.asset.id)}>Inspect floor-only RGB and source indices</button>
   </div>}
  </div>
 </details>;
}
