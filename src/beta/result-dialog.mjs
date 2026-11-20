import {feedbackForm} from './feedback.mjs';
export function resultMessage(puzzle,correct){return puzzle.resultTexts?.[correct?'correct':'incorrect']??(correct?'Du hast die gesuchte Route rekonstruiert.':'Diese Route passt noch nicht zu allen Hinweisen. Prüfe Deine Eintragungen und versuche es erneut.');}
export function showResult({puzzle,correct,penalty,store,identity,opener}){
 const previous=opener??document.activeElement,dialog=document.createElement('dialog');dialog.className='beta-result';dialog.setAttribute('aria-labelledby','resultTitle');dialog.setAttribute('aria-describedby','resultMessage');
 const title=document.createElement('h2');title.id='resultTitle';title.tabIndex=-1;title.textContent=correct?'Richtig gelöst!':'Leider falsch';
 const message=document.createElement('p');message.id='resultMessage';message.textContent=resultMessage(puzzle,correct);dialog.append(title,message);
 let draft={};
 if(correct){
  const points=document.createElement('p');points.textContent=penalty+' Strafpunkte';dialog.append(points);
  const invitation=document.createElement('p');invitation.textContent='Wenn Du möchtest: Wie war das Rätsel? Dein Feedback ist freiwillig.';dialog.append(invitation);
  dialog.append(feedbackForm({record:store.get(identity),onChange:values=>Object.assign(draft,values)}));
 }
 const buttons=document.createElement('div');buttons.className='controls';
 function close(){dialog.close();}
 if(correct){const save=document.createElement('button');save.type='button';save.className='btn primary';save.textContent='Feedback speichern';save.onclick=()=>{store.feedback(identity,draft,puzzle.title);close();};buttons.append(save);}
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='btn';dismiss.textContent=correct?'Überspringen / Schließen':'Schließen und weiterspielen';dismiss.onclick=close;buttons.append(dismiss);dialog.append(buttons);
 dialog.addEventListener('close',()=>{dialog.remove();previous?.focus({preventScroll:true});},{once:true});
 // Native dialog provides focus containment, Escape, background inertness and touch scrolling.
 // Escape in a result must not also switch the mobile logbook view.
 dialog.addEventListener('keydown',event=>{
  if(event.key==='Escape')event.stopPropagation();
  if(event.key!=='Tab')return;
  const fields=[...dialog.querySelectorAll('button,select,textarea,input,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
  if(!fields.length)return;
  const index=fields.indexOf(document.activeElement);
  event.preventDefault();
  fields[event.shiftKey?(index<=0?fields.length-1:index-1):(index+1)%fields.length].focus();
 });
 document.body.append(dialog);dialog.showModal();title.focus();
}
