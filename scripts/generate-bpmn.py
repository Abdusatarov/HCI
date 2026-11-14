"""Deterministic BPMN 2.0 model + DI. No manual editor required."""
from pathlib import Path
from lxml import etree as E
import json
import heapq
NS={'bpmn':'http://www.omg.org/spec/BPMN/20100524/MODEL','bpmndi':'http://www.omg.org/spec/BPMN/20100524/DI','dc':'http://www.omg.org/spec/DD/20100524/DC','di':'http://www.omg.org/spec/DD/20100524/DI','xsi':'http://www.w3.org/2001/XMLSchema-instance'}
def el(parent,tag,**a):
    p,n=tag.split(':'); return E.SubElement(parent,'{'+NS[p]+'}'+n,**{k:str(v) for k,v in a.items()})
root=E.Element('{'+NS['bpmn']+'}definitions',nsmap=NS,id='PharmacyDefinitions',targetNamespace='https://github.com/Abdusatarov/HCI',exporter='HCI deterministic generator',exporterVersion='1.0')
def route(a,b,obstacles,width):
    ax,ay,aw,ah=a;bx,by,bw,bh=b
    start=(ax+aw+20,ay+ah/2);end=(bx-20,by+bh/2)
    # Orthogonal visibility grid, inflated obstacles protect tasks and labels.
    rects=[(x-12,y-12,x+w+12,y+h+12) for x,y,w,h in obstacles]
    xs=sorted({80,width-30,start[0],end[0],*[v for r in rects for v in (r[0]-1,r[2]+1)]})
    ys=sorted({55,945,start[1],end[1],*[v for r in rects for v in (r[1]-1,r[3]+1)]})
    xs=[x for x in xs if 60<=x<=width-20];ys=[y for y in ys if 45<=y<=955]
    si=(xs.index(start[0]),ys.index(start[1]),0);goal=(xs.index(end[0]),ys.index(end[1]))
    def clear(p,q):
        x,y=p;xx,yy=q
        if x==xx:return not any(l<x<r and max(min(y,yy),t)<min(max(y,yy),bt) for l,t,r,bt in rects)
        return not any(t<y<bt and max(min(x,xx),l)<min(max(x,xx),r) for l,t,r,bt in rects)
    queue=[(0,0,si)];cost={si:0};prev={};finish=None
    while queue:
        _,g,state=heapq.heappop(queue);i,j,d=state
        if g!=cost[state]:continue
        if (i,j)==goal:finish=state;break
        for ni,nj,nd in [(i-1,j,1),(i+1,j,1),(i,j-1,2),(i,j+1,2)]:
            if not(0<=ni<len(xs) and 0<=nj<len(ys)):continue
            p=(xs[i],ys[j]);q=(xs[ni],ys[nj])
            if not clear(p,q):continue
            ng=g+abs(p[0]-q[0])+abs(p[1]-q[1])+(25 if d and d!=nd else 0)
            ns=(ni,nj,nd)
            if ng<cost.get(ns,float('inf')):
                cost[ns]=ng;prev[ns]=state;h=abs(q[0]-end[0])+abs(q[1]-end[1]);heapq.heappush(queue,(ng+h,ng,ns))
    if finish is None:raise RuntimeError('Cannot route '+str((a,b)))
    path=[];cur=finish
    while True:
        path.append((xs[cur[0]],ys[cur[1]]))
        if cur==si:break
        cur=prev[cur]
    pts=[(ax+aw,ay+ah/2)]+list(reversed(path))+[(bx,by+bh/2)]
    compressed=[]
    for pt in pts:
        if len(compressed)>1 and ((compressed[-2][0]==compressed[-1][0]==pt[0]) or (compressed[-2][1]==compressed[-1][1]==pt[1])):compressed.pop()
        compressed.append(pt)
    return compressed
