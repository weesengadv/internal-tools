"""Millimetre geometry shared by editing, fitting and fabrication exports."""
import io, math, copy, hashlib
import numpy as np
import ezdxf
from ezdxf.path import make_path
from ezdxf.disassemble import recursive_decompose
from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.ops import unary_union
from shapely.affinity import translate, scale
from scipy.spatial import Voronoi, QhullError

DEFAULTS = dict(wallThickness=.8, clearanceOverall=.2, lipWidth=1., screwDiameter=4., holeClearance=.2,
                holeCount='auto', baseThickness=1., height=30., heightMode='total', linkMatching=True, style='hollow-t-cover',offsetDirection='inward',bodyMode='hollow',wireEnabled=False,wireDiameter=6.)

def polygons(g):
    return [g] if g.geom_type=='Polygon' and not g.is_empty else [p for p in getattr(g,'geoms',[]) if p.geom_type=='Polygon' and not p.is_empty]

def shape_data(g):
    return [dict(outer=[[round(x,6),round(y,6)] for x,y in p.exterior.coords],
                 holes=[[[round(x,6),round(y,6)] for x,y in r.coords] for r in p.interiors]) for p in polygons(g)]

def shape_from_data(data):
    return unary_union([Polygon(p['outer'],p.get('holes',[])) for p in data])

def offsets(p, wall, clearance, lip):
    if not all(math.isfinite(x) for x in [wall,clearance,lip]) or wall<=0 or clearance<0 or lip<0:
        raise ValueError('Wall must be positive; clearance and lip must be non-negative.')
    opening=p.buffer(-wall,join_style=2)
    insert=p.buffer(-(wall+clearance/2),join_style=2)
    return dict(wall=p.difference(opening),opening=opening,insert=insert,cap=insert.buffer(lip,join_style=2))

def height_values(base,height,mode):
    if mode not in ('total','wall') or not all(math.isfinite(x) for x in [base,height]) or base<=0 or height<=0:
        raise ValueError('Use positive base and height values, and a valid height mode.')
    total=height if mode=='total' else height+base
    if total<=base: raise ValueError('Total height must be greater than base thickness.')
    return base,total-base,total

def model_heights(params):
    if params.get('bodyMode')=='flat':
        base=params['baseThickness']
        if not math.isfinite(base) or base<=0:raise ValueError('Base thickness must be positive.')
        return base,0.,base
    return height_values(params['baseThickness'],params['height'],params['heightMode'])

def validate_holes(p,holes,wall,clearance):
    issues=[];opening=p.buffer(-wall,join_style=2)
    for j,h in enumerate(holes):
        d=float(h['diameter']);pt=Point(h['x'],h['y'])
        if d<=0 or not math.isfinite(d): issues.append(f'Hole {j+1}: diameter must be positive.');continue
        if not opening.covers(pt.buffer(d/2+clearance,quad_segs=32)):
            issues.append(f'Hole {j+1}: too close to a wall, counter or outer edge.')
        for k in range(j):
            other=holes[k]
            if math.dist((h['x'],h['y']),(other['x'],other['y'])) < (d+other['diameter'])/2+clearance:
                issues.append(f'Holes {k+1} and {j+1}: overlap or insufficient separation.')
    return issues

