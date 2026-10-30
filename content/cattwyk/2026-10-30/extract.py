import json,sys
src,dst,key=sys.argv[1],sys.argv[2],(sys.argv[3] if len(sys.argv)>3 else None)
raw=open(src,encoding='utf-8').read()
try: inner=json.loads(raw)['result']
except Exception: inner=raw
i=inner.find('>\n['); j=inner.rfind(']\n</untrusted')
rows=json.loads(inner[i+2:j+1])[0]['json_agg']
if key:
    d=json.load(open(dst,encoding='utf-8')); d[key]=rows
    json.dump(d,open(dst,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
else:
    json.dump(rows,open(dst,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(dst,key,len(rows))