models=[]
# Node format: id, type, label, lane index, column, optional vertical offset.
def model(key,title,nodes,edges,external=None,messages=None):
    p=el(root,'bpmn:process',id=key,name=title,isExecutable='false')
    el(p,'bpmn:documentation').text='Conceptual HCI process. User=buyer; Service=pharmacy staff and service adapters; Script/System=local deterministic automation. API tasks include technical retries with the same operation ID; business outcomes use explicit gateways.'
    ls=el(p,'bpmn:laneSet',id=key+'_lanes')
    lanes=[]
    for i,name in enumerate(['User · Покупатель','Service · Аптека / интеграции','Script/System · Автоматизация']):
        l=el(ls,'bpmn:lane',id=key+'_lane'+str(i),name=name);lanes.append(l)
    nm={}; bounds={}
    for row in nodes:
        id,t,label,l,c,*dy=row; id=key+'_'+id
        kw={'id':id,'name':label}
        if t.startswith('call:'):kw['calledElement']=t.split(':')[1];tag='callActivity'
        else:tag=t
        n=el(p,'bpmn:'+tag,**kw);nm[id]=n
        if t=='scriptTask':
            n.set('scriptFormat','text/plain');el(n,'bpmn:script').text='Design specification: '+label
        if t=='intermediateCatchEvent':
            td=el(n,'bpmn:timerEventDefinition',id=id+'_timer');el(td,'bpmn:timeDuration',**{'{'+NS['xsi']+'}type':'bpmn:tFormalExpression'}).text='PT30S'
        el(lanes[l],'bpmn:flowNodeRef').text=id
        w,h=(42,42) if 'Event' in t else ((54,54) if 'Gateway' in t else (186,86))
        x=130+c*255;y=45+l*310+105+(dy[0] if dy else 0)+(86-h)/2
        bounds[id]=(x,y,w,h)
    for i,row in enumerate(edges):
        s,t,*rest=row;s=key+'_'+s;t=key+'_'+t
        label=rest[0] if rest else '';f=el(p,'bpmn:sequenceFlow',id=key+'_f'+str(i),sourceRef=s,targetRef=t)
        if label:f.set('name',label)
        el(nm[s],'bpmn:outgoing').text=f.get('id');el(nm[t],'bpmn:incoming').text=f.get('id')
        if nm[s].tag.endswith('exclusiveGateway') and sum(1 for r in edges if key+'_'+r[0]==s)>1:
            if label=='Иначе': nm[s].set('default',f.get('id'))
            else:el(f,'bpmn:conditionExpression',**{'{'+NS['xsi']+'}type':'bpmn:tFormalExpression'}).text='outcome = "'+label+'"'
    col=el(root,'bpmn:collaboration',id=key+'_collab')
    participant=el(col,'bpmn:participant',id=key+'_pool',name=title,processRef=key)
    for eid,ename in external or []:el(col,'bpmn:participant',id=key+'_'+eid,name=ename)
    for j,(s,t,label) in enumerate(messages or []):el(col,'bpmn:messageFlow',id=key+'_m'+str(j),sourceRef=key+'_'+s,targetRef=key+'_'+t,name=label)
    dg=el(root,'bpmndi:BPMNDiagram',id=key+'_diagram',name=title)
    plane=el(dg,'bpmndi:BPMNPlane',id=key+'_plane',bpmnElement=col.get('id'))
    width=max(x+w for x,y,w,h in bounds.values())+120
    def shape(id,b,**attrs):
        sh=el(plane,'bpmndi:BPMNShape',id=id+'_di',bpmnElement=id,**attrs);el(sh,'dc:Bounds',x=b[0],y=b[1],width=b[2],height=b[3]);return sh
    shape(participant.get('id'),(0,40,width,930),isHorizontal='true')
    for i in range(3):shape(key+'_lane'+str(i),(30,40+i*310,width-30,310),isHorizontal='true')
    for id,b in bounds.items():
        sh=shape(id,b)
        if nm[id].tag.endswith(('Event','Gateway')):
            lb=el(sh,'bpmndi:BPMNLabel');el(lb,'dc:Bounds',x=b[0]-48,y=b[1]+b[3]+8,width=b[2]+96,height=56)
    used_labels=[]
    for i,(s,t,*rest) in enumerate(edges):
        s=key+'_'+s;t=key+'_'+t;a=bounds[s];b=bounds[t]
        ax,ay,aw,ah=a;bx,by,bw,bh=b
        # Dedicated low/high routing channels protect task boxes from crossing lines.
        obstacles=list(bounds.values())+[(x-48,y+h+8,w+96,56) for id,(x,y,w,h) in bounds.items() if nm[id].tag.endswith(('Event','Gateway'))]
        pts=route(a,b,obstacles,width)
        # Put decision labels near a long edge segment, away from node bounds.
        segments=sorted(zip(pts,pts[1:]),key=lambda z:abs(z[0][0]-z[1][0])+abs(z[0][1]-z[1][1]),reverse=True)
        labelx=pts[0][0]+10;labely=pts[0][1]-40
        for u,v in segments:
            candidates=[((u[0]+v[0])/2-55,(u[1]+v[1])/2-38),((u[0]+v[0])/2+8,(u[1]+v[1])/2+6)]
            found=False
            for lx,ly in candidates:
                if lx<70 or ly<48:continue
                if not any(lx<x+w and lx+130>x and ly<y+h and ly+32>y for x,y,w,h in obstacles+used_labels):
                    labelx,labely=lx,ly;found=True;break
            if found:break
        if rest and rest[0]:used_labels.append((labelx,labely,130,32))
        ed=el(plane,'bpmndi:BPMNEdge',id=key+'_f'+str(i)+'_di',bpmnElement=key+'_f'+str(i))
        for x,y in pts:el(ed,'di:waypoint',x=x,y=y)
        if rest and rest[0]:
            lb=el(ed,'bpmndi:BPMNLabel');el(lb,'dc:Bounds',x=labelx,y=labely,width=130,height=38)
    for j,(eid,ename) in enumerate(external or []):shape(key+'_'+eid,(100+j*650,1030,560,80),isHorizontal='true')
    for j,(s,t,label) in enumerate(messages or []):
        def pt(id):
            if key+'_'+id in bounds:
                x,y,w,h=bounds[key+'_'+id];return (x+w/2,y+h)
            idx=[x[0] for x in external].index(id);return (380+idx*650,1030)
        a,b=pt(s),pt(t);ed=el(plane,'bpmndi:BPMNEdge',id=key+'_m'+str(j)+'_di',bpmnElement=key+'_m'+str(j))
        for x,y in [a,(a[0],1000),(b[0],1000),b]:el(ed,'di:waypoint',x=x,y=y)
    models.append({'id':key,'title':title,'nodes':len(nodes),'flows':len(edges),'diagram':key+'_diagram'})

