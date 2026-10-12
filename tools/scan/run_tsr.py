import sys, os, time, numpy as np, torch
sys.path.insert(0, '/workspace/TripoSR')
from PIL import Image
from tsr.system import TSR
torch.set_num_threads(6)
t=time.time()
model = TSR.from_pretrained("stabilityai/TripoSR", config_name="config.yaml", weight_name="model.ckpt")
model.renderer.set_chunk_size(8192); model.eval()
print('loaded', time.time()-t, flush=True)
# input: background-removed RGB on black -> build alpha from luminance mask, composite on 0.5 gray, foreground 85%
im = Image.open('pre_front.png').convert('RGB')
a = np.asarray(im).astype(np.float32)/255
mask = (a.max(-1) > 0.02).astype(np.float32)
from scipy import ndimage
mask = ndimage.binary_fill_holes(ndimage.binary_opening(mask>0.5, iterations=2)).astype(np.float32)
ys,xs = np.where(mask>0); y0,y1,x0,x1 = ys.min(),ys.max(),xs.min(),xs.max()
crop = a[y0:y1+1,x0:x1+1]; m = mask[y0:y1+1,x0:x1+1,None]
comp = crop*m + 0.5*(1-m)
h,w = comp.shape[:2]; S = int(max(h,w)/0.85)
canvas = np.full((S,S,3),0.5,np.float32); oy,ox=(S-h)//2,(S-w)//2; canvas[oy:oy+h,ox:ox+w]=comp
inp = Image.fromarray((canvas*255).astype(np.uint8)); inp.save('tsr_input.png')
with torch.no_grad():
    codes = model([inp], device='cpu')
    print('codes', time.time()-t, flush=True)
    meshes = model.extract_mesh(codes, has_vertex_color=True, resolution=int(sys.argv[1]) if len(sys.argv)>1 else 192)
meshes[0].export('tsr_raw.obj'); meshes[0].export('tsr_raw.glb')
print('done', time.time()-t, len(meshes[0].vertices), flush=True)
