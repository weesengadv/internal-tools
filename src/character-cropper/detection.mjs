import {clampCrop} from './geometry.mjs';

function bands(counts, threshold, gap) {
  const result = [];
  let start = -1, end = -1;
  for (let i=0; i<counts.length; i++) {
    if (counts[i] < threshold) continue;
    if (start >= 0 && i-end > gap+1) { result.push([start,end+1]); start = -1; }
    if (start < 0) start = i;
    end = i;
  }
  if (start >= 0) result.push([start,end+1]);
  return result;
}

// Content separation for sheets with a plain background. Orientation names
// cannot be inferred from whitespace; detected regions use neutral view names.
export function detectViewCrops({width, height, data}, sourceWidth = width, sourceHeight = height) {
  if (!width || !height || !data || data.length !== width*height*4) return [];
  const corners = [0,width-1,(height-1)*width,width*height-1];
  const median = values => values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const transparent = corners.filter(i=>data[i*4+3]<32).length >= 3;
  const background = [0,1,2].map(channel=>median(corners.map(i=>data[i*4+channel])));
  const mask = new Uint8Array(width*height), xs = new Uint32Array(width), ys = new Uint32Array(height);
  for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
    const p=y*width+x, i=p*4, alpha=data[i+3];
    const distance=Math.max(Math.abs(data[i]-background[0]),Math.abs(data[i+1]-background[1]),Math.abs(data[i+2]-background[2]));
    if (alpha>32 && (transparent || distance>24)) { mask[p]=1; xs[x]++; ys[y]++; }
  }
  // Thin rules often separate panels. Remove only near-full-length rules;
  // leaving them would join otherwise separate character rows and columns.
  const verticalRules = bands(xs,height*.72,0).filter(([a,b])=>b-a<=Math.max(3,Math.round(width*.004)));
  const horizontalRules = bands(ys,width*.72,0).filter(([a,b])=>b-a<=Math.max(3,Math.round(height*.004)));
  for (const [a,b] of verticalRules) for(let x=a;x<b;x++) for(let y=0;y<height;y++) mask[y*width+x]=0;
  for (const [a,b] of horizontalRules) for(let y=a;y<b;y++) mask.fill(0,y*width,(y+1)*width);
  ys.fill(0);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) ys[y]+=mask[y*width+x];
  const result=[];
  const minHeight=Math.min(24,Math.max(8,height*.025));
  const rowBands=bands(ys,Math.max(2,width*.003),Math.max(2,Math.floor(height*.006))).filter(([top,bottom])=>bottom-top>=minHeight);
  const heights=rowBands.map(([top,bottom])=>bottom-top).sort((a,b)=>a-b);
  const middle=Math.floor(heights.length/2);
  const typicalHeight=heights.length ? (heights[middle]+heights[Math.max(0,Math.ceil(heights.length/2)-1)])/2 : 0;
  for (const [top,bottom] of rowBands) {
    if (bottom-top<typicalHeight*.45) continue;
    const counts = new Uint32Array(width);
    for(let y=top;y<bottom;y++) for(let x=0;x<width;x++) counts[x]+=mask[y*width+x];
    for (const [left,right] of bands(counts,Math.max(2,(bottom-top)*.012),Math.max(2,Math.floor(width*.003)))) {
      if (right-left<Math.min(20,Math.max(6,width*.015))) continue;
      // Ignore short caption bands and broad headers, rather than exporting
      // every piece of printed text as a character view.
      if (bottom-top<(right-left)*.45) continue;
      const pad=Math.max(2,Math.round(Math.min(right-left,bottom-top)*.025));
      const x=Math.max(0,left-pad), y=Math.max(0,top-pad);
      const r=Math.min(width,right+pad), b=Math.min(height,bottom+pad);
      result.push(clampCrop({name:`View ${result.length+1}`,x:Math.floor(x*sourceWidth/width),y:Math.floor(y*sourceHeight/height),width:Math.ceil(r*sourceWidth/width)-Math.floor(x*sourceWidth/width),height:Math.ceil(b*sourceHeight/height)-Math.floor(y*sourceHeight/height)},sourceWidth,sourceHeight));
    }
  }
  return result;
}
