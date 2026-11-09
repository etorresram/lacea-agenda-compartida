from pathlib import Path
import json,re
base=Path(__file__).resolve().parents[1]
template=(base/'static/template.html').read_text()
template=re.sub(r'<h1>.*?</h1>','<h1>Agenda LACEA Eric</h1>',template,count=1,flags=re.S)
template=template.replace('espacios LACEA<br>seleccionados','sesiones<br>seleccionadas')
template=template.replace('sesiones RIDGE<br>obligatorias','sesiones<br>RIDGE')
template=template.replace('<nav id="day-nav"',(base/'static/share-controls.html').read_text()+'<nav id="day-nav"')
template=template.replace('Selección personal · No modifica tu calendario','Selecciones compartidas por enlace · Sin registro')
css='''
#lacea-dash [hidden]{display:none!important}#lacea-dash .share-panel{padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--paper);margin-bottom:24px}#lacea-dash .share-controls{display:flex;flex-wrap:wrap;align-items:end;gap:12px}#lacea-dash .share-controls label{display:grid;gap:5px;font-size:11px;flex:1;min-width:160px}#lacea-dash .share-panel button{padding:11px 14px;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:8px;font:inherit;font-size:12px;cursor:pointer}#lacea-dash .share-panel button.primary,#lacea-dash .person-tabs button[aria-pressed=true]{background:var(--green);color:light-dark(#fff,#10203b)}#lacea-dash .share-panel button:disabled{opacity:.5;cursor:default}#lacea-dash .share-panel input{font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:100%;min-width:0;box-sizing:border-box}#lacea-dash .share-help{font-size:12px;color:var(--muted);margin:12px 0}#lacea-dash #share-status{font-size:12px;color:var(--green);margin:10px 0}#lacea-dash #share-result{display:grid;grid-template-columns:1fr auto;gap:8px;margin:14px 0}#lacea-dash #result-label{grid-column:1/-1;font-size:12px}#lacea-dash .person-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#lacea-dash .event,#lacea-dash .day{cursor:pointer}#lacea-dash .together{color:var(--green);font-weight:600}#lacea-dash .option:has(input:disabled){opacity:.85}
'''
css+='''
#lacea-dash{--selected-green:light-dark(#177044,#8be0af);--selected-fill:light-dark(#e5f5eb,#193e2c)}#lacea-dash .event.chosen-course{background:var(--selected-fill);border-left-color:var(--selected-green)}#lacea-dash .event.chosen-course .kind::after{content:' · Seleccionado';color:var(--selected-green)}#lacea-dash .option.chosen-option,#lacea-dash .option.chosen-option:has(input:checked),#lacea-dash .option.chosen-option:has(input:disabled){background:var(--selected-fill);border-color:var(--selected-green);opacity:1}#lacea-dash .option.chosen-option input{accent-color:var(--selected-green);opacity:1}#lacea-dash .event.chosen-course[aria-pressed=true]{outline-color:var(--selected-green)}#lacea-dash .selection-proof{display:block;color:var(--selected-green);font-size:12px;font-weight:600;margin-top:7px}
'''
template=template.replace('</style>',css+'</style>')
slots=json.loads((base/'sessions.json').read_text())
script=(base/'static/share-client.js').read_text().replace('PROGRAM',json.dumps(slots,ensure_ascii=False),1)
html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Agenda LACEA Eric</title><style>body{margin:0;padding:20px;background:light-dark(#e5edf8,#0b1525);font-family:system-ui}#lacea-dash{max-width:1150px;margin:auto}@media(max-width:500px){body{padding:0}}</style></head><body>'+template+'<script>'+script+'</script></body></html>'
(base/'docs/index.html').write_text(html)
print('GitHub Pages: Agenda LACEA y selección compartible por enlace.')
