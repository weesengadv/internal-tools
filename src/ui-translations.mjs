export const uiText = [
  ['Shortcut menu', '快捷菜单'], ['Editor tools', '编辑工具'], ['Language', '语言'], ['Character view cropper', '角色视图裁剪'], ['3D word tools', '3D 立体字工具'],
  ['Load sample', '载入示例'], ['Guideline size', '参考线尺寸'], ['Measurement unit', '测量单位'], ['Backing width', '底板宽度'], ['Backing height', '底板高度'],
  ['Canvas zoom', '画布缩放'], ['Canvas pan', '画布平移'], ['Pan left', '向左平移'], ['Pan up', '向上平移'], ['Pan down', '向下平移'], ['Pan right', '向右平移'],
  ['Prompt shortcuts', '提示词快捷选项'], ['Export mode', '导出模式'], ['Close', '关闭'], ['Application status', '应用状态'],
  ['Live Google Sheet with last-good cache', '实时 Google 表格，保留上次有效缓存'], ['Not saved yet', '尚未保存'], ['Formula', '计算公式'],
  ['Production handoff', '生产交接'], ['Draft', '草稿'], ['Approved', '已批准'], ['Changed after approval', '批准后已更改'], ['Quotation', '报价单'], ['Not assigned', '尚未分配'],
  ['Approving manager', '批准经理'], ['Customer acceptance reference', '客户确认记录'], ['Example: WhatsApp confirmation', '例如：WhatsApp 确认记录'],
  ['Confirm only after the customer accepts this quotation. Any important edit will require approval again.', '仅在客户接受此报价后确认。重要修改后需要重新批准。'],
  ['Confirm customer acceptance', '确认客户接受报价'], ['Export for production', '导出生产文件'], ['Approve revised quotation', '批准修改后的报价'], ['Approval confirmed', '已确认批准'],
  ['Commercial values changed after approval. Review and approve the revised quotation before production export.', '批准后报价金额已更改。请检查并批准修改后的报价，再导出生产文件。'],
  ['Sample signage', '招牌示例'], ['Signage photo loaded', '招牌图片已载入'], ['Emboss word pricing', '立体字计价'], ['No backing', '无底板'], ['No backing rate', '无底板单价'],
  ['Acrylic emboss', '亚克力立体字'], ['Stainless steel emboss', '不锈钢立体字'], ['Aluminium emboss', '铝制立体字'], ['Google Sheet', 'Google 表格'],
  ['Customer', '客户'], ['Project', '项目'], ['Contact', '联系方式'], ['Date', '日期'], ['Validity', '有效期'], ['Prepared by', '制单人'], ['Notes', '备注'], ['Signage marked preview', '招牌标注预览'],
  ['Item', '项目'], ['Dimension', '尺寸'], ['Measurements', '测量值'], ['Qty', '数量'], ['Rate', '单价'], ['Total', '总额'], ['Signage Quotation', '招牌报价'], ['No quote lines yet.', '尚无报价项目。'],
  ['Front-lit 6mm LED estimate', '正发光 6mm LED 估算'], ['Back-lit LED perimeter estimate', '背发光 LED 周长估算'], ['Skylift', '高空车'], ['Assembly', '组装'], ['Installation', '安装'], ['Manual add-on cost', '手动附加费用'],
  ['Sample recognition is ready. Letter S needs review before final quotation.', '示例识别已就绪。最终报价前请检查字母 S。'], ['Letter S confidence is low. Confirm its height before final quote.', '字母 S 的识别置信度较低。最终报价前请确认高度。'],
  ['AI recognition completed. Review low-confidence items before final quote.', 'AI 识别已完成。最终报价前请检查低置信度项目。'],
  ['Unknown image read error.', '读取图片时发生未知错误。'], ['Image could not be loaded.', '无法载入图片。'], ['Saved project photo could not be loaded.', '无法载入项目中保存的图片。'],
  ['The pricing service returned an invalid response.', '单价服务返回了无效响应。'], ['Google Sheet pricing is unavailable.', 'Google 表格单价暂不可用。'],
  ['Acrylic', '亚克力'], ['Stainless steel', '不锈钢'], ['Aluminium', '铝'], ['Standard', '标准'], ['White', '白色'], ['Black', '黑色'], ['Backing with metal frame', '带金属框架底板'],
  ['manual', '手动'], ['sample', '示例'], ['auto-trace', '自动描边'], ['ai', 'AI'], ['inch', '英寸'], ['feet', '英尺'], ['meter', '米'],
  ['Unknown file read error.', '读取文件时发生未知错误。'], ['Tesseract.js failed to load.', '无法载入 Tesseract.js。'], ['Tesseract.js loaded without OCR support.', 'Tesseract.js 未能启用文字识别。'],
  ['No signage photo canvas available.', '尚无可用的招牌图片画布。'], ['Trace letter offline replaced boxes with OCR-confirmed text only.', '离线字形描边已更新，仅保留文字识别确认的字框。'],
  ['No cached pricing available', '尚无可用的单价缓存'], ['This is not a Weeseng quotation project file.', '这不是 Weeseng 报价项目文件。'], ['Quote date', '报价日期'],
  ['Could not prepare the source photo for production export.', '无法为生产导出准备原始图片。'], ['Approve the revised quotation before production export.', '请先批准修改后的报价，再导出生产文件。'], ['Confirm customer acceptance before production export.', '请先确认客户接受报价，再导出生产文件。'],
  ['Could not create quotation preview image.', '无法创建报价预览图片。'], ['Could not render quotation preview image.', '无法渲染报价预览图片。'], ['New backing', '新底板'], ['New letter', '新字框'],
  ['Accepted Signage Quotation', '已接受的招牌报价'], ['Signage Quotation Draft', '招牌报价草稿'], ['Weeseng Software Signage Quotation', 'Weeseng Software 招牌报价'],
  ['Item / formula', '项目 / 计算公式'], ['Total quotation', '报价总额'],
  ['3D print', '3D 打印'], ['Mild Steel', '低碳钢'], ['Brass', '黄铜'], ['Gold stainless steel', '金色不锈钢'], ['Rose gold stainless steel', '玫瑰金不锈钢'], ['Rose', '玫瑰金'],
];
const lookup = new Map(uiText.flatMap(pair => pair.map(value => [value, pair])));
const catalogue = [];
for (const depth of [50, 70]) catalogue.push([`budget Aluminium(无边edgeless)-${depth}MM边`, `Budget aluminium (edgeless) · ${depth}mm side`, `经济型铝字（无边）· ${depth}mm 边`]);
for (const finish of ['HL', 'BA']) for (const [type, en, cn] of [['304', '304', '304'], ['gold', 'gold', '金色'], ['rose', 'rose gold', '玫瑰金']]) catalogue.push([`Stainless steel ${type} ${finish}`, `Stainless steel ${en} ${finish}`, `${cn} 不锈钢 ${finish}`]);
for (const [type, cn] of [['Zink', '锌板'], ['ACP', 'ACP']]) for (const [color, colorCn] of [['White', '白色'], ['Black', '黑色'], ['Color', '彩色']]) catalogue.push([`${type} with 2x1in metal frame - ${color}`, `${type} with 2x1in metal frame - ${color}`, `${cn}配 2×1 英寸金属框 - ${colorCn}`]);
for (const thickness of [20,25]) catalogue.push([`PVC 牌匾 - ${thickness}`, `PVC plaque - ${thickness}`, `PVC 牌匾 - ${thickness}`]);
for (const [type, en] of [['单层', 'single layer'], ['双层', 'double layer']]) catalogue.push([`Houseplate 门牌 ${type} - 1`, `Houseplate ${en} - 1`, `门牌 ${type} - 1`]);

