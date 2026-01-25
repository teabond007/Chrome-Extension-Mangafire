var V=Object.defineProperty;var X=(r,e,t)=>e in r?V(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var $=(r,e,t)=>(X(r,typeof e!="symbol"?e+"":e,t),t);import{o as f,c as y,a as m,n as z,w as C,F as U,b as T,t as R,d as G,e as b,r as W,f as J,g as Q,h as A}from"./runtime-dom.esm-bundler-7bf71c36.js";import{_ as q}from"./_plugin-vue_export-helper-c27b6911.js";const Z={Reading:"#4ade80",Completed:"#60a5fa","Plan to Read":"#fbbf24","On-Hold":"#f97316","On Hold":"#f97316",Dropped:"#ef4444","Re-reading":"#a855f7",HasHistory:"#9ca3af"};const ee=["data-entry-id"],te=["title"],re=["title"],ae=["title"],oe={__name:"QuickActions",props:{entry:{type:Object,required:!0},adapter:{type:Object,required:!0},callbacks:{type:Object,default:()=>({})}},emits:["action"],setup(r,{emit:e}){const t=r,o=e,a=b(()=>(parseFloat(t.entry.lastReadChapter)||0)>0),n=b(()=>t.adapter.unitName==="episode"?"Ep.":"Ch."),i=b(()=>{const d=parseFloat(t.entry.lastReadChapter)||0;return Math.floor(d)+1}),s=b(()=>a.value?`Continue ${n.value} ${i.value}`:`Start Reading ${n.value} 1`),l=b(()=>{var d;return((d=t.entry.personalData)==null?void 0:d.rating)||0}),c=b(()=>{const d={reading:"#4ade80",completed:"#60a5fa","plan to read":"#fbbf24",planning:"#fbbf24","on-hold":"#f97316","on hold":"#f97316",dropped:"#ef4444","re-reading":"#a855f7",rereading:"#a855f7"},h=(t.entry.status||"").toLowerCase().trim();return d[h]||"rgba(255,255,255,0.3)"}),u=(d,h)=>{t.callbacks[d]&&t.callbacks[d](t.entry,h==null?void 0:h.currentTarget),o("action",{action:d,entry:t.entry,target:h==null?void 0:h.currentTarget})};return(d,h)=>(f(),y("div",{class:"bmh-quick-tooltip","data-entry-id":r.entry.slug||r.entry.id||""},[m("button",{class:"bmh-tt-btn bmh-tt-status",onClick:h[0]||(h[0]=C(g=>u("status",g),["stop","prevent"])),title:r.entry.status||"Set Status",style:z({"--status-color":c.value})},[m("span",{class:"bmh-tt-status-dot",style:z({background:c.value})},null,4)],12,te),r.entry.status&&r.entry.status!=="Add to Library"?(f(),y(U,{key:0},[m("button",{class:T(["bmh-tt-btn bmh-tt-continue",{"bmh-btn-disabled":!a.value}]),onClick:h[1]||(h[1]=C(g=>u("continue",g),["stop","prevent"])),title:s.value}," ▶ ",10,re),m("button",{class:"bmh-tt-btn bmh-tt-rating",onClick:h[2]||(h[2]=C(g=>u("rating",g),["stop","prevent"])),title:`Rating: ${l.value}/10`},R(l.value>0?l.value:"★"),9,ae),m("button",{class:"bmh-tt-btn bmh-tt-info",onClick:h[3]||(h[3]=C(g=>u("details",g),["stop","prevent"])),title:"View Details"},[...h[4]||(h[4]=[m("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":"2.5","stroke-linecap":"round","stroke-linejoin":"round"},[m("circle",{cx:"12",cy:"12",r:"10"}),m("line",{x1:"12",y1:"16",x2:"12",y2:"12"}),m("line",{x1:"12",y1:"8",x2:"12.01",y2:"8"})],-1)])])],64)):G("",!0)],8,ee))}},ne=q(oe,[["__scopeId","data-v-b79acebb"]]);const se={class:"bmh-picker-options"},ie=["onClick"],le={__name:"StatusPicker",props:{entry:{type:Object,required:!0},customStatuses:{type:Array,default:()=>[]},onSelect:{type:Function,default:null}},emits:["select"],setup(r,{emit:e}){const t=r,o=e,a=[{name:"Reading",color:"#4ade80"},{name:"Completed",color:"#60a5fa"},{name:"Plan to Read",color:"#fbbf24"},{name:"On-Hold",color:"#f97316"},{name:"Dropped",color:"#ef4444"},{name:"Re-reading",color:"#a855f7"}],n=b(()=>[...a,...t.customStatuses]),i=s=>{t.onSelect&&t.onSelect(s,t.entry),o("select",s)};return(s,l)=>(f(),y("div",{class:"bmh-status-picker",onClick:l[0]||(l[0]=C(()=>{},["stop"]))},[l[1]||(l[1]=m("div",{class:"bmh-picker-header"},"Change Status",-1)),m("div",se,[(f(!0),y(U,null,W(n.value,c=>(f(),y("button",{key:c.name,class:T(["bmh-picker-option",{active:r.entry.status===c.name}]),onClick:u=>i(c.name)},[m("span",{class:"bmh-picker-dot",style:z({background:c.color})},null,4),J(" "+R(c.name),1)],10,ie))),128))])]))}},ce=q(le,[["__scopeId","data-v-40c15120"]]);const de={class:"bmh-rating-grid"},ue=["onMouseenter","onClick"],he={__name:"RatingPicker",props:{entry:{type:Object,required:!0},onSelect:{type:Function,default:null}},emits:["select"],setup(r,{emit:e}){const t=r,o=e,a=Q(0),n=b(()=>{var s;return((s=t.entry.personalData)==null?void 0:s.rating)||0}),i=s=>{t.onSelect&&t.onSelect(s,t.entry),o("select",s)};return(s,l)=>(f(),y("div",{class:"bmh-rating-picker",onClick:l[2]||(l[2]=C(()=>{},["stop"]))},[l[3]||(l[3]=m("div",{class:"bmh-picker-header"},"Rate (1-10)",-1)),m("div",de,[(f(),y(U,null,W(10,c=>m("button",{key:c,class:T(["bmh-rating-num",{active:c===n.value,hovered:c<=a.value}]),onMouseenter:u=>a.value=c,onMouseleave:l[0]||(l[0]=u=>a.value=0),onClick:u=>i(c)},R(c),43,ue)),64))]),m("button",{class:"bmh-rating-clear",onClick:l[1]||(l[1]=c=>i(0))},"Clear")]))}},pe=q(he,[["__scopeId","data-v-cab7d0ad"]]);const me={__name:"StatusBadge",props:{text:{type:String,required:!0},type:{type:String,default:"progress"},position:{type:Object,default:()=>({})}},setup(r){const e=r,t=b(()=>{const o={...e.position};return Object.keys(o).length?o:e.type==="new"?{top:"4px",right:"4px"}:{bottom:"4px",left:"4px"}});return(o,a)=>(f(),y("div",{class:T(["bmh-badge",[`bmh-badge-${r.type}`]]),style:z(t.value)},R(r.text),7))}},ge=q(me,[["__scopeId","data-v-7c094370"]]);const be={class:"bmh-as-speed-control"},fe=["value"],ye={class:"bmh-as-speed-value"},xe={__name:"ReaderControls",props:{initialSpeed:{type:Number,default:50},isRunning:{type:Boolean,default:!1}},emits:["toggle","speed-change"],setup(r,{emit:e}){const t=r,o=e,a=Q(t.initialSpeed),n=()=>{o("toggle")},i=s=>{const l=parseInt(s.target.value);a.value=l,o("speed-change",l)};return(s,l)=>(f(),y("div",{class:"bmh-autoscroll-panel",onClick:l[0]||(l[0]=C(()=>{},["stop"]))},[m("button",{class:T(["bmh-as-toggle",{active:r.isRunning}]),type:"button",onClick:n},R(r.isRunning?"⏸ Stop":"▶ Start"),3),m("div",be,[l[1]||(l[1]=m("span",{class:"bmh-as-label"},"Speed:",-1)),m("input",{type:"range",class:"bmh-as-speed",min:"20",max:"200",value:a.value,onInput:i},null,40,fe),m("span",ye,R(a.value),1)])]))}},ve=q(xe,[["__scopeId","data-v-034a957b"]]);class p{static mountStatusPicker(e,t,o,a){document.querySelectorAll(".bmh-vue-picker-container").forEach(g=>g.remove());const n=document.createElement("div");n.className="bmh-vue-picker-container bmh-vue-status-picker",document.body.appendChild(n);const i=n.attachShadow({mode:"open"}),s=document.createElement("div");i.appendChild(s);const l=document.createElement("style");l.textContent=`
            .bmh-status-picker {
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px);
                animation: bmh-picker-slide 0.2s ease-out;
                font-family: sans-serif;
            }
            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .bmh-picker-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .bmh-picker-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: left;
            }
            .bmh-picker-option:hover { background: rgba(255, 255, 255, 0.1); }
            .bmh-picker-option.active { background: rgba(255, 255, 255, 0.15); }
            .bmh-picker-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }
        `,i.appendChild(l);const c=e.getBoundingClientRect();n.style.position="fixed",n.style.left=`${c.left}px`,n.style.top=`${c.bottom+8}px`,n.style.zIndex="10000";let u;const d=()=>{h.unmount(),n.remove(),u&&document.removeEventListener("click",u)},h=A(ce,{entry:t,customStatuses:o,onSelect:g=>{a(g,t),d()}});return u=g=>{!n.contains(g.target)&&!e.contains(g.target)&&d()},setTimeout(()=>document.addEventListener("click",u),0),h.mount(s)}static mountRatingPicker(e,t,o){document.querySelectorAll(".bmh-vue-picker-container").forEach(h=>h.remove());const a=document.createElement("div");a.className="bmh-vue-picker-container bmh-vue-rating-picker",document.body.appendChild(a);const n=a.attachShadow({mode:"open"}),i=document.createElement("div");n.appendChild(i);const s=document.createElement("style");s.textContent=`
            .bmh-rating-picker {
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px);
                animation: bmh-picker-slide 0.2s ease-out;
                font-family: sans-serif;
            }
            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
            .bmh-rating-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 10px;
            }
            .bmh-rating-num {
                width: 36px;
                height: 36px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                background: transparent;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .bmh-rating-num:hover, .bmh-rating-num.hovered {
                background: rgba(251, 191, 36, 0.3);
                border-color: #fbbf24;
                color: #fbbf24;
            }
            .bmh-rating-num.active {
                background: #fbbf24;
                border-color: #fbbf24;
                color: #000;
            }
            .bmh-rating-clear {
                width: 100%;
                padding: 8px;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .bmh-rating-clear:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        `,n.appendChild(s);const l=e.getBoundingClientRect();a.style.position="fixed",a.style.left=`${l.left}px`,a.style.top=`${l.bottom+8}px`,a.style.zIndex="10000";let c;const u=()=>{d.unmount(),a.remove(),c&&document.removeEventListener("click",c)},d=A(pe,{entry:t,onSelect:h=>{o(h,t),u()}});return c=h=>{!a.contains(h.target)&&!e.contains(h.target)&&u()},setTimeout(()=>document.addEventListener("click",c),0),d.mount(i)}static mountStatusBadge(e,t,o="progress",a={}){const n=document.createElement("div");n.className="bmh-vue-badge-container",e.appendChild(n);const i=n.attachShadow({mode:"open"}),s=document.createElement("div");i.appendChild(s);const l=document.createElement("style");return l.textContent=`
            .bmh-badge {
                position: absolute;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 700;
                color: white;
                z-index: 50;
                pointer-events: none;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                font-family: sans-serif;
            }
            .bmh-badge-progress {
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .bmh-badge-new {
                background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                animation: bmh-pulse 2s infinite;
            }
            @keyframes bmh-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
        `,i.appendChild(l),A(ge,{text:t,type:o,position:a}).mount(s)}static mountReaderControls(e,t){const o=document.querySelector(".bmh-vue-reader-container");o&&o.remove();const a=document.createElement("div");a.className="bmh-vue-reader-container",document.body.appendChild(a);const n=a.attachShadow({mode:"open"}),i=document.createElement("div");n.appendChild(i);const s=document.createElement("style");s.textContent=`
            .bmh-autoscroll-panel {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 10px 14px;
                color: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                pointer-events: auto;
            }
            .bmh-as-toggle {
                background: #4f46e5;
                color: white;
                border: none;
                padding: 8px 14px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                min-width: 70px;
                transition: background 0.2s;
            }
            .bmh-as-toggle:hover { background: #4338ca; }
            .bmh-as-toggle.active { background: #dc2626; }
            .bmh-as-toggle.active:hover { background: #b91c1c; }
            .bmh-as-speed-control {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .bmh-as-label { color: rgba(255, 255, 255, 0.7); font-size: 11px; }
            .bmh-as-speed {
                width: 60px;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
            }
            .bmh-as-speed::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
            }
            .bmh-as-speed-value { color: rgba(255, 255, 255, 0.9); font-size: 11px; min-width: 24px; }
        `,n.appendChild(s),a.style.position="fixed",a.style.bottom="20px",a.style.right="20px",a.style.zIndex="2147483647";const l=A(ve,{initialSpeed:e.speed,isRunning:e.isRunning});return l.config.globalProperties.$onToggle=t.onToggle,l.config.globalProperties.$onSpeedChange=t.onSpeedChange,{app:l,vm:l.mount(i),container:a}}static mountQuickActions(e,t,o,a={}){const n=document.createElement("div");n.className="bmh-vue-container",e.appendChild(n);const i=n.attachShadow({mode:"open"}),s=document.createElement("div");i.appendChild(s);const l=document.createElement("style");l.textContent=`
            .bmh-quick-tooltip {
                display: flex;
                gap: 6px;
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 100;
                opacity: 0;
                transform: translateY(-8px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                pointer-events: none;
            }
            :host(:hover) .bmh-quick-tooltip,
            :host-context([data-bmh-enhanced]:hover) .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .bmh-tt-btn {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: rgba(15, 15, 20, 0.95);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                backdrop-filter: blur(12px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 0;
            }
            .bmh-tt-btn:hover {
                transform: translateY(-2px) scale(1.05);
                background: rgba(30, 30, 40, 0.95);
                border-color: rgba(255,255,255,0.2);
                box-shadow: 0 6px 16px rgba(0,0,0,0.6);
            }
            .bmh-tt-continue {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .bmh-tt-continue.bmh-btn-disabled {
                background: rgba(60, 60, 70, 0.8);
                opacity: 0.5;
                filter: grayscale(1);
                box-shadow: none;
                cursor: not-allowed;
            }
            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                box-shadow: 0 0 8px var(--status-color);
            }
            .bmh-tt-rating {
                font-weight: 700;
                color: #fbbf24;
            }
            .bmh-tt-info {
                color: #60a5fa;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent !important;
                box-shadow: none !important;
                border-color: transparent !important;
            }
            .bmh-tt-info svg {
                width: 20px;
                height: 20px;
                display: block;
            }
        `,i.appendChild(l);const c=A(ne,{entry:t,adapter:o,callbacks:a});return c.mount(s),c}static create(e,t,o={}){var d;const a=document.createElement("div");a.className="bmh-quick-tooltip",a.dataset.entryId=e.slug||e.id||"";const n=t.unitName==="episode"?"Ep.":"Ch.",i=parseFloat(e.lastReadChapter)||0,s=p.calculateNextChapter(e),l=p.getStatusColor(e.status),c=((d=e.personalData)==null?void 0:d.rating)||0,u=i>0;return a.innerHTML=`
            <button class="bmh-tt-btn bmh-tt-continue ${u?"":"bmh-btn-disabled"}" 
                    data-action="continue" 
                    title="${u?`Continue ${n} ${s}`:`Start Reading ${n} 1`}">
                ▶
            </button>
            <button class="bmh-tt-btn bmh-tt-status" data-action="status" title="${e.status||"Set Status"}" style="--status-color: ${l}">
                <span class="bmh-tt-status-dot" style="background: ${l}"></span>
            </button>
            <button class="bmh-tt-btn bmh-tt-rating" data-action="rating" title="Rating: ${c}/10">
                ${c>0?c:"★"}
            </button>
            <button class="bmh-tt-btn bmh-tt-info" data-action="details" title="View Details">
                ℹ
            </button>
        `,p.attachEventListeners(a,e,o),a}static createExpanded(e,t,o={}){var l;const a=document.createElement("div");a.className="bmh-quick-actions bmh-qa-expanded",a.dataset.entryId=e.slug||e.id||"";const n=t.unitName==="episode"?"Ep.":"Ch.",i=p.calculateNextChapter(e),s=((l=e.personalData)==null?void 0:l.rating)||0;return a.innerHTML=`
            <div class="bmh-qa-content">
                <button class="bmh-qa-btn bmh-qa-continue" data-action="continue" title="Continue to ${n} ${i}">
                    <span class="bmh-qa-icon">▶</span>
                    Continue ${n} ${i}
                </button>
                <button class="bmh-qa-btn bmh-qa-status" data-action="status" title="Change reading status">
                    <span class="bmh-qa-status-indicator" style="background: ${p.getStatusColor(e.status)}"></span>
                    ${e.status||"Add to Library"}
                </button>
                <div class="bmh-qa-row">
                    <div class="bmh-qa-rating" data-action="rating" title="Rate (${s}/10)">
                        ${p.renderRatingBadge(s)}
                    </div>
                    <button class="bmh-qa-btn bmh-qa-details" data-action="details" title="View details">
                        <span class="bmh-qa-icon">ℹ️</span>
                    </button>
                </div>
            </div>
        `,p.attachEventListeners(a,e,o),a}static attachEventListeners(e,t,o){e.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation(),n.preventDefault();const i=a.dataset.action;o[i]&&o[i](t,a,n)})})}static calculateNextChapter(e){const t=parseFloat(e.lastReadChapter)||0;return Math.floor(t)+1}static renderRatingBadge(e){return!e||e<=0?'<span class="bmh-rating-badge bmh-rating-empty">-</span>':`<span class="bmh-rating-badge">${e}/10</span>`}static getStatusColor(e){const t={reading:"#4ade80",completed:"#60a5fa","plan to read":"#fbbf24",planning:"#fbbf24","on-hold":"#f97316","on hold":"#f97316",dropped:"#ef4444","re-reading":"#a855f7",rereading:"#a855f7"},o=(e||"").toLowerCase().trim();return t[o]||"rgba(255,255,255,0.3)"}static createStatusPicker(e,t,o=[]){const a=document.createElement("div");a.className="bmh-status-picker";const i=[...[{name:"Reading",color:"#4ade80"},{name:"Completed",color:"#60a5fa"},{name:"Plan to Read",color:"#fbbf24"},{name:"On-Hold",color:"#f97316"},{name:"Dropped",color:"#ef4444"},{name:"Re-reading",color:"#a855f7"}],...o];return a.innerHTML=`
            <div class="bmh-picker-header">Change Status</div>
            <div class="bmh-picker-options">
                ${i.map(s=>`
                    <button class="bmh-picker-option ${e.status===s.name?"active":""}" 
                            data-status="${s.name}">
                        <span class="bmh-picker-dot" style="background: ${s.color}"></span>
                        ${s.name}
                    </button>
                `).join("")}
            </div>
        `,a.querySelectorAll("[data-status]").forEach(s=>{s.addEventListener("click",l=>{l.stopPropagation(),t==null||t(s.dataset.status,e),a.remove()})}),p.autoCloseOnOutsideClick(a),a}static createRatingPicker(e,t){var i;const o=document.createElement("div");o.className="bmh-rating-picker";const a=((i=e.personalData)==null?void 0:i.rating)||0;o.innerHTML=`
            <div class="bmh-picker-header">Rate (1-10)</div>
            <div class="bmh-rating-grid">
                ${[1,2,3,4,5,6,7,8,9,10].map(s=>`
                    <button class="bmh-rating-num ${s===a?"active":""}" 
                            data-rating="${s}">
                        ${s}
                    </button>
                `).join("")}
            </div>
            <button class="bmh-rating-clear" data-rating="0">Clear</button>
        `;const n=o.querySelectorAll(".bmh-rating-num");return n.forEach((s,l)=>{s.addEventListener("mouseenter",()=>{n.forEach((c,u)=>{c.classList.toggle("hovered",u<=l)})})}),o.querySelector(".bmh-rating-grid").addEventListener("mouseleave",()=>{n.forEach(s=>s.classList.remove("hovered"))}),o.querySelectorAll("[data-rating]").forEach(s=>{s.addEventListener("click",l=>{l.stopPropagation();const c=parseInt(s.dataset.rating);t==null||t(c,e),o.remove()})}),p.autoCloseOnOutsideClick(o),o}static autoCloseOnOutsideClick(e){setTimeout(()=>{const t=o=>{e.contains(o.target)||(e.remove(),document.removeEventListener("click",t))};document.addEventListener("click",t)},0)}static injectStyles(){if(document.getElementById("bmh-overlay-styles"))return;const e=document.createElement("style");e.id="bmh-overlay-styles",e.textContent=`
            /* ===== COMPACT TOOLTIP ===== */
            .bmh-quick-tooltip {
                position: absolute;
                top: 8px;
                right: 8px;
                display: flex;
                gap: 4px;
                opacity: 0;
                transform: translateY(-8px);
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                z-index: 60;
                pointer-events: none;
            }

            [data-bmh-enhanced]:hover .bmh-quick-tooltip {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }

            .bmh-tt-btn {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 8px;
                background: rgba(15, 15, 20, 0.9);
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                backdrop-filter: blur(12px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }

            .bmh-tt-btn:hover {
                transform: translateY(-2px) scale(1.05);
                background: rgba(30, 30, 40, 0.95);
                border-color: rgba(255,255,255,0.2);
                box-shadow: 0 6px 16px rgba(0,0,0,0.6);
            }

            .bmh-tt-continue {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            .bmh-tt-continue.bmh-btn-disabled {
                background: rgba(60, 60, 70, 0.8);
                opacity: 0.5;
                filter: grayscale(1);
                box-shadow: none;
                cursor: not-allowed;
            }

            .bmh-tt-continue:not(.bmh-btn-disabled):hover {
                background: linear-gradient(135deg, #10b981, #059669);
            }

            .bmh-tt-status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                box-shadow: 0 0 8px var(--status-color);
            }

            .bmh-tt-rating {
                font-weight: 700;
                color: #fbbf24;
            }

            .bmh-tt-info {
                color: #60a5fa;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }
            .bmh-tt-info svg {
                width: 20px;
                height: 20px;
                display: block;
            }

            /* ===== PICKERS (Status & Rating) ===== */
            .bmh-status-picker,
            .bmh-rating-picker {
                position: fixed;
                background: rgba(20, 20, 25, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 12px;
                padding: 12px;
                min-width: 180px;
                z-index: 10000;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(16px);
                animation: bmh-picker-slide 0.2s ease-out;
            }

            @keyframes bmh-picker-slide {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            .bmh-picker-header {
                font-size: 11px;
                color: rgba(255, 255, 255, 0.5);
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                margin-bottom: 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .bmh-picker-options {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .bmh-picker-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: transparent;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: left;
            }

            .bmh-picker-option:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .bmh-picker-option.active {
                background: rgba(255, 255, 255, 0.15);
            }

            .bmh-picker-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            /* Rating Grid (1-10) */
            .bmh-rating-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 6px;
                margin-bottom: 10px;
            }

            .bmh-rating-num {
                width: 36px;
                height: 36px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                background: transparent;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-num:hover,
            .bmh-rating-num.hovered {
                background: rgba(251, 191, 36, 0.3);
                border-color: #fbbf24;
                color: #fbbf24;
            }

            .bmh-rating-num.active {
                background: #fbbf24;
                border-color: #fbbf24;
                color: #000;
            }

            .bmh-rating-clear {
                width: 100%;
                padding: 8px;
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .bmh-rating-clear:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #fff;
            }

            /* Rating Badge */
            .bmh-rating-badge {
                color: #fbbf24;
                font-weight: 600;
                font-size: 13px;
            }

            .bmh-rating-empty {
                opacity: 0.5;
            }

            /* Animation keyframes */
            @keyframes bmh-pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
            }
        `,document.head.appendChild(e)}static injectPickerStyles(){p.injectStyles()}}const ke=Object.freeze(Object.defineProperty({__proto__:null,OverlayFactory:p,default:p},Symbol.toStringTag,{value:"Module"}));class B{constructor(e,t={}){$(this,"adapter");$(this,"settings");this.adapter=e,this.settings={highlighting:t.highlighting!==!1,progressBadges:t.progressBadges!==!1,quickActions:t.quickActions===!0,newChapterBadges:t.newChapterBadges===!0,border:{size:t.CustomBorderSize||4,style:t.borderStyle||"solid",radius:"8px"},customBookmarks:t.customBookmarks||[],customBookmarksEnabled:t.CustomBookmarksfeatureEnabled||!1}}async enhanceAll(){try{const e=this.findCards(),t=await this.loadLibrary();let o=0;for(const a of e)try{if(a.element.dataset.bmhEnhanced)continue;const n=this.findMatch(a,t);if(n)this.applyEnhancements(a,n);else if(this.settings.quickActions){const i={title:a.data.title,slug:a.data.id,status:"Add to Library",source:this.adapter.id,sourceId:a.data.id,sourceUrl:a.data.url};this.applyQuickActions(a,i)}a.element.dataset.bmhEnhanced="true",o++}catch(n){console.error("[CardEnhancer] Error enhancing card:",n,a)}return o}catch(e){return console.error("[CardEnhancer] Global enhancement error:",e),0}}findCards(){const e=this.adapter.selectors.card;return e?Array.from(document.querySelectorAll(e)).map(t=>({element:t,data:this.adapter.extractCardData(t)})).filter(t=>t.data.title||t.data.id):[]}async loadLibrary(){return new Promise(e=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks","savedReadChapters"],t=>{if(chrome.runtime.lastError){e([]);return}const o=Array.isArray(t.savedEntriesMerged)?t.savedEntriesMerged:[],a=Array.isArray(t.userBookmarks)?t.userBookmarks:[],n=t.savedReadChapters||{},i=new Map;[...a,...o].forEach(s=>{if(s!=null&&s.title){const l=this.findHistoryKey(s.title,s.slug,n),c=l?n[l]:[];s.readChapters=c,s.lastReadChapter=this.getHighestChapter(c),i.set(s.title,s)}}),e(Array.from(i.values()))})})}findHistoryKey(e,t,o){if(!o)return null;if(t){const n=`${this.adapter.PREFIX||""}${t}`;if(o[n])return n;if(o[t])return t;if(t.includes(".")){const i=t.substring(0,t.lastIndexOf("."));if(o[i])return i}}if(o[e])return e;const a=this.normalizeTitle(e);for(const n of Object.keys(o))if(this.normalizeTitle(n)===a)return n;return null}findMatch(e,t){const o=t.find(n=>n.source===this.adapter.id&&n.sourceId===e.data.id);if(o)return o;const a=this.normalizeTitle(e.data.title);return t.find(n=>this.normalizeTitle(n.title)===a)}applyEnhancements(e,t){var o;this.settings.highlighting&&this.applyBorder(e,t),this.settings.progressBadges&&(((o=t.readChapters)==null?void 0:o.length)||0)>0&&this.applyProgressBadge(e,t),this.settings.newChapterBadges&&t.hasNewChapters&&this.applyNewBadge(e),this.settings.quickActions&&this.applyQuickActions(e,t)}applyBorder(e,t){const o=(t.status||"").trim().toLowerCase();if(!o||o==="add to library")return;let a="",n=this.settings.border.style;const i=Object.entries(Z);for(const[s,l]of i)if(o===s.toLowerCase()||o.includes(s.toLowerCase())){a=l;break}if(this.settings.customBookmarksEnabled&&this.settings.customBookmarks&&this.settings.customBookmarks.forEach(s=>{s.name&&o.includes(s.name.toLowerCase())&&(a=s.color,n=s.style||"solid")}),!!a)if(this.adapter.applyBorder)this.adapter.applyBorder(e.element,a,this.settings.border.size,n);else{const s=e.element.closest("li")||e.element;s.style.setProperty("border",`${this.settings.border.size}px ${n} ${a}`,"important"),s.style.setProperty("border-radius",this.settings.border.radius,"important"),s.style.setProperty("box-sizing","border-box","important")}}applyProgressBadge(e,t){var s,l,c;const o=this.adapter.unitName==="episode"?"Ep.":"Ch.",a=t.chapters||((s=t.anilistData)==null?void 0:s.chapters),n=a?`${o} ${t.lastReadChapter}/${a}`:`${o} ${t.lastReadChapter}+`,i=((c=(l=this.adapter).getBadgePosition)==null?void 0:c.call(l))||{bottom:"4px",left:"4px"};p.mountStatusBadge(e.element,n,"progress",i)}applyNewBadge(e){p.mountStatusBadge(e.element,"NEW","new")}applyQuickActions(e,t){const o={continue:a=>this.handleContinueReading(a,e),status:(a,n)=>this.handleStatusChange(a,n||null,e),rating:(a,n)=>this.handleRatingChange(a,n||null,e),details:a=>this.handleViewDetails(a,e)};p.mountQuickActions(e.element,t,this.adapter,o),e.element.style.position="relative"}handleContinueReading(e,t){var n,i;const o=p.calculateNextChapter(e),a=(i=(n=this.adapter).buildChapterUrl)==null?void 0:i.call(n,e,o);a?window.location.href=a:e.mangafireUrl||e.sourceUrl?window.location.href=e.mangafireUrl||e.sourceUrl||"":t.data.url?window.location.href=t.data.url:console.log("[CardEnhancer] No URL available for continue reading:",e)}handleStatusChange(e,t,o){p.mountStatusPicker(t,e,this.settings.customBookmarks,(a,n)=>this.saveStatusChange(n,a))}handleRatingChange(e,t,o){p.mountRatingPicker(t,e,(a,n)=>this.saveRatingChange(n,a))}handleViewDetails(e,t){if(this.adapter.handleViewDetails){this.adapter.handleViewDetails(e,t);return}chrome.runtime.sendMessage({type:"showMangaDetails",title:e.title},()=>{chrome.runtime.lastError&&console.log("[CardEnhancer] Error opening details:",chrome.runtime.lastError)})}async saveStatusChange(e,t){try{const o=await new Promise(l=>{chrome.storage.local.get(["savedEntriesMerged","userBookmarks"],l)}),a=o.savedEntriesMerged||[],n=o.userBookmarks||[],i=a.findIndex(l=>this.normalizeTitle(l.title)===this.normalizeTitle(e.title));i!==-1&&(a[i].status=t);const s=n.findIndex(l=>this.normalizeTitle(l.title)===this.normalizeTitle(e.title));if(s!==-1)n[s].status=t;else if(i===-1){const l={...e,status:t,lastUpdated:Date.now()};n.push(l),console.log(`[CardEnhancer] Added new entry to library: ${e.title}`)}await new Promise(l=>{chrome.storage.local.set({savedEntriesMerged:a,userBookmarks:n},l)}),console.log(`[CardEnhancer] Status updated: ${e.title} → ${t}`),setTimeout(()=>{document.querySelectorAll("[data-bmh-enhanced]").forEach(l=>{l.removeAttribute("data-bmh-enhanced"),l.querySelectorAll(".bmh-vue-container, .bmh-vue-badge-container").forEach(c=>c.remove())}),this.enhanceAll()},100)}catch(o){console.error("[CardEnhancer] Failed to save status:",o)}}async saveRatingChange(e,t){try{const a=(await new Promise(i=>{chrome.storage.local.get(["savedEntriesMerged"],i)})).savedEntriesMerged||[],n=a.findIndex(i=>this.normalizeTitle(i.title)===this.normalizeTitle(e.title));n!==-1&&(a[n].personalData||(a[n].personalData={}),a[n].personalData.rating=t,await new Promise(i=>{chrome.storage.local.set({savedEntriesMerged:a},i)}),console.log(`[CardEnhancer] Rating updated: ${e.title} → ${t}`))}catch(o){console.error("[CardEnhancer] Failed to save rating:",o)}}normalizeTitle(e){return e?e.toLowerCase().replace(/[^a-z0-9]/g,""):""}getHighestChapter(e){if(!e||e.length===0)return 0;let t=0;return e.forEach(o=>{const a=String(o).match(/^(\d+\.?\d*)/);if(a){const n=parseFloat(a[1]);n>t&&(t=n)}}),t}}const we="modulepreload",Ce=function(r){return"/"+r},F={},Se=function(e,t,o){if(!t||t.length===0)return e();const a=document.getElementsByTagName("link");return Promise.all(t.map(n=>{if(n=Ce(n),n in F)return;F[n]=!0;const i=n.endsWith(".css"),s=i?'[rel="stylesheet"]':"";if(!!o)for(let u=a.length-1;u>=0;u--){const d=a[u];if(d.href===n&&(!i||d.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${n}"]${s}`))return;const c=document.createElement("link");if(c.rel=i?"stylesheet":we,i||(c.as="script",c.crossOrigin=""),c.href=n,document.head.appendChild(c),i)return new Promise((u,d)=>{c.addEventListener("load",u),c.addEventListener("error",()=>d(new Error(`Unable to preload CSS for ${n}`)))})})).then(()=>e()).catch(n=>{const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=n,window.dispatchEvent(i),!i.defaultPrevented)throw n})};class Ee{constructor(e={}){this.speed=e.speed||50,this.isRunning=!1,this.intervalId=null,this.showPanel=e.showPanel!==!1,this.panel=null,this.vueApp=null,this.adapter=e.adapter||null,this.scrollTarget=null,this.lastScrollPos=-1,this.stuckCount=0}findScrollTarget(){const e=["#chapter-reader",".chapter-content",".reader-content",".reading-content","#content",".manga-reader",".read-container","main","article",".container"];for(const n of e){const i=document.querySelector(n);if(i){const s=window.getComputedStyle(i);if((s.overflow==="auto"||s.overflow==="scroll"||s.overflowY==="auto"||s.overflowY==="scroll")&&i.scrollHeight>i.clientHeight)return{element:i,useElement:!0}}}const t=document.documentElement;if(document.body.scrollHeight>window.innerHeight||t.scrollHeight>window.innerHeight)return{element:window,useElement:!1};const a=document.querySelectorAll("*");for(const n of a)if(n.scrollHeight>n.clientHeight+100){const i=window.getComputedStyle(n);if(i.overflow==="auto"||i.overflow==="scroll"||i.overflowY==="auto"||i.overflowY==="scroll")return{element:n,useElement:!0}}return{element:window,useElement:!1}}getScrollPos(){return this.scrollTarget.useElement?this.scrollTarget.element.scrollTop:window.scrollY||window.pageYOffset||document.documentElement.scrollTop}doScroll(e){this.scrollTarget.useElement?this.scrollTarget.element.scrollTop+=e:window.scrollBy(0,e)}start(){if(this.isRunning)return;this.scrollTarget=this.findScrollTarget(),this.isRunning=!0,this.lastScrollPos=this.getScrollPos(),this.stuckCount=0;const e=this.speed/60;this.intervalId=setInterval(()=>{if(!this.isRunning){this.stop();return}this.doScroll(e);const t=this.getScrollPos();if(Math.abs(t-this.lastScrollPos)<.1){if(this.stuckCount++,this.stuckCount>60){this.stop();return}}else this.stuckCount=0;this.lastScrollPos=t},1e3/60),this.updatePanelState()}stop(){this.intervalId&&(clearInterval(this.intervalId),this.intervalId=null),this.isRunning=!1,this.updatePanelState()}toggle(){this.isRunning?this.stop():this.start()}setSpeed(e){this.speed=Math.max(10,Math.min(300,e)),this.isRunning&&(this.stop(),this.start())}updatePanelState(){if(this.vueApp&&this.vueApp.vm){this.vueApp.vm.isRunning=this.isRunning;return}if(!this.panel)return;const e=this.panel.querySelector(".bmh-as-toggle");e&&(e.textContent=this.isRunning?"⏸ Stop":"▶ Start",e.className="bmh-as-toggle"+(this.isRunning?" active":""))}createControlPanel(){if(this.adapter&&this.adapter.id==="mangafire"){const i={speed:this.speed,isRunning:this.isRunning},s={onToggle:()=>this.toggle(),onSpeedChange:l=>this.setSpeed(l)};Se(()=>Promise.resolve().then(()=>ke),void 0).then(l=>{this.vueApp=l.OverlayFactory.mountReaderControls(i,s)});return}const e=document.querySelector(".bmh-autoscroll-panel");e&&e.remove();const t=document.createElement("div");t.className="bmh-autoscroll-panel",t.innerHTML=`
            <button class="bmh-as-toggle" type="button">▶ Start</button>
            <div class="bmh-as-speed-control">
                <span class="bmh-as-label">Speed:</span>
                <input type="range" class="bmh-as-speed" min="20" max="200" value="${this.speed}">
                <span class="bmh-as-speed-value">${this.speed}</span>
            </div>
        `;const o=this;t.querySelector(".bmh-as-toggle").onclick=function(i){return i.preventDefault(),i.stopPropagation(),o.toggle(),!1};const a=t.querySelector(".bmh-as-speed"),n=t.querySelector(".bmh-as-speed-value");return a.oninput=function(i){const s=parseInt(i.target.value);o.setSpeed(s),n.textContent=s},this.injectStyles(),document.body.appendChild(t),this.panel=t,t}injectStyles(){if(document.getElementById("bmh-autoscroll-styles"))return;const e=document.createElement("style");e.id="bmh-autoscroll-styles",e.textContent=`
            .bmh-autoscroll-panel {
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                background: rgba(0, 0, 0, 0.95) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 10px !important;
                padding: 10px 14px !important;
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                z-index: 2147483647 !important;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                font-size: 13px !important;
                color: white !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
            }
            .bmh-as-toggle {
                background: #4f46e5 !important;
                color: white !important;
                border: none !important;
                padding: 8px 14px !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                min-width: 70px !important;
            }
            .bmh-as-toggle:hover { background: #4338ca !important; }
            .bmh-as-toggle.active { background: #dc2626 !important; }
            .bmh-as-toggle.active:hover { background: #b91c1c !important; }
            .bmh-as-speed-control {
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }
            .bmh-as-label {
                color: rgba(255, 255, 255, 0.7) !important;
                font-size: 11px !important;
            }
            .bmh-as-speed {
                width: 60px !important;
                height: 4px !important;
                -webkit-appearance: none !important;
                background: rgba(255, 255, 255, 0.3) !important;
                border-radius: 2px !important;
            }
            .bmh-as-speed::-webkit-slider-thumb {
                -webkit-appearance: none !important;
                width: 12px !important;
                height: 12px !important;
                background: white !important;
                border-radius: 50% !important;
            }
            .bmh-as-speed-value {
                color: rgba(255, 255, 255, 0.9) !important;
                font-size: 11px !important;
                min-width: 24px !important;
            }
        `,document.head.appendChild(e)}init(){this.showPanel&&this.createControlPanel(),window.bmhAutoScroll=this}destroy(){this.stop(),this.panel&&(this.panel.remove(),this.panel=null),delete window.bmhAutoScroll}}const P=class P{constructor(e){this.adapter=e,this.bindings=new Map,this.enabled=!0,this.boundHandler=this.handleKey.bind(this)}async loadBindings(){try{const t=(await chrome.storage.local.get("keybinds")).keybinds||{},o={...P.defaults,...t};Object.entries(o).forEach(([a,n])=>{this.bindings.set(a,n)}),console.log("[Keybinds] Loaded",this.bindings.size,"bindings")}catch(e){console.warn("[Keybinds] Failed to load bindings:",e),Object.entries(P.defaults).forEach(([t,o])=>{this.bindings.set(t,o)})}}async saveBindings(){try{const e=Object.fromEntries(this.bindings);await chrome.storage.local.set({keybinds:e})}catch(e){console.warn("[Keybinds] Failed to save bindings:",e)}}start(){document.addEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Started listening")}stop(){document.removeEventListener("keydown",this.boundHandler,{capture:!0}),console.log("[Keybinds] Stopped listening")}setEnabled(e){this.enabled=e}handleKey(e){if(!this.enabled||["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)||e.target.isContentEditable||e.ctrlKey||e.altKey||e.metaKey)return;const t=this.bindings.get(e.key);t&&(e.preventDefault(),e.stopPropagation(),this.executeAction(t))}executeAction(e){const o={nextPage:()=>{var a,n;return((n=(a=this.adapter).goToNextPage)==null?void 0:n.call(a))||this.scrollPage(1)},prevPage:()=>{var a,n;return((n=(a=this.adapter).goToPrevPage)==null?void 0:n.call(a))||this.scrollPage(-1)},nextChapter:()=>{var a,n;return(n=(a=this.adapter).goToNextChapter)==null?void 0:n.call(a)},prevChapter:()=>{var a,n;return(n=(a=this.adapter).goToPrevChapter)==null?void 0:n.call(a)},scrollDown:()=>window.scrollBy({top:window.innerHeight*.5,behavior:"smooth"}),scrollUp:()=>window.scrollBy({top:-window.innerHeight*.5,behavior:"smooth"}),scrollToTop:()=>window.scrollTo({top:0,behavior:"smooth"}),scrollToBottom:()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}),toggleAutoScroll:()=>{var a;return(a=window.bmhAutoScroll)==null?void 0:a.toggle()},speedUp:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed+20)},speedDown:()=>{window.bmhAutoScroll&&window.bmhAutoScroll.setSpeed(window.bmhAutoScroll.speed-20)},toggleFullscreen:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(a=>{console.warn("[Keybinds] Fullscreen failed:",a)})},exitReader:()=>{var a,n;document.fullscreenElement?document.exitFullscreen():(n=(a=this.adapter).exitReader)==null||n.call(a)}}[e];o?(o(),console.log("[Keybinds] Executed:",e)):console.warn("[Keybinds] Unknown action:",e)}scrollPage(e){window.scrollBy({top:window.innerHeight*.5*e,behavior:"smooth"})}setBinding(e,t){this.bindings.set(e,t),this.saveBindings()}removeBinding(e){this.bindings.delete(e),this.saveBindings()}resetToDefaults(){this.bindings.clear(),Object.entries(P.defaults).forEach(([e,t])=>{this.bindings.set(e,t)}),this.saveBindings()}async init(){await this.loadBindings(),this.start(),window.bmhKeybinds=this,console.log("[Keybinds] Initialized")}destroy(){this.stop(),delete window.bmhKeybinds}};$(P,"defaults",{ArrowDown:"scrollDown",ArrowUp:"scrollUp"," ":"toggleAutoScroll",Escape:"exitReader",f:"toggleFullscreen",F:"toggleFullscreen",n:"nextChapter",N:"nextChapter",p:"prevChapter",P:"prevChapter",Home:"scrollToTop",End:"scrollToBottom"});let L=P;const N=class N{constructor(e){this.adapter=e,this.currentEntry=null,this.saveTimeout=null,this.isSaved=!1}async init(){const e=this.parseCurrentUrl();if(!e||!e.chapterNo){console.log("[ProgressTracker] Not a chapter page, skipping");return}this.currentEntry={source:this.adapter.id||this.adapter.PREFIX,slug:e.slug,id:e.id,chapter:String(e.chapterNo),url:window.location.href},console.log("[ProgressTracker] Tracking:",this.currentEntry),this.saveTimeout=setTimeout(()=>this.saveProgress(),N.SAVE_DELAY),this.setupScrollTracking()}parseCurrentUrl(){if(this.adapter.parseUrl)return this.adapter.parseUrl(window.location.href);const e=window.location.href,t=e.match(/\/read\/([^/]+)\.(\d+)\/\w+\/chapter-(\d+(?:\.\d+)?)/);if(t)return{slug:t[1],id:t[2],chapterNo:parseFloat(t[3])};const o=e.match(/mangadex\.org\/chapter\/([a-f0-9-]+)/i);if(o)return{chapterId:o[1],chapterNo:null};const a=e.match(/webtoons\.com.*episode_no=(\d+)/i);if(a){const n=e.match(/\/([^/]+)\/list\?/);return{slug:(n==null?void 0:n[1])||"unknown",chapterNo:parseInt(a[1])}}return null}setupScrollTracking(){let e=!1;const t=()=>{if(e||this.isSaved)return;window.scrollY/(document.body.scrollHeight-window.innerHeight)>.25&&(e=!0,this.saveProgress())};window.addEventListener("scroll",t,{passive:!0})}async saveProgress(){if(this.isSaved||!this.currentEntry)return;this.isSaved=!0;const{source:e,slug:t,chapter:o,url:a,id:n}=this.currentEntry;try{const i=t||`${e}:${n}`,s=await chrome.storage.local.get(["savedReadChapters","savedEntriesMerged"]),l=s.savedReadChapters||{},c=s.savedEntriesMerged||[];l[i]||(l[i]=[]),l[i].includes(o)||(l[i].push(o),l[i].sort((d,h)=>parseFloat(d)-parseFloat(h)));const u=c.find(d=>{if(d.source===e&&d.sourceId===n||d.slug===t||d.slug===i)return!0;const h=t==null?void 0:t.toLowerCase().replace(/[^a-z0-9]/g,""),g=(d.slug||d.title||"").toLowerCase().replace(/[^a-z0-9]/g,"");return h&&h===g});if(u){const d=parseFloat(o),h=parseFloat(u.lastReadChapter)||0;d>h&&(u.lastReadChapter=o,u.lastMangafireUrl=a),u.lastReadDate=Date.now(),u.readChapters=l[i].length,console.log("[ProgressTracker] Updated library entry:",u.title||t)}await chrome.storage.local.set({savedReadChapters:l,savedEntriesMerged:c}),console.log(`[ProgressTracker] ✓ Saved progress: ${t} ch.${o}`);try{chrome.runtime.sendMessage({action:"progressSaved",data:{source:e,slug:t,chapter:o}})}catch{}}catch(i){console.error("[ProgressTracker] Failed to save progress:",i),this.isSaved=!1}}destroy(){this.saveTimeout&&(clearTimeout(this.saveTimeout),this.saveTimeout=null)}};$(N,"SAVE_DELAY",5e3);let I=N;class x{constructor(e,t={}){this.adapter=e,this.options={autoScroll:t.autoScroll!==!1,keybinds:t.keybinds!==!1,progressTracking:t.progressTracking!==!1},this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}isReaderPage(){if(this.adapter.isReaderPage)return this.adapter.isReaderPage();const e=window.location.href;return[/\/read\//i,/\/chapter\//i,/episode_no=/i,/\/viewer/i,/chapter-\d+/i].some(o=>o.test(e))}async init(){if(!this.isReaderPage()){console.log("[ReaderEnhancements] Not a reader page, skipping init");return}console.log("[ReaderEnhancements] Initializing on reader page...");const e=await this.loadSettings();this.options.autoScroll&&e.autoScrollEnabled!==!1&&(this.autoScroll=new Ee({speed:e.autoScrollSpeed||50,showPanel:!0,adapter:this.adapter}),this.autoScroll.init()),this.options.keybinds&&e.keybindsEnabled!==!1&&(this.keybinds=new L(this.adapter),await this.keybinds.init()),this.options.progressTracking&&e.progressTrackingEnabled!==!1&&(this.progressTracker=new I(this.adapter),await this.progressTracker.init()),this.isInitialized=!0,console.log("[ReaderEnhancements] Initialized successfully")}async loadSettings(){try{return await chrome.storage.local.get(["autoScrollEnabled","autoScrollSpeed","keybindsEnabled","progressTrackingEnabled"])}catch(e){return console.warn("[ReaderEnhancements] Failed to load settings:",e),{}}}destroy(){var e,t,o;(e=this.autoScroll)==null||e.destroy(),(t=this.keybinds)==null||t.destroy(),(o=this.progressTracker)==null||o.destroy(),this.autoScroll=null,this.keybinds=null,this.progressTracker=null,this.isInitialized=!1}}const M={id:"mangafire",name:"MangaFire",unitName:"chapter",PREFIX:"",displayName:"MangaFire",hosts:["mangafire.to"],selectors:{card:".unit, .swiper-slide, #top-trending .swiper-slide",cardTitle:".info a, .info h6 a, .above a",cardLink:'a[href*="/manga/"]',cardCover:".poster img, img"},extractCardData(r){var i;let e="",t="",o="";const a=r.querySelector(".info a")||r.querySelector(".info h6 a")||r.querySelector(".above a");a&&(e=((i=a.textContent)==null?void 0:i.trim())||"");const n=r.querySelector(this.selectors.cardLink);return n&&(t=n.href,o=this.extractSlug(t)),{id:o,title:e,slug:o,url:t}},extractSlug(r){if(!r)return"";try{const e=r.match(/\/manga\/([^/?#]+)/);return e?e[1]:""}catch{return""}},applyBorder(r,e,t,o){let a=r;if(r.classList.contains("swiper-slide")){(r.querySelector(".swiper-inner")||r).style.setProperty("border-left",`${t}px ${o} ${e}`,"important");return}const n=r.closest("li");n&&(a=n),a.style.setProperty("border",`${t}px ${o} ${e}`,"important"),a.style.setProperty("border-radius","8px","important"),a.style.setProperty("box-sizing","border-box","important")},getBadgePosition(){return{bottom:"4px",left:"4px"}},buildChapterUrl(r,e){return null},isReaderPage(){return window.location.href.includes("/read/")},parseUrl(r){const e=r.match(/\/read\/([^/]+)\.?(\d*)\/(?:[^/]+\/)?chapter-([^/?#]+)/);return e?{slug:e[1],id:e[2]||null,chapterNo:parseFloat(e[3])}:null},goToNextChapter(){const r=document.querySelector('a.btn-next, .chapter-nav .next, [data-direction="next"]');r&&r.click()},goToPrevChapter(){const r=document.querySelector('a.btn-prev, .chapter-nav .prev, [data-direction="prev"]');r&&r.click()},exitReader(){const r=document.querySelector('a.manga-link, a[href*="/manga/"]');r?window.location.href=r.href:window.history.back()}};async function Pe(r){const e=s=>{var l;(l=chrome.runtime)!=null&&l.id&&chrome.runtime.sendMessage({type:"log",text:`[MangaFire] ${s}`},()=>{chrome.runtime.lastError})};if(e("Initializing MangaFire Adapter..."),!document.getElementById("bmh-mangafire-styles")){const s=document.createElement("style");s.id="bmh-mangafire-styles",s.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(s),p.injectStyles()}const t=new B(M,{highlighting:!0,progressBadges:r.MangaFireShowProgress!==!1,quickActions:r.MangaFireQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),M.isReaderPage()&&(D(e),new x(M).init());let o;new MutationObserver(()=>{clearTimeout(o),o=setTimeout(()=>t.enhanceAll(),200)}).observe(document.body,{childList:!0,subtree:!0});let n=location.href;new MutationObserver(()=>{location.href!==n&&(n=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(s=>{s.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),500),M.isReaderPage()&&setTimeout(()=>D(e),1e3))}).observe(document,{subtree:!0,childList:!0})}function D(r){var i;if(!((i=chrome.runtime)!=null&&i.id))return;const t=window.location.href.match(/\/read\/([^/]+)\/(?:[^/]+\/)?chapter-([^/?#]+)/);if(!t)return;const o=t[1],a=t[2];let n=o.includes(".")?o.substring(0,o.lastIndexOf(".")):o;n.endsWith("gg")&&(n=n.slice(0,-1)),chrome.storage.local.get(["savedReadChapters"],s=>{if(chrome.runtime.lastError)return;let l=s.savedReadChapters||{};l[n]||(l[n]=[]),l[n].includes(a)||(l[n].push(a),chrome.storage.local.set({savedReadChapters:l},()=>{chrome.runtime.lastError||r(`Saved chapter ${a} for ${n}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:a,slugWithId:o,readChapters:l[n].length,source:"mangafire"})})}const S={id:"asurascans",name:"Asura Scans",unitName:"chapter",PREFIX:"asura:",displayName:"Asura Scans",hosts:["asuracomic.net","asurascans.com","asuratoon.com"],selectors:{card:'a[href*="/series/"]:has(img), div.grid.grid-cols-12:has(a[href*="/series/"])',cardTitle:'span.font-medium, a[href*="/series/"] span, h2, h3',cardLink:'a[href*="/series/"]',cardCover:"img.object-cover, img"},extractCardData(r){var n,i;let e="",t="",o="";const a=r.tagName==="A"?r:r.querySelector('a[href*="/series/"]');if(a&&(t=a.href,o=this.extractSlug(t),e=((n=(r.querySelector(this.selectors.cardTitle)||a.querySelector("span")||a).textContent)==null?void 0:n.trim())||"",e=e.split(/\n|Chapter/i)[0].trim()),!e&&r.classList.contains("grid")){const s=r.querySelector('span.font-medium a, a[href*="/series/"]');s&&(e=((i=s.textContent)==null?void 0:i.trim())||"",t=s.href,o=this.extractSlug(t))}return{id:o,title:e,slug:o,url:t}},extractSlug(r){try{const e=new URL(r).pathname.split("/").filter(o=>o),t=e.indexOf("series");return t!==-1&&e[t+1]?e[t+1]:e[e.length-1]}catch{return""}},applyBorder(r,e,t,o){r.style.setProperty("border",`${t}px ${o} ${e}`,"important"),r.style.setProperty("border-radius","8px","important"),r.style.setProperty("box-sizing","border-box","important")},getBadgePosition(){return{bottom:"8px",left:"8px"}},buildChapterUrl(r,e){return r.slug?`https://asuracomic.net/series/${r.slug}/chapter-${e}`:null},isReaderPage(){return window.location.href.includes("/chapter")},parseUrl(r){const e=r.match(/\/series\/([^/]+)\/chapter[/-]?([\d.-]+)/i);return e?{slug:e[1],chapterNo:parseFloat(e[2])}:null},goToNextChapter(){const r=document.querySelector('a[href*="/chapter"]:has(svg[class*="right"]), button:has(svg[stroke*="next"]), .next-chapter');r&&r.click()},goToPrevChapter(){const r=document.querySelector('a[href*="/chapter"]:has(svg[class*="left"]), button:has(svg[stroke*="prev"]), .prev-chapter');r&&r.click()},exitReader(){const r=document.querySelector('a[href*="/series/"]:not([href*="/chapter"])');r?window.location.href=r.href:window.history.back()}};async function Re(r){const e=s=>{var l;(l=chrome.runtime)!=null&&l.id&&chrome.runtime.sendMessage({type:"log",text:`[AsuraScans] ${s}`})};if(e("Initializing Asura Scans Adapter..."),!document.getElementById("bmh-asura-styles")){const s=document.createElement("style");s.id="bmh-asura-styles",s.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(s),p.injectStyles()}const t=new B(S,{highlighting:!0,progressBadges:!0,quickActions:r.AsuraScansQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),S.isReaderPage()&&(O(e),new x(S).init());let o;new MutationObserver(()=>{clearTimeout(o),o=setTimeout(()=>t.enhanceAll(),200)}).observe(document.body,{childList:!0,subtree:!0});let n=location.href;new MutationObserver(()=>{location.href!==n&&(n=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(s=>{s.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),800),S.isReaderPage()&&setTimeout(()=>O(e),1e3))}).observe(document,{subtree:!0,childList:!0})}function O(r){var l,c;if(!((l=chrome.runtime)!=null&&l.id))return;const e=window.location.href,t=e.match(/\/chapter[/-]?([\d.-]+)/i),o=t?t[1]:null;if(!o)return;const a=document.querySelector('h1, span.font-bold, a[href*="/series/"]'),n=(c=a==null?void 0:a.textContent)==null?void 0:c.trim();if(!n)return;const i=S.extractSlug(e),s=`${S.PREFIX}${i}`;chrome.storage.local.get(["savedReadChapters"],u=>{if(chrome.runtime.lastError)return;let d=u.savedReadChapters||{};d[s]||(d[s]=[]),d[s].includes(o)||(d[s].push(o),chrome.storage.local.set({savedReadChapters:d},()=>{r(`Saved chapter ${o} for ${n}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:o,slugWithId:`asura-${i}`,readChapters:d[s].length,source:"asurascans"})})}const v={id:"mangadex",name:"MangaDex",unitName:"chapter",PREFIX:"mangadex:",displayName:"MangaDex",hosts:["mangadex.org"],selectors:{card:'.manga-card, .hchaptercard, [class*="chapter-feed__container"]',cardTitle:'a[href*="/title/"] h6, a.title span, a.title, [class*="title"]',cardLink:'a[href*="/title/"]',cardCover:".manga-card-cover img, img"},extractCardData(r){var n;let e="",t="",o="";const a=r.querySelector(this.selectors.cardLink);if(a){t=a.href,o=this.extractUUID(t);let i;r.classList.contains("hchaptercard")?i=r.querySelector('a[href*="/title/"] h6'):i=r.querySelector("a.title span")||r.querySelector("a.title")||r.querySelector('[class*="title"]'),e=((n=i==null?void 0:i.textContent)==null?void 0:n.trim())||""}return{id:o,title:e,slug:this.slugify(e),url:t}},extractUUID(r){if(!r)return"";const e=r.match(/\/(title|chapter)\/([a-f0-9-]{36})/i);return e?e[2]:""},slugify(r){return r?r.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""):""},applyBorder(r,e,t,o){let a;r.classList.contains("hchaptercard")?a=r.querySelector('a[href*="/title/"]')||r:a=r.querySelector(".manga-card-cover")||r,a.style.setProperty("border",`${t}px ${o} ${e}`,"important"),a.style.setProperty("border-radius","8px","important"),a.style.setProperty("box-sizing","border-box","important"),a.style.setProperty("position","relative","important")},getBadgePosition(){return{bottom:"4px",left:"4px"}},buildChapterUrl(r,e){return null},isReaderPage(){return window.location.href.includes("/chapter/")},parseUrl(r){return null},goToNextChapter(){const r=Array.from(document.querySelectorAll("a")).find(e=>{var t,o;return((t=e.textContent)==null?void 0:t.includes("Next"))||((o=e.textContent)==null?void 0:o.includes("next"))});r&&r.click()},goToPrevChapter(){const r=Array.from(document.querySelectorAll("a")).find(e=>{var t,o;return((t=e.textContent)==null?void 0:t.includes("Previous"))||((o=e.textContent)==null?void 0:o.includes("Prev"))});r&&r.click()},exitReader(){const r=document.querySelector('a[href*="/title/"]');r?r.click():window.history.back()}};async function Be(r){const e=s=>{var l;(l=chrome.runtime)!=null&&l.id&&chrome.runtime.sendMessage({type:"log",text:`[MangaDex] ${s}`})};if(e("Initializing MangaDex Adapter..."),!document.getElementById("bmh-mangadex-styles")){const s=document.createElement("style");s.id="bmh-mangadex-styles",s.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(s),p.injectStyles()}const t=new B(v,{highlighting:!0,progressBadges:r.MangaDexShowProgress!==!1,quickActions:r.MangaDexQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),v.isReaderPage()&&(j(e),new x(v).init());let o;new MutationObserver(()=>{clearTimeout(o),o=setTimeout(()=>t.enhanceAll(),200)}).observe(document.body,{childList:!0,subtree:!0});let n=location.href;new MutationObserver(()=>{location.href!==n&&(n=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(s=>{s.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),500),v.isReaderPage()&&setTimeout(()=>{j(e),new x(v).init()},1e3))}).observe(document,{subtree:!0,childList:!0})}function j(r){var c,u;if(!((c=chrome.runtime)!=null&&c.id))return;const t=window.location.href.match(/\/chapter\/([a-f0-9-]{36})/i),o=t?t[1]:null;if(!o)return;const a=document.querySelector('[class*="title"]')||document.querySelector('a[href*="/title/"]'),n=(u=a==null?void 0:a.textContent)==null?void 0:u.trim();if(!n)return;const i=document.querySelector('a[href*="/title/"]'),s=i?v.extractUUID(i.href):null,l=s?`${v.PREFIX}${s}`:n;chrome.storage.local.get(["savedReadChapters"],d=>{if(chrome.runtime.lastError)return;let h=d.savedReadChapters||{};h[l]||(h[l]=[]),h[l].includes(o)||(h[l].push(o),chrome.storage.local.set({savedReadChapters:h},()=>{r(`Saved chapter ${o} for ${n}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:o,slugWithId:`mangadex-${s||"unknown"}`,readChapters:h[l].length,source:"mangadex"})})}const k={id:"manganato",name:"Manganato",unitName:"chapter",PREFIX:"manganato:",displayName:"Manganato",hosts:["manganato.com","chapmanganato.com"],selectors:{cardContainer:".panel-content-genres, .daily-update, .truyen-list",card:".content-genres-item, .list-truyen-item-wrap, .sh",cardTitle:"h3 a, a.genres-item-name",cardLink:"h3 a, a.genres-item-name",cardCover:"img"},extractCardData(r){var n;let e="",t="",o="";const a=r.querySelector(this.selectors.cardLink)||(r.tagName==="A"?r:null);return a&&(e=a.getAttribute("title")||((n=a.textContent)==null?void 0:n.trim())||"",t=a.href,o=this.extractSlug(t)),{id:o,title:e,slug:o,url:t}},extractSlug(r){try{return new URL(r).pathname.replace(/^\//,"").split("/")[0]}catch{return""}},applyBorder(r,e,t,o){r.style.setProperty("border",`${t}px ${o} ${e}`,"important"),r.style.setProperty("border-radius","5px","important"),r.style.setProperty("box-sizing","border-box","important"),r.style.setProperty("position","relative","important")},getBadgePosition(){return{bottom:"4px",left:"4px"}},buildChapterUrl(r,e){return null},isReaderPage(){return window.location.pathname.includes("chapter-")},parseUrl(r){const e=r.match(/\/([^/]+)\/chapter-([\d.-]+)/);return e?{slug:e[1],chapterNo:parseFloat(e[2])}:null},goToNextChapter(){const r=document.querySelector(".navi-change-chapter-btn-next");r&&r.click()},goToPrevChapter(){const r=document.querySelector(".navi-change-chapter-btn-prev");r&&r.click()},exitReader(){const r=document.querySelector(".panel-breadcrumb a:last-child")||document.querySelector('a[href*="/manga-"]');r?r.click():window.history.back()}};async function $e(r){const e=s=>{var l;(l=chrome.runtime)!=null&&l.id&&chrome.runtime.sendMessage({type:"log",text:`[Manganato] ${s}`})};if(e("Initializing Manganato Adapter..."),!document.getElementById("bmh-manganato-styles")){const s=document.createElement("style");s.id="bmh-manganato-styles",s.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(s),p.injectStyles()}const t=new B(k,{highlighting:!0,progressBadges:r.ManganatoShowProgress!==!1,quickActions:r.ManganatoQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),k.isReaderPage()&&(H(e),new x(k).init());let o;new MutationObserver(()=>{clearTimeout(o),o=setTimeout(()=>t.enhanceAll(),200)}).observe(document.body,{childList:!0,subtree:!0});let n=location.href;new MutationObserver(()=>{location.href!==n&&(n=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(s=>{s.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),500),k.isReaderPage()&&setTimeout(()=>{H(e),new x(k).init()},1e3))}).observe(document,{subtree:!0,childList:!0})}function H(r){var l,c;if(!((l=chrome.runtime)!=null&&l.id))return;const e=window.location.href,t=e.match(/\/chapter[/-]?([\d.-]+)/i),o=t?t[1]:null;if(!o)return;const a=document.querySelector(".panel-chapter-info-top h1, .story-info-right h1"),n=(c=a==null?void 0:a.textContent)==null?void 0:c.trim();if(!n)return;const i=k.extractSlug(e),s=`${k.PREFIX}${i}`;chrome.storage.local.get(["savedReadChapters"],u=>{if(chrome.runtime.lastError)return;let d=u.savedReadChapters||{};d[s]||(d[s]=[]),d[s].includes(o)||(d[s].push(o),chrome.storage.local.set({savedReadChapters:d},()=>{r(`Saved chapter ${o} for ${n}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:o,slugWithId:`manganato-${i}`,readChapters:d[s].length,source:"manganato"})})}const w={id:"mangaplus",name:"MangaPlus",unitName:"chapter",PREFIX:"mp:",displayName:"MangaPlus",hosts:["mangaplus.shueisha.co.jp"],selectors:{cardContainer:'div[class*="TitleList"]',card:'a[href*="/titles/"]',cardTitle:'h3, div[class*="TitleName"]',cardLink:'a[href*="/titles/"]',cardCover:"img"},extractCardData(r){var n;let e="",t="",o="";t=r.href,o=this.extractIdFromUrl(t);const a=r.querySelector('h3, div[class*="TitleName"], p');return e=((n=a==null?void 0:a.textContent)==null?void 0:n.trim())||"",{id:o,title:e,slug:o,url:t}},extractIdFromUrl(r){if(!r)return"";const e=r.match(/\/titles\/(\d+)/);return e?e[1]:""},applyBorder(r,e,t,o){const n=r.querySelector('div[class*="Cover"]')||r;n.style.setProperty("border",`${t}px ${o} ${e}`,"important"),n.style.setProperty("box-sizing","border-box","important"),n.style.setProperty("border-radius","4px","important"),n.style.setProperty("position","relative","important")},getBadgePosition(){return{top:"4px",right:"4px"}},buildChapterUrl(r,e){return null},isReaderPage(){return window.location.href.includes("/viewer/")},parseUrl(r){const e=this.extractIdFromUrl(r);return e?{slug:null,id:e,chapterNo:null}:null},goToNextChapter(){},goToPrevChapter(){},exitReader(){const r=document.querySelector('a[href*="/titles/"]');r?r.click():window.history.back()}};async function Ae(r){const e=i=>{var s;(s=chrome.runtime)!=null&&s.id&&chrome.runtime.sendMessage({type:"log",text:`[MangaPlus] ${i}`})};if(e("Initializing MangaPlus Adapter..."),!document.getElementById("bmh-mangaplus-styles")){const i=document.createElement("style");i.id="bmh-mangaplus-styles",i.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(i),p.injectStyles()}const t=new B(w,{highlighting:!0,progressBadges:r.MangaPlusShowProgress!==!1,quickActions:r.MangaPlusQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),w.isReaderPage()&&(setTimeout(()=>K(e),1500),new x(w).init()),new MutationObserver(i=>{i.some(l=>l.addedNodes.length>0)&&t.enhanceAll()}).observe(document.body,{childList:!0,subtree:!0});let a=location.href;new MutationObserver(()=>{location.href!==a&&(a=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(i=>{i.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),1e3),w.isReaderPage()&&setTimeout(()=>{K(e),new x(w).init()},1500))}).observe(document,{subtree:!0,childList:!0})}function K(r){var c,u;if(!((c=chrome.runtime)!=null&&c.id))return;const t=window.location.href.match(/\/viewer\/(\d+)/),o=t?t[1]:null;if(!o)return;const a=document.querySelector('h1, a[href*="/titles/"]'),n=(u=a==null?void 0:a.textContent)==null?void 0:u.trim();if(!n)return;const i=document.querySelector('a[href*="/titles/"]'),s=i?w.extractIdFromUrl(i.href):null;if(!s)return;const l=`${w.PREFIX}${s}`;chrome.storage.local.get(["savedReadChapters"],d=>{if(chrome.runtime.lastError)return;let h=d.savedReadChapters||{};h[l]||(h[l]=[]),h[l].includes(o)||(h[l].push(o),chrome.storage.local.set({savedReadChapters:h},()=>{r(`Saved chapter ${o} for ${n}`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:o,slugWithId:`mangaplus-${s}`,readChapters:h[l].length,source:"mangaplus"})})}const E={id:"webtoons",name:"Webtoons",unitName:"episode",PREFIX:"webtoon:",displayName:"Webtoons",hosts:["www.webtoons.com","webtoons.com"],selectors:{card:'li:has(a[class*="_title_a"])',cardTitle:".title, .subj, strong.title",cardLink:'a[class*="_title_a"], a.link',cardCover:"img"},extractCardData(r){var i;let e="",t="",o="",a="";const n=r.querySelector(this.selectors.cardLink)||(r.tagName==="A"?r:null);if(n){t=n.href;const s=this.extractInfoFromUrl(t);o=s.titleNo,a=s.slug;const l=r.querySelector(".title")||r.querySelector(".subj")||r.querySelector("p.subj")||r.querySelector(".info .subj")||r.querySelector(".info_area .subj");l?e=((i=l.textContent)==null?void 0:i.trim())||"":n.getAttribute("title")&&(e=n.getAttribute("title")||"")}return{id:o,title:e,slug:a,url:t}},extractInfoFromUrl(r){if(!r)return{titleNo:"",slug:"",episodeNo:null};try{const e=new URL(r),t=e.pathname.match(/\/(?:webtoon|challenge)\/([^/]+)/),o=t?t[1]:"",a=e.searchParams.get("title_no")||"",n=e.searchParams.get("episode_no")||null;return{titleNo:a,slug:o,episodeNo:n}}catch{return{titleNo:"",slug:"",episodeNo:null}}},applyBorder(r,e,t,o){const a=r.closest("li")||r;a.style.setProperty("border",`${t}px ${o} ${e}`,"important"),a.style.setProperty("border-radius","8px","important"),a.style.setProperty("box-sizing","border-box","important"),a.style.setProperty("position","relative","important")},getBadgePosition(){return{bottom:"4px",left:"4px"}},buildChapterUrl(r,e){const t=r.sourceUrl||r.url;if(!t)return null;try{const o=new URL(t);if(o.pathname.endsWith("/list"))return o.pathname=o.pathname.replace("/list","/viewer"),o.searchParams.set("episode_no",String(e)),o.toString()}catch{return null}return null},isReaderPage(){return window.location.href.includes("episode_no")||window.location.href.includes("/viewer")},parseUrl(r){const e=this.extractInfoFromUrl(r);return{slug:e.slug,id:e.titleNo,chapterNo:e.episodeNo?parseFloat(e.episodeNo):null}},goToNextChapter(){const r=document.querySelector(".pg_next")||document.querySelector("a.next");r&&r.click()},goToPrevChapter(){const r=document.querySelector(".pg_prev")||document.querySelector("a.prev");r&&r.click()},exitReader(){const r=document.querySelector("#detail_list_btn")||document.querySelector('a[href*="/list"]');if(r)r.click();else{const e=new URL(window.location.href);e.pathname=e.pathname.replace("/viewer","/list"),e.searchParams.delete("episode_no"),window.location.href=e.toString()}}};async function Te(r){const e=i=>{var s;(s=chrome.runtime)!=null&&s.id&&chrome.runtime.sendMessage({type:"log",text:`[Webtoons] ${i}`})};if(e("Initializing Webtoons Adapter..."),!document.getElementById("bmh-webtoons-styles")){const i=document.createElement("style");i.id="bmh-webtoons-styles",i.textContent="@keyframes bmh-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.05); } }",document.head.appendChild(i),p.injectStyles()}const t=new B(E,{highlighting:!0,progressBadges:r.WebtoonsShowProgress!==!1,quickActions:r.WebtoonsQuickActionsEnabled!==!1,CustomBorderSize:r.CustomBorderSizefeatureEnabled?r.CustomBorderSize:4,CustomBookmarksfeatureEnabled:r.CustomBookmarksfeatureEnabled,customBookmarks:r.customBookmarks});await t.enhanceAll(),E.isReaderPage()&&(Y(e),new x(E).init()),new MutationObserver(()=>{t.enhanceAll()}).observe(document.body,{childList:!0,subtree:!0});let a=location.href;new MutationObserver(()=>{location.href!==a&&(a=location.href,document.querySelectorAll("[data-bmh-enhanced]").forEach(i=>{i.dataset.bmhEnhanced=void 0}),setTimeout(()=>t.enhanceAll(),500),E.isReaderPage()&&setTimeout(()=>Y(e),1e3))}).observe(document,{subtree:!0,childList:!0})}function Y(r){var s,l;if(!((s=chrome.runtime)!=null&&s.id))return;const e=window.location.href,{slug:t,episodeNo:o}=E.extractInfoFromUrl(e);if(!o||!t)return;const a=document.querySelector(".subj"),n=(l=a==null?void 0:a.textContent)==null?void 0:l.trim();if(!n)return;const i=`${E.PREFIX}${t}`;chrome.storage.local.get(["savedReadChapters"],c=>{if(chrome.runtime.lastError)return;let u=c.savedReadChapters||{};u[i]||(u[i]=[]),u[i].includes(o)||(u[i].push(o),chrome.storage.local.set({savedReadChapters:u},()=>{r(`Saved episode ${o} for ${n} (${t})`)})),chrome.runtime.sendMessage({type:"autoSyncEntry",title:n,chapter:o,slugWithId:`webtoon-${t}`,readChapters:u[i].length,source:"webtoons"})})}const qe=[{hosts:["mangafire.to"],init:Pe,settingsPrefix:"MangaFire"},{hosts:["asuracomic.net","asurascans.com","asuratoon.com"],init:Re,settingsPrefix:"AsuraScans"},{hosts:["mangadex.org"],init:Be,settingsPrefix:"MangaDex"},{hosts:["manganato.com","chapmanganato.com"],init:$e,settingsPrefix:"Manganato"},{hosts:["mangaplus.shueisha.co.jp"],init:Ae,settingsPrefix:"MangaPlus"},{hosts:["www.webtoons.com","webtoons.com"],init:Te,settingsPrefix:"Webtoons"}];async function _(){var o;if(!((o=chrome.runtime)!=null&&o.id))return;const r=window.location.hostname,e=qe.find(a=>a.hosts.some(n=>r.includes(n)));if(!e){console.warn(`[BMH] No adapter found for host: ${r}`);return}const t=["CustomBorderSize","CustomBorderSizefeatureEnabled","CustomBookmarksfeatureEnabled","customBookmarks",`${e.settingsPrefix}HighlightEnabled`,`${e.settingsPrefix}QuickActionsEnabled`,`${e.settingsPrefix}ShowProgress`];try{const a=await new Promise(n=>{chrome.storage.local.get(t,n)});await e.init(a)}catch(a){console.error(`[BMH] Failed to initialize adapter for ${e.settingsPrefix}:`,a)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();window.addEventListener("load",()=>{setTimeout(_,500)});
