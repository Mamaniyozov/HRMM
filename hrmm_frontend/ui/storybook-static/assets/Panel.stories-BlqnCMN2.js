import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{R as p}from"./index-Bc2G9s8g.js";import{c as u}from"./cx-2dOUpm6k.js";/* empty css              */import{B as y}from"./Button-Ucvy-F8B.js";const n=p.forwardRef(({className:i,...s},o)=>e.jsx("div",{ref:o,className:u("panel",i),...s}));n.displayName="Panel";const t=p.forwardRef(({inline:i,className:s,...o},x)=>e.jsx("div",{ref:x,className:u("panel-heading",i&&"inline",s),...o}));t.displayName="PanelHeading";n.__docgenInfo={description:"",methods:[],displayName:"Panel"};t.__docgenInfo={description:"",methods:[],displayName:"PanelHeading",props:{inline:{required:!1,tsType:{name:"boolean"},description:"lays the heading out with space-between (title left, actions right)"}}};const w={title:"Aurora Precision/Panel",component:n,tags:["autodocs"]},a={render:()=>e.jsxs(n,{style:{maxWidth:420},children:[e.jsx(t,{children:e.jsx("h3",{style:{margin:0},children:"Panel title"})}),e.jsx("p",{style:{margin:0,color:"var(--text-secondary)"},children:"Panel content goes here — glass surface on the aurora background."})]})},r={render:()=>e.jsxs(n,{style:{maxWidth:420},children:[e.jsxs(t,{inline:!0,children:[e.jsx("h3",{style:{margin:0},children:"Recent activity"}),e.jsx(y,{variant:"ghost",children:"View all"})]}),e.jsx("p",{style:{margin:0,color:"var(--text-secondary)"},children:"Inline heading pairs a title with a right-aligned action."})]})};var l,c,d;a.parameters={...a.parameters,docs:{...(l=a.parameters)==null?void 0:l.docs,source:{originalSource:`{
  render: () => <Panel style={{
    maxWidth: 420
  }}>\r
      <PanelHeading>\r
        <h3 style={{
        margin: 0
      }}>Panel title</h3>\r
      </PanelHeading>\r
      <p style={{
      margin: 0,
      color: "var(--text-secondary)"
    }}>\r
        Panel content goes here — glass surface on the aurora background.\r
      </p>\r
    </Panel>
}`,...(d=(c=a.parameters)==null?void 0:c.docs)==null?void 0:d.source}}};var m,h,g;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  render: () => <Panel style={{
    maxWidth: 420
  }}>\r
      <PanelHeading inline>\r
        <h3 style={{
        margin: 0
      }}>Recent activity</h3>\r
        <Button variant="ghost">View all</Button>\r
      </PanelHeading>\r
      <p style={{
      margin: 0,
      color: "var(--text-secondary)"
    }}>\r
        Inline heading pairs a title with a right-aligned action.\r
      </p>\r
    </Panel>
}`,...(g=(h=r.parameters)==null?void 0:h.docs)==null?void 0:g.source}}};const R=["Default","WithInlineHeadingActions"];export{a as Default,r as WithInlineHeadingActions,R as __namedExportsOrder,w as default};
