import io,zipfile,pytest,ezdxf
from backend.tests.test_body_modes import project
from backend.geometry import generate_2d
from backend.exports import export_dxf,build_mesh,export_stl_zip

def test_wire_hole_is_one_adjustable_six_mm_hole_separate_from_screws():
 p=project('hollow');p['parameters'].update(wireEnabled=True,wireDiameter=6)
 p=generate_2d(p);a=p['parts'][0]
 assert len(a['holes'])==1 and len(a['wireHoles'])==1
 assert a['wireHoles'][0]['diameter']==6
 p['parameters']['wireDiameter']=8;p=generate_2d(p)
 assert p['parts'][0]['wireHoles'][0]['diameter']==8

def test_wire_hole_roundtrips_dxf_stl_and_zip():
 p=project('flat');p['parameters'].update(wireEnabled=True,wireDiameter=6);p=generate_2d(p)
 d=ezdxf.read(io.StringIO(export_dxf(p,'body').decode()))
 assert len(d.modelspace().query('CIRCLE[layer=="WIRE_HOLES"]'))==1
 assert len(d.modelspace().query('CIRCLE[layer=="SCREW_HOLES"]'))==1
 mesh=build_mesh(p,p['parts'][0]);assert mesh.is_watertight
 assert len(mesh.section(plane_normal=[0,0,1],plane_origin=[0,0,.5]).discrete)==4
 with zipfile.ZipFile(io.BytesIO(export_stl_zip(p))) as z:assert 'wire_holes' in z.read('parts_manifest.csv').decode()

def test_wire_hole_can_be_disabled_without_deleting_saved_position():
 p=project('flat');p['parameters'].update(wireEnabled=True,wireDiameter=6);p=generate_2d(p)
 hole=p['parts'][0]['wireHoles'][0].copy();p['parameters']['wireEnabled']=False;p=generate_2d(p)
 assert p['parts'][0]['wireHoles'][0]==hole
 assert len(build_mesh(p,p['parts'][0]).section(plane_normal=[0,0,1],plane_origin=[0,0,.5]).discrete)==3


def test_wire_collisions_block_export_and_omit_allows_small_components():
 from backend.exports import ensure_valid
 p=project('hollow');p['parameters'].update(wireEnabled=True,wireDiameter=6);p=generate_2d(p)
 p['parts'][0]['wireHoles'][0].update(x=7,y=10)
 with pytest.raises(ValueError):ensure_valid(p)
 p['parts'][0]['wireOmit']=True;p=generate_2d(p);ensure_valid(p)

def test_wire_reset_api_preserves_screws_and_checks_size():
 from fastapi.testclient import TestClient
 from backend.main import app
 client=TestClient(app,base_url='http://127.0.0.1');p=project('flat');p['parameters'].update(wireEnabled=True,wireDiameter=6);p=generate_2d(p)
 screws=p['parts'][0]['holes'].copy();p['parts'][0]['wireOmit']=True
 response=client.post('/api/reset-wire-holes',json={'project':p,'partIds':[p['parts'][0]['id']]})
 assert response.status_code==200
 part=response.json()['parts'][0];assert len(part['wireHoles'])==1 and part['holes']==screws and not part['wireOmit']
 p['parameters']['wireDiameter']=0;assert client.post('/api/project/check',json=p).status_code==422
