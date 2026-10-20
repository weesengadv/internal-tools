import pytest
from shapely.geometry import Polygon, box, Point
from backend.geometry import offsets, height_values, auto_holes, validate_holes, parse_dxf, shape_data, shape_from_data, generate_2d

def test_clearance_is_overall_and_lip_covers_wall():
    result = offsets(box(0,0,100,100), .8, .2, 1)
    assert result['insert'].bounds == pytest.approx((.9,.9,99.1,99.1))
    assert result['cap'].bounds == pytest.approx((-.1,-.1,100.1,100.1))
    opening_width=100-2*.8
    assert result['insert'].bounds[2]-result['insert'].bounds[0] == pytest.approx(opening_width-.2)

def test_counter_stays_open_and_gets_wall():
    p=Polygon([(0,0),(50,0),(50,50),(0,50)],holes=[[(15,15),(35,15),(35,35),(15,35)]])
    result=offsets(p,.8,.2,1)
    assert not result['wall'].covers(Point(25,25))
    assert result['wall'].covers(Point(14.6,25))
    assert not result['insert'].covers(Point(25,25))
    assert shape_from_data(shape_data(p)).equals(p)

def test_both_height_modes_and_invalid_values():
    assert height_values(1,30,'total') == (1,29,30)
    assert height_values(1,30,'wall') == (1,30,31)
    with pytest.raises(ValueError): height_values(2,1,'total')

def test_holes_centered_on_stroke_and_narrow_part_rejected():
    p=box(0,0,15,80)
    hs=auto_holes(p,4,.8,1,2)
    assert len(hs)==2
    assert all(abs(h['x']-7.5)<.6 for h in hs)
    assert not validate_holes(p,hs,.8,1)
    assert not auto_holes(box(0,0,3,20),4,.8,1,2)

def test_detect_wall_and_overlapping_holes():
    assert validate_holes(box(0,0,30,30),[{'x':2,'y':15,'diameter':4}],.8,1)
    assert validate_holes(box(0,0,30,30),[{'x':15,'y':15,'diameter':4},{'x':16,'y':15,'diameter':4}],.8,1)

def test_import_preserves_existing_polyline_screws_and_counters():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace()
    m.add_lwpolyline([(0,0),(60,0),(60,60),(0,60)],close=True)
    m.add_lwpolyline([(20,20),(40,20),(40,40),(20,40)],close=True)
    m.add_circle((10,10),2)
    stream=io.StringIO();doc.write(stream)
    project=parse_dxf(stream.getvalue().encode(),'test.dxf')
    assert len(project['parts'])==1
    part=project['parts'][0]
    assert len(part['holes'])==1 and part['holes'][0]['diameter']==pytest.approx(4)
    assert not shape_from_data(part['shape']).covers(Point(30,30))

def test_legacy_closed_polyline_is_not_decomposed_to_open_segments():
    import ezdxf,io
    doc=ezdxf.new('R12');doc.units=4
    doc.modelspace().add_polyline2d([(0,0),(60,0),(60,60),(0,60)],close=True)
    stream=io.StringIO();doc.write(stream)
    assert len(parse_dxf(stream.getvalue().encode(),'legacy.dxf')['parts'])==1

def test_windows_crlf_dxf_import():
    import ezdxf,io
    doc=ezdxf.new('R12');doc.units=4
    doc.modelspace().add_polyline2d([(0,0),(60,0),(60,60),(0,60)],close=True)
    stream=io.StringIO();doc.write(stream)
    assert len(parse_dxf(stream.getvalue().replace('\n','\r\n').encode(),'windows.dxf')['parts'])==1

def test_outward_wall_growth_and_regeneration_do_not_accumulate_offsets():
    from backend.geometry import generate_2d,DEFAULTS
    project=dict(version=1,parameters={**DEFAULTS,'offsetDirection':'outward'},parts=[dict(id='p1',name='Test',group='g1',shape=shape_data(box(0,0,30,60)),holes=[],bounds=[0,0,30,60])])
    first=generate_2d(project);q=shape_from_data(first['parts'][0]['shape'])
    assert q.bounds==pytest.approx((-.8,-.8,30.8,60.8))
    assert shape_from_data(generate_2d(first)['parts'][0]['shape']).bounds==pytest.approx(q.bounds)

def test_base_validation_ignores_acrylic_coverage_when_only_exporting_body():
    from backend.geometry import generate_2d,DEFAULTS
    project=dict(version=1,parameters={**DEFAULTS,'lipWidth':0},parts=[dict(id='p1',name='Test',group='g1',shape=shape_data(box(0,0,30,60)),holes=[],bounds=[0,0,30,60])])
    assert any('cover' in e for e in generate_2d(project)['parts'][0]['issues'])

def test_thin_counter_is_not_discarded_as_offset():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace()
    m.add_lwpolyline([(0,0),(30,0),(30,30),(0,30)],close=True)
    m.add_lwpolyline([(1.5,1.5),(28.5,1.5),(28.5,28.5),(1.5,28.5)],close=True)
    stream=io.StringIO();doc.write(stream)
    p=parse_dxf(stream.getvalue().encode(),'thin.dxf')
    assert not shape_from_data(p['parts'][0]['shape']).covers(Point(15,15))

