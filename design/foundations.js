// Run through Figma use_figma on the project's file; no manual drawing.
await Promise.all(['Regular','Medium','Semi Bold','Bold'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const page=figma.currentPage;page.name='01 · Аптека рядом · HCI';
const created=[];const add=n=>{created.push(n.id);return n;};
const [buttons,fields,space,bg,body]=await Promise.all([
 figma.importComponentSetByKeyAsync('cc8b558dc7d9684011b6b99ce8e6509399bc836b'),
 figma.importComponentSetByKeyAsync('c28150b04d333d34ed9d2b77abd9f2f54e1a878a'),
 figma.variables.importVariableByKeyAsync('16bc6f84b6e7e20e4234ef79030ee580ec0f4505'),
 figma.variables.importVariableByKeyAsync('955929a32d354aebeb2d4e97edc1eb6ee1511547'),
 figma.importStyleByKeyAsync('cebee1b62ea594fa8f97b0b247fd163730736f2a')]);
const coll=figma.variables.createVariableCollection('Pharmacy · Foundations');
const color={};
const palette={ink:'#16332E',muted:'#526A64',brand:'#146858',paper:'#FFFFFF',canvas:'#F2F7F5',border:'#78958B',danger:'#A32D25',dangerBg:'#FFF0ED',warning:'#6F4A05',warningBg:'#FFF4D6',focus:'#2059BC'};
const rgb=hex=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7,9),16)/255});
for(const [name,hex]of Object.entries(palette)){
 const v=figma.variables.createVariable('color/'+name,coll,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(coll.defaultModeId,rgb(hex));v.setVariableCodeSyntax('WEB','var(--color-'+name+')');color[name]=v;
}
const radius=figma.variables.createVariable('radius/card',coll,'FLOAT');radius.scopes=['CORNER_RADIUS'];radius.setValueForMode(coll.defaultModeId,16);radius.setVariableCodeSyntax('WEB','var(--radius-card)');
const paint=name=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',color[name])];
const styles={body};
for(const [name,size,style]of [['title',28,'Bold'],['heading',20,'Semi Bold'],['label',16,'Semi Bold'],['caption',14,'Regular']]){
 const s=figma.createTextStyle();s.name='Pharmacy/'+name;s.fontName={family:'Inter',style};s.fontSize=size;s.lineHeight={unit:'PERCENT',value:140};styles[name]=s;
}
function text(parent,value,style='body',tone='ink',width=310){const t=add(figma.createText());parent.appendChild(t);t.fontName={family:'Inter',style:'Regular'};t.textStyleId=styles[style].id;t.characters=value;t.fills=paint(tone);t.textAutoResize='HEIGHT';t.resize(width,24);return t;}
function component(name,height=130){const c=add(figma.createComponent());c.name=name;c.layoutMode='VERTICAL';c.resize(350,height);c.primaryAxisSizingMode='AUTO';c.paddingTop=c.paddingBottom=c.paddingLeft=c.paddingRight=20;c.setBoundVariable('itemSpacing',space);c.setBoundVariable('cornerRadius',radius);c.fills=paint('paper');c.strokes=paint('border');return c;}
const library=add(figma.createAutoLayout('VERTICAL'));library.name='Design system · исходные компоненты';library.x=200;library.y=200;library.resize(1600,100);library.primaryAxisSizingMode='AUTO';library.paddingTop=library.paddingBottom=library.paddingLeft=library.paddingRight=32;library.itemSpacing=24;library.fills=paint('canvas');text(library,'Аптека рядом · Design system','title','ink',1500);text(library,'Inter · шаг 4 px · CTA ≥48 px · WCAG 2.2 AA — цель проектирования. Состояния прототипа не подтверждают реальную оплату.','body','muted',1500);
const components={};
// Adapted from createComponentWithVariants helper: one state axis, grid after combine.
function family(name,states,builder){const comps=states.map(state=>{const c=component('State='+state);builder(c,state);return c;});const set=add(figma.combineAsVariants(comps,page));set.name=name;set.description='HCI pharmacy reusable '+name+'; explicit states and editable labels.';set.resize(1500,Math.ceil(states.length/4)*210+32);set.children.forEach((c,i)=>{c.x=16+(i%4)*370;c.y=16+Math.floor(i/4)*210;});library.appendChild(set);components[name]={id:set.id,states:Object.fromEntries(set.children.map(n=>[n.name.slice(6),n.id]))};return set;}
const primary=buttons.children.find(n=>n.name==='Variant=Primary, State=Default, Size=Medium');
const disabled=buttons.children.find(n=>n.name==='Variant=Primary, State=Disabled, Size=Medium');
family('Button',['Default','Hover','Focus','Pressed','Disabled','Loading'],(c,s)=>{c.paddingTop=c.paddingBottom=4;c.paddingLeft=c.paddingRight=4;c.fills=paint('paper');const i=add((s==='Disabled'||s==='Loading'?disabled:primary).createInstance());c.appendChild(i);i.setProperties({'Label#2:0':s==='Loading'?'Проверяем…':'Продолжить','Has Icon Start#4:128':false,'Has Icon End#4:64':false});i.resize(340,48);if(s==='Focus'){c.strokes=paint('focus');c.strokeWeight=3;}if(s==='Hover')c.opacity=.9;if(s==='Pressed')c.opacity=.8;});
family('Input',['Default','Focus','Filled','Error','Success','Disabled'],(c,s)=>{c.paddingTop=c.paddingBottom=4;c.paddingLeft=c.paddingRight=4;const source=fields.children.find(n=>n.name===`State=${s==='Error'?'Error':s==='Disabled'?'Disabled':'Default'}, Value Type=${s==='Default'?'Placeholder':'Default'}`);const i=add(source.createInstance());c.appendChild(i);i.setProperties({'Label#280:41':'Адрес доставки','Value#630:14':s==='Default'?'Улица и номер дома':'ул. Абая, 10','Has Error#72:6':s==='Error','Error#280:44':'Уточните номер дома','Has Description#611:20':s==='Success','Description#611:27':'Адрес подтверждён'});i.resize(340,i.height);if(s==='Focus'){c.strokes=paint('focus');c.strokeWeight=3;}});
const specs={
 Search:['Default','Focus','Loading','Empty','Error','Disabled'],Select:['Default','Hover','Focus','Pressed','Disabled','Loading'],Checkbox:['Default','Hover','Focus','Pressed','Disabled','Loading'],Radio:['Default','Hover','Focus','Pressed','Disabled','Loading'],Toast:['Info','Success','Error'],Alert:['Info','Warning','Error','Success'],Modal:['Default','Focus','Disabled','Loading'],BottomSheet:['Default','Focus','Disabled','Loading'],
 ProductCard:['In stock','Low stock','Out of stock','Prescription required','Unavailable','Loading','Error'],CartItem:['Normal','Quantity updated','Item unavailable','Price changed','Partial stock','Loading','Error'],PriceSummary:['Default'],DeliverySlot:['Default','Selected','Unavailable','Loading','Error'],PaymentMethod:['Idle','Selected','Processing','Success','Declined','Cancelled','Unknown','Service error'],OrderStatus:['Processing','Confirmed','Delayed','Delivered','Cancelled','Refund pending','Refund completed'],Stepper:['Default'],Skeleton:['Loading']};
const copy={
 'In stock':'В наличии · 1 200 ₸','Low stock':'Осталось 2 упаковки','Out of stock':'Нет в наличии · вернуться в каталог','Prescription required':'Нужна проверка рецепта фармацевтом','Unavailable':'Продажа пока недоступна','Loading':'Загружаем…','Error':'Не удалось загрузить. Повторить проверку','Empty':'Ничего не найдено. Измените запрос',
 'Declined':'Оплата не прошла. Выберите другой способ','Unknown':'Проверяем статус. Не повторяйте платёж','Processing':'Обрабатываем… Не закрывайте страницу','Cancelled':'Операция отменена','Service error':'Сервис недоступен. Сначала проверим операцию','Refund pending':'Возврат запрошен. Ожидаем подтверждения','Refund completed':'Возврат подтверждён','Delayed':'Доставка задерживается; время уточняется','Delivered':'Доставка подтверждена','Confirmed':'Заказ принят · № DEMO-1042','Partial stock':'Доступно 2 из 3. Подтвердите количество','Price changed':'Цена изменилась. Проверьте итог','Item unavailable':'Товар закончился. Удалить / найти другой'};
for(const [name,states] of Object.entries(specs))family(name,states,(c,s)=>{
 if(['Error','Declined','Service error','Item unavailable'].includes(s))c.fills=paint('dangerBg');
 if(['Unknown','Delayed','Prescription required','Refund pending'].includes(s))c.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',bg)];
 text(c,name==='ProductCard'?'Парацетамол · 500 мг':name==='PriceSummary'?'Итого · 1 700 ₸':name==='CartItem'?'Парацетамол · 1 упаковка':name==='DeliverySlot'?'Сегодня · 18:00–20:00':name==='Stepper'?'Адрес → Доставка → Оплата → Проверка':name,'label');
 text(c,copy[s]||s,'body','muted');
});
return {createdNodeIds:created,page:page.id,library:library.id,components,variables:Object.fromEntries(Object.entries(color).map(([k,v])=>[k,v.id])),radius:radius.id,space:space.id,bg:bg.id,styles:Object.fromEntries(Object.entries(styles).map(([k,v])=>[k,v.id])),font:'Inter',componentSets:Object.keys(components).length};