export function localizeCatalogLabel(text, language) {
  if (typeof text !== 'string') return text;
  for (const [raw, en, cn] of catalogue) if (text === raw) return language === 'cn' ? cn : en;
  const rate = text.match(/^(.*?) - ([A-Z]{3} [\d,.]+.*)$/);
  if (rate) return `${localizeCatalogLabel(rate[1], language)} - ${rate[2]}`;
  const material = text.match(/^(Acrylic|Mild Steel|Brass|Stainless steel|Gold stainless steel|Rose gold stainless steel|Aluminium|Rose)([ >\d.]+(?:mm)?| - [\d.]+)$/);
  if (material && language === 'cn') return `${lookup.get(material[1])?.[1] || material[1]}${material[2]}`;
  return text;
}
export const extraMessages = {
  en: {
    backingHint: 'Draw one or more backing boxes. If no backing is listed, no backing will be charged.',
    backingRateEdit: 'Backing rate', productRateEdit: 'Product rate', heightRateEdit: 'Height rate', areaRateEdit: 'Area rate', materialHeightRateEdit: 'Material height add-on', materialAreaRateEdit: 'Material area add-on', ledRateEdit: 'LED rate', psuRateEdit: 'PSU price', signageAiResponseReceived: 'AI response received. Review the detected items.',
  },
  cn: {
    backingHint: '绘制一个或多个底板框。未列出底板时不收取底板费用。', backingRateEdit: '底板单价', productRateEdit: '产品单价', heightRateEdit: '高度单价', areaRateEdit: '面积单价', materialHeightRateEdit: '材料高度附加单价', materialAreaRateEdit: '材料面积附加单价', ledRateEdit: 'LED 单价', psuRateEdit: '电源价格', signageAiResponseReceived: '已收到 AI 响应，请检查识别结果。',
    resumePrint: '断点续打', gcodeEditorGroup: 'G-code 编辑', signageGuideline: '参考尺寸（英寸）', backingRealSize: '底板尺寸（英寸）',
    statusMaterialPricing: '选择材料和灯光，然后刷新 Google 表格单价。', syncLatestSheet: '同步最新 Google 表格', syncingLatestSheet: '正在同步 Google 表格…', sheetSyncReady: '已载入最新 Google 表格单价。', sheetSyncFailed: 'Google 表格同步失败：{message}', signagePricingLoading: '正在读取 Google 表格单价…', signageQuoteReady: '已根据 Google 表格单价生成报价草稿。', signageLettersCleared: '已清空检查报价中的字框。',
    quotationRulesText: '12 英寸以下按高度英寸计价，12 英寸及以上按平方英寸计价。正发光 LED 优先使用 6mm LED 面积单价，背发光按周长米数计价。附加费为 0 时不列入报价。',
  }
};

