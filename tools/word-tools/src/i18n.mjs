// Each entry accepts either language, so old saved messages also follow the current UI language.
export const translations = [
  ['3D word tools', '3D 立体字工具'], ['Opening 3D word tools', '正在打开 3D 立体字工具'],
  ['LOCAL WORKBENCH', '本地工作台'], ['Import DXF', '导入 DXF'], ['Open saved project', '打开已保存的项目'], ['Open project', '打开项目'], ['Save project', '保存项目'],
  ['Undo', '撤销'], ['Redo', '重做'], ['Export', '导出'], ['Body DXF', '底板 DXF'], ['Acrylic DXF', '亚克力 DXF'], ['STL + DXF · ZIP', 'STL + DXF · ZIP'],
  ['Prepare 2D', '准备 2D'], ['Generate 3D', '生成 3D'], ['3D preview generated', '已生成 3D 预览'], ['2D geometry ready', '2D 几何已就绪'], ['Generate 2D to refresh outlines', '生成 2D 以更新轮廓'],
  ['Parts', '部件'], ['holes', '个洞'], ['Units', '单位'], ['Millimetres', '毫米'], ['Files stay on this computer', '文件仅在本机处理'], ['Drawing layout', '图形布局'],
  ['Right-drag to pan · Left-drag to select · Scroll to zoom', '右键平移 · 左键框选 · 滚轮缩放'], ['3D body', '3D 字体'], ['Fitting section', '配合剖面'], ['Zoom out', '缩小'], ['Zoom in', '放大'],
  ['Fit drawing', '显示全部图形'], ['Show all', '显示全部'], ['DXF letter outlines with draggable screw holes', 'DXF 字形轮廓，可拖动螺丝洞'],
  ['Click a solid area of any letter, outside its openings.', '请点击任意字母的实体区域，不能点内洞或外面。'],
  ['Hole added. Keep clicking to add more, then finish adding. Adjust red holes before exporting.', '已手动加洞；可继续点选位置，完成后点击“结束加洞”。红色洞位需调整后再导出。'],
  ['Generate your 3D letter', '生成立体字'], ['Review 2D first, then set the base and height.', '先检查 2D，再设置底板与高度。'], ['Generate selected 3D', '生成选中部件的 3D'], ['Settings changed · Generate 2D to refresh', '设置已更改 · 请生成 2D 以更新'],
  ['Selected', '已选'], ['letters', '个字母'], ['No letters selected', '未选中字母'], ['Wire outlet', '出线洞'], ['selected', '已选中'],
  ['Fitting', '配合'], ['Focus selected part', '聚焦选中部件'], ['Acrylic outlines', '亚克力轮廓'], ['Body', '底板'], ['Acrylic', '亚克力'], ['Screw holes', '螺丝洞'],
  ['Reference structure: hollow printed P with perimeter and counter walls', '参考结构：带外墙和内洞围墙的空心立体字 P'], ['Reference structure · open top', '参考结构 · 顶部开放'],
  ['Prepare your outlines', '准备字形轮廓'], ['Build your letter', '制作立体字'], ['STEP 1 · 2D', '第 1 步 · 2D'], ['STEP 2 · 3D', '第 2 步 · 3D'],
  ['Imported contours', '内线处理'], ['DXF inner contours are detected here. Choose body mode below to control walls and openings.', '这里只识别 DXF 内线；是否加墙、是否保留内洞，由下方“制作方式”决定。'],
  ['Inset contour', '内缩轮廓'], ['Inset', '内缩线'], ['role', '用途'], ['Reference guide (not an opening boundary)', '参考线（不作为挖洞边界）'], ['Opening boundary (cut along this line)', '内洞边界（按这条线挖空）'],
  ['Round contour', '圆形轮廓'], ['Contour', '轮廓'], ['Screw hole in base', '底板螺丝洞'], ['Offset guide / ignore', '偏移参考线 / 忽略'],
  ['Contour roles confirmed. Generate 2D to apply any changes.', '已确认内线用途，请生成 2D 以应用更改。'], ['Confirm contour roles', '确认内线用途'],
  ['Printed body', '打印主体'], ['Body mode (all parts)', '制作方式（全部部件）'], ['Body mode', '制作方式'],
  ['① No walls (keep original openings)', '① 不加墙（保留原有内洞）'], ['② Walls, no openings', '② 加墙，没有内洞'], ['③ Walls with openings', '③ 加墙，有内洞'],
  ['Keep the base, original openings and screw holes. Total thickness equals base thickness.', '只保留底板、原有内洞和螺丝洞；总厚度＝底板厚度。'],
  ['Fill original openings and build outer walls. Keep screw holes.', '填平原有内洞，只做外墙；螺丝洞保留。'],
  ['Keep original openings and build outer and opening walls. Keep screw holes.', '保留原有内洞，制作外墙和洞边围墙；螺丝洞保留。'],
  ['Review imported contour roles', '检查导入的内线用途'], ['Wall thickness', '墙厚'], ['Wall offset', '墙体偏移'], ['Inline · keep outer size', '内偏移 · 保持外部尺寸'], ['Outline · grow outer size', '外偏移 · 扩大外部尺寸'],
  ['Inner outline follows wall thickness. Set base and height in step 2.', '内轮廓随墙厚调整。在第 2 步设置底板和高度。'], ['Base thickness', '底板厚度'], ['No-wall mode: total thickness', '无墙模式：总厚度'],
  ['Height mode', '高度模式'], ['Total height (incl. base)', '总高度（含底板）'], ['Wall above base', '底板以上墙高'], ['Total height', '总高度'], ['base +', '底板 +'], ['wall =', '墙高 ='], ['mm total', 'mm 总高'],
  ['Diameter', '直径'], ['For new / re-placed holes', '适用于新增或重排的洞'], ['Count', '数量'], ['Hole count', '洞数'], ['Automatic (shape and hole diameter)', '系统自动（按字形与洞径）'], ['Custom count', '自定义数量'], ['Holes per letter', '每个字母洞数'], ['1–50 holes', '1–50 个'],
  ['Re-place screws in selected letters', '重排选中字母螺丝洞'],
  ['Replace selected screw positions using automatic or custom counts. Supports Undo. Generate 2D adds holes to letters without them.', '按自动建议或自定义数量，替换选中字母的螺丝洞位。支持 Undo。没有洞的字母可直接点 Generate 2D 自动生成。'],
  ['Finish adding holes', '结束加洞'], ['Add holes manually (click position)', '手动加洞（点选位置）'],
  ['Click a solid letter area to add a hole; no selection required. Right-drag still pans. Finish adding when done.', '点击任意字母实体区域加洞，无需预先选择；右键仍可平移。完成后点击结束加洞。'],
  ['Edge clearance', '边缘间距'], ['Wall clearance', '墙边间距'], ['Reset selected screws (', 'Reset 选中字母螺丝洞（'], [')', '）'],
  ['Re-place all holes…', '重排全部洞位…'], ['Replace all existing holes and manual positions? Undo can restore them.', '替换全部现有洞位和手动位置？可通过撤销恢复。'], ['Replace all holes now', '替换全部洞位'], ['Keep existing holes', '保留现有洞位'],
  ['Drag holes to adjust; select a hole and press Delete to remove it. Automatic counts use letter size, stroke area and hole diameter. Re-place to update existing holes.', '拖动调整洞位；选中洞后按 Delete 删除。自动数量根据字形尺寸、笔画面积和洞径估算，已有洞位需点重排才更新。'],
  ['Allow this part without screw holes', '允许此部件不设螺丝洞'], ['Selected screw', '选中螺丝洞'], ['Delete this part’s wire outlet', '删除此部件出线洞'], ['Delete selected screw', '删除选中螺丝洞'], ['X position', 'X 位置'], ['Y position', 'Y 位置'],
  ['Enable wire outlet (through base)', '启用出线洞（穿过底板）'], ['Wire outlet diameter', '出线洞直径'],
  ['One orange outlet per part by default. Drag after generating 2D. Included in body DXF and STL; no outlet in acrylic.', '每个独立部件默认 1 个，橙色显示。Generate 2D 后可拖动；底板 DXF 和 STL 包含此洞，亚克力不打洞。'],
  ['Re-place wire outlets', '重排出线洞'], ['Re-place selected wire outlets', '重排选中部件出线洞'], ['Omit wire outlet for this part', '此部件不设出线洞'],
  ['Acrylic fit', '亚克力配合'], ['No-wall mode does not use a T-shaped acrylic cover.', '无墙模式不使用 T 形亚克力盖板。'], ['Overall clearance', '总配合间隙'], ['Lip outward', '向外盖边'], ['Measured from insert edge', '从嵌入边缘测量'],
  ['Link matching letters', '关联相同字母'], ['matching copies · same shape and size. Linked moves/deletions require compatible hole layouts.', '个相同副本 · 字形及尺寸相同。关联移动或删除需要兼容的洞位布局。'],
  ['Apply holes to matching letters', '将洞位应用到相同字母'], ['Replace the hole layouts in', '替换以下数量相同字母的洞位：'], ['matching copies with this part\'s layout? Their manual positions will be replaced.', '个副本，使用当前部件布局？其手动位置将被替换。'],
  ['Replace matching layouts', '替换相同字母布局'], ['Cancel matching update', '取消关联更新'], ['Generate 2D', '生成 2D'], ['Continue to 3D', '继续制作 3D'],
  ['① Base only', '① 无墙底板'], ['② Walls, filled openings', '② 加墙，无内洞'], ['More patterns in phase 2', '第 2 步有更多制作设置'],
  ['Geometry checks clear', '几何检查通过'], ['holes ·', '个洞 ·'], ['parts', '个部件'], ['Local processing · mm', '本机处理 · mm'], ['Dismiss message', '关闭消息'], ['Geometry checks', '几何检查'], ['Close checks', '关闭检查'],
  ['Some edited holes violate clearance and are marked red.', '部分调整后的洞位不满足间距要求，已标红。'], ['No generated conflicts. Exports perform an additional fabrication check.', '未发现生成冲突。导出时将再次检查加工条件。'],
  ['Request failed', '请求失败'], ['Project changed; the older result was discarded.', '项目已更改，已忽略较早的处理结果。'], ['Reading DXF', '正在读取 DXF'], ['Placing holes', '正在放置洞位'], ['Generating 2D', '正在生成 2D'],
  ['2D geometry updated. Review the outlines and holes.', '2D 几何已更新，请检查轮廓和洞位。'], ['Building 3D model', '正在建立 3D 模型'], ['Selected part is watertight. STL ZIP generates all parts.', '选中部件已通过封闭性检查。STL ZIP 将生成全部部件。'],
  ['Export downloaded.', '已下载导出文件。'], ['Project saved, including manual hole positions.', '已保存项目，包含手动洞位。'], ['Opening project', '正在打开项目'], ['Project restored. Generate 3D when ready.', '项目已恢复，可继续生成 3D。'], ['Reset selected screws', 'Reset 选中字母螺丝洞'],
  ['Wire outlet deleted. Re-place or Undo to restore.', '出线洞已删除；可重排恢复，也可以 Undo。'], ['Screw deleted. Undo restores the previous layout.', '螺丝洞已删除，可撤销以恢复原布局。'],
  ['Acrylic fitting · section', '亚克力配合 · 剖面'], ['Planar fit · not to scale', '平面配合 · 非等比例'], ['total body', '主体总高'], ['Acrylic insert', '亚克力嵌入部分'], ['Top cover · lip', '顶盖 · 盖边'], ['mm side gap', 'mm 单边间隙'], ['Base', '底板'], ['Wall', '墙厚'],
  ['Overall gap', '总间隙'], ['Per side', '每侧'], ['Outer-wall cover', '外墙覆盖量'], ['Acrylic thickness and insert depth are not specified. This schematic illustrates fitting; the DXF defines the two cutting outlines.', '尚未指定亚克力厚度与嵌入深度。此图仅说明配合关系；两条切割轮廓以 DXF 为准。'],
  ['① No walls', '① 不加墙'], ['Base, original openings and screw holes only. Total thickness', '只有底板、原有内洞和螺丝洞。总厚度'], ['No walls; T-shaped acrylic cover fitting does not apply.', '没有墙，T 形亚克力盖板配合不适用。'],
  ['Interactive 3D letter: drag to orbit, scroll to zoom', '交互式 3D 立体字：拖动旋转，滚轮缩放'],
  ['Each letter supports up to 100 holes.', '每个字母最多支持 100 个洞。'],
  ['Wall must be positive; clearance and lip must be non-negative.', '墙厚必须大于零，间隙与盖边不能为负数。'],
  ['Use positive base and height values, and a valid height mode.', '底板厚度和高度必须大于零，并选择有效的高度模式。'],
  ['Total height must be greater than base thickness.', '总高度必须大于底板厚度。'], ['Base thickness must be positive.', '底板厚度必须大于零。'],
  ['Custom screw count must be an integer from 1 to 50.', '自定义螺丝洞数量必须为 1 至 50 的整数。'],
  ['DXF has no unit metadata. Coordinates are treated as millimetres; confirm the displayed size.', 'DXF 没有单位信息，坐标按毫米处理，请确认显示尺寸。'],
  ['An invalid contour was repaired for preview; inspect its shape before export.', '已为预览修复无效轮廓，导出前请检查形状。'],
  ['No closed letter contours found. Convert text to closed curves before importing.', '未找到闭合字形轮廓，请将文字转换为闭合曲线后导入。'],
  ['A round contour inside an opening was retained as an independent island; inspect it or exclude the component if it is stray geometry.', '内洞中的圆形轮廓已保留为独立区域，请检查；若为多余图形，请排除此部件。'],
  ['Review inferred wall-offset and round-contour roles before fabrication. Small round contours provisionally represent screws.', '加工前请检查推断的墙体偏移及圆形轮廓用途，小圆形暂按螺丝洞处理。'],
  ['Invalid body mode.', '主体制作方式无效。'], ['Wall thickness consumes this entire component.', '当前墙厚已覆盖整个部件。'],
  ['Acrylic insert collapses at this wall thickness and clearance.', '当前墙厚和间隙使亚克力嵌入轮廓消失。'], ['Acrylic lip does not cover the whole wall.', '亚克力盖边未完全覆盖墙体。'],
  ['Not enough stroke area for the requested holes and clearance.', '笔画面积不足，无法满足洞数与间距要求。'], ['Wire outlet does not fit. Reduce its diameter or omit it for this component.', '出线洞无法放入，请减小直径或取消此部件的出线洞。'],
  ['Select one or more letters to reset.', '请选择一个或多个要重置的字母。'], ['Unknown selected letter.', '选中的字母不存在。'], ['Round contour retained as an island; inspect whether it belongs here.', '圆形轮廓已保留为独立区域，请确认是否需要。'],
  ['Generate and review 2D geometry first.', '请先生成并检查 2D 几何。'], ['Review imported contour roles and confirm their classifications first.', '请先检查并确认导入轮廓的用途。'],
  ['Some screw contours are not inside a letter. Correct their positions in the DXF before fabrication.', '部分螺丝洞轮廓不在字形内部，请在加工前修正 DXF 中的位置。'],
  ['Acrylic T-cover export is unavailable in flat mode.', '无墙底板模式不支持导出 T 形亚克力盖板。'], ['Unknown DXF export type.', '未知的 DXF 导出类型。'],
  ['Choose Auto or a custom count from 1 to 50.', '请选择自动数量或 1 至 50 的自定义数量。'], ['DXF is larger than the 20 MB limit.', 'DXF 超过 20 MB 限制。'],
  ['Duplicate component identifier.', '部件标识重复。'], ['Incomplete component data.', '部件数据不完整。'], ['Invalid component identifiers.', '部件标识无效。'], ['Invalid contour classification.', '轮廓分类无效。'],
  ['Invalid height or offset mode.', '高度或偏移模式无效。'], ['Invalid hole coordinates.', '洞位坐标无效。'], ['Invalid imported hole metadata.', '导入的洞位信息无效。'], ['Invalid imported inset contour.', '导入的内缩轮廓无效。'],
  ['Invalid imported round contour.', '导入的圆形轮廓无效。'], ['Invalid inset contour classification.', '内缩轮廓分类无效。'], ['Invalid matching-letter setting.', '相同字母关联设置无效。'], ['Invalid or duplicate hole identifier.', '洞位标识无效或重复。'],
  ['Invalid or empty component polygon.', '部件多边形无效或为空。'], ['Invalid polygon coordinates.', '多边形坐标无效。'], ['Invalid polygon data.', '多边形数据无效。'], ['Invalid polygon rings.', '多边形环无效。'],
  ['Invalid project format or too many components (maximum 500).', '项目格式无效或部件数量过多（最多 500 个）。'], ['Invalid wire outlet override.', '部件出线洞覆盖设置无效。'], ['Invalid wire outlet settings.', '出线洞设置无效。'],
  ['One wire outlet per component is supported.', '每个部件仅支持一个出线洞。'], ['Polygon ring needs at least four coordinates.', '多边形环至少需要四个坐标。'], ['Project has too many curve points.', '项目曲线点数过多。'],
  ['Project units must be millimetres.', '项目单位必须为毫米。'], ['Select valid components.', '请选择有效部件。'], ['Select valid letters.', '请选择有效字母。'], ['Too many holes in a component.', '部件中的洞数过多。'], ['Wall and screw diameter must be positive.', '墙厚与螺丝洞直径必须大于零。'],
];

