import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{R as u}from"./index-Bc2G9s8g.js";import{c as m}from"./cx-2dOUpm6k.js";/* empty css              */const v=u.forwardRef(({className:d,...o},s)=>e.jsx("div",{ref:s,className:m("panel",d),...o}));v.displayName="Card";const a=u.forwardRef(({label:d,value:o,icon:s,accentColor:k="var(--accent)",links:p,className:A,style:q,...I},T)=>e.jsxs("article",{ref:T,className:m("stat-card",A),style:{"--card-accent":k,...q},...I,children:[e.jsxs("div",{className:"stat-card-head",children:[e.jsx("span",{className:"stat-card-label",children:d}),s?e.jsx("span",{className:"stat-card-icon",children:s}):null]}),e.jsx("div",{className:"stat-card-number",children:o}),p&&p.length>0?e.jsx("div",{className:"stat-card-links",children:p.map((t,E)=>e.jsxs(u.Fragment,{children:[E>0?e.jsx("span",{className:"stat-card-link-sep",children:"·"}):null,e.jsx("button",{type:"button",className:m("stat-card-link",t.active&&"active"),onClick:t.onClick,children:t.label})]},t.label))}):null]}));a.displayName="StatCard";v.__docgenInfo={description:"",methods:[],displayName:"Card"};a.__docgenInfo={description:"",methods:[],displayName:"StatCard",props:{label:{required:!0,tsType:{name:"string"},description:""},value:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},icon:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},accentColor:{required:!1,tsType:{name:"string"},description:'drives --card-accent (icon tint + number color); any CSS color, e.g. "var(--accent)"',defaultValue:{value:'"var(--accent)"',computed:!1}},links:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ label: string; onClick?: () => void; active?: boolean }",signature:{properties:[{key:"label",value:{name:"string",required:!0}},{key:"onClick",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!1}},{key:"active",value:{name:"boolean",required:!1}}]}}],raw:"Array<{ label: string; onClick?: () => void; active?: boolean }>"},description:""}}};const W={title:"Aurora Precision/Card",tags:["autodocs"]},r=()=>e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,children:[e.jsx("path",{d:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"}),e.jsx("circle",{cx:"9",cy:"7",r:"4"}),e.jsx("path",{d:"M23 21v-2a4 4 0 00-3-3.87"}),e.jsx("path",{d:"M16 3.13a4 4 0 010 7.75"})]}),n={render:()=>e.jsx(v,{style:{maxWidth:360},children:e.jsx("p",{style:{margin:0},children:"A generic content card (reuses the panel surface)."})})},c={render:()=>e.jsx("div",{style:{width:260},children:e.jsx(a,{label:"Active Employees",value:128,icon:e.jsx(r,{})})})},l={render:()=>e.jsx("div",{style:{width:260},children:e.jsx(a,{label:"Pending Requests",value:12,icon:e.jsx(r,{}),accentColor:"var(--warning)",links:[{label:"All",active:!0},{label:"Leave"},{label:"Reports"}]})})},i={render:()=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:16,width:720},children:[e.jsx(a,{label:"Active Employees",value:128,icon:e.jsx(r,{})}),e.jsx(a,{label:"On Leave",value:6,icon:e.jsx(r,{}),accentColor:"var(--success)"}),e.jsx(a,{label:"Pending",value:12,icon:e.jsx(r,{}),accentColor:"var(--warning)"})]})};var g,x,C;n.parameters={...n.parameters,docs:{...(g=n.parameters)==null?void 0:g.docs,source:{originalSource:`{
  render: () => <Card style={{
    maxWidth: 360
  }}>\r
      <p style={{
      margin: 0
    }}>A generic content card (reuses the panel surface).</p>\r
    </Card>
}`,...(C=(x=n.parameters)==null?void 0:x.docs)==null?void 0:C.source}}};var y,h,j;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 260
  }}>\r
      <StatCard label="Active Employees" value={128} icon={<UsersIcon />} />\r
    </div>
}`,...(j=(h=c.parameters)==null?void 0:h.docs)==null?void 0:j.source}}};var b,f,S;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 260
  }}>\r
      <StatCard label="Pending Requests" value={12} icon={<UsersIcon />} accentColor="var(--warning)" links={[{
      label: "All",
      active: true
    }, {
      label: "Leave"
    }, {
      label: "Reports"
    }]} />\r
    </div>
}`,...(S=(f=l.parameters)==null?void 0:f.docs)==null?void 0:S.source}}};var w,N,R;i.parameters={...i.parameters,docs:{...(w=i.parameters)==null?void 0:w.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    width: 720
  }}>\r
      <StatCard label="Active Employees" value={128} icon={<UsersIcon />} />\r
      <StatCard label="On Leave" value={6} icon={<UsersIcon />} accentColor="var(--success)" />\r
      <StatCard label="Pending" value={12} icon={<UsersIcon />} accentColor="var(--warning)" />\r
    </div>
}`,...(R=(N=i.parameters)==null?void 0:N.docs)==null?void 0:R.source}}};const G=["GenericCard","StatCardDefault","StatCardWithLinks","StatCardGrid"];export{n as GenericCard,c as StatCardDefault,i as StatCardGrid,l as StatCardWithLinks,G as __namedExportsOrder,W as default};
