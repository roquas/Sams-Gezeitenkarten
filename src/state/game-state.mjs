// Editing history excludes navigation, display and paid hints.
export function initialState(puzzle){
 return {layer:1,tool:'maybe',hideRouteMarks:false,showRouteNumbers:false,distanceMode:false,distanceOrigin:null,marks:{},route:[puzzle.start],penalty:0,hintCount:0,hintPenalty:0,hiddenHours:[],doneClues:[],help:'',result:''};
}
export function createHistory(limit=100){
 const entries=[];
 return {
  push(state){entries.push(structuredClone({marks:state.marks,route:state.route,doneClues:state.doneClues,checkPenalty:state.penalty-state.hintPenalty}));if(entries.length>limit)entries.shift();},
  undo(state){const previous=entries.pop();if(!previous)return state;return {...state,marks:previous.marks,route:previous.route,doneClues:previous.doneClues,penalty:previous.checkPenalty+state.hintPenalty,result:''};},
  clear(){entries.length=0;}
 };
}
