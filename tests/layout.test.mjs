import assert from 'node:assert/strict';
import test from 'node:test';
import { galleryLayout } from '../src/gallery/layout.mjs';

test('portrait cards fit the touch viewport and retain readable image area',()=>{
  for(const [w,h] of [[320,740],[390,844],[430,932]]){
    const layout=galleryLayout(w,h);
    assert.ok(layout.cardHeight*1.7<w);
    assert.ok(layout.cardHeight>h*.2);
    assert.ok(layout.pixelRatioLimit<=1.25);
  }
});
test('ring outer edge fits portrait, landscape, and desktop short side',()=>{
  for(const [w,h] of [[320,740],[390,844],[844,390],[1440,900],[1920,1080]]){
    const {ringRadius,ringBand}=galleryLayout(w,h);
    assert.ok((ringRadius+ringBand)*w*2<Math.min(w,h)*.95);
    assert.ok(ringBand/ringRadius>.4);
    assert.ok(ringRadius*w*2>Math.min(w,h)*.59);
  }
});
