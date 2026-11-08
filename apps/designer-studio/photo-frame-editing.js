(function(root){
 function apply(item,values){
  item.image ||= {};
  item.image.binding=values.binding;item.image.fit=values.fit;
  item.image.scale=Number(values.scale||1);item.image.offsetX=Number(values.offsetX||0);item.image.offsetY=Number(values.offsetY||0);
  item.image.flipX=values.flipX===true||values.flipX==='true';item.image.flipY=values.flipY===true||values.flipY==='true';
  item.image.brightness=Number(values.brightness??100);item.image.contrast=Number(values.contrast??100);item.image.saturation=Number(values.saturation??100);
  return item;
 }
 root.ACDLPhotoFrameEditing=Object.freeze({apply});
})(globalThis);
