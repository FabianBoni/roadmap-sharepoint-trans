"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[410],{3999:(e,t,a)=>{a.d(t,{A:()=>n});var r=a(7876),o=a(4232),i=a(9099),s=a(5261);function n(e){return function(t){let a=(0,i.useRouter)(),[n,l]=(0,o.useState)(!0);return((0,o.useEffect)(()=>{(async()=>{try{if(!localStorage.getItem("isAdmin")){a.push("/admin/login");return}if(!await (0,s.uu)()){localStorage.removeItem("isAdmin"),a.push("/admin/login");return}l(!1)}catch(e){console.error("Auth check error:",e),a.push("/admin/login")}})()},[a]),n)?(0,r.jsx)("div",{className:"min-h-screen bg-gray-900 text-white flex items-center justify-center",children:(0,r.jsx)("div",{className:"text-xl",children:"Loading..."})}):(0,r.jsx)(e,{...t})}}},5261:(e,t,a)=>{a.d(t,{jL:()=>s,uu:()=>i,wR:()=>o}),a(3426),a(5611);var r=a(5364);async function o(){try{return(await fetch("/_api/web/currentuser",{method:"GET",headers:{Accept:"application/json;odata=verbose"},credentials:"include"})).ok}catch(e){return console.error("Authentication check failed:",e),!1}}async function i(){try{let{clientDataService:e}=await Promise.resolve().then(a.bind(a,5611));return await e.isCurrentUserAdmin()}catch(e){return console.error("Admin check failed:",e),!1}}function s(){let e=encodeURIComponent(window.location.href);window.location.href="/_layouts/15/authenticate.aspx?Source=".concat(e)}a(8220).Buffer,r.env.JWT_SECRET},7264:(e,t,a)=>{a.d(t,{A:()=>ed});var r,o=a(7876),i=a(4232),s=a(9099);let n={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||n,c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,p=(e,t)=>{let a="",r="",o="";for(let i in e){let s=e[i];"@"==i[0]?"i"==i[1]?a=i+" "+s+";":r+="f"==i[1]?p(s,i):i+"{"+p(s,"k"==i[1]?"":t)+"}":"object"==typeof s?r+=p(s,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=s&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=p.p?p.p(i,s):i+":"+s+";")}return a+(t&&o?t+"{"+o+"}":o)+r},m={},g=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+g(e[a]);return t}return e},y=(e,t,a,r,o)=>{let i=g(e),s=m[i]||(m[i]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(i));if(!m[s]){let t=i!==e?e:(e=>{let t,a,r=[{}];for(;t=c.exec(e.replace(d,""));)t[4]?r.shift():t[3]?(a=t[3].replace(u," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(u," ").trim();return r[0]})(e);m[s]=p(o?{["@keyframes "+s]:t}:t,a?"":"."+s)}let n=a&&m.g?m.g:null;return a&&(m.g=m[s]),((e,t,a,r)=>{r?t.data=t.data.replace(r,e):-1===t.data.indexOf(e)&&(t.data=a?e+t.data:t.data+e)})(m[s],t,r,n),s},f=(e,t,a)=>e.reduce((e,r,o)=>{let i=t[o];if(i&&i.call){let e=i(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+r+(null==i?"":i)},"");function h(e){let t=this||{},a=e.call?e(t.p):e;return y(a.unshift?a.raw?f(a,[].slice.call(arguments,1),t.p):a.reduce((e,a)=>Object.assign(e,a&&a.call?a(t.p):a),{}):a,l(t.target),t.g,t.o,t.k)}h.bind({g:1});let b,x,v,w=h.bind({k:1});function C(e,t){let a=this||{};return function(){let r=arguments;function o(i,s){let n=Object.assign({},i),l=n.className||o.className;a.p=Object.assign({theme:x&&x()},n),a.o=/ *go\d+/.test(l),n.className=h.apply(a,r)+(l?" "+l:""),t&&(n.ref=s);let c=e;return e[0]&&(c=n.as||e,delete n.as),v&&c[0]&&v(n),b(c,n)}return t?t(o):o}}var N=e=>"function"==typeof e,k=(e,t)=>N(e)?e(t):e,E=(()=>{let e=0;return()=>(++e).toString()})(),S=(()=>{let e;return()=>{if(void 0===e&&"u">typeof window){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),$=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return $(e,{type:+!!e.toasts.find(e=>e.id===a.id),toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},A=[],I={toasts:[],pausedAt:void 0},D=e=>{I=$(I,e),A.forEach(e=>{e(I)})},_={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},F=(e={})=>{let[t,a]=j(I),r=Q(I);H(()=>(r.current!==I&&a(I),A.push(a),()=>{let e=A.indexOf(a);e>-1&&A.splice(e,1)}),[]);let o=t.toasts.map(t=>{var a,r,o;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(a=e[t.type])?void 0:a.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(r=e[t.type])?void 0:r.duration)||(null==e?void 0:e.duration)||_[t.type],style:{...e.style,...null==(o=e[t.type])?void 0:o.style,...t.style}}});return{...t,toasts:o}},z=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||E()}),O=e=>(t,a)=>{let r=z(t,e,a);return D({type:2,toast:r}),r.id},T=(e,t)=>O("blank")(e,t);T.error=O("error"),T.success=O("success"),T.loading=O("loading"),T.custom=O("custom"),T.dismiss=e=>{D({type:3,toastId:e})},T.remove=e=>D({type:4,toastId:e}),T.promise=(e,t,a)=>{let r=T.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?k(t.success,e):void 0;return o?T.success(o,{id:r,...a,...null==a?void 0:a.success}):T.dismiss(r),e}).catch(e=>{let o=t.error?k(t.error,e):void 0;o?T.error(o,{id:r,...a,...null==a?void 0:a.error}):T.dismiss(r)}),e};var R=(e,t)=>{D({type:1,toast:{id:e,height:t}})},L=()=>{D({type:5,time:Date.now()})},P=new Map,U=1e3,M=(e,t=U)=>{if(P.has(e))return;let a=setTimeout(()=>{P.delete(e),D({type:4,toastId:e})},t);P.set(e,a)},q=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,B=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,J=C("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${q} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${B} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${G} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,W=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,X=C("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${W} 1s linear infinite;
`,Z=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,K=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,V=C("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${K} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Y=C("div")`
  position: absolute;
`,ee=C("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,et=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ea=C("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${et} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,er=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?i.createElement(ea,null,t):t:"blank"===a?null:i.createElement(ee,null,i.createElement(X,{...r}),"loading"!==a&&i.createElement(Y,null,"error"===a?i.createElement(J,{...r}):i.createElement(V,{...r})))},eo=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ei=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,es=C("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,en=C("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,el=(e,t)=>{let a=e.includes("top")?1:-1,[r,o]=S()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[eo(a),ei(a)];return{animation:t?`${w(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};i.memo(({toast:e,position:t,style:a,children:r})=>{let o=e.height?el(e.position||t||"top-center",e.visible):{opacity:0},s=i.createElement(er,{toast:e}),n=i.createElement(en,{...e.ariaProps},k(e.message,e));return i.createElement(es,{className:e.className,style:{...o,...a,...e.style}},"function"==typeof r?r({icon:s,message:n}):i.createElement(i.Fragment,null,s,n))}),r=i.createElement,p.p=void 0,b=r,x=void 0,v=void 0,h`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var ec=a(5611);let ed=e=>{let{initialData:t,onCancel:a}=e,r=(0,s.useRouter)(),[n,l]=(0,i.useState)(!1),[c,d]=(0,i.useState)([]),[u,p]=(0,i.useState)({name:(null==t?void 0:t.name)||"",color:(null==t?void 0:t.color)||"#3B82F6",icon:(null==t?void 0:t.icon)||"",parentId:(null==t?void 0:t.parentId)||"",isSubcategory:null!=t&&!!t.parentId});(0,i.useEffect)(()=>{(async()=>{try{let e=await ec.clientDataService.getAllCategories(),a=(null==t?void 0:t.id)?e.filter(e=>e.id!==t.id&&!e.isSubcategory):e.filter(e=>!e.isSubcategory);d(a)}catch(e){console.error("Error fetching categories:",e),T.error("Failed to load categories")}})()},[t]);let m=e=>{let{name:t,value:a}=e.target;p(e=>({...e,[t]:a,isSubcategory:"parentId"===t?""!==a:e.isSubcategory}))},g=async e=>{e.preventDefault(),l(!0);try{t?(await ec.clientDataService.updateCategory(t.id,u),T.success("Category updated successfully")):(await ec.clientDataService.createCategory(u),T.success("Category created successfully")),r.push("/admin")}catch(e){console.error("Error saving category:",e),T.error(t?"Failed to update category":"Failed to create category")}finally{l(!1)}};return(0,o.jsxs)("form",{onSubmit:g,className:"bg-gray-800 p-6 rounded-lg shadow-lg",children:[(0,o.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"block text-gray-300 mb-2",children:"Name"}),(0,o.jsx)("input",{type:"text",name:"name",value:u.name,onChange:m,className:"w-full p-2 bg-gray-700 border border-gray-600 rounded text-white",required:!0})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"block text-gray-300 mb-2",children:"Color"}),(0,o.jsxs)("div",{className:"flex space-x-2",children:[(0,o.jsx)("input",{type:"color",name:"color",value:u.color,onChange:m,className:"h-10 w-10 bg-gray-700 border border-gray-600 rounded"}),(0,o.jsx)("input",{type:"text",name:"color",value:u.color,onChange:m,className:"flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white",placeholder:"#HEX"})]})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"block text-gray-300 mb-2",children:"Icon (Optional)"}),(0,o.jsx)("input",{type:"text",name:"icon",value:u.icon,onChange:m,className:"w-full p-2 bg-gray-700 border border-gray-600 rounded text-white",placeholder:"Icon name or URL"})]}),(0,o.jsxs)("div",{children:[(0,o.jsx)("label",{className:"block text-gray-300 mb-2",children:"Parent Category (Optional)"}),(0,o.jsxs)("select",{name:"parentId",value:u.parentId,onChange:m,className:"w-full p-2 bg-gray-700 border border-gray-600 rounded text-white",children:[(0,o.jsx)("option",{value:"",children:"None (Top-level Category)"}),c.map(e=>(0,o.jsx)("option",{value:e.id,children:e.name},e.id))]})]})]}),(0,o.jsxs)("div",{className:"mt-6 flex justify-end space-x-4",children:[(0,o.jsx)("button",{type:"button",onClick:a,className:"px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors",disabled:n,children:"Cancel"}),(0,o.jsx)("button",{type:"submit",className:"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors",disabled:n,children:n?"Saving...":t?"Update Category":"Create Category"})]})]})}}}]);