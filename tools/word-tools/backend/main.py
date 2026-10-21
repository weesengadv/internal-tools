import json,math,copy
from pathlib import Path
from fastapi import FastAPI,UploadFile,File,HTTPException,Request
from fastapi.responses import Response,FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware
from urllib.parse import urlparse
from .geometry import parse_dxf,generate_2d,reset_holes,DEFAULTS,height_values,model_heights
from .exports import export_dxf,export_stl_zip,build_mesh,ensure_valid

app=FastAPI(title='LetterForm local geometry service')
app.add_middleware(TrustedHostMiddleware,allowed_hosts=['localhost','127.0.0.1'])
ROOT=Path(__file__).resolve().parent.parent

@app.middleware('http')
async def local_only(request:Request,call_next):
    origin=request.headers.get('origin','')
    if origin and (urlparse(origin).hostname not in ('localhost','127.0.0.1') or urlparse(origin).scheme!='http'):
        return Response('Local application only',status_code=403)
    return await call_next(request)

def checked(project):
    if not isinstance(project,dict) or project.get('version')!=1 or not isinstance(project.get('parts'),list) or not 1<=len(project['parts'])<=500:
        raise ValueError('Invalid project format or too many components (maximum 500).')
    params={**DEFAULTS,**project.get('parameters',{})}
    if project.get('units')!='mm':raise ValueError('Project units must be millimetres.')
    for k in ('wallThickness','clearanceOverall','lipWidth','screwDiameter','holeClearance','baseThickness','height','wireDiameter'):
        if not isinstance(params[k],(float,int)) or not math.isfinite(params[k]) or params[k]<0 or params[k]>1000:raise ValueError('Invalid '+k)
    if params['wallThickness']<=0 or params['screwDiameter']<=0:raise ValueError('Wall and screw diameter must be positive.')
    if params.get('bodyMode','hollow') not in ('flat','solid','hollow','wall-only'):raise ValueError('Invalid body mode.')
    if params['holeCount']!='auto' and (isinstance(params['holeCount'],bool) or str(params['holeCount']) not in {str(i) for i in range(1,51)}):raise ValueError('Choose Auto or a custom count from 1 to 50.')
    if params['heightMode'] not in ('total','wall') or params['offsetDirection'] not in ('inward','outward'):raise ValueError('Invalid height or offset mode.')
    if not isinstance(params['linkMatching'],bool):raise ValueError('Invalid matching-letter setting.')
    if not isinstance(params['wireEnabled'],bool) or params['wireDiameter']<=0:raise ValueError('Invalid wire outlet settings.')
    ids=set();point_count=0
    from .geometry import shape_from_data
    for part in project['parts']:
        if not all(k in part for k in ('id','name','group','shape','holes')):raise ValueError('Incomplete component data.')
        if not all(isinstance(part[k],str) and 0<len(part[k])<=100 for k in ('id','name','group')):raise ValueError('Invalid component identifiers.')
        if part['id'] in ids:raise ValueError('Duplicate component identifier.')
        ids.add(part['id'])
        for field in ('shape','sourceShape','wall','opening','insert','cap'):
            if field not in part:continue
            if not isinstance(part[field],list):raise ValueError('Invalid polygon data.')
            for polygon in part[field]:
                if not isinstance(polygon,dict) or not isinstance(polygon.get('outer'),list) or not isinstance(polygon.get('holes',[]),list):raise ValueError('Invalid polygon rings.')
                for ring in [polygon['outer'],*polygon.get('holes',[])]:
                    if not isinstance(ring,list) or len(ring)<4:raise ValueError('Polygon ring needs at least four coordinates.')
                    point_count+=len(ring)
                    if point_count>600000:raise ValueError('Project has too many curve points.')
                    for pt in ring:
                        if not isinstance(pt,list) or len(pt)!=2 or not all(isinstance(x,(int,float)) and math.isfinite(x) and abs(x)<1000000 for x in pt):raise ValueError('Invalid polygon coordinates.')
            q=shape_from_data(part[field])
            if not q.is_valid or (field in ('shape','sourceShape') and (q.is_empty or q.area<=0)):raise ValueError('Invalid or empty component polygon.')
        part['bounds']=list(shape_from_data(part['shape']).bounds)
        if len(part['holes'])>100:raise ValueError('Too many holes in a component.')
        hole_ids=set()
        if not isinstance(part.get('wireHoles',[]),list) or len(part.get('wireHoles',[]))>1:raise ValueError('One wire outlet per component is supported.')
        if not isinstance(part.get('wireOmit',False),bool):raise ValueError('Invalid wire outlet override.')
        for h in part['holes']+part.get('wireHoles',[]):
            if not all(isinstance(h.get(k),(int,float)) and math.isfinite(h[k]) for k in ('x','y','diameter')):raise ValueError('Invalid hole coordinates.')
            if h['diameter']<=0 or h['diameter']>1000 or not isinstance(h.get('id'),str) or h['id'] in hole_ids:raise ValueError('Invalid or duplicate hole identifier.')
            hole_ids.add(h['id'])
        for contour in part.get('offsetContours',[]):
            if contour.get('role') not in ('offset','counter'):raise ValueError('Invalid inset contour classification.')
            q=shape_from_data(contour['shape'])
            if q.is_empty or not q.is_valid or not math.isfinite(q.area):raise ValueError('Invalid imported inset contour.')
        for contour in part.get('roundContours',[]):
            if contour.get('role') not in ('screw','counter','ignore'):raise ValueError('Invalid contour classification.')
            q=shape_from_data(contour['shape'])
            if q.is_empty or not q.is_valid or not math.isfinite(q.area):raise ValueError('Invalid imported round contour.')
            h=contour.get('originalHole',{})
            if not all(isinstance(h.get(k),(int,float)) and math.isfinite(h[k]) for k in ('x','y','diameter')) or h['diameter']<=0:raise ValueError('Invalid imported hole metadata.')
    project['parameters']=params;return project