const lookup = new Map();
for (const pair of translations) for (const value of pair) lookup.set(value, pair);
for (const pair of translations) {
  pair[1] = pair[1].replaceAll('Generate 2D', '生成 2D').replaceAll('Undo', '撤销').replace(/^Reset /, '重置');
  lookup.set(pair[1], pair);
}
// Existing mixed-language copy, kept as aliases so old messages are readable in either language.
for (const [alias, canonical] of [['出线洞 · Wire outlet', 'Wire outlet'], ['Reset 选中字母螺丝洞（', 'Reset selected screws (']]) lookup.set(alias, lookup.get(canonical));

const patterns = [
  [/^Hole (\d+)$/, 'Hole $1', '洞 $1'],
  [/^Hole (\d+): too close to a wall or another hole\.$/, 'Hole $1: too close to a wall or another hole.', '洞 $1：距离墙体或其他洞太近。'],
  [/^Hole (\d+): too close to a wall, counter or outer edge\.$/, 'Hole $1: too close to a wall, counter or outer edge.', '洞 $1：距离墙体、内洞或外边缘太近。'],
  [/^Hole (\d+): diameter must be positive\.$/, 'Hole $1: diameter must be positive.', '洞 $1：直径必须大于零。'],
  [/^Holes (\d+) and (\d+): overlap or insufficient separation\.$/, 'Holes $1 and $2: overlap or insufficient separation.', '洞 $1 和 $2：重叠或间距不足。'],
  [/^(.+): imported hole pattern differs; edits are not linked until compatible positions are generated\.$/, '$1: imported hole pattern differs; edits are not linked until compatible positions are generated.', '$1：导入洞位布局不同，生成兼容位置后才能关联编辑。'],
  [/^(.+): deletion skipped because its hole pattern differs\. Apply holes to matching letters to replace its layout\.$/, '$1: deletion skipped because its hole pattern differs. Apply holes to matching letters to replace its layout.', '$1：洞位布局不同，已跳过关联删除。可应用相同字母洞位来替换布局。'],
  [/^Unit code (.+) is not supported\. Confirm millimetre scale before fabrication\.$/, 'Unit code $1 is not supported. Confirm millimetre scale before fabrication.', '不支持单位代码 $1，加工前请确认毫米比例。'],
  [/^Open (.+) contour skipped\. Join it into a closed contour\.$/, 'Open $1 contour skipped. Join it into a closed contour.', '已跳过未闭合的 $1 轮廓，请连接成闭合轮廓。'],
  [/^(.+) hole contours could not be assigned to a letter\.$/, '$1 hole contours could not be assigned to a letter.', '$1 个洞轮廓无法归属到字母。'],
  [/^Resolve geometry conflicts before export\.\s*(.*)$/, 'Resolve geometry conflicts before export. $1', '导出前请解决几何冲突。$1'],
  [/^Cannot read this DXF: (.*)$/, 'Cannot read this DXF: $1', '无法读取此 DXF：$1'],
  [/^Imported (\d+) parts · (\d+) existing holes preserved\.$/, 'Imported $1 parts · $2 existing holes preserved.', '已导入 $1 个部件 · 已保留 $2 个现有洞位。'],
  [/^已重置 (\d+) 个选中字母的螺丝洞；其他字母不变。Undo 可恢复。$/, 'Reset screws in $1 selected letters. Other letters are unchanged. Undo restores them.', '已重置 $1 个选中字母的螺丝洞；其他字母不变，可撤销恢复。'],
  [/^Hole layout applied to (\d+) matching copies\. Undo can restore them\.$/, 'Hole layout applied to $1 matching copies. Undo can restore them.', '已将洞位应用到 $1 个相同副本，可撤销恢复。'],
  [/^(\d+) checks need attention$/, '$1 checks need attention', '$1 项检查需要处理'],
  [/^([\d.]+) mm per side$/, '$1 mm per side', '每侧 $1 mm'],
  [/^Exporting (.+)$/, 'Exporting $1', '正在导出 $1'],
  [/^Acrylic cover: (.+) mm per-side clearance and (.+) mm lip$/, 'Acrylic cover: $1 mm per-side clearance and $2 mm lip', '亚克力盖板：每侧间隙 $1 mm，盖边 $2 mm'],
  [/^Select (wire outlet|screw) (.+) in (.+)$/, 'Select $1 $2 in $3', '选择 $3 中的 $1 $2'],
];

export function translate(text, language = 'en') {
  if (typeof text !== 'string') return text;
  const selection = text.match(/^Select (wire outlet|screw) (.+) in (.+)$/);
  if (selection && language === 'cn') return `选择 ${selection[3]} 中的${selection[1] === 'screw' ? '螺丝洞' : '出线洞'} ${selection[2]}`;
  const trimmed = text.trim(), pair = lookup.get(trimmed);
  if (pair) return text.replace(trimmed, pair[language === 'cn' ? 1 : 0]);
  for (const [regex, en, cn] of patterns) if (regex.test(text)) return text.replace(regex, language === 'cn' ? cn : en);
  return text;
}
