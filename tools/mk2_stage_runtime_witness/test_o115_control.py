"""O115 original Portal control cross-capture reconstruction: synthetic and falsified inputs."""
import json,tempfile,unittest,zipfile
from pathlib import Path
from PIL import Image
from verify_o115_portal_control import fit,original_portal

class O115PortalControlTests(unittest.TestCase):
 def test_synthetic_projected_unmodified_control(self):
  # All game contents here are synthetic; commercial resources are not needed.
  src=bytes(3+((x+37*y)%78) for y in range(40) for x in range(896))
  colors={i:[i,(i*3)%256,(i*7)%256] for i in range(3,81)}
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);p=root/'control.png';q=root/'palette.json'
   w,h=639,397;im=Image.new('RGB',(w,h),(0,0,0))
   for y in range(321,397):
    row=(y-321)//2
    for x in range(w):
     xx=min(319,int((x+.5)*320/w))
     im.putpixel((x,y),tuple(colors[src[row*896+292+xx]]))
   im.save(p)
   q.write_text(json.dumps({'sourceIndexDomain':[3,80],
       'completeObservedColorTable':True,'input':{'sha256':'synthetic'},
       'indexToObservedColor':{str(i):{'observedRGB':col} for i,col in colors.items()}}))
   r=fit(src,p,q,offset_x=range(290,295),origins=range(319,324))
   self.assertEqual((r['bestConditionalSourceLeft'],r['bestConditionalSourceRow0ImageY']),(292,321))
   self.assertEqual(r['heldOutRegions']['centralUnoccluded']['fraction'],1.0)
 def test_wrong_palette_identity_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'r.json'; p.write_text(json.dumps({'sourceIndexDomain':[1,50],
       'completeObservedColorTable':True,'indexToObservedColor':{}}))
   screenshot=Path(t)/'x.png';Image.new('RGB',(639,397)).save(screenshot)
   with self.assertRaises(ValueError):fit(bytes(40*896),screenshot,p,offset_x=range(1),origins=range(321,322))
 def test_forged_original_portal_rejected(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t)/'game.zip'
   with zipfile.ZipFile(p,'w') as z:z.writestr('mk2/portal.gra',b'forged-resource')
   with self.assertRaises(ValueError):original_portal(p)
if __name__=='__main__':unittest.main()
