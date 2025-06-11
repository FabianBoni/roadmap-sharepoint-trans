"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1215],{6815:(t,i,a)=>{a.d(i,{lM:()=>k});var s=a(7876);a(4232);var e=a(7232);let r="#4fa94d",o={"aria-busy":!0,role:"progressbar"},n=(0,e.Ay).div`
  display: ${t=>t.$visible?"flex":"none"};
`,h=(0,e.i7)`
12.5% {
  stroke-dasharray: ${33.98873199462888}px, ${242.776657104492}px;
  stroke-dashoffset: -${26.70543228149412}px;
}
43.75% {
  stroke-dasharray: ${84.97182998657219}px, ${242.776657104492}px;
  stroke-dashoffset: -${84.97182998657219}px;
}
100% {
  stroke-dasharray: ${2.42776657104492}px, ${242.776657104492}px;
  stroke-dashoffset: -${240.34889053344708}px;
}
`;(0,e.Ay).path`
  stroke-dasharray: ${2.42776657104492}px, ${242.776657104492};
  stroke-dashoffset: 0;
  animation: ${h} ${1.6}s linear infinite;
`;let l=(0,e.i7)`
to {
   transform: rotate(360deg);
 }
`;(0,e.Ay).svg`
  animation: ${l} 0.75s steps(12, end) infinite;
  animation-duration: 0.75s;
`,(0,e.Ay).polyline`
  stroke-width: ${t=>t.width}px;
  stroke-linecap: round;

  &:nth-child(12n + 0) {
    stroke-opacity: 0.08;
  }

  &:nth-child(12n + 1) {
    stroke-opacity: 0.17;
  }

  &:nth-child(12n + 2) {
    stroke-opacity: 0.25;
  }

  &:nth-child(12n + 3) {
    stroke-opacity: 0.33;
  }

  &:nth-child(12n + 4) {
    stroke-opacity: 0.42;
  }

  &:nth-child(12n + 5) {
    stroke-opacity: 0.5;
  }

  &:nth-child(12n + 6) {
    stroke-opacity: 0.58;
  }

  &:nth-child(12n + 7) {
    stroke-opacity: 0.66;
  }

  &:nth-child(12n + 8) {
    stroke-opacity: 0.75;
  }

  &:nth-child(12n + 9) {
    stroke-opacity: 0.83;
  }

  &:nth-child(12n + 11) {
    stroke-opacity: 0.92;
  }
`;let d=(0,e.i7)`
to {
   stroke-dashoffset: 136;
 }
`,p=(0,e.Ay).polygon`
  stroke-dasharray: 17;
  animation: ${d} 2.5s cubic-bezier(0.35, 0.04, 0.63, 0.95) infinite;
`,c=(0,e.Ay).svg`
  transform-origin: 50% 65%;
`,k=({height:t=80,width:i=80,color:a=r,ariaLabel:e="triangle-loading",wrapperStyle:h,wrapperClass:l,visible:d=!0})=>(0,s.jsx)(n,{style:h,$visible:d,className:`${l}`,"data-testid":"triangle-loading","aria-label":e,...o,children:(0,s.jsx)(c,{id:"triangle",width:i,height:t,xmlns:"http://www.w3.org/2000/svg",viewBox:"-3 -4 39 39","data-testid":"triangle-svg",children:(0,s.jsx)(p,{fill:"transparent",stroke:a,strokeWidth:"1",points:"16,0 32,32 0,32"})})})}}]);