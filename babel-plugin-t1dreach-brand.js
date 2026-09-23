// Keeps legacy product-name copy from leaking into compiled user-facing text.
// IMPORTANT: only transform text nodes. Transforming every StringLiteral also
// rewrites import/require module paths (for example ../T1Together/... ->
// ../T1DReach/...), which breaks Metro module resolution.
module.exports=function(){
 const swap=value=>typeof value==='string'?value.replace(/T1Together/g,'T1DReach').replace(/T1TOGETHER/g,'T1DREACH'):value;
 return {visitor:{
  JSXText(path){path.node.value=swap(path.node.value)},
  TemplateElement(path){path.node.value.raw=swap(path.node.value.raw);path.node.value.cooked=swap(path.node.value.cooked)}
 }};
};
