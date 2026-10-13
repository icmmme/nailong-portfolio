import assert from 'node:assert/strict';
import test from 'node:test';
import { GalleryMotion } from '../src/gallery/GalleryMotion.ts';
import { surfaceColumn } from '../src/gallery/surface.mjs';
import { sheetEase } from '../src/gallery/sheetEase.ts';

function replay(hz) {
  const m=new GalleryMotion();m.grab(0);
  for(let i=1;i<=hz/2;i++){m.dragBy(1000/hz,i*1000/hz);m.step(1/hz);}
  assert.ok(m.target-m.position<30,`drag lag ${m.target-m.position}px`);
  m.release(500);for(let i=0;i<hz*2;i++)m.step(1/hz);
  return m;
}
test('drag follows within 30px and coast is stable at 60/144Hz',()=>{
  const a=replay(60),b=replay(144);assert.ok(Math.abs(a.position-b.position)<2);
});
test('grabbing cancels an old fling and direction reverses immediately',()=>{
  const m=replay(60);m.grab(2500);const start=m.position;m.dragBy(-20,2516);m.step(1/60);assert.ok(m.position<start);
  m.release(2516,true);const stopped=m.position;for(let i=0;i<60;i++)m.step(1/60);assert.equal(m.position,stopped);
});
test('holding still does not relaunch stale velocity',()=>{
  const m=new GalleryMotion();m.grab(0);m.dragBy(100,100);for(let i=0;i<60;i++)m.step(1/60);m.release(1100);
  const start=m.position;for(let i=0;i<60;i++)m.step(1/60);assert.ok(Math.abs(m.position-start)<.01);
});
test('wheel bursts settle and reverse without old buffering',()=>{
  const m=new GalleryMotion();m.wheelBy(120,1,1000);for(let i=0;i<60;i++)m.step(1/60);assert.ok(m.position>295&&m.position<301);
  m.wheelBy(-120,1,2000);const start=m.position;m.step(1/60);assert.ok(m.position<start);
});
test('compressed pointer timestamps respect the input speed limit',()=>{
  const m=new GalleryMotion();m.maxInputSpeed=2000;m.grab(0);m.dragBy(200,1);m.step(1/60);m.release(1);
  for(let i=0;i<180;i++)m.step(1/60);assert.ok(m.position<565);
});
test('stopping mid-drag cancels all pending motion before resume',()=>{
  const m=new GalleryMotion();m.grab(0);m.dragBy(180,100);m.step(1/60);m.stop();
  const start=m.position;assert.equal(m.dragging,false);for(let i=0;i<144;i++)m.step(1/144);assert.equal(m.position,start);
  m.wheelBy(-120,1,2000);m.step(1/60);assert.ok(m.position<start);
});
test('added surface twist tapers to zero at both edges and remains bounded',()=>{
  for(const speed of [-100,-1,0,1,100])for(let x=-100;x<=100;x++){
    const s=surfaceColumn(x,100,speed);assert.ok(Math.abs(s.twist)<=.15);assert.ok(Number.isFinite(s.z));
    if(Math.abs(x)===100){const resting=surfaceColumn(x,100,0);assert.equal(Math.abs(s.twist),0);assert.equal(s.z,resting.z);}
  }
});
test('sheet easing is continuous, bounded and monotonic',()=>{
  let previous=0;for(let i=0;i<=1000;i++){const next=sheetEase(i/1000);assert.ok(next>=previous-1e-6);assert.ok(next>=0&&next<=1);previous=next;}
  assert.equal(sheetEase(0),0);assert.equal(sheetEase(1),1);
});