export function localizeSystemText(text, language) {
  if (typeof text !== 'string') return text;
  const pair = lookup.get(text);
  if (pair) return pair[language === 'cn' ? 1 : 0];
  const catalogLabel = localizeCatalogLabel(text, language);
  if (catalogLabel !== text) return catalogLabel;
  if (language !== 'cn') return text;
  return text
    .replace(/^(.+) · Revision (\d+)$/, '$1 · 第 $2 版')
    .replace(/^Approved by (.+) on (.+)\.$/, '由 $1 于 $2 批准。')
    .replace(/ - not synced yet$/, ' - 尚未同步')
    .replace(/ - cached prices synced /, ' - 缓存单价同步于 ')
    .replace(/ - live prices synced /, ' - 实时单价同步于 ')
    .replace(/^(1200 x 720) canvas/, '$1 画布');
}

// Localize generated quote descriptions at display time, keeping the stored commercial data stable.
export function localizeQuoteText(text, language) {
  let result = localizeSystemText(text, language);
  if (typeof result === 'string') for (const [raw, en, cn] of catalogue) result = result.replace(raw, language === 'cn' ? cn : en);
  if (language !== 'cn' || typeof result !== 'string') return result;
  return result
    .replace(/^Letter (.+?) #(\d+) - /, '字形 $1 #$2 - ')
    .replace(/^Backing (\d+)(?= -|$)/, '底板 $1')
    .replace(/(\d+) letter box\(es\)/g, '$1 个字框')
    .replace(/\bfront-lit\b/g, '正发光').replace(/\bback-lit\b/g, '背发光').replace(/\bno-lit\b/g, '不发光')
    .replace(/height-inch rule/g, '高度英寸计价').replace(/square-inch rule/g, '平方英寸计价')
    .replace(/\bPerimeter\b/g, '周长').replace(/\bbase \+/g, '基础 +').replace(/\bmaterial\)/g, '材料)')
    .replace(/\bper height inch\b/g, '每高度英寸').replace(/\bheight inch\b/g, '高度英寸')
    .replace(/\bheight in\b/g, '高度英寸')
    .replace(/^Backing: /, '底板：').replace(/^Emboss height rate: /, '立体字高度单价：').replace(/^Emboss area rate: /, '立体字面积单价：')
    .replace(/^Material add-on: /, '材料附加单价：').replace(/^Selected product: /, '选中产品：').replace(/active LED rate/g, '当前 LED 单价')
    .replace(/^Letter: /, '字形：').replace(/^Dimension: /, '尺寸：').replace(/^Area: /, '面积：').replace(/^Product: /, '产品：').replace(/^Rate: /, '单价：').replace(/^Material: /, '材料：').replace(/^Lighting: /, '灯光：')
    .replace(/^Base rate: /, '基础单价：').replace(/^Material add-on rate: /, '材料附加单价：').replace(/^Base total: /, '基础金额：').replace(/^Material total: /, '材料金额：')
    .replace(/ or /g, ' 或 ').replace(/^LED\/PSU: /, 'LED / 电源：').replace(/ PSU\b/g, ' 电源')
    .replace(/\bunit\b/g, '个').replace(/\bmanual\b/g, '手动').replace(/\bsq in\b/g, '平方英寸').replace(/\bsqft\b/g, '平方英尺');
}
