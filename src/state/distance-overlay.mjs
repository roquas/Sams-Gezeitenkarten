// Display overlay and origin selection are independent of the editing tool.
export const distancePhase=state=>!state.distanceMode?'inactive':state.distanceSelecting||!state.distanceOrigin?'waiting':'showing';
export function toggleDistance(state){
 const phase=distancePhase(state);
 if(phase==='waiting')return {...state,distanceMode:false,distanceSelecting:false,distanceOrigin:null};
 return {...state,distanceMode:true,distanceSelecting:true,distanceOrigin:phase==='showing'?state.distanceOrigin:null};
}
export const chooseDistanceOrigin=(state,id)=>({...state,distanceMode:true,distanceSelecting:false,distanceOrigin:id});
export function selectChartTool(state,tool){
 return {...state,tool,distanceSelecting:false,distanceMode:!!(state.distanceMode&&state.distanceOrigin)};
}
