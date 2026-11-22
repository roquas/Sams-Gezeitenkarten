let emergencyExport;
export function setEmergencyExport(action){emergencyExport=action;const notice=document.getElementById('storageNotice');if(notice)storageNotice(notice.dataset.message);}
export function storageNotice(message){
 let notice=document.getElementById('storageNotice');
 if(!notice){notice=document.createElement('p');notice.id='storageNotice';notice.className='notice error';notice.role='alert';const text=document.createElement('span');text.dataset.storageMessage='';notice.append(text);const close=document.createElement('button');close.type='button';close.className='btn small';close.textContent='Hinweis schließen';close.onclick=()=>{notice.hidden=true;};notice.append(document.createTextNode(' '),close);document.body.prepend(notice);}
 notice.dataset.message=message;notice.querySelector('[data-storage-message]').textContent=message;
 if(emergencyExport){
  let button=notice.querySelector('[data-emergency-export]');
  if(!button){button=document.createElement('button');button.type='button';button.className='btn small';button.textContent='Feedback jetzt exportieren';button.dataset.emergencyExport='';notice.append(document.createTextNode(' '),button);}
  button.onclick=emergencyExport;
 }
}
export function localStorageAccess(){
 let storage;const unreadable=new Set();
 try{storage=window.localStorage;const probe='gezeitenkarten-storage-probe';storage.setItem(probe,'1');storage.removeItem(probe);}
 catch{storageNotice('Lokales Speichern ist nicht verfügbar (gesperrt oder Speicher voll). Eingaben sind nicht dauerhaft gesichert. Exportiere Feedback vor dem Verlassen.');}
 // A narrow adapter also surfaces the game storage module's caught errors.
 return {
  getItem(key){try{return storage.getItem(key);}catch(error){unreadable.add(key);storageNotice('Lokale Daten können nicht gelesen werden. Der Spielstand ist nicht dauerhaft gesichert.');throw error;}},
  setItem(key,value){if(unreadable.has(key))throw Error('Vorhandene Daten nicht lesbar; kein Überschreiben.');try{return storage.setItem(key,value);}catch(error){storageNotice('Lokales Speichern fehlgeschlagen (gesperrt oder Speicher voll). Spielstand und neue Rückmeldungen sind nicht dauerhaft gesichert. Exportiere Feedback vor dem Verlassen.');throw error;}},
  get length(){return storage.length;},key(index){return storage.key(index);}
 };
}
