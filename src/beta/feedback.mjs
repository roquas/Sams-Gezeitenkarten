export const statusText=value=>({open:'Noch offen',solved:'Gelöst',abandoned:'Aufgegeben'}[value]??'Noch offen');
export function feedbackForm({record,onChange}){
 const form=document.createElement('form');form.className='beta-feedback';form.addEventListener('submit',e=>e.preventDefault());
 function select(name,label,entries){
  const field=document.createElement('label');field.textContent=label;
  const input=document.createElement('select');input.name=name;
  for(const [value,text]of [['','Keine Angabe'],...entries]){const option=new Option(text,value);input.append(option);}
  input.value=record.feedback[name]??'';field.append(input);form.append(field);
  input.addEventListener('change',()=>onChange({[name]:name==='fun'&&input.value?Number(input.value):input.value||null}));
 }
 select('difficulty','Wie schwierig war das Rätsel?',[['easy','Einfach'],['medium','Mittel'],['hard','Schwer']]);
 select('fairness','Waren die Hinweise verständlich und fair?',[['yes','Ja'],['partly','Teilweise'],['no','Nein']]);
 select('fun','Wie viel Spaß hat Dir das Rätsel gemacht?',[['1','1 · Gar keinen'],['2','2 · Wenig'],['3','3 · Mittel'],['4','4 · Viel'],['5','5 · Sehr viel']]);
 select('solvingStyle','Wie bist Du überwiegend zur Lösung gekommen?',[['stepwise','Schrittweise ausschließen und markieren'],['route-comparison','Routenkandidaten vergleichen'],['mixed','Eine Mischung'],['other','Anders / schwer einzuordnen']]);
 select('status','Deine Rückmeldung zum Bearbeitungsstand',[['solved','Gelöst'],['abandoned','Aufgegeben'],['open','Noch offen']]);
 const label=document.createElement('label');label.textContent='Kommentar (freiwillig)';const comment=document.createElement('textarea');comment.name='comment';comment.rows=3;comment.value=record.feedback.comment;label.append(comment);form.append(label);
 comment.addEventListener('input',()=>onChange({comment:comment.value}));
 const summary=document.createElement('p');summary.className='muted';const phases=record.phases;
 summary.textContent='Erfasst: '+statusText(phases.at(-1)?.status)+' · Aktive Zeit ca. '+Math.round(phases.reduce((n,p)=>n+p.activeMs,0)/60000)+' Min. · '+phases.reduce((n,p)=>n+p.hints,0)+' Tipps · '+phases.reduce((n,p)=>n+p.noteChecks,0)+' Notizprüfungen. '+(record.solvedAt?'Korrekt gelöst; der Nachweis bleibt erhalten.':'');form.prepend(summary);
 return form;
}
