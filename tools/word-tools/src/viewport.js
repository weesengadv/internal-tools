export function fitViewport(bounds){const width=Math.max(bounds[2]-bounds[0],.01),height=Math.max(bounds[3]-bounds[1],.01),pad=Math.max(width,height)*.08;return {x:bounds[0]-pad,y:bounds[1]-pad,width:width+2*pad,height:height+2*pad};}
export function panBy(v,dx,dy){return {...v,x:v.x-dx,y:v.y-dy};}
export function zoomAt(v,factor,fx=.5,fy=.5){const width=Math.min(1e8,Math.max(.01,v.width/factor)),height=v.height*width/v.width;return {x:v.x+(v.width-width)*fx,y:v.y+(v.height-height)*fy,width,height};}

export function partsInBox(parts,a,b){const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);return parts.filter(p=>p.bounds[0]<=x1&&p.bounds[2]>=x0&&p.bounds[1]<=y1&&p.bounds[3]>=y0).map(p=>p.id);}