model('Order','Интернет-аптека · Заказ от поиска до доставки',[
('start','startEvent','Нужен товар',0,0),('catalog','call:Catalog','01 · Выбор товара',0,1),('hascart','exclusiveGateway','Корзина сформирована?',0,2,0),('eligible','call:Eligibility','02 · Наличие и рецепт',1,3),('allowed','exclusiveGateway','Продажа допустима?',1,4),('stop','endEvent','Покупка остановлена; помощь',0,5,-60),('checkout','call:Checkout','03 · Адрес, доставка, проверка',0,5,95),('ready','exclusiveGateway','Готов к оплате?',0,6,95),('exit','endEvent','Выход; корзина сохранена',0,7,-60),('pay','call:Payment','04 · Оплата и заказ',1,7),('paid','exclusiveGateway','Заказ подтверждён?',1,8),('pending','endEvent','Ожидается проверка; ID операции',2,9),('fulfil','call:Fulfilment','05 · Исполнение / возврат',1,9),('end','endEvent','Завершено: доставка или отмена',1,10)],
[('start','catalog'),('catalog','hascart'),('hascart','eligible','Да'),('hascart','exit','Нет'),('eligible','allowed'),('allowed','stop','Нет'),('allowed','checkout','Да'),('checkout','ready'),('ready','exit','Нет'),('ready','pay','Да'),('pay','paid'),('paid','pending','Нет / неизвестно'),('paid','fulfil','Да'),('fulfil','end')])
model('Catalog','01 · Поиск и корзина',[
('start','startEvent','Начало поиска',0,0),('query','userTask','Ввести название / выбрать категорию',0,1),('search','serviceTask','Получить каталог',1,2),('found','exclusiveGateway','Ответ каталога?',1,3),('empty','userTask','Исправить запрос / открыть помощь',0,4,-50),('retry','userTask','Сохранённый запрос: повторить / выйти',0,4,105),('choice','exclusiveGateway','Повторить?',0,5,105),('exit','endEvent','Выход без заказа',0,6,105),('product','userTask','Проверить форму, дозировку, цену',0,6,-50),('cart','userTask','Выбрать количество; добавить в корзину',0,7,-50),('end','endEvent','Корзина сформирована',0,8,-50)],
[('start','query'),('query','search'),('search','found'),('found','product','Есть'),('found','empty','Нет результатов'),('found','retry','Ошибка / offline'),('empty','query'),('retry','choice'),('choice','search','Да'),('choice','exit','Нет'),('product','cart'),('cart','end')])
model('Eligibility','02 · Наличие и рецептурные ограничения',[
('start','startEvent','Есть корзина',0,0),('check','serviceTask','Перепроверить остаток, цену, правила',1,1),('ok','exclusiveGateway','Товар доступен?',1,2),('edit','userTask','Принять изменения / убрать товар',0,3,-40),('again','exclusiveGateway','Продолжить?',0,4,-40),('no','endEvent','Продажа не разрешена',0,6,-40),('rx','exclusiveGateway','Нужен рецепт?',1,3,105),('upload','userTask','Предоставить документ',0,5,105),('review','userTask','Фармацевт проверяет документ',1,6),('result','exclusiveGateway','Проверка?',1,7),('fix','userTask','Исправить документ / помощь',0,8,-40),('fixgo','exclusiveGateway','Исправить?',0,9,-40),('wait','intermediateCatchEvent','Проверить позже',2,8),('yes','endEvent','Допуск подтверждён',1,10)],
[('start','check'),('check','ok'),('ok','edit','Нет / изменилось / ошибка'),('edit','again'),('again','check','Да'),('again','no','Нет'),('ok','rx','Да'),('rx','yes','Не нужен'),('rx','upload','Нужен'),('rx','fix','Требования неизвестны'),('upload','review'),('review','result'),('result','yes','Одобрено'),('result','fix','Отклонено'),('result','wait','Ожидается'),('wait','review'),('fix','fixgo'),('fixgo','upload','Да'),('fixgo','no','Нет')])
model('Checkout','03 · Адрес, доставка и итоговая проверка',[
('start','startEvent','Товар допущен',0,0),('address','userTask','Указать адрес и контакт',0,1),('validate','scriptTask','Проверить обязательные поля',2,2),('valid','exclusiveGateway','Поля корректны?',2,3),('error','userTask','Исправить поля; данные сохранены',0,4,-40),('delivery','serviceTask','Проверить адрес, зону, слоты и цену',1,4),('available','exclusiveGateway','Доставка доступна?',1,5),('change','userTask','Изменить адрес / время / выйти',0,6,-40),('changego','exclusiveGateway','Продолжить?',0,7,-40),('cancel','endEvent','Выход до оплаты',0,10,-40),('select','userTask','Выбрать слот и способ оплаты',0,6,105),('total','scriptTask','Рассчитать полный итог',2,7),('review','userTask','Проверить итог, адрес и согласиться',0,8,105),('session','serviceTask','Проверить сессию, цену, резерв и слот',1,9),('state','exclusiveGateway','Результат?',1,10),('login','userTask','Войти снова; восстановить корзину',0,11,-40),('ready','endEvent','Готов к оплате',1,12)],
[('start','address'),('address','validate'),('validate','valid'),('valid','error','Нет'),('error','address'),('valid','delivery','Да'),('delivery','available'),('available','select','Да'),('available','change','Нет / API недоступен'),('change','changego'),('changego','address','Да'),('changego','cancel','Нет'),('select','total'),('total','review'),('review','session'),('session','state'),('state','ready','Подтверждено'),('state','login','Сессия истекла'),('state','change','Цена / наличие / слот изменились'),('state','change','Отмена'),('login','session')])
model('Payment','04 · Идемпотентная оплата и создание заказа',[
('start','startEvent','Итог подтверждён',0,0),('key','scriptTask','Заблокировать Pay; назначить ID операции',2,1),('pay','serviceTask','Отправить платёж с idempotency key',1,2),('result','exclusiveGateway','Статус провайдера?',1,3),('decline','userTask','Отказ / прервано: другой способ или выход',0,4,-40),('retry','exclusiveGateway','Новая попытка?',0,5,-40),('new','scriptTask','Новый ID только после конечного отказа',2,6,-20),('exit','endEvent','Не оплачено',0,7,-40),('unknown','scriptTask','Показать: проверяем; не повторять оплату',2,4,110),('timer','intermediateCatchEvent','Повторная проверка через 30 с',2,5,110),('status','serviceTask','Запросить существующую операцию по ID',1,6,90),('known','exclusiveGateway','Статус известен?',1,7,90),('pending','endEvent','Проверка отложена; ID и помощь',2,8,110),('persist','serviceTask','Сохранить заказ однократно по ID оплаты',1,8,-50),('saved','exclusiveGateway','Заказ сохранён?',1,9,-50),('reconcile','serviceTask','Восстановить заказ по оплаченному ID',1,10,100),('recovered','exclusiveGateway','Восстановлен?',1,11,100),('success','scriptTask','Показать номер и подтверждённый статус',2,12,-20),('end','endEvent','Заказ принят',2,13,-20)],
[('start','key'),('key','pay'),('pay','result'),('result','persist','Оплачено'),('result','decline','Отказ / отмена'),('result','unknown','Timeout / неизвестно / сбой'),('decline','retry'),('retry','new','Да'),('retry','exit','Нет'),('new','pay'),('unknown','timer'),('timer','status'),('status','known'),('known','persist','Оплачено'),('known','decline','Конечный отказ'),('known','pending','Не удалось подтвердить'),('persist','saved'),('saved','success','Да'),('saved','reconcile','Нет / timeout'),('reconcile','recovered'),('recovered','success','Да'),('recovered','pending','Нет'),('success','end')],
external=[('provider','Внешний платёжный провайдер')],messages=[('pay','provider','Платёж + ключ'),('provider','status','Статус по ID')])
model('Fulfilment','05 · Сборка, доставка, отмена и возврат',[
('start','startEvent','Заказ подтверждён',1,0),('pack','userTask','Фармацевт собирает заказ',1,1),('delivery','serviceTask','Запросить доставку и актуальный статус',1,2),('state','exclusiveGateway','Состояние доставки?',1,3),('done','endEvent','Доставка подтверждена',1,4,-40),('delay','scriptTask','Показать задержку; ETA только из ответа',2,4),('wait','intermediateCatchEvent','Следующее обновление',2,5),('cancel','userTask','Запросить отмену / подтвердить невозможность',0,5),('can','serviceTask','Проверить отмену и остановить исполнение',1,6),('allowed','exclusiveGateway','Отмена подтверждена?',1,7),('refund','serviceTask','Запросить возврат один раз по ID заказа',1,8),('notice','scriptTask','Показать: возврат ожидается',2,9),('refundwait','intermediateCatchEvent','Проверить возврат позже',2,10),('refundstatus','serviceTask','Получить подтверждённый статус возврата',1,11),('refunded','exclusiveGateway','Возврат завершён?',1,12),('pending','userTask','Показать ID возврата и помощь',0,13),('end','endEvent','Отмена и возврат подтверждены',1,14)],
[('start','pack'),('pack','delivery'),('delivery','state'),('state','done','Доставлено'),('state','delay','Задержка / неизвестно / в пути'),('delay','wait'),('wait','delivery'),('state','cancel','Отмена / доставка невозможна'),('cancel','can'),('can','allowed'),('allowed','delivery','Нет'),('allowed','refund','Да'),('refund','notice'),('notice','refundwait'),('refundwait','refundstatus'),('refundstatus','refunded'),('refunded','end','Да'),('refunded','pending','Нет / неизвестно'),('pending','refundwait')],external=[('courier','Внешняя служба доставки')],messages=[('delivery','courier','Заказ / запрос статуса'),('courier','delivery','Подтверждённый статус')])
# Definitions require all root elements before BPMNDiagram elements.
for diagram in list(root.findall('bpmndi:BPMNDiagram',NS)):
    root.remove(diagram);root.append(diagram)
# BPMN flow-node child order: incoming, outgoing, then task/event-specific content.
for node in root.iter():
    if node.tag.startswith('{'+NS['bpmn']+'}'):
        refs=[c for c in node if c.tag in ('{'+NS['bpmn']+'}incoming','{'+NS['bpmn']+'}outgoing')]
        for c in refs:node.remove(c)
        offset=1 if len(node) and node[0].tag=='{'+NS['bpmn']+'}documentation' else 0
        for c in sorted(refs,key=lambda c:0 if c.tag.endswith('incoming') else 1):
            node.insert(offset,c);offset+=1
Path('diagrams/pharmacy-order.bpmn').write_bytes(E.tostring(root,pretty_print=True,xml_declaration=True,encoding='UTF-8'))
Path('diagrams/bpmn-manifest.json').write_text(json.dumps(models,ensure_ascii=False,indent=2)+'\n')
print('Generated',len(models),'BPMN diagrams')
