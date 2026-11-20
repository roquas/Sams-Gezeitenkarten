import {mountGame} from './game.mjs';
import {showLanding} from '../beta/landing.mjs';
const params=new URLSearchParams(window.location.search);
if(params.get('view')!=='selection'&&(params.has('puzzle')||params.get('play')==='1'||params.get('dev')==='b2')){
 document.getElementById('gameSurface').hidden=false;
 await mountGame();
}else await showLanding();
