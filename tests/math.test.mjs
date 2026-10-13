import test from 'node:test';
import assert from 'node:assert/strict';
import { wrap, damp, wasDrag, pointerPosition } from '../src/gallery/math.mjs';
test('loop positions remain stable across positive and negative laps',()=>{
  for(const value of [-10000,-53,-26,0,26,53,10000]) {
    const x=wrap(value,52); assert.ok(x>=-26&&x<26);
    assert.ok(Math.abs(wrap(value+52*7,52)-x)<1e-9);
  }
});
test('inertia is independent of frame rate and never overshoots',()=>{
  let a=0,b=0;
  for(let i=0;i<60;i++) a=damp(a,10,7,1/60);
  for(let i=0;i<120;i++) b=damp(b,10,7,1/120);
  assert.ok(Math.abs(a-b)<1e-9); assert.ok(a<10&&a>9.9);
});
test('drag threshold distinguishes clicks from a gallery swipe',()=>{
  assert.equal(wasDrag(0),false); assert.equal(wasDrag(7),false);
  assert.equal(wasDrag(8),true);
});
test('pointer parallax respects the viewport origin and clamps outside positions',()=>{
  const bounds={left:20,top:10,width:1000,height:800};
  assert.deepEqual(pointerPosition(520,410,bounds),{x:0,y:0});
  assert.deepEqual(pointerPosition(-200,1000,bounds),{x:-1,y:1});
  const hidden=pointerPosition(100,100,{left:0,top:0,width:0,height:0});
  assert.ok(Number.isFinite(hidden.x)&&Number.isFinite(hidden.y));
});
