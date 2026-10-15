from pathlib import Path
import re,json
src=Path('/workspace/scratch/25f330814d33/upload');out=Path('dist');out.mkdir(exist_ok=True)
ref=(src/'code.html').read_text()
header=re.search(r'<header\b.*?</header>',ref,re.S).group()
aside=re.search(r'<aside\b.*?</aside>',ref,re.S).group()
(out/'shell.json').write_text(json.dumps({'header':header,'aside':aside}))
paths=['mesh-topology','runtime-config-settings','live-control','acp-telemetry','tool-registry']
for i,path in enumerate(paths):
 s=(src/('code'+(f'({i})' if i else '')+'.html')).read_text()
 s=re.sub(r'<header\b.*?</header>','<div id="shared-header"></div>',s,count=1,flags=re.S)
 s=re.sub(r'<aside\b.*?</aside>','<div id="shared-sidebar"></div>',s,count=1,flags=re.S)
 s=s.replace('class="pl-14"','class="pl-16"')
 s=s.replace('</body>',f'<script>window.currentPage={json.dumps(path)}</script><script src="shell.js"></script></body>')
 s=s.replace('</head>','<title>Hermes Copilot — '+path+'</title></head>')
 s=s.replace('<main ', '<main data-workspace="true" ',1)
 s=s.replace('</body>','<link rel="stylesheet" href="prototype.css"></body>')
 (out/(path+'.html')).write_text(s)
(out/'index.html').write_text('<!doctype html><meta http-equiv="refresh" content="0;url=live-control.html"><title>Hermes Copilot</title><a href="live-control.html">Open Hermes Copilot</a>')
