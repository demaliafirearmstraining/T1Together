// Keeps legacy technical identifiers intact while ensuring old product-name copy
// cannot leak into the compiled app from a missed UI/legal string.
module.exports=function(){
 const swap=value=>typeof value==='string'?value.replace(/T1Together/g,'T1DReach').replace(/T1TOGETHER/g,'T1DREACH'):value;
 return {visitor:{
  StringLiteral(path){path.node.value=swap(path.node.value)},
  JSXText(path){path.node.value=swap(path.node.value)},
  TemplateElement(path){path.node.value.raw=swap(path.node.value.raw);path.node.value.cooked=swap(path.node.value.cooked)}
 }};
};
