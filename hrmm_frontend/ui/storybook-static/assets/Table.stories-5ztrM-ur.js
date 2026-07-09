import{j as r}from"./jsx-runtime-DFAAy_2V.js";import{R as c}from"./index-Bc2G9s8g.js";import{c as y}from"./cx-2dOUpm6k.js";import{S as h}from"./Badge-BMRWJM48.js";const d=c.forwardRef(({className:e,...n},s)=>r.jsx("div",{ref:s,className:y("table-wrap",e),...n}));d.displayName="TableWrap";function p({columns:e,rows:n,rowKey:s,className:u}){return r.jsx(d,{children:r.jsxs("table",{className:u,children:[r.jsx("thead",{children:r.jsx("tr",{children:e.map(t=>r.jsx("th",{children:t.header},t.key))})}),r.jsx("tbody",{children:n.map(t=>r.jsx("tr",{children:e.map(i=>r.jsx("td",{children:i.render(t)},i.key))},s(t)))})]})})}d.__docgenInfo={description:"Horizontal-scroll wrapper — wrap any <table> in this, per .table-wrap.",methods:[],displayName:"TableWrap"};p.__docgenInfo={description:"Thin typed wrapper over the source's bare <table>/<th>/<td> element styling.",methods:[],displayName:"Table",props:{columns:{required:!0,tsType:{name:"Array",elements:[{name:"TableColumn",elements:[{name:"T"}],raw:"TableColumn<T>"}],raw:"TableColumn<T>[]"},description:""},rows:{required:!0,tsType:{name:"Array",elements:[{name:"T"}],raw:"T[]"},description:""},rowKey:{required:!0,tsType:{name:"signature",type:"function",raw:"(row: T) => React.Key",signature:{arguments:[{type:{name:"T"},name:"row"}],return:{name:"ReactKey",raw:"React.Key"}}},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};const f={title:"Aurora Precision/Table",tags:["autodocs"]},w=[{id:1,name:"Jane Doe",department:"Engineering",status:"approved"},{id:2,name:"John Smith",department:"Design",status:"pending"},{id:3,name:"Amy Lee",department:"HR",status:"rejected"}],a={render:()=>r.jsx("div",{style:{width:480},children:r.jsx(p,{rowKey:e=>e.id,rows:w,columns:[{key:"name",header:"Name",render:e=>e.name},{key:"department",header:"Department",render:e=>e.department},{key:"status",header:"Status",render:e=>r.jsx(h,{status:e.status,children:e.status})}]})})};var m,o,l;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 480
  }}>\r
      <Table<Row> rowKey={r => r.id} rows={rows} columns={[{
      key: "name",
      header: "Name",
      render: r => r.name
    }, {
      key: "department",
      header: "Department",
      render: r => r.department
    }, {
      key: "status",
      header: "Status",
      render: r => <StatusPill status={r.status}>{r.status}</StatusPill>
    }]} />\r
    </div>
}`,...(l=(o=a.parameters)==null?void 0:o.docs)==null?void 0:l.source}}};const g=["Default"];export{a as Default,g as __namedExportsOrder,f as default};