def fail(exc):raise HTTPException(status_code=422,detail=str(exc))

@app.get('/api/health')
def health():return {'ok':True,'local':True}

@app.get('/api/demo')
def demo():return json.loads((ROOT/'backend'/'demo.json').read_text(encoding='utf-8'))

@app.post('/api/import')
async def import_file(file:UploadFile=File(...)):
    raw=await file.read(20*1024*1024+1)
    if len(raw)>20*1024*1024:fail(ValueError('DXF is larger than the 20 MB limit.'))
    try:return parse_dxf(raw,file.filename or 'drawing.dxf')
    except Exception as exc:fail(exc)

@app.post('/api/generate2d')
def generate(payload:dict):
    try:
        project=checked(payload['project']);targets=payload.get('partIds')
        if targets is not None and (not isinstance(targets,list) or not targets or not all(isinstance(i,str) for i in targets) or not set(targets)<=set(p['id'] for p in project['parts'])):raise ValueError('Select valid letters.')
        return generate_2d(project,payload.get('placeHoles',False),payload.get('replaceHoles',False),targets=targets)
    except Exception as exc:fail(exc)

@app.post('/api/reset-holes')
def reset_selected(payload:dict):
    try:return reset_holes(checked(payload['project']),payload.get('partIds'))
    except Exception as exc:fail(exc)

@app.post('/api/reset-wire-holes')
def reset_wire(payload:dict):
    try:
        project=checked(payload['project']);targets=payload.get('partIds',[])
        if not targets or not isinstance(targets,list) or not all(isinstance(i,str) for i in targets) or not set(targets)<=set(p['id'] for p in project['parts']):raise ValueError('Select valid components.')
        for part in project['parts']:
            if part['id'] in targets:part['wireHoles']=[];part['wireOmit']=False
        return generate_2d(project)
    except Exception as exc:fail(exc)

@app.post('/api/project/check')
def check_project(project:dict):
    try:return checked(project)
    except Exception as exc:fail(exc)

@app.post('/api/model')
def model(payload:dict):
    try:
        project=generate_2d(checked(payload['project']),place=True);ensure_valid(project);model_heights(project['parameters'])
        part=next(p for p in project['parts'] if p['id']==payload['partId']);mesh=build_mesh(project,part)
        return dict(project=project,vertices=mesh.vertices.tolist(),faces=mesh.faces.tolist(),bounds=mesh.bounds.tolist(),watertight=True)
    except Exception as exc:fail(exc)

@app.post('/api/export/{kind}')
def export(kind:str,project:dict):
    try:
        project=generate_2d(checked(project),place=True)
        if kind=='stl':raw=export_stl_zip(project);media='application/zip';name='letterform_stl_parts.zip'
        else:raw=export_dxf(project,kind);media='application/dxf';name=f'letterform_{kind}.dxf'
        return Response(raw,media_type=media,headers={'Content-Disposition':f'attachment; filename="{name}"'})
    except Exception as exc:fail(exc)

DIST=ROOT/'dist'/'client'
if DIST.exists():app.mount('/',StaticFiles(directory=DIST,html=True),name='ui')