def auto_holes(p,diameter,wall,clearance,count='auto'):
    if count!='auto' and (isinstance(count,bool) or str(count) not in {str(i) for i in range(1,51)}):raise ValueError('Custom screw count must be an integer from 1 to 50.')
    required=diameter/2+wall+clearance+.03
    if diameter<=0 or p.buffer(-required).is_empty:return []
    x0,y0,x1,y1=p.bounds;w,h=x1-x0,y1-y0
    # Geometric suggestion: coverage across long strokes and broad letter areas.
    # This is an editable placement heuristic, not a load-bearing calculation.
    pitch=max(12.,diameter*10+2*(wall+clearance))
    wanted=min(50,max(1,math.ceil(max(max(w,h)/pitch,math.sqrt(p.area)/(pitch*.65))))) if count=='auto' else int(count)
    if wanted==1:
        from shapely.ops import polylabel
        point=polylabel(p,tolerance=.05)
        result=[dict(id='h1',x=round(point.x,6),y=round(point.y,6),diameter=diameter,manual=False)]
        return result if not validate_holes(p,result,wall,clearance) else []
    if not p.interiors and min(w,h)/max(w,h)>.5 and p.area/p.convex_hull.area>.9:
        cx,cy=p.centroid.x,p.centroid.y;pairs=[]
        if wanted==2:
            dx=max(0,min(w*.24,w/2-required));dy=max(0,min(h*.24,h/2-required))
            pairs=[[(cx-dx,cy),(cx+dx,cy)],[(cx,cy-dy),(cx,cy+dy)],[(cx-dx,cy-dy),(cx+dx,cy+dy)]]
        elif wanted==3:
            minimum=(diameter+clearance+.06)/math.sqrt(3)
            if min(w,h)*.3>=minimum:
                for radius in np.linspace(min(w,h)*.3,minimum,12):
                    pairs.append([(cx-math.sqrt(3)*radius/2,cy-radius/2),(cx+math.sqrt(3)*radius/2,cy-radius/2),(cx,cy+radius)])
        for positions in pairs:
            result=[dict(id=f'h{i+1}',x=x,y=y,diameter=diameter,manual=False) for i,(x,y) in enumerate(positions)]
            if not validate_holes(p,result,wall,clearance):return result
    samples=[]
    for ring in [p.exterior,*p.interiors]:
        n=max(16,min(6000,math.ceil(ring.length/.55)))
        samples += [[ring.interpolate(j*ring.length/n).x,ring.interpolate(j*ring.length/n).y] for j in range(n)]
    candidates=[];fallback=[]
    try:
        vor=Voronoi(np.unique(np.round(samples,7),axis=0))
        for ridge,seeds in zip(vor.ridge_vertices,vor.ridge_points):
            if len(ridge)!=2 or -1 in ridge:continue
            a,b=vor.vertices[ridge]
            if not p.contains(Point(*a)) or not p.contains(Point(*b)):continue
            for t in np.linspace(0,1,max(2,min(800,int(np.linalg.norm(b-a)/.8)+1))):
                v=a+t*(b-a)
                if p.boundary.distance(Point(*v))<required:continue
                fallback.append(v)
                va,vb=vor.points[seeds[0]]-v,vor.points[seeds[1]]-v
                if np.dot(va,vb)/(np.linalg.norm(va)*np.linalg.norm(vb))<-.7:candidates.append(v)
    except QhullError:pass
    if len(candidates)<2:candidates=fallback
    if len(candidates)<2:
        safe=p.buffer(-required);b=safe.bounds
        step=max(.3,diameter/6)
        candidates=[np.array([x,y]) for x in np.arange(b[0],b[2]+step/2,step) for y in np.arange(b[1],b[3]+step/2,step) if safe.covers(Point(x,y))]
    if not candidates:return []
    if count!='auto' and len(candidates)<min(2,wanted):return []
    coords=np.array(candidates);center=coords.mean(axis=0)
    if count=='auto' or wanted==1 or wanted>3:
        if count=='auto' and wanted>1:
            a=coords[np.argmax(np.sum((coords-center)**2,axis=1))]
            b=coords[np.argmax(np.sum((coords-a)**2,axis=1))]
            chosen=[a,b] if np.linalg.norm(a-b)>=diameter+clearance+.001 else [coords[np.argmin(np.sum((coords-center)**2,axis=1))]]
        else:chosen=[coords[np.argmin(np.sum((coords-center)**2,axis=1))]]
        while len(chosen)<wanted:
            distances=np.min(np.stack([np.linalg.norm(coords-v,axis=1) for v in chosen]),axis=0)
            index=int(np.argmax(distances))
            if distances[index]<diameter+clearance+.001:
                if count=='auto':break
                return []
            chosen.append(coords[index])
        result=[dict(id=f'h{i+1}',x=round(float(v[0]),6),y=round(float(v[1]),6),diameter=diameter,manual=False) for i,v in enumerate(chosen)]
        return result if not validate_holes(p,result,wall,clearance) else []

    a=coords[np.argmax(np.sum((coords-center)**2,axis=1))]
    b=coords[np.argmax(np.sum((coords-a)**2,axis=1))];a=coords[np.argmax(np.sum((coords-b)**2,axis=1))]
    if np.linalg.norm(a-b)<diameter+clearance:return []
    span=b-a;aa=coords[np.argmin(np.sum((coords-(a+.15*span))**2,axis=1))];bb=coords[np.argmin(np.sum((coords-(b-.15*span))**2,axis=1))]
    if np.linalg.norm(aa-bb)>diameter+clearance:a,b=aa,bb
    hs=[a,b]
    if wanted>=3:
        v=b-a;scores=np.abs(v[0]*(coords[:,1]-a[1])-v[1]*(coords[:,0]-a[0]))/np.linalg.norm(v)
        c=coords[np.argmax(scores)]
        if min(np.linalg.norm(c-a),np.linalg.norm(c-b))>diameter+clearance and max(scores)>diameter:hs.append(c)
        elif count!='auto':return []
    result=[dict(id=f'h{k+1}',x=round(float(v[0]),6),y=round(float(v[1]),6),diameter=diameter,manual=False) for k,v in enumerate(hs)]
    return result if not validate_holes(p,result,wall,clearance) else []

