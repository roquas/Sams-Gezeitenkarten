import {test,selectionUse} from '../integration/webkit-startup.mjs';
import {registerModelTests} from '../integration/model-game.mjs';
test.use({...selectionUse,reducedMotion:'reduce'});
registerModelTests('/');
