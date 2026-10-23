// Mulberry32, uint32 state, increment before mixing. Seed 0 is valid.
export function validateSeed(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('seed must be a uint32 integer (0–4294967295)');
 return seed;
}

export function createRandom(seed){
 let state=validateSeed(seed);
 const uint32=()=>{
  state=(state+0x6d2b79f5)>>>0;
  let t=state;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return (t^(t>>>14))>>>0;
 };
 return {uint32,integer(limit){
  if(!Number.isSafeInteger(limit)||limit<1||limit>0x100000000)throw new RangeError('limit must be 1–4294967296');
  return Math.floor(uint32()/0x100000000*limit);
 }};
}

// FNV-1a over ASCII domain, initialized with offset_basis XOR seed.
// Independent phase/attempt domains never consume another stream's state.
export function randomStream(seed,domain){
 validateSeed(seed);
 if(typeof domain!=='string'||!domain.length||/[^\x20-\x7e]/.test(domain))throw new RangeError('domain must be nonempty printable ASCII');
 let hash=(0x811c9dc5^seed)>>>0;
 for(let i=0;i<domain.length;i++)hash=Math.imul(hash^domain.charCodeAt(i),0x01000193)>>>0;
 return createRandom(hash);
}