def parse_dxf(raw,filename):
    try:doc=ezdxf.read(io.StringIO(raw.decode('utf-8-sig',errors='replace'),newline=None))
    except Exception as exc:raise ValueError(f'Cannot read this DXF: {exc}')
    unit=doc.header.get('$INSUNITS',0) or 0;factor={1:25.4,2:304.8,4:1.,5:10.,6:1000.}.get(unit,1.)
    warnings=[];items=[];unsupported=set()
    if unit==0:warnings.append('DXF has no unit metadata. Coordinates are treated as millimetres; confirm the displayed size.')
    elif unit not in (1,2,4,5,6):warnings.append(f'Unit code {unit} is not supported. Confirm millimetre scale before fabrication.')
    def expand_blocks(entities):
        for entity in entities:
            if entity.dxftype()=='INSERT':yield from expand_blocks(entity.virtual_entities())
            else:yield entity
    for e in expand_blocks(doc.modelspace()):
        typ=e.dxftype()
        if typ not in ('POLYLINE','LWPOLYLINE','CIRCLE','ELLIPSE','SPLINE'):
            unsupported.add(typ);continue
        try:
            path=make_path(e)
            if not path.is_closed:
                warnings.append(f'Open {typ} contour skipped. Join it into a closed contour.');continue
            pts=[(v.x*factor,v.y*factor) for v in path.flattening(.015/factor)]
            q=Polygon(pts)
            if not q.is_valid:
                fixed=q.buffer(0)
                warnings.append('An invalid contour was repaired for preview; inspect its shape before export.')
                q=fixed
            for poly in polygons(q):
                if poly.area>.001:items.append((poly,typ,e.dxf.layer))
        except Exception as exc:warnings.append(f'{typ} contour skipped: {exc}')
    if unsupported:warnings.append('Unsupported entities skipped: '+', '.join(sorted(unsupported))+'. Convert text/open segments to closed polylines.')
    if not items:raise ValueError('No closed letter contours found. Convert text to closed curves before importing.')
    screws=[];contours=[];ambiguous=False;explicit_screws=[]
    known_inner=[q for q,_,layer in items if layer.upper() in ('BODY_INNER','WALL_INNER')]
    for q,typ,layer in items:
        b=q.bounds;w,h=b[2]-b[0],b[3]-b[1]
        round_small=w<=12 and h<=12 and abs(w-h)<.03 and abs(q.area-math.pi*(w/2)**2)<max(.08,q.area*.01)
        nested=any(r.area>q.area*1.5 and r.covers(q.representative_point()) for r,_,_ in items)
        if (round_small and nested) or ('SCREW' in layer.upper() and abs(w-h)<.03 and abs(q.area-math.pi*(w/2)**2)<max(.08,q.area*.01)):
            if not any(q.hausdorff_distance(h)<.01 for h in screws):screws.append(q)
            if 'SCREW' in layer.upper():explicit_screws.append(q)
            if 'SCREW' not in layer.upper():ambiguous=True
        else:contours.append(q)
    unique=[]
    for q in sorted(contours,key=lambda q:-q.area):
        if not any(q.hausdorff_distance(r)<.05 for r in unique):unique.append(q)
    from collections import Counter
    possible_offsets=[]
    def median_edge_distance(q,r):
        return float(np.median([q.exterior.distance(r.exterior.interpolate(r.exterior.length*j/48)) for j in range(48)]))
    for i,q in enumerate(unique):
        for r in unique[i+1:]:
            if r.area/q.area>.6 and q.covers(r):
                distance=median_edge_distance(q,r)
                if .1<distance<1.2 and q.exterior.hausdorff_distance(r.exterior)<distance*1.8:
                    possible_offsets.append(round(distance/ .05)*.05)
    common=Counter(possible_offsets).most_common(1)
    has_offset_pattern=bool(common and common[0][1]>=3)
    offset_hint=common[0][0] if has_offset_pattern else .8
    def is_parallel_offset(q,r):
        distance=median_edge_distance(q,r)
        return has_offset_pattern and r.area/q.area>.01 and abs(distance-offset_hint)<.08
    # Group paired wall guides first; then use containment parity for real
    # body/counter/island boundaries. A counter family's smallest loop is the
    # actual opening; its larger paired loop is the counter-wall guide.
    links=list(range(len(unique)))
    def leader(i):
        while links[i]!=i:
            links[i]=links[links[i]];i=links[i]
        return i
    def link(i,j):links[leader(j)]=leader(i)
    known_indexes=[i for i,q in enumerate(unique) if any(q.equals(k) for k in known_inner)]
    for i in known_indexes:
        guide=unique[i];options=[]
        for j,q in enumerate(unique):
            if j==i or j in known_indexes:continue
            large,small=(guide,q) if guide.area>q.area else (q,guide)
            if large.covers(small):options.append((median_edge_distance(large,small),j))
        if options:link(i,min(options)[1])
    if has_offset_pattern:
        for i,q in enumerate(unique):
            for j in range(i+1,len(unique)):
                r=unique[j]
                contained=q.covers(r) or q.intersection(r).area/r.area>.995
                if contained and is_parallel_offset(q,r):link(i,j)
    grouped={}
    for i in range(len(unique)):grouped.setdefault(leader(i),[]).append(i)
    families=list(grouped.values());large=[max((unique[i] for i in f),key=lambda q:q.area) for f in families]
    parents=[]
    for i,q in enumerate(large):
        candidates=[j for j,r in enumerate(large) if j!=i and r.area>q.area and r.covers(q)]
        parents.append(min(candidates,key=lambda j:large[j].area) if candidates else None)
    def depth(i):
        d=0
        while parents[i] is not None:d+=1;i=parents[i]
        return d
    depths=[depth(i) for i in range(len(families))]
    canonical=[(max if depths[j]%2==0 else min)((unique[i] for i in f),key=lambda q:q.area) for j,f in enumerate(families)]
    guides=[unique[i] for j,f in enumerate(families) for i in f if not unique[i].equals(canonical[j])]
    bodies=[]
    for i,q in enumerate(canonical):
        if depths[i]%2:continue
        for j,h in enumerate(canonical):
            if parents[j]==i:q=q.difference(h)
        bodies+=polygons(q)
    bodies=polygons(unary_union(bodies));bodies.sort(key=lambda q:(-q.bounds[3],q.bounds[0]))
    recovered=[]
    for candidate in screws[:]:
        if any(p.covers(candidate.representative_point()) for p in bodies):continue
        in_opening=any(depths[i]%2 and c.covers(candidate) for i,c in enumerate(canonical))
        if in_opening and not any(candidate.equals(c) for c in explicit_screws):
            screws.remove(candidate);recovered.append(candidate);bodies.append(candidate);ambiguous=True
            warnings.append('A round contour inside an opening was retained as an independent island; inspect it or exclude the component if it is stray geometry.')
    bodies.sort(key=lambda q:(-q.bounds[3],q.bounds[0]))
    parts=[];templates=[];assigned=0
    for i,p in enumerate(bodies):
        ox,oy=p.bounds[:2];local=translate(p,-ox,-oy);group=None
        for j,t in enumerate(templates):
            if abs(local.area-t.area)<max(2,t.area*.025) and local.hausdorff_distance(t)<.4:group=f'g{j+1}';break
        if group is None:templates.append(local);group=f'g{len(templates)}'
        hs=[]
        for h in screws:
            if p.covers(h.representative_point()):
                pt=h.centroid;hs.append(dict(id=f'h{len(hs)+1}',x=pt.x,y=pt.y,diameter=(h.bounds[2]-h.bounds[0]),manual=True,sourceContour=f'r{len(hs)+1}'));assigned+=1
        round_contours=[]
        for j,hole in enumerate(hs):
            candidate=next(h for h in screws if abs(h.centroid.x-hole['x'])<.001 and abs(h.centroid.y-hole['y'])<.001)
            round_contours.append(dict(id=hole['sourceContour'],shape=shape_data(candidate),originalHole=copy.deepcopy(hole),role='screw'))
        for candidate in canonical:
            if not any(Polygon(r).equals(candidate) for r in p.interiors):continue
            b=candidate.bounds;w,h=b[2]-b[0],b[3]-b[1]
            if abs(w-h)<.03 and abs(candidate.area-math.pi*(w/2)**2)<max(.08,candidate.area*.01):
                identifier=f'r{len(round_contours)+1}';pt=candidate.centroid
                original=dict(id='import_'+identifier,x=pt.x,y=pt.y,diameter=w,manual=True,sourceContour=identifier)
                round_contours.append(dict(id=identifier,shape=shape_data(candidate),originalHole=original,role='counter',originalRole='counter',wasCounter=True));ambiguous=True
        outside=Polygon(p.exterior)
        offset_contours=[]
        for candidate in unique:
            if candidate.area>=outside.area or not outside.covers(candidate):continue
            is_guide=any(candidate.equals(g) for g in guides)
            near_unknown=not has_offset_pattern and abs(median_edge_distance(outside,candidate)-.8)<.08
            if is_guide or near_unknown:
                if not any(shape_from_data(c['shape']).hausdorff_distance(candidate)<.08 for c in offset_contours):
                    role='offset' if is_guide else 'counter'
                    offset_contours.append(dict(id=f'o{len(offset_contours)+1}',shape=shape_data(candidate),role=role,originalRole=role))
                    if not any(candidate.equals(k) for k in known_inner):ambiguous=True
        note='Round contour retained as an island; inspect whether it belongs here.' if any(p.equals(c) for c in recovered) else ''
        parts.append(dict(id=f'p{i+1}',name=f'Part {i+1:03d}',shape=shape_data(p),holes=hs,group=group,bounds=list(p.bounds),roundContours=round_contours,offsetContours=offset_contours,importNote=note))
    if assigned!=len(screws):warnings.append(f'{len(screws)-assigned} hole contours could not be assigned to a letter.')
    if ambiguous:warnings.append('Review inferred wall-offset and round-contour roles before fabrication. Small round contours provisionally represent screws.')
    return dict(version=1,filename=filename,units='mm',parameters=copy.deepcopy(DEFAULTS),parts=parts,warnings=list(dict.fromkeys(warnings)),stage='imported',roundReviewRequired=ambiguous,classificationConfirmed=not ambiguous,unassignedHoleCount=len(screws)-assigned)

