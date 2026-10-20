"""Local FreeCAD geometry worker. JSON input/output only; no project-supplied code."""
import sys, json, math, base64, traceback
from pathlib import Path
import FreeCAD as App
import Part

V=App.Vector

def prism_xz(points,depth):
    pts=[V(x,-depth/2,z) for x,z in points]
    return Part.Face(Part.makePolygon(pts+[pts[0]])).extrude(V(0,depth,0))

def build(m):
    p=m['profile'];w=p['width'];d=w if p['shape'] in ('square','round') else p['depth'];t=p['wall'];r=p.get('radius',0);L=m['length']
    if p['shape']=='round':
        shape=Part.makeCylinder(w/2,L).cut(Part.makeCylinder(w/2-t,L+2,V(0,0,-1)))
    else:
        outer=Part.makeBox(w,d,L,V(-w/2,-d/2,0))
        if r>0:outer=outer.makeFillet(r,[e for e in outer.Edges if abs(e.Length-L)<1e-6])
        inner=Part.makeBox(w-2*t,d-2*t,L+2,V(-w/2+t,-d/2+t,-1))
        ir=max(0,r-t)
        if ir>1e-7:inner=inner.makeFillet(ir,[e for e in inner.Edges if abs(e.Length-(L+2))<1e-6])
        shape=outer.cut(inner)
    if m.get('fold'):
        for c in m['fold']['centres']:
            root=m['fold']['allowance']/2
            # Retain +X wall; remove three walls with two 45-degree flanks.
            a,b=-w/2-5,w/2-t;dep=b-a
            shape=shape.cut(prism_xz([(a,c-dep-root),(b,c-root),(b,c+root),(a,c+dep+root)],d+10))
    for end in ('start','end'):
        angle=m.get('cuts',{}).get(end,0)
        if abs(angle)<1e-8:continue
        slope=math.tan(math.radians(abs(angle)))
        # +X is the inside face. Negative angles reverse the short face.
        def plane(x):
            delta=(x+w/2 if angle>=0 else w/2-x)*slope
            return delta if end=='start' else L-delta
        a,b=-w/2-5,w/2+5;far=-w*10-100 if end=='start' else L+w*10+100
        shape=shape.cut(prism_xz([(a,far),(b,far),(b,plane(b)),(a,plane(a))],d+10))
    if m.get('clip'):
        c=m['clip'];pos=m['placement'];sx,sy=pos['start'];dx,dy=pos['direction'];xx,xy=pos['xAxis']
        corners=[(c['minX'],c['minY']),(c['maxX'],c['minY']),(c['maxX'],c['maxY']),(c['minX'],c['maxY'])]
        shape=shape.common(prism_xz([((gx-sx)*xx+(gy-sy)*xy,(gx-sx)*dx+(gy-sy)*dy) for gx,gy in corners],d+10))
    checks=[]
    for h in m.get('holes',[]):
        face=h['face'];across=h.get('x',0);z=h['z'];through=h['cut']=='through'
        # Construct in coordinates (across face, distance inward, along member).
        half=(d/2 if face in ('A','C') else w/2)
        if p['shape']=='round':half=w/2
        depth=2*half+2 if through else half+1
        if h['shape']=='circle':tool=Part.makeCylinder(h['diameter']/2,depth,V(across,0,z),V(0,1,0))
        else:
            hw=h['width'];hh=h['height']
            if h['shape']=='rectangle':tool=Part.makeBox(hw,depth,hh,V(across-hw/2,0,z-hh/2))
            else:
                radius=hw/2;dz=(hh-hw)/2
                tool=Part.makeCylinder(radius,depth,V(across,0,z-dz),V(0,1,0)).fuse(Part.makeCylinder(radius,depth,V(across,0,z+dz),V(0,1,0)))
                if hh>hw:tool=tool.fuse(Part.makeBox(hw,depth,hh-hw,V(across-hw/2,0,z-dz)))
        # Translate generic +Y inward cutter to the selected wall, then orient.
        tool.translate(V(0,-half-1,0))
        rotation={'A':180,'C':0,'B':90,'D':-90}[face]
        tool.rotate(V(0,0,0),V(0,0,1),rotation)
        if p['shape']=='round':
            tool.rotate(V(0,0,0),V(0,0,1),h.get('angle',0)-rotation+180)
        shape=shape.cut(tool)
        if p['shape']=='round':
            a=math.radians(h.get('angle',0));entry=V(-(w/2-t/2)*math.sin(a),(w/2-t/2)*math.cos(a),z)
        elif face=='A':entry=V(-across,d/2-t/2,z)
        elif face=='C':entry=V(across,-d/2+t/2,z)
        elif face=='B':entry=V(w/2-t/2,across,z)
        else:entry=V(-w/2+t/2,-across,z)
        opposite=V(-entry.x,-entry.y,z) if p['shape']=='round' else (V(entry.x,-entry.y,z) if face in ('A','C') else V(-entry.x,entry.y,z))
        checks.append({'id':h['id'],'entryRemoved':not shape.isInside(entry,1e-6,True),'oppositeRemoved':not shape.isInside(opposite,1e-6,True)})
    shape=shape.removeSplitter()
    if not shape.isValid() or len(shape.Solids)!=1:raise ValueError(m['id']+': geometry is not one valid hollow part; review openings and joints.')
    for c in checks:
        if not c['entryRemoved']:raise ValueError(m['id']+': selected wall opening could not be verified.')
    return shape,{'valid':True,'solids':len(shape.Solids),'holes':checks,'bounds':[shape.BoundBox.XLength,shape.BoundBox.YLength,shape.BoundBox.ZLength]}

def run():
    job=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    if job.get('probe'):
        result={'available':True,'version':'.'.join(App.Version()[:3])}
    else:
        parts=[]
        for i,m in enumerate(job['members']):
            shape,checks=build(m);target=Path(sys.argv[2]).parent/(str(i)+'.igs');shape.exportIges(str(target))
            vertices,triangles=shape.tessellate(0.35)
            parts.append({**m,'igs':base64.b64encode(target.read_bytes()).decode('ascii'),'vertices':[[v.x,v.y,v.z] for v in vertices],'triangles':[list(t) for t in triangles],'checks':checks})
        result={'version':'.'.join(App.Version()[:3]),'parts':parts}
    Path(sys.argv[2]).write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')

if __name__=='__main__':
    try:run()
    except Exception as exc:
        Path(sys.argv[2]).write_text(json.dumps({'error':str(exc)}),encoding='utf-8');traceback.print_exc();sys.exit(1)