def test_round_contour_can_be_confirmed_as_letter_counter():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace();m.add_lwpolyline([(0,0),(40,0),(40,40),(0,40)],close=True);m.add_circle((20,20),4)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'round-counter.dxf')
    assert p['roundReviewRequired'] and not p['classificationConfirmed']
    p['parts'][0]['roundContours'][0]['role']='counter';p['classificationConfirmed']=True
    result=generate_2d(p)
    assert not result['parts'][0]['holes']
    assert not shape_from_data(result['parts'][0]['shape']).covers(Point(20,20))

def test_replacing_imported_holes_does_not_restore_them_on_regeneration():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace();m.add_lwpolyline([(0,0),(30,0),(30,80),(0,80)],close=True);m.add_circle((8,15),2)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'holes.dxf');p['classificationConfirmed']=True;p['parameters']['holeCount']=2
    first=generate_2d(p,True,True)
    assert len(first['parts'][0]['holes'])==2
    assert generate_2d(first)['parts'][0]['holes']==first['parts'][0]['holes']

def test_three_holes_fit_a_large_solid_logo():
    from shapely.affinity import scale
    p=scale(Point(0,0).buffer(1,quad_segs=64),100,70)
    holes=auto_holes(p,4,.8,.2,3)
    assert len(holes)==3
    assert not validate_holes(p,holes,.8,.2)

def test_nested_island_inside_counter_remains_a_separate_part():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace()
    for q in [box(0,0,100,100),box(20,20,80,80),box(35,35,55,55)]:m.add_lwpolyline(list(q.exterior.coords)[:-1],close=True)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'island.dxf')
    assert len(p['parts'])==2
    assert any(shape_from_data(part['shape']).covers(Point(40,40)) for part in p['parts'])

def test_counter_offset_family_keeps_actual_small_counter_boundary():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace()
    for x in [0,50,100]:
        outer=box(x,0,x+20,30);counter=box(x+7,10,x+13,20)
        for q in [outer,outer.buffer(-.8,join_style=2),counter,counter.buffer(.8,join_style=2)]:m.add_lwpolyline(list(q.exterior.coords)[:-1],close=True)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'paired.dxf')
    assert len(p['parts'])==3
    assert all(shape_from_data(part['shape']).area==pytest.approx(540) for part in p['parts'])

def test_duplicate_screw_contours_are_not_duplicate_holes():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace();m.add_lwpolyline(list(box(0,0,40,40).exterior.coords)[:-1],close=True)
    m.add_circle((10,10),2);m.add_circle((10,10),2)
    stream=io.StringIO();doc.write(stream)
    assert len(parse_dxf(stream.getvalue().encode(),'duplicate.dxf')['parts'][0]['holes'])==1

def test_small_round_island_is_not_lost_inside_a_counter():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace()
    for q in [box(0,0,100,100),box(20,20,80,80)]:m.add_lwpolyline(list(q.exterior.coords)[:-1],close=True)
    m.add_circle((45,45),4)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'round-island.dxf')
    assert len(p['parts'])==2
    assert sum(len(q['holes']) for q in p['parts'])==0

def test_large_round_opening_can_be_reclassified_as_base_screw_hole():
    import ezdxf,io
    doc=ezdxf.new();doc.units=4;m=doc.modelspace();m.add_lwpolyline(list(box(0,0,80,80).exterior.coords)[:-1],close=True);m.add_circle((40,40),10)
    stream=io.StringIO();doc.write(stream);p=parse_dxf(stream.getvalue().encode(),'large-round.dxf')
    assert p['roundReviewRequired']
    p['parts'][0]['roundContours'][0]['role']='screw';p['classificationConfirmed']=True
    result=generate_2d(p)
    assert shape_from_data(result['parts'][0]['shape']).covers(Point(40,40))
    assert result['parts'][0]['holes'][0]['diameter']==pytest.approx(20)

def test_two_holes_fit_small_solid_square_even_without_long_medial_axis():
    p=box(0,0,10,10);holes=auto_holes(p,4,.8,.2,2)
    assert len(holes)==2 and not validate_holes(p,holes,.8,.2)

def test_three_holes_fit_small_solid_round_component():
    p=Point(0,0).buffer(5.5,quad_segs=64);holes=auto_holes(p,4,.8,.2,3)
    assert len(holes)==3 and not validate_holes(p,holes,.8,.2)



def test_auto_count_scales_with_letter_and_screw_size():
 small=auto_holes(box(0,0,8,8),4,.8,.2)
 large=auto_holes(box(0,0,180,180),4,.8,.2)
 larger_screws=auto_holes(box(0,0,180,180),8,.8,.2)
 assert len(small)==1
 assert len(large)>3 and len(larger_screws)<len(large)
 assert not validate_holes(box(0,0,180,180),large,.8,.2)

def test_auto_count_covers_long_strokes_and_is_deterministic():
 p=box(0,0,12,240);holes=auto_holes(p,4,.8,.2)
 assert len(holes)>3 and not validate_holes(p,holes,.8,.2)
 assert all(abs(h['x']-6)<.7 for h in holes)
 assert holes==auto_holes(p,4,.8,.2)