def generate_2d(project,place=False,replace=False,targets=None):
    result=copy.deepcopy(project);params={**DEFAULTS,**result.get('parameters',{})};result['parameters']=params
    mode=params.get('bodyMode','hollow')
    if mode not in ('flat','solid','hollow'):raise ValueError('Invalid body mode.')
    w,c,l=(0 if mode=='flat' else params['wallThickness']),params['clearanceOverall'],params['lipWidth'];templates={}
    for part in result['parts']:
        if 'sourceShape' not in part:part['sourceShape']=copy.deepcopy(part['shape'])
        source=shape_from_data(part['sourceShape'])
        for contour in part.get('offsetContours',[]):
            if contour['role']=='counter':source=source.difference(shape_from_data(contour['shape']))
            elif contour.get('originalRole')=='counter':source=source.union(shape_from_data(contour['shape']))
        for contour in part.get('roundContours',[]):
            if contour.get('originalRole')=='counter' and contour['role']!='counter':source=source.union(shape_from_data(contour['shape']))
            if contour['role'] in ('counter','ignore'):
                if contour['role']=='counter':source=source.difference(shape_from_data(contour['shape']))
                part['holes']=[h for h in part['holes'] if h.get('sourceContour')!=contour['id']]
                contour['wasCounter']=True
            elif contour.get('wasCounter') and contour['id'] not in part.get('deletedHoleContours',[]) and not any(h.get('sourceContour')==contour['id'] for h in part['holes']):
                restored=copy.deepcopy(contour['originalHole'])
                if any(h['id']==restored['id'] for h in part['holes']):restored['id']='import_'+contour['id']
                part['holes'].append(restored)
                contour['wasCounter']=False
        if mode=='solid':source=unary_union([Polygon(q.exterior) for q in polygons(source)])
        p=source.buffer(w,join_style=2) if params['offsetDirection']=='outward' else source
        part['shape']=shape_data(p);part['bounds']=list(p.bounds)
        layers=(dict(wall=Polygon(),opening=p,insert=Polygon(),cap=Polygon()) if mode=='flat' else offsets(p,w,c,l));issues=[]
        if layers['opening'].is_empty:issues.append('Wall thickness consumes this entire component.')
        if mode!='flat' and layers['insert'].is_empty:issues.append('Acrylic insert collapses at this wall thickness and clearance.')
        if not layers['cap'].is_empty and layers['wall'].difference(layers['cap']).area>.05:issues.append('Acrylic lip does not cover the whole wall.')
        if place and (targets is None or part['id'] in targets) and (replace or (not part['holes'] and not part.get('manualHoleLayout') and not part.get('allowHoleless'))):
            part['manualHoleLayout']=False;part['deletedHoleContours']=[];part['allowHoleless']=False
            group=part['group'];ox,oy=p.bounds[:2]
            if params['linkMatching'] and group in templates:
                hs=copy.deepcopy(templates[group])
                for h in hs:h['x']+=ox;h['y']+=oy
                part['holes']=hs
            else:
                part['holes']=auto_holes(p,params['screwDiameter'],w,params['holeClearance'],params['holeCount'])
                hs=copy.deepcopy(part['holes'])
                for h in hs:h['x']-=ox;h['y']-=oy
                templates[group]=hs
            part['placementUnresolved']=not bool(part['holes'])
            if not part['holes']:issues.append('Not enough stroke area for the requested holes and clearance.')
        part.setdefault('wireHoles',[])
        if params['wireEnabled'] and not part.get('wireOmit'):
            diameter=params['wireDiameter']
            if not part['wireHoles']:
                from shapely.ops import polylabel
                safe=p.buffer(-(diameter/2+w+params['holeClearance']+.03))
                for h in part['holes']:safe=safe.difference(Point(h['x'],h['y']).buffer((h['diameter']+diameter)/2+params['holeClearance']+.03))
                candidates=polygons(safe)
                if candidates:
                    point=polylabel(max(candidates,key=lambda q:q.area),tolerance=.05)
                    part['wireHoles']=[dict(id='wire1',x=point.x,y=point.y,diameter=diameter)]
            for h in part['wireHoles']:h['diameter']=diameter
            part['wirePlacementUnresolved']=not bool(part['wireHoles'])
            if part['wirePlacementUnresolved']:issues.append('Wire outlet does not fit. Reduce its diameter or omit it for this component.')
        issues+=validate_holes(p,part['holes']+(part['wireHoles'] if params['wireEnabled'] and not part.get('wireOmit') else []),w,params['holeClearance'])
        if part['holes'] and (not part.get('holeBaseline') or (replace and (targets is None or part['id'] in targets))):
            imported=[copy.deepcopy(c['originalHole']) for c in part.get('roundContours',[]) if c['role']=='screw']
            part['holeBaseline']=copy.deepcopy(part['holes']) if replace else (imported or copy.deepcopy(part['holes']))
        part.update({k:shape_data(v) for k,v in layers.items()});part['issues']=issues
    result['stage']='2d';result['modelReady']=False
    return result


def reset_holes(project,part_ids):
    if not isinstance(part_ids,list) or not part_ids or not all(isinstance(i,str) for i in part_ids):raise ValueError('Select one or more letters to reset.')
    if not set(part_ids)<=set(p['id'] for p in project['parts']):raise ValueError('Unknown selected letter.')
    result=copy.deepcopy(project)
    for part in result['parts']:
        if part['id'] in part_ids and 'holeBaseline' not in part:
            original=[copy.deepcopy(c['originalHole']) for c in part.get('roundContours',[]) if c['role']=='screw']
            if original:part['holeBaseline']=original
    result=generate_2d(result);automatic=[]
    for part in result['parts']:
        if part['id'] not in part_ids:continue
        baseline=part.get('holeBaseline',[])
        if baseline:part['holes']=copy.deepcopy(baseline)
        else:automatic.append(part['id'])
        part['manualHoleLayout']=False;part['deletedHoleContours']=[];part['allowHoleless']=False;part['placementUnresolved']=False
    return generate_2d(result,place=bool(automatic),replace=True,targets=automatic)
