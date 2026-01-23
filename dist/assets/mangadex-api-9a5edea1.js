const y="https://graphql.anilist.co";let F=`
query ($search: String) {
  Page (page: 1, perPage: 1) {
    media (search: $search, type: MANGA) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        medium
      }
      bannerImage
      format
      countryOfOrigin
      genres
      synonyms
      tags {
        name
      }
      status
      chapters
      volumes
      siteUrl
      averageScore
      popularity
      description
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      externalLinks {
        url
        site
        language
      }
    }
  }
}
`;function q(){return F}let v=0;const S=2e3,D=3,R=3e3;function $(a,e=!0){const t=e?Math.floor(Math.random()*500):0;return new Promise(r=>setTimeout(r,a+t))}function _(a,e=!1){let t=a.replace(/\s*\(.*?\)\s*/g," ").replace(/\s*\[.*?\]\s*/g," ").replace(/[:\-–—]/g," ").replace(/\s+/g," ").trim();return e&&([/colored/gi,/remake/gi,/full color/gi,/digital/gi,/vertical/gi,/scanlation/gi,/official/gi,/ver/gi,/manga/gi,/manhwa/gi,/manhua/gi,/remastered/gi,/raw/gi,/chapter/gi,/ch\.\d+/gi,/v\.\d+/gi].forEach(n=>{t=t.replace(n," ")}),t=t.replace(/[^a-zA-Z0-9 ]/g," "),t=t.replace(/\s+/g," ").trim()),t}async function w(a,e=0){const r=Date.now()-v;r<S&&await $(S-r),v=Date.now();let n=a;e===1&&(n=_(a,!1)),e>=2&&(n=_(a,!0));const i=q(),d={method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({query:i,variables:{search:n}})};try{const s=await fetch(y,d);if(s.status===429){if(e<D){const o=s.headers.get("Retry-After"),u=o?parseInt(o):60,f=Math.min(u*1e3,R*Math.pow(2,e));return console.warn(`AniList rate limited. Waiting ${f/1e3}s before retry ${e+1}/${D}`),await $(f),w(a,e+1)}return console.error("AniList rate limit exceeded after max retries"),null}if(s.status>=500)return console.warn(`AniList Server Error (${s.status}): ${s.statusText}. Retrying...`),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null;if(!s.ok)return console.error(`AniList HTTP error: ${s.status} ${s.statusText} for title: "${n}"`),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null;const l=await s.json();if(l.errors)return console.warn("AniList API Error for title:",n,l.errors),e<2?w(a,e+1):null;if(l.data&&l.data.Page&&l.data.Page.media){const o=l.data.Page.media;return o.length===0?e<2?(console.log(`No results for "${n}", trying next strategy...`),w(a,e+1)):null:[...o].sort((f,g)=>{const c=p=>p.format==="MANGA"?100:p.format==="ONE_SHOT"?10:p.format==="NOVEL"?5:50;return c(g)-c(f)})[0]}return null}catch(s){return console.error("Network error fetching from AniList:",s),e<D?(await $(R*Math.pow(2,e)),w(a,e+1)):null}}const I="https://api.mangadex.org";let j=0;const E=600,x=2,T=2e3,H=7*24*60*60*1e3;function N(a,e=!0){const t=e?Math.floor(Math.random()*300):0;return new Promise(r=>setTimeout(r,a+t))}function P(a,e=!1){let t=a.replace(/\s*\(.*?\)\s*/g," ").replace(/\s*\[.*?\]\s*/g," ").replace(/[:\-–—]/g," ").replace(/\s+/g," ").trim();return e&&([/colored/gi,/remake/gi,/full color/gi,/digital/gi,/vertical/gi,/scanlation/gi,/official/gi,/ver\./gi,/remastered/gi,/raw/gi,/chapter/gi,/ch\.\d+/gi].forEach(n=>{t=t.replace(n," ")}),t=t.replace(/[^a-zA-Z0-9 ]/g," ").replace(/\s+/g," ").trim()),t}async function W(a){return new Promise(e=>{chrome.storage.local.get(["mangadexCache"],t=>{const r=t.mangadexCache||{},n=a.toLowerCase().trim(),i=r[n];i&&Date.now()-i.timestamp<H?e(i.data):e(null)})})}async function k(a,e){return new Promise(t=>{chrome.storage.local.get(["mangadexCache"],r=>{const n=r.mangadexCache||{},i=a.toLowerCase().trim();n[i]={data:e,timestamp:Date.now()},chrome.storage.local.set({mangadexCache:n},t)})})}function U(a){var g,c,p,L;const e=a.attributes,t=a.relationships||[],r=t.find(m=>m.type==="cover_art");let n=null;r&&r.attributes&&r.attributes.fileName?n=`https://uploads.mangadex.org/covers/${a.id}/${r.attributes.fileName}.256.jpg`:r&&r.id&&console.log(`[MangaDex] ⚠️ Cover relationship exists but no fileName for ${a.id}`),n||(n="https://mangadex.org/img/avatar.png");const i=t.find(m=>m.type==="author"),d=((g=i==null?void 0:i.attributes)==null?void 0:g.name)||"Unknown",s={ongoing:"RELEASING",completed:"FINISHED",hiatus:"HIATUS",cancelled:"CANCELLED"};let l="MANGA";const o=e.tags||[],u=o.find(m=>{var h,M;return["Manhwa","Manhua","Long Strip"].includes((M=(h=m.attributes)==null?void 0:h.name)==null?void 0:M.en)});u&&(u.attributes.name.en==="Manhwa"&&(l="Manhwa"),u.attributes.name.en==="Manhua"&&(l="Manhua"));const f={ko:"KR",zh:"CN","zh-hk":"CN",ja:"JP"};return{id:`md_${a.id}`,mangadexId:a.id,source:"MANGADEX",title:{english:e.title.en||Object.values(e.title)[0]||"Unknown",romaji:((p=(c=e.altTitles)==null?void 0:c.find(m=>m.ja))==null?void 0:p.ja)||e.title.en,native:e.title.ja||e.title["ja-ro"]||null},description:((L=e.description)==null?void 0:L.en)||Object.values(e.description||{})[0]||"No description available from MangaDex.",coverImage:{large:n,medium:n},status:s[e.status]||"UNKNOWN",format:l,countryOfOrigin:f[e.originalLanguage]||"JP",genres:o.filter(m=>{var h;return((h=m.attributes)==null?void 0:h.group)==="genre"}).map(m=>m.attributes.name.en),chapters:e.lastChapter?parseInt(e.lastChapter):null,averageScore:null,popularity:null,startDate:e.year?{year:e.year}:null,staff:{edges:[{node:{name:{full:d}},role:"Story & Art"}]},externalLinks:[{site:"MangaDex",url:`https://mangadex.org/title/${a.id}`}]}}async function A(a,e=0){console.log(`[MangaDex] 🔍 Searching for: "${a}" (attempt ${e+1})`);const t=await W(a);if(t!==null)return t.status==="NOT_FOUND"?(console.log(`[MangaDex] ⏭️ Cache hit: "${a}" marked as NOT_FOUND, skipping`),null):(console.log(`[MangaDex] ✅ Cache hit: "${a}" - returning cached data`),t);const n=Date.now()-j;n<E&&await N(E-n),j=Date.now();let i=a;e===1&&(i=P(a,!1)),e>=2&&(i=P(a,!0));const d=`${I}/manga`,s=`title=${encodeURIComponent(i)}&limit=10&includes[]=cover_art&includes[]=author&order[relevance]=desc`,l=`${d}?${s}`;console.log(`[MangaDex] 🌐 API Request: ${l}`);try{const o=await fetch(l,{headers:{Accept:"application/json"}});if(o.status===429){if(e<x){const c=T*Math.pow(2,e);return console.warn(`MangaDex rate limited. Waiting ${c/1e3}s before retry.`),await N(c),A(a,e+1)}return console.error("MangaDex rate limit exceeded after max retries"),null}if(o.status>=500)return e<x?(await N(T*Math.pow(2,e)),A(a,e+1)):null;if(!o.ok)return console.error(`MangaDex HTTP error: ${o.status} for title: "${i}"`),e<x?A(a,e+1):null;const u=await o.json();if(!u.data||u.data.length===0)return e<x?A(a,e+1):(await k(a,{status:"NOT_FOUND",lastChecked:Date.now()}),null);const f=u.data[0],g=U(f);return console.log(`[MangaDex] ✅ Found: "${g.title.english}" (ID: ${g.mangadexId})`),console.log(`[MangaDex] 📊 Format: ${g.format}, Status: ${g.status}, Chapters: ${g.chapters||"N/A"}`),await k(a,g),g}catch(o){return console.error("Network error fetching from MangaDex:",o),e<x?(await N(T*Math.pow(2,e)),A(a,e+1)):null}}async function z(){return new Promise(a=>{chrome.storage.local.remove("mangadexCache",a)})}function G(a){if(!a)return null;const e=a.trim();if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e))return e;const r=e.match(/mangadex\.org\/list\/([0-9a-f-]{36})/i);return r?r[1]:null}async function X(a){var t,r,n,i;const e=G(a);if(!e)return{success:!1,manga:[],error:"Invalid MDList ID or URL format."};console.log(`[MangaDex] 📋 Fetching MDList: ${e}`);try{const d=`${I}/list/${e}`,s=await fetch(d,{headers:{Accept:"application/json"}});if(!s.ok)return s.status===404?{success:!1,manga:[],error:"MDList not found. Make sure the list is public."}:{success:!1,manga:[],error:`API error: ${s.status}`};const l=await s.json(),o=((r=(t=l.data)==null?void 0:t.relationships)==null?void 0:r.filter(c=>c.type==="manga"))||[];if(o.length===0)return{success:!1,manga:[],error:"MDList is empty or has no manga."};console.log(`[MangaDex] 📚 Found ${o.length} manga in list`);const u=o.map(c=>c.id),f=100,g=[];for(let c=0;c<u.length;c+=f){const L=u.slice(c,c+f).map(M=>`ids[]=${M}`).join("&"),m=`${I}/manga?${L}&includes[]=cover_art&includes[]=author&limit=${f}`;await N(E);const h=await fetch(m,{headers:{Accept:"application/json"}});if(h.ok){const b=(await h.json()).data.map(O=>U(O));g.push(...b),console.log(`[MangaDex] ✅ Fetched batch ${Math.floor(c/f)+1}: ${b.length} manga`)}}return{success:!0,manga:g,listName:((i=(n=l.data)==null?void 0:n.attributes)==null?void 0:i.name)||"Unnamed List"}}catch(d){return console.error("[MangaDex] MDList fetch error:",d),{success:!1,manga:[],error:d.message}}}export{A as a,X as b,w as f,z as w};
