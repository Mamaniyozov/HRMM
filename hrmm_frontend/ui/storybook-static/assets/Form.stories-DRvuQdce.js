import{j as e}from"./jsx-runtime-DFAAy_2V.js";import{R as d}from"./index-Bc2G9s8g.js";import{c as m}from"./cx-2dOUpm6k.js";import{B as F}from"./Button-Ucvy-F8B.js";const c=d.forwardRef(({twoCol:r,className:o,...n},s)=>e.jsx("div",{ref:s,className:m("form-grid",r&&"two-col",o),...n}));c.displayName="FormGrid";const t=({label:r,htmlFor:o,children:n,className:s})=>e.jsxs("label",{htmlFor:o,className:s,children:[e.jsx("span",{children:r}),n]}),a=d.forwardRef((r,o)=>e.jsx("input",{ref:o,...r}));a.displayName="Input";const p=d.forwardRef(({autoGrow:r,className:o,...n},s)=>e.jsx("textarea",{ref:s,className:m(r&&"auto-grow",o),...n}));p.displayName="Textarea";const u=d.forwardRef(({className:r,...o},n)=>e.jsx("div",{ref:n,className:m("form-actions",r),...o}));u.displayName="FormActions";c.__docgenInfo={description:"",methods:[],displayName:"FormGrid",props:{twoCol:{required:!1,tsType:{name:"boolean"},description:"two-column layout, per .form-grid.two-col"}}};t.__docgenInfo={description:"Wraps the source `<label>{span}{control}</label>` pattern used throughout the prototype's forms.",methods:[],displayName:"FormField",props:{label:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},htmlFor:{required:!1,tsType:{name:"string"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};a.__docgenInfo={description:"",methods:[],displayName:"Input"};p.__docgenInfo={description:"",methods:[],displayName:"Textarea",props:{autoGrow:{required:!1,tsType:{name:"boolean"},description:"no inner scrollbar, expands with content — per .auto-grow"}}};u.__docgenInfo={description:"",methods:[],displayName:"FormActions"};const I={title:"Aurora Precision/Form",tags:["autodocs"]},l={render:()=>e.jsxs(c,{style:{maxWidth:360},children:[e.jsx(t,{label:"Full name",children:e.jsx(a,{placeholder:"Jane Doe"})}),e.jsx(t,{label:"Notes",children:e.jsx(p,{autoGrow:!0,placeholder:"Add a note..."})}),e.jsxs(u,{children:[e.jsx(F,{variant:"primary",children:"Save"}),e.jsx(F,{variant:"ghost",children:"Cancel"})]})]})},i={render:()=>e.jsxs(c,{twoCol:!0,style:{maxWidth:520},children:[e.jsx(t,{label:"First name",children:e.jsx(a,{placeholder:"Jane"})}),e.jsx(t,{label:"Last name",children:e.jsx(a,{placeholder:"Doe"})}),e.jsx(t,{label:"Department",children:e.jsxs("select",{children:[e.jsx("option",{children:"Engineering"}),e.jsx("option",{children:"Design"}),e.jsx("option",{children:"HR"})]})}),e.jsx(t,{label:"Start date",children:e.jsx(a,{type:"date"})})]})};var h,x,j;l.parameters={...l.parameters,docs:{...(h=l.parameters)==null?void 0:h.docs,source:{originalSource:`{
  render: () => <FormGrid style={{
    maxWidth: 360
  }}>\r
      <FormField label="Full name">\r
        <Input placeholder="Jane Doe" />\r
      </FormField>\r
      <FormField label="Notes">\r
        <Textarea autoGrow placeholder="Add a note..." />\r
      </FormField>\r
      <FormActions>\r
        <Button variant="primary">Save</Button>\r
        <Button variant="ghost">Cancel</Button>\r
      </FormActions>\r
    </FormGrid>
}`,...(j=(x=l.parameters)==null?void 0:x.docs)==null?void 0:j.source}}};var f,g,y;i.parameters={...i.parameters,docs:{...(f=i.parameters)==null?void 0:f.docs,source:{originalSource:`{
  render: () => <FormGrid twoCol style={{
    maxWidth: 520
  }}>\r
      <FormField label="First name">\r
        <Input placeholder="Jane" />\r
      </FormField>\r
      <FormField label="Last name">\r
        <Input placeholder="Doe" />\r
      </FormField>\r
      <FormField label="Department">\r
        <select>\r
          <option>Engineering</option>\r
          <option>Design</option>\r
          <option>HR</option>\r
        </select>\r
      </FormField>\r
      <FormField label="Start date">\r
        <Input type="date" />\r
      </FormField>\r
    </FormGrid>
}`,...(y=(g=i.parameters)==null?void 0:g.docs)==null?void 0:y.source}}};const T=["SingleColumn","TwoColumn"];export{l as SingleColumn,i as TwoColumn,T as __namedExportsOrder,I as default};
