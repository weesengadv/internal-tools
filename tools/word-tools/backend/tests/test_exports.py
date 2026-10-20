import io,zipfile,pytest,trimesh,ezdxf
from shapely.geometry import box, Point
from backend.geometry import DEFAULTS,shape_data,generate_2d
from backend.exports import build_mesh, export_dxf, export_stl_zip

def fixture():
    return generate_2d(dict(version=1,filename='test.dxf',units='mm',parameters=dict(DEFAULTS),warnings=[],parts=[dict(id='p1',name='Test',group='g1',shape=shape_data(box(0,0,30,60)),holes=[dict(id='h1',x=15,y=15,diameter=4,manual=True)],bounds=[0,0,30,60])]))

def test_real_mesh_height_hole_and_closed_volume():
    p=fixture();m=build_mesh(p,p['parts'][0]);assert m.is_volume and m.is_watertight
    assert m.extents[2]==pytest.approx(30)
    reopened=trimesh.load(io.BytesIO(m.export(file_type='stl')),file_type='stl')
    assert reopened.is_volume and reopened.is_watertight
    assert reopened.section([0,0,1],[0,0,.5]) is not None

def test_dxf_export_layers_and_screw_circle():
    p=fixture();body=ezdxf.read(io.StringIO(export_dxf(p,'body').decode()))
    assert body.units==4
    assert len(body.modelspace().query('CIRCLE'))==1
    acrylic=ezdxf.read(io.StringIO(export_dxf(p,'acrylic').decode()))
    assert {'ACRYLIC_INSERT','ACRYLIC_TOP'} <= {e.dxf.layer for e in acrylic.modelspace()}

def test_stl_archive_and_manifest():
    raw=export_stl_zip(fixture())
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        assert 'parts_manifest.csv' in z.namelist()
        assert len([n for n in z.namelist() if n.endswith('.stl')])==2

def test_invalid_hole_prevents_export():
    p=fixture();p['parts'][0]['holes'][0]['x']=.1
    with pytest.raises(ValueError):export_stl_zip(p)

def test_unresolved_auto_hole_failure_blocks_stl_until_explicitly_accepted():
    p=fixture();p['parts'][0]['holes']=[];p['parts'][0]['placementUnresolved']=True
    with pytest.raises(ValueError):export_stl_zip(p)
    p['parts'][0]['allowHoleless']=True
    assert export_stl_zip(p)

def test_outline_only_dxf_generates_walls_and_screws_then_exports():
    from backend.geometry import parse_dxf
    doc=ezdxf.new();doc.units=4
    doc.modelspace().add_lwpolyline([(0,0),(35,0),(35,12),(12,12),(12,60),(0,60)],close=True)
    raw=io.StringIO();doc.write(raw)
    p=parse_dxf(raw.getvalue().encode(),'outline_only.dxf')
    assert len(p['parts'])==1 and not p['parts'][0]['holes']
    assert not p['parts'][0]['offsetContours']
    p=generate_2d(p,place=True)
    assert len(p['parts'][0]['holes']) in (2,3)
    reopened=ezdxf.read(io.StringIO(export_dxf(p,'body').decode()))
    assert len(reopened.modelspace().query('CIRCLE'))==len(p['parts'][0]['holes'])
    assert export_stl_zip(p)

def test_deleted_last_hole_not_automatically_recreated_by_generate_2d():
    p=fixture();part=p['parts'][0];part['holes']=[];part['manualHoleLayout']=True;part['allowHoleless']=True
    part['roundContours']=[dict(id='r1',role='screw',wasCounter=True,shape=shape_data(Point(15,15).buffer(2)),originalHole=dict(id='h1',x=15,y=15,diameter=4,sourceContour='r1'))]
    part['deletedHoleContours']=['r1']
    n=generate_2d(p,place=True)
    assert not n['parts'][0]['holes']
    assert export_dxf(n,'body')
    assert export_stl_zip(n)
    mesh=build_mesh(n,n['parts'][0]);section=mesh.section(plane_normal=[0,0,1],plane_origin=[0,0,.5])
    assert len(section.discrete)==1  # only the base exterior remains; no deleted screw loop
    n=generate_2d(n,place=True,replace=True)
    assert n['parts'][0]['holes']


@pytest.mark.parametrize('kind',['body','acrylic'])
def test_export_explicitly_repeats_start_vertex_for_legacy_cutting_software(kind):
    doc=ezdxf.read(io.StringIO(export_dxf(fixture(),kind).decode()))
    contours=list(doc.modelspace().query('LWPOLYLINE'))
    assert contours
    for contour in contours:
        points=list(contour.get_points('xy'))
        assert contour.closed
        assert points[0]==points[-1], 'Legacy readers need an explicit final segment, not only the DXF closed flag.'
