export function downloadFeedback(store,{scope=null,catalogSchemaVersion=null}={}){
 const data=store.exportData({name:'Sams Gezeitenkarten',version:'0.1.0',catalog:scope,catalogSchemaVersion});
 const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='gezeitenkarten-betatest-'+data.exportedAt.slice(0,10)+'.json';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
