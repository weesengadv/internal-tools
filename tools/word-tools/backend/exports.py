import io,csv,zipfile,json,re
import trimesh,ezdxf
from shapely.geometry import Point
from shapely.ops import unary_union
from shapely.affinity import translate
from .geometry import shape_from_data,polygons,offsets,height_values,model_heights,validate_holes,generate_2d

def wire_holes(project,part):
    return part.get('wireHoles',[]) if project['parameters'].get('wireEnabled') and not part.get('wireOmit') else []

def ensure_valid(project):
    if project.get('stage') not in ('2d','3d'):raise ValueError('Generate and review 2D geometry first.')
    if project.get('roundReviewRequired') and not project.get('classificationConfirmed'):raise ValueError('Review imported contour roles and confirm their classifications first.')
    if project.get('unassignedHoleCount',0):raise ValueError('Some screw contours are not inside a letter. Correct their positions in the DXF before fabrication.')
    p=project['parameters'];w=0 if p.get('bodyMode')=='flat' else p['wallThickness'];errors=[]
    for part in project['parts']:
        if part.get('placementUnresolved') and not part.get('allowHoleless'):errors.append(part['name']+': automatic holes do not fit; adjust diameter/clearance or explicitly allow this part without holes.')
        if p.get('wireEnabled') and not part.get('wireOmit') and not part.get('wireHoles'):errors.append(part['name']+': wire outlet does not fit; adjust diameter or omit it.')
        q=shape_from_data(part['shape'])
        errors += [part['name']+': '+e for e in validate_holes(q,part['holes']+wire_holes(project,part),w,p['holeClearance'])]
        if w and q.buffer(-w,join_style=2).is_empty:errors.append(part['name']+': wall consumes component.')
    if errors:raise ValueError('Resolve geometry conflicts before export. '+' '.join(errors[:6]))

def build_mesh(project,part):
    params=project['parameters'];base,wallheight,total=model_heights(params)
    original=shape_from_data(part['shape']);ox,oy=original.bounds[:2]
    q=translate(original,-ox,-oy).simplify(.01,preserve_topology=True)
    holes=[Point(h['x']-ox,h['y']-oy).buffer(h['diameter']/2,quad_segs=48) for h in part['holes']+wire_holes(project,part)]
    for attempt in range(2):
        if attempt:q=q.buffer(.01).buffer(-.01)
        baseq=q.difference(unary_union(holes));wallq=q.difference(q.buffer(-params['wallThickness'],join_style=2))
        meshes=[trimesh.creation.extrude_polygon(baseq,base,engine='earcut')]
        for ring in ([] if params.get('bodyMode')=='flat' else polygons(wallq)):
            m=trimesh.creation.extrude_polygon(ring,wallheight,engine='earcut');m.apply_translation([0,0,base]);meshes.append(m)
        result=trimesh.boolean.union(meshes,engine='manifold')
        reopened=trimesh.load(io.BytesIO(result.export(file_type='stl')),file_type='stl')
        if reopened.is_volume and reopened.is_watertight and abs(result.extents[2]-total)<.001:
            result.metadata['numerical_repair_mm']=.01 if attempt else 0.
            return result
    raise ValueError(f'{part["name"]}: export contains a self-touching edge; inspect the source contour.')

def add_shape(m,g,layer):
    for q in polygons(g):
        for ring in [q.exterior,*q.interiors]:m.add_lwpolyline(list(ring.coords),close=True,dxfattribs={'layer':layer})

def export_dxf(project,kind):
    ensure_valid(project)
    if kind not in ('body','acrylic'):raise ValueError('Unknown DXF export type.')
    if kind=='acrylic' and project['parameters'].get('bodyMode')=='flat':raise ValueError('Acrylic T-cover export is unavailable in flat mode.')
    doc=ezdxf.new('R2010');doc.units=4;m=doc.modelspace();params=project['parameters']
    layers={'BODY_OUTER':7,'BODY_INNER':3,'SCREW_HOLES':5,'WIRE_HOLES':30} if kind=='body' else {'ACRYLIC_INSERT':4,'ACRYLIC_TOP':6}
    for name,color in layers.items():doc.layers.new(name,dxfattribs={'color':color})
    for part in project['parts']:
        q=shape_from_data(part['shape']);r=offsets(q,params['wallThickness'],params['clearanceOverall'],params['lipWidth']) if params.get('bodyMode')!='flat' else None
        if kind=='body':
            add_shape(m,q,'BODY_OUTER')
            if r:add_shape(m,r['opening'],'BODY_INNER')
            for h in part['holes']:m.add_circle((h['x'],h['y']),h['diameter']/2,dxfattribs={'layer':'SCREW_HOLES'})
            for h in wire_holes(project,part):m.add_circle((h['x'],h['y']),h['diameter']/2,dxfattribs={'layer':'WIRE_HOLES'})
        else:
            if r['insert'].is_empty or r['wall'].difference(r['cap']).area>.05:raise ValueError(part['name']+': resolve acrylic fit/coverage before export.')
            add_shape(m,r['insert'],'ACRYLIC_INSERT');add_shape(m,r['cap'],'ACRYLIC_TOP')
    stream=io.StringIO();doc.write(stream);return stream.getvalue().encode('utf-8')

def export_stl_zip(project):
    ensure_valid(project);buffer=io.BytesIO();rows=[];combined=[]
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('dxf/body.dxf',export_dxf(project,'body'))
        if project['parameters'].get('bodyMode')=='flat':
            z.writestr('dxf/acrylic_NOT_APPLICABLE.txt','Flat / no-wall mode has no matching T-cover. No acrylic DXF is generated. Use body.dxf for the flat body cutting contours.\n')
        else:
            z.writestr('dxf/acrylic.dxf',export_dxf(project,'acrylic'))
        for i,part in enumerate(project['parts']):
            mesh=build_mesh(project,part);name=f'{i+1:03d}_{re.sub(r"[^a-zA-Z0-9_-]","_",part["name"])}.stl';z.writestr(name,mesh.export(file_type='stl'))
            params=project['parameters'];base,above,total=model_heights(params)
            rows.append(dict(file=name,width_mm=round(mesh.extents[0],3),depth_mm=round(mesh.extents[1],3),total_height_mm=total,base_mm=base,wall_above_base_mm=above,wall_thickness_mm=0 if params.get('bodyMode')=='flat' else params['wallThickness'],screw_holes=len(part['holes']),wire_holes=len(wire_holes(project,part)),numerical_repair_mm=mesh.metadata.get('numerical_repair_mm',0),watertight=True))
            moved=mesh.copy();bounds=shape_from_data(part['shape']).bounds;moved.apply_translation([bounds[0],bounds[1],0]);combined.append(moved)
        if combined:
            assembly=trimesh.util.concatenate(combined);assembly.apply_translation([-assembly.bounds[0,0],-assembly.bounds[0,1],0]);z.writestr('assembly_layout.stl',assembly.export(file_type='stl'))
        stream=io.StringIO();writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows);z.writestr('parts_manifest.csv',stream.getvalue())
        z.writestr('README.txt','Units: mm. Each STL is placed flat at Z=0. Acrylic DXFs specify planar cutting outlines only. Assembly layout is for reference. All individual exported STLs were reopened and checked for watertight positive volumes.\n')
        z.writestr('export_parameters.json',json.dumps(dict(parameters=project['parameters'],source=project.get('filename'),warnings=project.get('warnings',[]),classificationsConfirmed=project.get('classificationConfirmed',False)),indent=2))
    return buffer.getvalue()
