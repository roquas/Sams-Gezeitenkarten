// Runs in the page. Observe native animations without seeking, finishing,
// cancelling or changing them. The two limits bound delivery and cleanup,
// independently of the animation's own duration.
export function observePlaceReferenceCompletion({deliveryTimeout,cleanupTimeout}){
 return new Promise(resolve=>{
  document.getElementById('showPlaces').click();
  const svg=document.getElementById('map'),layer=svg.querySelector('.place-references');
  const started=performance.now(),timelineStarted=document.timeline.currentTime;
  const animations=layer.getAnimations({subtree:true});
  let settled=false,removed=null,allFinished=null,deliveryTimer,cleanupTimer;
  const tracks=[];
  const settle=reason=>{
   if(settled)return;
   settled=true;clearTimeout(deliveryTimer);clearTimeout(cleanupTimer);observer.disconnect();
   const finishedTimes=tracks.flatMap(t=>t.finished?[t.finished.wall]:[]);
   const lastTrackFinished=finishedTimes.length?Math.max(...finishedTimes):null;
   resolve({reason,elapsed:performance.now()-started,timelineStarted,removed,allFinished,lastTrackFinished,
    cleanupAfterLastTrack:removed&&lastTrackFinished!==null?Math.max(0,removed.wall-lastTrackFinished):null,
    tracks,overlayConnected:layer.isConnected,overlays:svg.querySelectorAll('.place-references').length,
    labels:svg.querySelectorAll('.place-label').length,svgAnimations:svg.getAnimations({subtree:true}).length,
    connectedTargets:animations.filter(a=>a.effect.target.isConnected).length});
  };
  const observer=new MutationObserver(()=>{
   if(!layer.isConnected){
    removed={wall:performance.now()-started,timeline:document.timeline.currentTime};
    if(allFinished!==null)settle('complete');
   }
  });
  observer.observe(svg,{childList:true});
  const finished=animations.map(animation=>{
   const sample=()=>({wall:performance.now()-started,timeline:document.timeline.currentTime,
    start:animation.startTime,current:animation.currentTime,state:animation.playState});
   const timing=animation.effect.getTiming(),computed=animation.effect.getComputedTiming();
   const track={duration:timing.duration,delay:timing.delay,endDelay:timing.endDelay,
    iterations:timing.iterations,endTime:computed.endTime,playbackRate:animation.playbackRate,created:sample()};
   tracks.push(track);
   animation.ready.then(()=>{track.ready=sample();},error=>{track.readyRejected=error.name;});
   return animation.finished.then(()=>{track.finished=sample();},error=>{track.rejected=error.name;});
  });
  deliveryTimer=setTimeout(()=>settle('delivery-timeout'),deliveryTimeout);
  Promise.all(finished).then(()=>{
   if(settled)return;
   allFinished=performance.now()-started;
   if(removed)settle('complete');
   else cleanupTimer=setTimeout(()=>settle('cleanup-timeout'),cleanupTimeout);
  });
 });
}
