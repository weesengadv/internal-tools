import io,copy,pytest,ezdxf
from shapely.geometry import box,Point
from backend.geometry import DEFAULTS,shape_data,shape_from_data,generate_2d
from backend.exports import build_mesh,export_dxf,export_stl_zip

def project(mode):
 return dict(version=1,filename='R-like.dxf',units='mm',stage='imported',parameters={**DEFAULTS,'bodyMode':mode},parts=[dict(id='p',name='R',group='g',shape=shape_data(box(0,0,50,60).difference(box(15,25,30,45))),bounds=[0,0,50,60],holes=[dict(id='h',x=7,y=10,diameter=4)])])

@pytest.mark.parametrize('mode,total,counters',[('flat',1,1),('solid',30,0),('hollow',30,1)])
def test_three_modes_control_counter_and_stl_height(mode,total,counters):
 p=generate_2d(project(mode));q=shape_from_data(p['parts'][0]['shape'])
 assert len(q.interiors)==counters
 m=build_mesh(p,p['parts'][0]);assert m.is_watertight and m.is_volume
 assert m.extents[2]==pytest.approx(total)
 assert len(m.section(plane_normal=[0,0,1],plane_origin=[0,0,.5]).discrete)==counters+2
 assert export_stl_zip(p)

def test_flat_dxf_has_no_wall_offsets_and_cover_export_is_unavailable():
 p=generate_2d(project('flat'));doc=ezdxf.read(io.StringIO(export_dxf(p,'body').decode()))
 assert not list(doc.modelspace().query('*[layer=="BODY_INNER"]'))
 assert len(doc.modelspace().query('CIRCLE'))==1
 with pytest.raises(ValueError,match='flat|无墙'):export_dxf(p,'acrylic')
 import zipfile
 with zipfile.ZipFile(io.BytesIO(export_stl_zip(p))) as z:
  assert 'dxf/body.dxf' in z.namelist() and 'dxf/acrylic_NOT_APPLICABLE.txt' in z.namelist()
  assert 'dxf/acrylic.dxf' not in z.namelist()

def test_changing_solid_back_to_flat_restores_original_counter():
 p=generate_2d(project('solid'));p['parameters']['bodyMode']='flat';p=generate_2d(p)
 assert len(shape_from_data(p['parts'][0]['shape']).interiors)==1

def test_flat_model_api_places_missing_holes_in_legacy_ready_project():
 from fastapi.testclient import TestClient
 from backend.main import app
 p=generate_2d(project('flat'));p['parts'][0]['holes']=[];p['parts'][0]['holeBaseline']=[]
 response=TestClient(app,base_url='http://localhost').post('/api/model',json={'project':p,'partId':'p'})
 assert response.status_code==200,response.text
 assert len(response.json()['project']['parts'][0]['holes'])>=2
 assert response.json()['project']['parts'][0]['holeBaseline']==response.json()['project']['parts'][0]['holes']

def test_reset_selected_restores_original_positions_without_touching_linked_copy():
 from backend.geometry import reset_holes
 p=generate_2d(project('flat'));a=p['parts'][0];original=[dict(h) for h in a['holes']]
 b=copy.deepcopy(a);b['id']='copy';p['parts'].append(b)
 a['holes'][0]['x']=9;b['holes'][0]['x']=10
 restored=reset_holes(p,['p'])
 assert restored['parts'][0]['holes']==original
 assert restored['parts'][1]['holes'][0]['x']==10

def test_reset_deleted_last_hole_restores_initial_layout():
 from backend.geometry import reset_holes
 p=generate_2d(project('flat'));p['parts'][0]['holes']=[];p['parts'][0]['manualHoleLayout']=True
 assert reset_holes(p,['p'])['parts'][0]['holes']

def test_model_respects_explicit_holeless_choice():
 from fastapi.testclient import TestClient
 from backend.main import app
 p=generate_2d(project('flat'));a=p['parts'][0];a['holes']=[];a['placementUnresolved']=True;a['allowHoleless']=True
 r=TestClient(app,base_url='http://localhost').post('/api/model',json={'project':p,'partId':'p'})
 assert r.status_code==200
 assert not r.json()['project']['parts'][0]['holes']

def test_flat_dxf_export_places_missing_screws_without_generating_3d_first():
 from fastapi.testclient import TestClient
 from backend.main import app
 p=generate_2d(project('flat'));p['parts'][0]['holes']=[]
 r=TestClient(app,base_url='http://localhost').post('/api/export/body',json=p)
 assert r.status_code==200
 assert len(ezdxf.read(io.StringIO(r.content.decode())).modelspace().query('CIRCLE'))>=2

@pytest.mark.parametrize('count',[1,4,6])
def test_custom_screw_count_is_exact(count):
 from backend.geometry import auto_holes,validate_holes
 shape=box(0,0,50,90);holes=auto_holes(shape,4,.8,.2,str(count))
 assert len(holes)==count
 assert not validate_holes(shape,holes,.8,.2)

def test_zip_includes_body_and_acrylic_cutting_files():
 p=generate_2d(project('hollow'))
 import zipfile
 with zipfile.ZipFile(io.BytesIO(export_stl_zip(p))) as z:
  assert {'dxf/body.dxf','dxf/acrylic.dxf'}<=set(z.namelist())
  for n in ['dxf/body.dxf','dxf/acrylic.dxf']:
   assert ezdxf.read(io.StringIO(z.read(n).decode())).units==4
