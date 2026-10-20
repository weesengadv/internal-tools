import { usePreferences } from './preferences.jsx';
import React from 'react';
import {totalHeight} from './project';
export default function FittingView({parameters:p,compact=false}) {
 const { t, theme } = usePreferences();
 if(p.bodyMode==='flat')return <div className={'fitting-view '+(compact?'compact':'')}><strong>{t("① 不加墙")}</strong><p>{t("只有底板、原有内洞和螺丝洞。总厚度")} {p.baseThickness} mm.</p><p>{t("没有墙，T 形亚克力盖板配合不适用。")}</p></div>;
 const gap=p.clearanceOverall/2,coverage=Math.round((p.lipWidth-p.wallThickness-gap)*100000)/100000;
 const sx=Math.min(100,80/Math.max(p.wallThickness,.01),80/Math.max(gap,.01),130/Math.max(p.lipWidth,.01));
 const outerLeft=130,innerLeft=outerLeft+p.wallThickness*sx,innerRight=480,outerRight=innerRight+p.wallThickness*sx;
 const insertLeft=innerLeft+gap*sx,insertRight=innerRight-gap*sx,capLeft=insertLeft-p.lipWidth*sx,capRight=insertRight+p.lipWidth*sx;
 const baseTop=230-Math.max(4,Math.min(35,p.baseThickness/Math.max(totalHeight(p),.1)*125));
 return <div className={'fitting-view '+(compact?'compact':'')}><div className="fit-heading"><strong>{t("Acrylic fitting · section")}</strong><span>{t("Planar fit · not to scale")}</span></div>
 <svg viewBox="0 0 650 250" role="img" aria-label={t(`Acrylic cover: ${gap} mm per-side clearance and ${p.lipWidth} mm lip`)}>
 <path d={`M${outerLeft} 105H${innerLeft}V${baseTop}H${innerRight}V105H${outerRight}V230H${outerLeft}Z`} fill="#c9d4d9" stroke="#677b85" strokeWidth="1.5"/>
 {coverage<0&&<><path d={`M${outerLeft} 105H${Math.min(capLeft,innerLeft)}`} stroke="#d95b4c" strokeWidth="5"/><path d={`M${Math.max(capRight,innerRight)} 105H${outerRight}`} stroke="#d95b4c" strokeWidth="5"/></>}
 <path d={`M${capLeft} 65H${capRight}V105H${insertRight}V137H${insertLeft}V105H${capLeft}Z`} fill="#d8edf7" stroke="#3b86b0" strokeWidth="1.5"/>
 <path d={`M${innerLeft} 115H${insertLeft}M${innerLeft} 108V122M${insertLeft} 108V122`} stroke="#007e83" strokeWidth="1.5"/><path d="M100 105H65V230H100M60 105H70M60 230H70" stroke="#687d86" fill="none"/>
 <text x="5" y="155">{totalHeight(p).toFixed(1)} mm</text><text x="5" y="174">{t("total body")}</text><path d={`M${insertLeft+15} 137L${insertLeft+50} 166`} stroke="#688b9d"/><text x={insertLeft+53} y="172">{t("Acrylic insert")}</text><text x="285" y="50">{t("Top cover · lip")} {p.lipWidth} mm</text><text x="135" y="35">{gap.toFixed(2)} {t("mm side gap")}</text><text x="235" y="247">{t("Base")} {p.baseThickness} mm</text><text x={Math.min(outerRight+8,555)} y="170">{t("Wall")} {p.wallThickness} mm</text>
 </svg><div className="fit-values"><span>{t("Overall gap")} <b>{p.clearanceOverall} mm</b></span><span>{t("Per side")} <b>{gap.toFixed(2)} mm</b></span><span className={coverage<0?'danger':''}>{t("Outer-wall cover")} <b>{coverage.toFixed(2)} mm</b></span></div>{!compact&&<p className="fit-note">{t("Acrylic thickness and insert depth are not specified. This schematic illustrates fitting; the DXF defines the two cutting outlines.")}</p>}</div>;
}
