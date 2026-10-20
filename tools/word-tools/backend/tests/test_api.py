import copy,pytest
from backend.main import checked
from backend.tests.test_exports import fixture

def test_saved_project_rejects_invalid_geometry_and_duplicate_ids():
    p=fixture();p['parts'][0]['shape']=[{'outer':[[0,0],[1,1],[0,1],[1,0]],'holes':[]}]
    with pytest.raises(ValueError):checked(p)
    p=fixture();p['parts'].append(copy.deepcopy(p['parts'][0]))
    with pytest.raises(ValueError):checked(p)

def test_bounds_are_derived_and_invalid_modes_rejected():
    p=fixture();p['parts'][0]['bounds']=[0,0,0,0]
    assert checked(p)['parts'][0]['bounds']==[0.,0.,30.,60.]
    p=fixture();p['parameters']['heightMode']='bad'
    with pytest.raises(ValueError):checked(p)
