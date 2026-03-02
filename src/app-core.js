import React, {useState,useEffect,useCallback,useRef,useMemo} from 'react';

// ── LOCAL STORAGE DB ─────────────────────────────────────────────────────────
const LS = {
  get(key,fallback=[]){try{const v=localStorage.getItem('sl_'+key);return v?JSON.parse(v):fallback}catch{return fallback}},
  set(key,val){try{localStorage.setItem('sl_'+key,JSON.stringify(val))}catch{}},
  // Table helpers
  all(table){return LS.get(table,[])},
  find(table,id){return LS.all(table).find(r=>r.id===id)},
  insert(table,row){const rows=LS.all(table);rows.push(row);LS.set(table,rows);return row},
  update(table,id,changes){const rows=LS.all(table).map(r=>r.id===id?{...r,...changes}:r);LS.set(table,rows)},
  remove(table,id){LS.set(table,LS.all(table).filter(r=>r.id!==id))},
  where(table,pred){return LS.all(table).filter(pred)},
};

const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const now=()=>new Date().toISOString();

// ── EMBARK HALO PALETTE (for charts & visualizations) ────────────────────────
const HALO={
  gold:'#FFCE34',blue:'#65CBFF',coral:'#FF6666',purple:'#B152E0',
  orange:'#FFAA33',green:'#98D147',pink:'#FF66CC',indigo:'#6E6EF7',
  // Ordered array for cycling through chart series
  cycle:['#FFCE34','#65CBFF','#FF6666','#B152E0','#FFAA33','#98D147','#FF66CC','#6E6EF7'],
  // Utility: return rgba version of a hex at given opacity
  rgba:(hex,a)=>{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}
};

// ── ICON HELPER ──────────────────────────────────────────────────────────────
const mIcon=(name,props={})=>React.createElement('span',{className:'material-symbols-outlined',style:{fontSize:props.size||20,verticalAlign:'middle',...props.style},...props},name);

// ── TOAST ────────────────────────────────────────────────────────────────────
const ToastCtx=React.createContext(null);
function ToastProvider({children}){
  const[toasts,set]=useState([]);
  const show=useCallback((msg,type='default')=>{
    const id=Date.now();
    set(t=>[...t,{id,msg,type}]);
    setTimeout(()=>set(t=>t.filter(x=>x.id!==id)),3000);
  },[]);
  return React.createElement(ToastCtx.Provider,{value:show},
    children,
    React.createElement('div',{className:'fixed bottom-5 right-5 z-[300] flex flex-col gap-1.75'},
      toasts.map(t=>React.createElement('div',{key:t.id,className:`toast ${t.type}`},t.msg))
    )
  );
}
const useToast=()=>React.useContext(ToastCtx);

// ── MODAL ────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children,footer}){
  return React.createElement('div',{className:'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-5',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    React.createElement('div',{className:'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col'},
      React.createElement('div',{style:{padding:'16px 24px',borderBottom:'1px solid #e5e7eb',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}},
        React.createElement('div',{style:{fontSize:17,fontWeight:700,color:'#111827',fontFamily:'Young Serif, Georgia, serif'}},title),
        React.createElement('button',{style:{background:'transparent',border:'none',cursor:'pointer',color:'#6b7280',padding:'4px 8px',borderRadius:6,fontSize:16,lineHeight:1},onClick:onClose},'✕')
      ),
      React.createElement('div',{style:{padding:'20px 24px',overflowY:'auto',flex:1}},children),
      footer&&React.createElement('div',{style:{padding:'14px 24px',borderTop:'1px solid #e5e7eb',display:'flex',justifyContent:'flex-end',gap:8,flexShrink:0}},footer)
    )
  );
}

// ── TOGGLE ───────────────────────────────────────────────────────────────────
function Toggle({label,checked,onChange}){
  const id=useRef('tg'+uid());
  return React.createElement('label',{className:'toggle',htmlFor:id.current},
    React.createElement('input',{type:'checkbox',id:id.current,checked:!!checked,onChange:e=>onChange(e.target.checked)}),
    React.createElement('span',{className:'toggle-track'}),
    label&&React.createElement('span',{className:'toggle-label'},label)
  );
}

// ── UI COMPONENT LIBRARY (shadcn-inspired) ──────────────────────────────────
const UI={
  Button:({variant='primary',size='md',disabled,onClick,children,className='',...rest})=>{
    const base='inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants={
      primary:'bg-black text-embark-gold hover:bg-gray-900 focus:ring-black',
      secondary:'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
      accent:'bg-embark-teal text-white hover:bg-embark-teal-dark focus:ring-embark-teal',
      ghost:'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
      danger:'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
      gold:'bg-embark-gold text-black hover:bg-embark-gold-dark focus:ring-embark-gold',
    };
    const sizes={sm:'px-2.5 py-1 text-xs gap-1',md:'px-4 py-2 text-sm gap-2',lg:'px-6 py-2.5 text-base gap-2'};
    return React.createElement('button',{className:`${base} ${variants[variant]||variants.primary} ${sizes[size]||sizes.md} ${className}`,disabled,onClick,...rest},children);
  },
  Card:({children,className='',header,title,noPad})=>{
    return React.createElement('div',{className:`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`},
      (header||title)&&React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},
        title&&React.createElement('h3',{className:'font-display text-base font-semibold text-gray-800'},title),
        header
      ),
      React.createElement('div',{className:noPad?'':'px-5 py-4'},children)
    );
  },
  Input:({label,error,className='',...rest})=>{
    return React.createElement('div',{className:`mb-3 ${className}`},
      label&&React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1'},label),
      React.createElement('input',{className:`w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal ${error?'border-red-300':'border-gray-300'}`,...rest}),
      error&&React.createElement('p',{className:'mt-1 text-xs text-red-500'},error)
    );
  },
  Textarea:({label,className='',...rest})=>{
    return React.createElement('div',{className:`mb-3 ${className}`},
      label&&React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1'},label),
      React.createElement('textarea',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y',...rest})
    );
  },
  Select:({label,children,className='',...rest})=>{
    return React.createElement('div',{className:`mb-3 ${className}`},
      label&&React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1'},label),
      React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',...rest},children)
    );
  },
  Badge:({variant='default',children,className=''})=>{
    const variants={
      default:'bg-gray-100 text-gray-700',
      success:'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      warning:'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      danger:'bg-red-50 text-red-700 ring-1 ring-red-200',
      info:'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
      published:'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      draft:'bg-gray-100 text-gray-600',
      paused:'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      archived:'bg-gray-100 text-gray-500',
    };
    return React.createElement('span',{className:`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${variants[variant]||variants.default} ${className}`},children);
  },
  StatCard:({label,value,sub,className=''})=>{
    return React.createElement('div',{className:`bg-white rounded-xl border border-gray-200 p-4 ${className}`},
      React.createElement('div',{className:'text-2xl font-bold text-gray-900 font-display'},value),
      React.createElement('div',{className:'text-xs font-medium text-gray-500 mt-0.5'},label),
      sub&&React.createElement('div',{className:'text-xs text-gray-400 mt-1'},sub)
    );
  },
  EmptyState:({icon,title,description,action})=>{
    return React.createElement('div',{className:'flex flex-col items-center justify-center py-16 text-center'},
      icon&&React.createElement('div',{className:'text-4xl mb-3'},icon),
      title&&React.createElement('h3',{className:'text-lg font-semibold text-gray-700 font-display mb-1'},title),
      description&&React.createElement('p',{className:'text-sm text-gray-500 max-w-sm mb-4'},description),
      action
    );
  },
  Table:({headers,rows,onRowClick,className=''})=>{
    return React.createElement('div',{className:`overflow-x-auto rounded-lg border border-gray-200 ${className}`},
      React.createElement('table',{className:'w-full text-sm'},
        React.createElement('thead',null,
          React.createElement('tr',{className:'bg-gray-50 border-b border-gray-200'},
            headers.map((h,i)=>React.createElement('th',{key:i,className:'px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'},h))
          )
        ),
        React.createElement('tbody',{className:'divide-y divide-gray-100'},
          rows.map((row,i)=>React.createElement('tr',{key:i,className:`${onRowClick?'cursor-pointer hover:bg-gray-50':''}`,onClick:onRowClick?()=>onRowClick(row,i):undefined},
            row.map((cell,j)=>React.createElement('td',{key:j,className:'px-4 py-2.5 text-gray-700'},cell))
          ))
        )
      )
    );
  },
};

// ── QUESTION TYPES ───────────────────────────────────────────────────────────
const QTYPES=[
  {type:'single_choice',label:'Single Choice',icon:'radio_button_checked'},
  {type:'multiple_select',label:'Multiple Select',icon:'check_box'},
  {type:'short_text',label:'Short Text',icon:'short_text'},
  {type:'paragraph',label:'Paragraph',icon:'notes'},
  {type:'rank',label:'Rank Order',icon:'format_list_numbered'},
  {type:'rating',label:'Numeric Scale',icon:'linear_scale'},
  {type:'card_sort_open',label:'Card Sort (Open)',icon:'view_column'},
  {type:'card_sort_closed',label:'Card Sort (Closed)',icon:'view_column'},
  {type:'context_screen',label:'Context Screen',icon:'article'},
  {type:'prototype_test',label:'Prototype Test (Figma)',icon:'devices'},
  {type:'ai_interview',label:'AI-Moderated Interview',icon:'mic'},
];

const mkQuestion=type=>({
  id:'q_'+uid(),type,text:'',required:false,helper_text:'',image_url:'',
  randomize_options:false,has_other:false,placeholder:'',
  options:['single_choice','multiple_select','rank'].includes(type)?[
    {id:'o_'+uid(),text:'Option 1'},
    {id:'o_'+uid(),text:'Option 2'},
    {id:'o_'+uid(),text:'Option 3'},
  ]:[],
  cards:['card_sort_open','card_sort_closed'].includes(type)?[
    {id:'c_'+uid(),text:'Card 1',image_url:''},
    {id:'c_'+uid(),text:'Card 2',image_url:''},
    {id:'c_'+uid(),text:'Card 3',image_url:''},
  ]:[],
  categories:type==='card_sort_closed'?[
    {id:'cat_'+uid(),name:'Category 1'},
    {id:'cat_'+uid(),name:'Category 2'},
  ]:[],
  button_text:type==='context_screen'?'Continue':'',
  body:type==='context_screen'?'':'',
  min:type==='rating'?0:undefined,
  max:type==='rating'?10:undefined,
  max_selections:type==='multiple_select'?null:undefined,
  // Prototype test fields
  figma_share_url:type==='prototype_test'?'':undefined,
  task_prompt:type==='prototype_test'?'':undefined,
  min_view_time_seconds:type==='prototype_test'?0:undefined,
  time_limit_seconds:type==='prototype_test'?null:undefined,
  success_question_enabled:type==='prototype_test'?true:undefined,
  difficulty_scale_enabled:type==='prototype_test'?true:undefined,
  open_ended_feedback_enabled:type==='prototype_test'?true:undefined,
  // AI Interview fields
  ai_objective:type==='ai_interview'?'':undefined,
  ai_duration:type==='ai_interview'?'3-5':undefined, // '1-3', '3-5', '7-9'
  ai_starter_questions:type==='ai_interview'?['']:undefined, // 1-3 predefined starter questions
  ai_tts_enabled:type==='ai_interview'?true:undefined,
  logic:[],
});

// ── SEED DEMO DATA ────────────────────────────────────────────────────────────
function seedDemo(){
  const sid=uid();
  // ── Questions covering ALL types ──
  const schema={questions:[
    // 1. Context Screen (intro)
    {id:'qcs',type:'context_screen',text:'Welcome to the Embark UX Research Study',body:'This study covers your overall experience with Embark\'s products and services. It includes a mix of question types and should take about 5 minutes.\n\nYour responses are anonymous and will help shape the future of Embark.',button_text:'Let\'s Go!',required:false,logic:[],image_url:''},
    // 2. Single Choice
    {id:'q1',type:'single_choice',text:'How satisfied are you with your Embark experience overall?',required:true,options:[{id:'o1',text:'Very satisfied'},{id:'o2',text:'Satisfied'},{id:'o3',text:'Neutral'},{id:'o4',text:'Dissatisfied'},{id:'o5',text:'Very dissatisfied'}],logic:[],has_other:false,randomize_options:false,helper_text:'Select the one that best describes your experience.'},
    // 3. Multiple Select
    {id:'q2',type:'multiple_select',text:'Which Embark features do you use most often?',required:false,options:[{id:'f1',text:'Health Reports'},{id:'f2',text:'DNA & Breed ID'},{id:'f3',text:'Relative Finder'},{id:'f4',text:'Vet Connect'},{id:'f5',text:'Community Forum'},{id:'f6',text:'Trait Insights'}],logic:[],has_other:true,randomize_options:false,helper_text:'Select all that apply.',max_selections:null},
    // 4. Rating (NPS style)
    {id:'q3',type:'rating',text:'How likely are you to recommend Embark to a friend or family member?',required:true,min:0,max:10,labels:{min:'Not at all likely',max:'Extremely likely'},logic:[]},
    // 5. Short Text
    {id:'q4',type:'short_text',text:'In a few words, what is your favorite thing about Embark?',required:false,placeholder:'e.g. breed accuracy, health insights...',logic:[],helper_text:''},
    // 6. Paragraph / Long Text
    {id:'q5',type:'paragraph',text:'What improvements would you suggest for Embark\'s products or services?',required:false,placeholder:'Share any feedback, ideas, or pain points...',logic:[],helper_text:'Be as detailed as you like.'},
    // 7. Rank Order
    {id:'q6',type:'rank',text:'Rank the following product areas by how important they are to you.',required:true,options:[{id:'r1',text:'Breed Accuracy'},{id:'r2',text:'Health Screening'},{id:'r3',text:'Speed of Results'},{id:'r4',text:'Price/Value'},{id:'r5',text:'Customer Support'}],logic:[],randomize_options:false},
    // 8. Card Sort (Closed)
    {id:'q7',type:'card_sort_closed',text:'Sort these features into the category that best describes them.',required:true,
      cards:[{id:'cs1',text:'DNA Breed ID',image_url:''},{id:'cs2',text:'Health Risk Report',image_url:''},{id:'cs3',text:'Relative Finder',image_url:''},{id:'cs4',text:'Trait Predictions',image_url:''},{id:'cs5',text:'Vet Consult Chat',image_url:''},{id:'cs6',text:'Ancestry Timeline',image_url:''},{id:'cs7',text:'Weight Predictor',image_url:''},{id:'cs8',text:'Genetic Diversity Score',image_url:''}],
      categories:[{id:'cat1',name:'Core Science'},{id:'cat2',name:'Health & Wellness'},{id:'cat3',name:'Social & Fun'}],
      logic:[]},
    // 9. Card Sort (Open)
    {id:'q8',type:'card_sort_open',text:'Group these dog traits into categories that make sense to you.',required:true,
      cards:[{id:'ot1',text:'Coat type',image_url:''},{id:'ot2',text:'Eye color',image_url:''},{id:'ot3',text:'Body size',image_url:''},{id:'ot4',text:'Energy level',image_url:''},{id:'ot5',text:'Trainability',image_url:''},{id:'ot6',text:'Friendliness',image_url:''},{id:'ot7',text:'Shedding',image_url:''},{id:'ot8',text:'Bark tendency',image_url:''},{id:'ot9',text:'Life expectancy',image_url:''},{id:'ot10',text:'Hip dysplasia risk',image_url:''}],
      categories:[],
      logic:[]},
    // 10. Prototype Test (Figma)
    {id:'qpt',type:'prototype_test',text:'Test our new Health Dashboard redesign',required:true,
      figma_share_url:'https://www.figma.com/proto/example123/Embark-Health-Dashboard',
      task_prompt:'Find your dog\'s hip dysplasia risk score and navigate to the recommended actions page.',
      min_view_time_seconds:10,time_limit_seconds:180,
      success_question_enabled:true,difficulty_scale_enabled:true,open_ended_feedback_enabled:true,
      logic:[]},
    // 11. AI Interview
    {id:'qai',type:'ai_interview',text:'Tell us about your experience with pet health testing',required:true,
      ai_objective:'Understand how pet owners discover, evaluate, and use DNA and health testing services for their dogs, including pain points and unmet needs.',
      ai_duration:'3-5',
      ai_starter_questions:['Tell me about your experience with Embark\'s DNA and health testing.','What frustrated you most about the process or the results?','If you could change one thing about how pet health testing works, what would it be?'],
      ai_tts_enabled:true,
      logic:[]},
    // 12. Final context screen
    {id:'qcse',type:'context_screen',text:'Almost done!',body:'One last question — we appreciate your time and thoughtfulness.',button_text:'Continue',required:false,logic:[],image_url:''},
    // 12. Rating (satisfaction 1-5)
    {id:'q9',type:'rating',text:'Overall, how would you rate your experience with this survey?',required:false,min:1,max:5,labels:{min:'Poor',max:'Excellent'},logic:[]},
  ],logic:[]};

  const token='demo'+uid().slice(0,10);
  LS.insert('surveys',{id:sid,title:'Embark Full Experience Study',description:'A comprehensive research study covering satisfaction, feature usage, card sorts, rankings, and open feedback.',status:'published',version:1,schema,branding:{primary_color:'#FFCE34'},thank_you_msg:'Thank you for your feedback!',thank_you_next:'Your responses will help shape the future of Embark products.',est_minutes:5,collect_email:1,show_progress:1,allow_back:1,allow_anonymous:1,token,created_at:now(),updated_at:now()});

  // ── Generate 55 respondents ──
  const satOpts=['Very satisfied','Very satisfied','Satisfied','Satisfied','Satisfied','Satisfied','Neutral','Neutral','Dissatisfied','Very dissatisfied'];
  const featPool=['Health Reports','DNA & Breed ID','Relative Finder','Vet Connect','Community Forum','Trait Insights'];
  const shortTexts=['Breed accuracy','Health insights','Easy to use','Great science','Relative finder is cool','Love the trait info','Customer support','Detailed results','Fast turnaround','Fun to explore','Genetic diversity data','Vet integration','Community aspect','Ancestry info','Value for money'];
  const longTexts=[
    'The DNA testing results were incredibly detailed and informative. I learned so much about my mixed breed.',
    'I love how easy it is to understand my dog\'s health risks. The reports are clear and actionable.',
    'The breed breakdown was fascinating and matched my dog perfectly. We always suspected some Lab in there!',
    'Customer support was very helpful when I had questions about the health screening results.',
    'The health reports give me peace of mind about my pet\'s future. Already shared with our vet.',
    'Would love more vet recommendations based on genetic results. The current ones are a bit generic.',
    'The interface is clean but could use better mobile optimization. Hard to read charts on my phone.',
    'Amazing product — it changed how I understand my dog\'s needs. Worth every penny.',
    'Wish there were more educational resources about rare breeds. My dog has some unusual ancestry.',
    'Very accurate predictions, impressed with the science behind it. The research papers linked are great.',
    'Great customer service experience overall. Quick response times and knowledgeable staff.',
    'I appreciate the health screening but would love more detail on dietary recommendations.',
    'Would be nice to track changes in health markers over time with annual re-testing.',
    'My vet was impressed by the detailed breed analysis. Uses it for care planning now.',
    'The relative finder feature connected us with another owner of our dog\'s sibling — incredible!',
    'Results took a bit longer than expected but the depth of information made up for it.',
    'The trait predictions were spot on — our dog\'s coat, size, and energy level all matched.',
    'Price seems high compared to competitors but quality and depth justify it in my opinion.',
    'Love the new ancestry timeline feature. Seeing the breed history visually is really engaging.',
    'The genetic diversity score was a nice touch. Hadn\'t seen that from other testing services.',
  ];
  // Closed card sort: realistic placements of 8 cards into 3 categories
  const closedSortPatterns=[
    // Pattern A: most common grouping
    {cat1:['cs1','cs6','cs8'],cat2:['cs2','cs5','cs7'],cat3:['cs3','cs4']},
    // Pattern B: slight variation
    {cat1:['cs1','cs4','cs8'],cat2:['cs2','cs5','cs7'],cat3:['cs3','cs6']},
    // Pattern C
    {cat1:['cs1','cs6'],cat2:['cs2','cs5','cs7','cs8'],cat3:['cs3','cs4']},
    // Pattern D
    {cat1:['cs1','cs8'],cat2:['cs2','cs4','cs5','cs7'],cat3:['cs3','cs6']},
    // Pattern E
    {cat1:['cs1','cs4','cs6','cs8'],cat2:['cs2','cs5','cs7'],cat3:['cs3']},
  ];
  // Open card sort: respondents create their own categories
  const openSortPatterns=[
    {catNames:{oc1:'Appearance',oc2:'Behavior',oc3:'Health'},placements:{oc1:['ot1','ot2','ot3','ot7'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot9','ot10']}},
    {catNames:{oc1:'Physical Traits',oc2:'Personality',oc3:'Medical'},placements:{oc1:['ot1','ot2','ot3','ot7'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot9','ot10']}},
    {catNames:{oc1:'Looks',oc2:'Temperament',oc3:'Health Risks'},placements:{oc1:['ot1','ot2','ot3'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot7','ot9','ot10']}},
    {catNames:{oc1:'Appearance',oc2:'Behavior & Energy',oc3:'Health & Lifespan'},placements:{oc1:['ot1','ot2','ot3','ot7'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot9','ot10']}},
    {catNames:{oc1:'Physical',oc2:'Mental',oc3:'Medical',oc4:'Grooming'},placements:{oc1:['ot2','ot3'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot9','ot10'],oc4:['ot1','ot7']}},
    {catNames:{oc1:'Body',oc2:'Personality',oc3:'Health'},placements:{oc1:['ot1','ot2','ot3','ot7'],oc2:['ot4','ot5','ot6','ot8'],oc3:['ot9','ot10']}},
    {catNames:{oc1:'Visual Traits',oc2:'Behavioral Traits',oc3:'Wellness'},placements:{oc1:['ot1','ot2','ot3'],oc2:['ot4','ot5','ot6','ot7','ot8'],oc3:['ot9','ot10']}},
  ];
  const rankIds=['r1','r2','r3','r4','r5'];

  for(let i=0;i<55;i++){
    const sessId=uid();
    const daysAgo=Math.random()*30;
    const start=new Date(Date.now()-daysAgo*24*60*60*1000);
    const ms=Math.floor(120000+Math.random()*360000);
    const submitted=new Date(start.getTime()+ms);
    const session={id:sessId,survey_id:sid,survey_version:1,status:'completed',device_type:Math.random()>.4?'mobile':'desktop',browser:Math.random()>.5?'Chrome':'Safari',completion_ms:ms,started_at:start.toISOString(),submitted_at:submitted.toISOString(),respondent_email:Math.random()>.7?`user${i}@example.com`:null,last_question_idx:schema.questions.length-1};
    LS.insert('sessions',session);
    const at=submitted.toISOString();

    // Q1: Single Choice
    const sat=satOpts[Math.floor(Math.random()*satOpts.length)];
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q1',question_type:'single_choice',raw_value:sat,text_value:sat,numeric_value:null,answered_at:at});

    // Q2: Multiple Select
    const nf=1+Math.floor(Math.random()*4);
    const feats=[...featPool].sort(()=>Math.random()-.5).slice(0,nf);
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q2',question_type:'multiple_select',raw_value:feats,text_value:feats.join(', '),numeric_value:null,answered_at:at});

    // Q3: Rating (NPS 0-10)
    const nps=Math.floor(Math.random()<.15?Math.random()*5:5+Math.random()*6);
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q3',question_type:'rating',raw_value:nps,text_value:String(nps),numeric_value:nps,answered_at:at});

    // Q4: Short Text
    if(Math.random()>.2){
      const st=shortTexts[Math.floor(Math.random()*shortTexts.length)];
      LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q4',question_type:'short_text',raw_value:st,text_value:st,numeric_value:null,answered_at:at});
    }

    // Q5: Paragraph
    if(Math.random()>.25){
      const lt=longTexts[Math.floor(Math.random()*longTexts.length)];
      LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q5',question_type:'paragraph',raw_value:lt,text_value:lt,numeric_value:null,answered_at:at});
    }

    // Q6: Rank Order (shuffle to simulate different orderings with bias)
    const ranked=[...rankIds];
    // Bias: r2 (Health Screening) and r1 (Breed Accuracy) tend to rank high
    for(let j=ranked.length-1;j>0;j--){const k=Math.floor(Math.random()*(j+1));[ranked[j],ranked[k]]=[ranked[k],ranked[j]];}
    if(Math.random()>.5&&ranked.indexOf('r2')>1){const idx=ranked.indexOf('r2');ranked.splice(idx,1);ranked.unshift('r2');}
    if(Math.random()>.6&&ranked.indexOf('r1')>1){const idx=ranked.indexOf('r1');ranked.splice(idx,1);ranked.splice(1,0,'r1');}
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q6',question_type:'rank',raw_value:ranked,text_value:ranked.join(', '),numeric_value:null,answered_at:at});

    // Q7: Card Sort (Closed)
    const cp=closedSortPatterns[Math.floor(Math.random()*closedSortPatterns.length)];
    const closedVal={categories:{cat1:[...cp.cat1],cat2:[...cp.cat2],cat3:[...cp.cat3]},catNames:{},uncategorized:[]};
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q7',question_type:'card_sort_closed',raw_value:closedVal,text_value:JSON.stringify(closedVal),numeric_value:null,answered_at:at});

    // Q8: Card Sort (Open)
    const op=openSortPatterns[Math.floor(Math.random()*openSortPatterns.length)];
    const openVal={categories:{...op.placements},catNames:{...op.catNames},uncategorized:[]};
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q8',question_type:'card_sort_open',raw_value:openVal,text_value:JSON.stringify(openVal),numeric_value:null,answered_at:at});

    // QPT: Prototype Test
    const ptFeedbacks=['The navigation was intuitive but the risk score was hard to find at first.','Loved the new layout! Much cleaner than before.','I wasn\'t sure what the "Recommended Actions" page was called in the nav.','The hip dysplasia section was easy to find, but the recommended actions took a minute.','Very smooth experience overall. The color coding of risk levels was helpful.','A bit confusing — I clicked on the wrong section first.','Great design, but the text was a bit small on mobile.','Found everything quickly. The dashboard is well organized.','The search function would help here, I had to scroll a lot.','Clean and professional look. Some icons could be clearer.','I got lost trying to find the actions page, maybe add breadcrumbs?','Everything was straightforward, no issues at all.'];
    const ptCompleted=Math.random()>0.2?'yes':'no';
    const ptDiff=[1,1,2,2,2,3,3,3,3,4,4,5][Math.floor(Math.random()*12)];
    const ptTimeMs=Math.floor((15+Math.random()*120)*1000);
    const ptVal={
      prototype_loaded_at:new Date(Date.now()-Math.random()*1000*60).toISOString(),
      task_started_at:new Date(Date.now()-ptTimeMs).toISOString(),
      task_completed_at:new Date().toISOString(),
      time_in_block_ms:ptTimeMs+Math.floor(Math.random()*5000),
      time_on_task_ms:ptTimeMs,
      completion_self_report:ptCompleted,
      difficulty_rating:ptDiff,
      open_text_feedback:Math.random()>0.25?ptFeedbacks[Math.floor(Math.random()*ptFeedbacks.length)]:'',
      device_type:Math.random()>0.3?'desktop':'mobile',
      viewport_size:Math.random()>0.3?'1440x900':'375x812'
    };
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'qpt',question_type:'prototype_test',raw_value:ptVal,text_value:JSON.stringify(ptVal),numeric_value:null,answered_at:at});

    // QAI: AI Interview
    const aiUserResponses=[
      'I really enjoyed the process. The DNA results were fascinating — we found out our rescue has some unexpected breeds in the mix.',
      'The health screening was the main reason I bought the kit. I wanted to know about potential genetic risks.',
      'I found the waiting time a bit long. It took about 3 weeks to get results, and I was checking every day.',
      'The results interface is great on desktop but a bit hard to navigate on my phone.',
      'I learned about Embark through a friend who had tested their dog. Word of mouth was really effective.',
      'The pricing felt steep at first, but the depth of information justified it completely.',
      'I wish there were more actionable recommendations based on the health results. Like specific diet or exercise plans.',
      'Customer support was excellent when I had questions about interpreting the genetic diversity results.',
      'The relative finder feature was a fun surprise — we connected with another family that has our dog\'s sibling!',
      'I was frustrated that some health markers showed as "at risk" without clear guidance on what to do next.',
      'The breed breakdown was incredibly accurate. We suspected Lab and German Shepherd, and those were the top two.',
      'I think the biggest improvement would be integration with my vet\'s system so they can see the results directly.',
    ];
    const aiFollowUps=[
      'That\'s really interesting! Can you tell me more about what surprised you in the breed results?',
      'I understand the concern about waiting. How did you feel when you finally received the results?',
      'That\'s a great point about mobile navigation. What specifically was difficult on your phone?',
      'Can you tell me more about what kind of actionable recommendations you were hoping for?',
      'How has knowing about the genetic risks changed how you care for your dog?',
    ];
    const aiDurationMs=Math.floor((120+Math.random()*180)*1000);
    const numExchanges=4+Math.floor(Math.random()*4);
    const aiTranscript=[];
    for(let e=0;e<numExchanges;e++){
      if(e<3){
        aiTranscript.push({role:'ai',text:['Tell me about your experience with Embark\'s DNA and health testing.','What frustrated you most about the process or the results?','If you could change one thing about how pet health testing works, what would it be?'][e]||aiFollowUps[e%aiFollowUps.length],ts:new Date(Date.now()-aiDurationMs+e*30000).toISOString()});
      }else{
        aiTranscript.push({role:'ai',text:aiFollowUps[Math.floor(Math.random()*aiFollowUps.length)],ts:new Date(Date.now()-aiDurationMs+e*30000).toISOString()});
      }
      aiTranscript.push({role:'user',text:aiUserResponses[Math.floor(Math.random()*aiUserResponses.length)],ts:new Date(Date.now()-aiDurationMs+e*30000+15000).toISOString()});
    }
    const aiVal={
      started_at:new Date(Date.now()-aiDurationMs).toISOString(),
      completed_at:new Date().toISOString(),
      duration_ms:aiDurationMs,
      total_exchanges:aiTranscript.length,
      transcript:aiTranscript,
      device_type:Math.random()>0.3?'desktop':'mobile'
    };
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'qai',question_type:'ai_interview',raw_value:aiVal,text_value:JSON.stringify(aiVal),numeric_value:null,answered_at:at});

    // Q9: Rating (survey experience 1-5)
    const sexp=Math.floor(3+Math.random()*3);
    LS.insert('answers',{id:uid(),session_id:sessId,survey_id:sid,question_id:'q9',question_type:'rating',raw_value:sexp,text_value:String(sexp),numeric_value:sexp,answered_at:at});
  }

  // Add a few partial/in-progress sessions for drop-off data
  for(let i=0;i<8;i++){
    const sessId=uid();
    const start=new Date(Date.now()-Math.random()*14*24*60*60*1000);
    const dropIdx=Math.floor(Math.random()*6);
    LS.insert('sessions',{id:sessId,survey_id:sid,survey_version:1,status:'in_progress',device_type:Math.random()>.5?'mobile':'desktop',browser:'Chrome',started_at:start.toISOString(),last_question_idx:dropIdx});
  }

  return {survey_id:sid,token};
}

// ── SURVEY BUILDER ────────────────────────────────────────────────────────────
function SurveyBuilder({surveyId,onBack,onPublished}){
  const toast=useToast();
  const[survey,setSurvey]=useState(null);
  const[selQ,setSelQ]=useState(null);
  const[tab,setTab]=useState('questions');
  const[publishModal,setPublishModal]=useState(null);
  const[editWarning,setEditWarning]=useState(false);
  const[updateWarningModal,setUpdateWarningModal]=useState(false);
  const saveRef=useRef(null);
  const surveyRef=useRef(null);
  const[dragState,setDragState]=useState({dragIdx:null,overIdx:null});

  useEffect(()=>{
    const s=LS.find('surveys',surveyId);
    if(s){if(!s.schema.questions)s.schema.questions=[];setSurvey(s);surveyRef.current=s;if(s.status==='published')setEditWarning(true);}
  },[surveyId]);

  const persist=useCallback((s)=>{
    // Full replacement (not merge) to ensure all nested schema data is saved
    const allSurveys=LS.all('surveys');
    const idx=allSurveys.findIndex(r=>r.id===s.id);
    if(idx>=0)allSurveys[idx]=s;
    else allSurveys.push(s);
    LS.set('surveys',allSurveys);
  },[]);

  // Debounced save for text input changes (typing), immediate save for structural changes
  const debouncedPersist=(next)=>{
    clearTimeout(saveRef.current);
    saveRef.current=setTimeout(()=>persist(next),600);
  };
  const immediatePersist=(next)=>{
    clearTimeout(saveRef.current);
    persist(next);
  };

  const update=useCallback((changes)=>{
    setSurvey(prev=>{
      const next={...prev,...changes,updated_at:now()};
      surveyRef.current=next;
      debouncedPersist(next);
      return next;
    });
  },[persist]);

  const updateSchema=useCallback((sc)=>{
    setSurvey(prev=>{
      const next={...prev,schema:{...prev.schema,...sc},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
  },[persist]);

  const addQ=(type)=>{
    const q=mkQuestion(type);
    setSurvey(prev=>{
      const qs=[...(prev.schema.questions||[]),q];
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
    setSelQ(q.id);
  };

  const updQ=(qid,changes)=>{
    setSurvey(prev=>{
      const qs=prev.schema.questions.map(q=>q.id===qid?{...q,...changes}:q);
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
  };

  const delQ=(qid)=>{
    setSurvey(prev=>{
      const qs=prev.schema.questions.filter(q=>q.id!==qid);
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
    if(selQ===qid)setSelQ(null);
  };

  const moveQ=(idx,dir)=>{
    setSurvey(prev=>{
      const qs=[...prev.schema.questions];
      const ni=idx+dir;
      if(ni<0||ni>=qs.length)return prev;
      [qs[idx],qs[ni]]=[qs[ni],qs[idx]];
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
  };

  const reorderQ=(fromIdx,toIdx)=>{
    if(fromIdx===toIdx)return;
    setSurvey(prev=>{
      const qs=[...prev.schema.questions];
      const [moved]=qs.splice(fromIdx,1);
      qs.splice(toIdx,0,moved);
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      surveyRef.current=next;
      immediatePersist(next);
      return next;
    });
  };

  const dupQ=(qid)=>{
    setSurvey(prev=>{
      const idx=prev.schema.questions.findIndex(q=>q.id===qid);
      if(idx<0)return prev;
      const copy={...prev.schema.questions[idx],id:'q_'+uid()};
      const qs=[...prev.schema.questions.slice(0,idx+1),copy,...prev.schema.questions.slice(idx+1)];
      const next={...prev,schema:{...prev.schema,questions:qs},updated_at:now()};
      immediatePersist(next);
      return next;
    });
  };

  const doPublish=()=>{
    if(!survey)return;
    const s=surveyRef.current||survey;
    const token=s.token||('s'+uid().slice(0,14));
    const newV=s.status==='published'?s.version+1:s.version;
    const updated={...s,status:'published',version:newV,token,updated_at:now(),_preview:undefined};
    // Force full replacement in localStorage
    const allSurveys=LS.all('surveys');
    const idx=allSurveys.findIndex(r=>r.id===s.id);
    if(idx>=0)allSurveys[idx]=updated;
    else allSurveys.push(updated);
    LS.set('surveys',allSurveys);
    setSurvey(updated);
    surveyRef.current=updated;
    const shareUrl=window.location.href.split('?')[0]+'?respond='+token;
    setPublishModal({token,shareUrl,version:newV,surveyId:updated.id});
    toast('Survey published! Redirecting to analytics…','success');
  };

  const publish=()=>{
    if(!survey)return;
    if(survey.status==='published'){
      // Schema diff: check if any existing question with answers has structural changes
      const prevSaved=LS.find('surveys',survey.id);
      const prevQs=(prevSaved?.schema?.questions||[]);
      const newQs=(survey.schema?.questions||[]);
      const schemaFingerprint=q=>JSON.stringify({type:q.type,options:(q.options||[]).map(o=>o.text||o),min:q.min,max:q.max,cards:(q.cards||[]).map(c=>c.text||c),categories:(q.categories||[]).map(c=>c.label||c)});
      const hasAnswers=qId=>LS.where('answers',a=>a.question_id===qId).length>0;
      const changed=prevQs.some(pq=>{
        const nq=newQs.find(q=>q.id===pq.id);
        if(!nq)return false; // deleted question — don't warn on delete
        return schemaFingerprint(pq)!==schemaFingerprint(nq)&&hasAnswers(pq.id);
      });
      if(changed){
        setUpdateWarningModal(true);
        return;
      }
    }
    doPublish();
  };

  if(!survey)return React.createElement('div',{style:{padding:40,textAlign:'center',color:'var(--gray-400)'}},'Loading...');
  const questions=survey.schema?.questions||[];
  const selQuestion=questions.find(q=>q.id===selQ);

  return React.createElement('div',{style:{display:'flex',flexDirection:'column',height:'calc(100vh - 56px)'}},
    // Top bar
    React.createElement('div',{className:'bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-2.5 sticky top-0 z-10'},
      React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',onClick:onBack},mIcon('arrow_back',{size:18}),' Back'),
      React.createElement('input',{className:'border-none bg-transparent text-lg font-semibold text-gray-900 flex-1 outline-none px-1 rounded-md focus:bg-gray-50',value:survey.title||'',onChange:e=>update({title:e.target.value}),placeholder:'Survey title...'}),
      React.createElement('div',{style:{display:'flex',gap:6,marginLeft:'auto',alignItems:'center'}},
        React.createElement('span',{className:`badge badge-${survey.status}`},survey.status),
        React.createElement('div',{style:{display:'flex',background:'var(--gray-100)',borderRadius:6,padding:2}},
          ['questions','settings','logic'].map(t=>React.createElement('button',{key:t,className:`btn btn-sm ${tab===t?'btn-primary':'btn-ghost'}`,onClick:()=>setTab(t),style:{padding:'4px 10px',textTransform:'capitalize'}},t))
        ),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',title:'Preview survey in new tab',onClick:()=>{
          // Use surveyRef to guarantee latest React state (avoids closure stale-capture)
          const s=surveyRef.current||survey;
          const previewToken=s.token||('prev'+s.id.slice(-8));
          // Synchronously flush any pending debounced save
          clearTimeout(saveRef.current);
          const savedForPreview={...s,token:previewToken,updated_at:now()};
          // Force full replacement in localStorage (not just a merge)
          const allSurveys=LS.all('surveys');
          const idx=allSurveys.findIndex(r=>r.id===s.id);
          if(idx>=0)allSurveys[idx]=savedForPreview;
          else allSurveys.push(savedForPreview);
          LS.set('surveys',allSurveys);
          if(!s.token){setSurvey(savedForPreview);surveyRef.current=savedForPreview;}
          const base=window.location.href.split('?')[0];
          // Add _t= timestamp so every click opens a fresh tab (never reuses a stale cached one)
          window.open(base+'?respond='+previewToken+'&_preview=1&_t='+Date.now(),'_blank');
        }},[mIcon('open_in_new',{size:16}),' Preview']),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-2.5 py-1.5 text-xs',onClick:publish},survey.status==='published'?[mIcon('refresh',{size:16}),' Update']:[mIcon('rocket_launch',{size:16}),' Publish'])
      )
    ),
    // Edit warning banner (only for already-published surveys)
    editWarning&&React.createElement('div',{className:'bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-3'},
      mIcon('warning',{size:18,style:{color:'#b45309'}}),
      React.createElement('span',{className:'text-sm text-amber-800 flex-1'},React.createElement('strong',null,'Live study — '),
        'This survey has already collected responses. Editing questions or options may affect analytics consistency for previously collected data.'
      ),
      React.createElement('button',{className:'text-amber-700 hover:text-amber-900 border-none bg-transparent cursor-pointer p-1',onClick:()=>setEditWarning(false)},mIcon('close',{size:16}))
    ),
    // 3-col layout
    React.createElement('div',{className:'grid grid-cols-[240px_1fr_280px] overflow-hidden',style:{flex:1,height:editWarning?'calc(100vh-56px - 48px)':'calc(100vh-56px)'}},
      // Left
      React.createElement('div',{className:'bg-white border-r border-gray-200 overflow-y-auto'},
        React.createElement('div',{className:'px-3.5 py-3.5 border-b border-gray-200'},
          React.createElement('div',{className:'text-xs font-semibold text-gray-400 text-transform uppercase tracking-wide mb-2.5'},'Add Questions'),
          QTYPES.map(qt=>React.createElement('button',{key:qt.type,className:'flex items-center gap-2 w-full px-2.5 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 mb-1.5 transition-all cursor-pointer hover:bg-embark-teal-light hover:border-embark-teal hover:text-embark-teal-dark',onClick:()=>addQ(qt.type)},
            mIcon(qt.icon,{size:16}),qt.label
          ))
        ),
        React.createElement('div',{className:'px-3.5 py-3.5 border-b border-gray-200'},
          React.createElement('div',{className:'text-xs font-semibold text-gray-400 text-transform uppercase tracking-wide mb-2.5'},'Survey'),
          React.createElement('div',{className:'text-sm text-gray-500'},`${questions.length} questions`),
          React.createElement('div',{className:'text-xs text-gray-500',style:{marginTop:4}},`Required: ${questions.filter(q=>q.required).length}`)
        )
      ),
      // Canvas
      React.createElement('div',{className:'overflow-y-auto bg-gray-50'},
        React.createElement('div',{className:'px-5 py-5 max-w-2xl mx-auto'},
          React.createElement('div',{className:'bg-gray-100 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 mb-2.5'},
            React.createElement('div',{className:'text-xs font-semibold text-gray-500 text-transform uppercase tracking-wide mb-1'},mIcon('waving_hand',{size:14}),' Welcome Screen'),
            React.createElement('input',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:survey.title||'',onChange:e=>update({title:e.target.value}),placeholder:'Survey title shown to respondents'}),
            React.createElement('textarea',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y min-h-20',style:{marginTop:8},value:survey.description||'',onChange:e=>update({description:e.target.value}),placeholder:'Brief intro for respondents...',rows:2})
          ),
          questions.length===0&&React.createElement('div',{className:'text-center px-5 py-16 text-gray-400'},
            React.createElement('div',{className:'text-6xl mb-3'},mIcon('edit_note',{size:48})),
            React.createElement('h3',null,'Add your first question'),
            React.createElement('p',null,'Use the panel on the left')
          ),
          questions.map((q,idx)=>React.createElement('div',{
            key:q.id,
            draggable:true,
            className:[
              'q-block',
              selQ===q.id?'selected':'',
              dragState.dragIdx===idx?'dragging':'',
              dragState.overIdx===idx&&dragState.dragIdx!==idx?(dragState.dragIdx<idx?'drag-over-bottom':'drag-over-top'):''
            ].filter(Boolean).join(' '),
            onClick:()=>setSelQ(q.id),
            onDragStart:e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(idx));setDragState({dragIdx:idx,overIdx:null});},
            onDragOver:e=>{e.preventDefault();e.dataTransfer.dropEffect='move';if(dragState.overIdx!==idx)setDragState(s=>({...s,overIdx:idx}));},
            onDragLeave:e=>{setDragState(s=>({...s,overIdx:null}));},
            onDrop:e=>{e.preventDefault();const from=parseInt(e.dataTransfer.getData('text/plain'),10);reorderQ(from,idx);setDragState({dragIdx:null,overIdx:null});},
            onDragEnd:e=>{setDragState({dragIdx:null,overIdx:null});},
          },
            React.createElement('div',{className:'q-block-actions'},
              React.createElement('button',{title:'Duplicate',className:'p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 border-none bg-transparent cursor-pointer',onClick:e=>{e.stopPropagation();dupQ(q.id)}},mIcon('content_copy',{size:16}))
            ),
            React.createElement('button',{title:'Delete question',className:'absolute top-2 right-2 p-1.5 rounded text-red-400 hover:bg-red-50 hover:text-red-600 border-none bg-transparent cursor-pointer',onClick:e=>{e.stopPropagation();delQ(q.id)}},mIcon('delete',{size:16})),
            React.createElement('div',{style:{display:'flex',gap:6,alignItems:'flex-start',marginBottom:8}},
              React.createElement('span',{className:'q-drag-handle',title:'Drag to reorder',style:{marginTop:2},onMouseDown:e=>e.stopPropagation()},mIcon('drag_indicator',{size:18})),
              React.createElement('div',{style:{flex:1,minWidth:0}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6,marginBottom:4}},
                  React.createElement('span',{className:'text-xs font-semibold text-black bg-embark-gold-light px-1.5 py-0.5 rounded flex-shrink-0'},`Q${idx+1}`),
                  React.createElement('span',{style:{fontSize:11,fontWeight:600,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.05em'}},QTYPES.find(t=>t.type===q.type)?.label+(q.required?' · Required':''))
                ),
                React.createElement('textarea',{
                  className:'w-full border-none bg-transparent text-sm font-medium text-gray-900 outline-none leading-relaxed resize-none placeholder:text-gray-400',
                  value:q.text,
                  onChange:e=>updQ(q.id,{text:e.target.value}),
                  placeholder:'Question text...',
                  rows:2,
                  style:{minHeight:'auto',resize:'none',border:'none',background:'transparent',fontSize:14,fontWeight:500,padding:0,width:'100%',display:'block'},
                  onClick:e=>e.stopPropagation()
                })
              )
            ),
            // Choice options
            (q.type==='single_choice'||q.type==='multiple_select')&&React.createElement('div',{style:{paddingLeft:26}},
              q.options.map((opt,oi)=>React.createElement('div',{key:opt.id,className:'flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-gray-300 transition-colors'},
                React.createElement('div',{className:`opt-dot${q.type==='multiple_select'?' sq':''}`}),
                React.createElement('input',{
                  className:'flex-1 border-none bg-transparent text-sm text-gray-700 px-1 py-0.5 outline-none',value:opt.text,
                  onChange:e=>updQ(q.id,{options:q.options.map((o,i)=>i===oi?{...o,text:e.target.value}:o)}),
                  placeholder:`Option ${oi+1}`,onClick:e=>e.stopPropagation()
                }),
                React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',style:{color:'var(--gray-400)',padding:'1px 5px'},onClick:e=>{e.stopPropagation();updQ(q.id,{options:q.options.filter((_,i)=>i!==oi)})}},mIcon('close',{size:14}))
              )),
              React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',onClick:e=>{e.stopPropagation();updQ(q.id,{options:[...q.options,{id:'o_'+uid(),text:''}]})}},mIcon('add',{size:16}),' Add option'),
              React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',style:{marginLeft:10},onClick:e=>{e.stopPropagation();updQ(q.id,{has_other:!q.has_other})}},q.has_other?[mIcon('close',{size:16}),' Remove "Other"']:[mIcon('add',{size:16}),' "Other" option'])
            ),
            // Rank items editor (same pattern as choice options)
            q.type==='rank'&&React.createElement('div',{style:{paddingLeft:26,marginTop:4}},
              q.options.map((opt,oi)=>React.createElement('div',{key:opt.id,className:'flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-gray-300 transition-colors'},
                mIcon('drag_indicator',{size:16,style:{color:'#9ca3af'}}),
                React.createElement('input',{
                  className:'flex-1 border-none bg-transparent text-sm text-gray-700 px-1 py-0.5 outline-none',value:opt.text,
                  onChange:e=>updQ(q.id,{options:q.options.map((o,i)=>i===oi?{...o,text:e.target.value}:o)}),
                  placeholder:`Item ${oi+1}`,onClick:e=>e.stopPropagation()
                }),
                React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',style:{color:'var(--gray-400)',padding:'1px 5px'},onClick:e=>{e.stopPropagation();updQ(q.id,{options:q.options.filter((_,i)=>i!==oi)})}},mIcon('close',{size:14}))
              )),
              React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',onClick:e=>{e.stopPropagation();updQ(q.id,{options:[...q.options,{id:'o_'+uid(),text:''}]})}},mIcon('add',{size:16}),' Add item')
            ),
            // Card sort preview
            ['card_sort_open','card_sort_closed'].includes(q.type)&&React.createElement('div',{style:{paddingLeft:26,marginTop:12}},
              // Cards — inline editable
              React.createElement('div',{style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:12,marginBottom:8}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
                  React.createElement('div',{className:'text-xs font-semibold text-gray-500'},`Cards (${q.cards?.length||0})`),
                  React.createElement('button',{
                    className:'flex items-center gap-1 text-xs text-embark-teal bg-transparent border-none cursor-pointer hover:underline',
                    onClick:e=>{e.stopPropagation();updQ(q.id,{cards:[...(q.cards||[]),{id:'c_'+uid(),text:'New card',image_url:''}]});}
                  },mIcon('add',{size:14}),' Add card')
                ),
                React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
                  (q.cards||[]).map((c,ci)=>React.createElement('div',{key:c.id,style:{position:'relative',background:'white',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 24px 6px 8px',fontSize:12}},
                    React.createElement('input',{
                      value:c.text,
                      onChange:e=>{e.stopPropagation();updQ(q.id,{cards:q.cards.map((x,j)=>j===ci?{...x,text:e.target.value}:x)});},
                      onClick:e=>e.stopPropagation(),
                      style:{border:'none',background:'transparent',fontSize:12,color:'#374151',outline:'none',width:Math.max(60,c.text.length*7)+'px',maxWidth:140}
                    }),
                    React.createElement('button',{
                      onClick:e=>{e.stopPropagation();updQ(q.id,{cards:q.cards.filter((_,j)=>j!==ci)});},
                      style:{position:'absolute',top:2,right:2,background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:2,lineHeight:1,display:'flex'}
                    },mIcon('close',{size:12}))
                  ))
                )
              ),
              // Categories — inline editable (closed sort only)
              q.type==='card_sort_closed'&&React.createElement('div',{style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:12}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}},
                  React.createElement('div',{className:'text-xs font-semibold text-gray-500'},`Categories (${q.categories?.length||0})`),
                  React.createElement('button',{
                    className:'flex items-center gap-1 text-xs text-embark-teal bg-transparent border-none cursor-pointer hover:underline',
                    onClick:e=>{e.stopPropagation();updQ(q.id,{categories:[...(q.categories||[]),{id:'cat_'+uid(),name:'New Category'}]});}
                  },mIcon('add',{size:14}),' Add category')
                ),
                React.createElement('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
                  (q.categories||[]).map((cat,ci)=>React.createElement('div',{key:cat.id,style:{position:'relative',background:'white',border:'1px solid #d1d5db',borderRadius:6,padding:'6px 24px 6px 8px',fontSize:12}},
                    React.createElement('input',{
                      value:cat.name,
                      onChange:e=>{e.stopPropagation();updQ(q.id,{categories:q.categories.map((x,j)=>j===ci?{...x,name:e.target.value}:x)});},
                      onClick:e=>e.stopPropagation(),
                      style:{border:'none',background:'transparent',fontSize:12,color:'#374151',outline:'none',width:Math.max(80,cat.name.length*7)+'px',maxWidth:160}
                    }),
                    React.createElement('button',{
                      onClick:e=>{e.stopPropagation();updQ(q.id,{categories:q.categories.filter((_,j)=>j!==ci)});},
                      style:{position:'absolute',top:2,right:2,background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:2,lineHeight:1,display:'flex'}
                    },mIcon('close',{size:12}))
                  ))
                )
              )
            ),
            // Context screen preview
            q.type==='context_screen'&&React.createElement('div',{style:{paddingLeft:26,marginTop:12,background:'var(--embark-gold-light)',border:'1px solid #fbbf24',borderRadius:6,padding:12}},
              React.createElement('div',{className:'text-xs font-semibold text-gray-700 mb-2'},'Context Screen'),
              q.body&&React.createElement('p',{style:{fontSize:12,color:'var(--gray-600)',whiteSpace:'pre-wrap',marginBottom:8}},q.body.slice(0,100)+(q.body.length>100?'...':'')),
              React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-2.5 py-1.5 text-xs',disabled:true},q.button_text||'Continue')
            ),
            // Prototype test preview
            q.type==='prototype_test'&&React.createElement('div',{style:{paddingLeft:26,marginTop:12}},
              React.createElement('div',{style:{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:8,padding:12}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
                  mIcon('devices',{size:18,style:{color:'#0284c7'}}),
                  React.createElement('span',{className:'text-xs font-semibold text-sky-700'},'Figma Prototype Test')
                ),
                q.figma_share_url?React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:11,color:'#6b7280',marginBottom:4}},'Figma URL:'),
                  React.createElement('div',{style:{fontSize:12,color:'#0284c7',wordBreak:'break-all',marginBottom:8}},q.figma_share_url),
                  React.createElement('div',{style:{background:'#e0f2fe',borderRadius:6,padding:'20px 16px',textAlign:'center',fontSize:12,color:'#0369a1'}},mIcon('play_circle',{size:28,style:{color:'#0284c7',display:'block',margin:'0 auto 4px'}}),'Prototype will be embedded here')
                ):React.createElement('div',{style:{fontSize:12,color:'#9ca3af',fontStyle:'italic'}},'No Figma URL set — configure in settings panel →'),
                q.task_prompt&&React.createElement('div',{style:{marginTop:8,fontSize:12,color:'#374151',background:'white',border:'1px solid #e5e7eb',borderRadius:6,padding:'6px 10px'}},
                  React.createElement('strong',null,'Task: '),q.task_prompt
                ),
                React.createElement('div',{style:{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}},
                  q.success_question_enabled&&React.createElement('span',{style:{fontSize:10,color:'#16a34a',background:'#f0fdf4',padding:'2px 8px',borderRadius:10}},'✓ Success Q'),
                  q.difficulty_scale_enabled&&React.createElement('span',{style:{fontSize:10,color:'#9333ea',background:'#faf5ff',padding:'2px 8px',borderRadius:10}},'✓ Difficulty Scale'),
                  q.open_ended_feedback_enabled&&React.createElement('span',{style:{fontSize:10,color:'#ea580c',background:'#fff7ed',padding:'2px 8px',borderRadius:10}},'✓ Open Feedback'),
                  q.min_view_time_seconds>0&&React.createElement('span',{style:{fontSize:10,color:'#6b7280',background:'#f3f4f6',padding:'2px 8px',borderRadius:10}},`Min ${q.min_view_time_seconds}s`),
                  q.time_limit_seconds&&React.createElement('span',{style:{fontSize:10,color:'#dc2626',background:'#fef2f2',padding:'2px 8px',borderRadius:10}},`Limit ${q.time_limit_seconds}s`)
                )
              )
            ),
            // AI Interview preview
            q.type==='ai_interview'&&React.createElement('div',{style:{paddingLeft:26,marginTop:12}},
              React.createElement('div',{style:{background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:8,padding:12}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
                  mIcon('mic',{size:18,style:{color:'#9333ea'}}),
                  React.createElement('span',{className:'text-xs font-semibold',style:{color:'#7c3aed'}},'AI-Moderated Voice Interview')
                ),
                q.ai_objective?React.createElement('div',{style:{fontSize:12,color:'#374151',background:'white',border:'1px solid #e5e7eb',borderRadius:6,padding:'6px 10px',marginBottom:8}},
                  React.createElement('strong',null,'Objective: '),q.ai_objective.slice(0,100)+(q.ai_objective.length>100?'...':'')
                ):React.createElement('div',{style:{fontSize:12,color:'#9ca3af',fontStyle:'italic',marginBottom:8}},'No objective set — configure in settings panel →'),
                React.createElement('div',{style:{display:'flex',gap:12,flexWrap:'wrap'}},
                  React.createElement('span',{style:{fontSize:10,color:'#7c3aed',background:'#f3e8ff',padding:'2px 8px',borderRadius:10}},`${q.ai_duration||'3-5'} min`),
                  React.createElement('span',{style:{fontSize:10,color:'#0369a1',background:'#e0f2fe',padding:'2px 8px',borderRadius:10}},`${(q.ai_starter_questions||[]).filter(s=>s.trim()).length} starter Q's`),
                  q.ai_tts_enabled!==false&&React.createElement('span',{style:{fontSize:10,color:'#16a34a',background:'#f0fdf4',padding:'2px 8px',borderRadius:10}},'TTS enabled'),
                  !OPENAI_KEY&&React.createElement('span',{style:{fontSize:10,color:'#dc2626',background:'#fef2f2',padding:'2px 8px',borderRadius:10}},'No API key')
                )
              )
            ),
            // Rating preview
            q.type==='rating'&&React.createElement('div',{style:{paddingLeft:26}},
              (()=>{const mn=q.min??0,mx=q.max??10,total=mx-mn+1;
              return React.createElement('div',null,
                React.createElement('div',{style:{display:'flex',gap:4,flexWrap:'wrap',pointerEvents:'none'}},
                  Array.from({length:total},(_,i)=>React.createElement('div',{key:i,style:{width:38,height:38,border:'2px solid #e5e7eb',borderRadius:8,background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#9ca3af'}},mn+i))
                ),
                React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:11,color:'#9ca3af',marginTop:6}},
                  React.createElement('span',null,q.labels?.min||String(mn)),
                  React.createElement('span',null,q.labels?.max||String(mx))
                )
              );})()
            ),
            // Text preview (short_text, paragraph)
            ['short_text','paragraph'].includes(q.type)&&React.createElement('div',{style:{paddingLeft:26,pointerEvents:'none'}},
              React.createElement('div',{style:{background:'var(--gray-50)',border:'1px solid var(--gray-200)',borderRadius:6,padding:'8px 12px',fontSize:13,color:'var(--gray-400)'}},
                q.placeholder||(q.type==='paragraph'?'Paragraph response...':'Short text response...')
              )
            ),
            q.helper_text&&React.createElement('div',{style:{fontSize:12,color:'var(--gray-400)',marginTop:6,paddingLeft:26}},q.helper_text)
          )),
          React.createElement('div',{className:'bg-gray-100 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 mb-2.5',style:{marginTop:14}},
            React.createElement('div',{className:'text-xs font-semibold text-gray-500 text-transform uppercase tracking-wide mb-1'},mIcon('celebration',{size:16}),' Thank You Screen'),
            React.createElement('input',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:survey.thank_you_msg||'',onChange:e=>update({thank_you_msg:e.target.value}),placeholder:'Thank you for your time! (default)'})
          )
        )
      ),
      // Right settings
      React.createElement('div',{className:'bg-white border-l border-gray-200 overflow-y-auto'},
        tab==='questions'&&selQuestion?
          React.createElement(QSettingsPanel,{q:selQuestion,allQ:questions,onUpdate:(c)=>updQ(selQuestion.id,c)}):
        tab==='settings'?
          React.createElement(SurveySettingsPanel,{survey,onUpdate:update}):
        tab==='logic'?
          React.createElement(LogicOverviewPanel,{survey}):
          React.createElement('div',{className:'px-3.5 py-3.5',style:{paddingTop:24,textAlign:'center',color:'var(--gray-400)',fontSize:13}},
            tab==='questions'?'Click a question to configure it':null
          )
      )
    ),
    // Publish modal
    updateWarningModal&&React.createElement(Modal,{
      title:React.createElement('span',{className:'flex items-center gap-2'},[mIcon('warning',{size:20,style:{color:'#b45309'}}),' Update Live Survey?']),
      onClose:()=>setUpdateWarningModal(false),
      footer:React.createElement('div',{className:'flex gap-2 justify-end'},
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 cursor-pointer',onClick:()=>setUpdateWarningModal(false)},'Cancel'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium cursor-pointer bg-amber-600 text-white hover:bg-amber-700',onClick:()=>{setUpdateWarningModal(false);doPublish();}},[mIcon('refresh',{size:14}),' Proceed with Update'])
      )
    },
      React.createElement('div',null,
        React.createElement('p',{className:'mb-3 text-gray-700 text-sm'},'You\'ve made structural changes to questions that already have collected responses. This may affect analytics consistency for those existing responses.'),
        React.createElement('ul',{className:'list-disc pl-5 mb-3 text-sm text-gray-600 space-y-1'},
          React.createElement('li',null,'Existing response records will ',React.createElement('strong',null,'not'),' be deleted'),
          React.createElement('li',null,'Changed question schemas may render some existing answers incompatible with charts'),
          React.createElement('li',null,'Adding new questions only is safe — no warning needed for that')
        ),
        React.createElement('p',{className:'text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'},'If you only added new questions, you can safely proceed. If you changed existing question types or options, consider the impact on your data.')
      )
    ),
    publishModal&&React.createElement(Modal,{
      title:React.createElement('span',{className:'flex items-center gap-2'},[mIcon('rocket_launch',{size:20,style:{color:'#00ACBD'}}),' Survey Published!']),
      onClose:()=>{setPublishModal(null);if(onPublished)onPublished(publishModal.surveyId);},
      footer:React.createElement('div',{className:'flex gap-2'},
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 cursor-pointer',onClick:()=>{navigator.clipboard?.writeText(publishModal.shareUrl);toast('Copied!','success');}},mIcon('content_copy',{size:14}),' Copy link'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all cursor-pointer bg-black text-embark-gold hover:bg-gray-900',onClick:()=>{setPublishModal(null);if(onPublished)onPublished(publishModal.surveyId);}},mIcon('analytics',{size:14}),' View Analytics')
      )
    },
      React.createElement('div',null,
        React.createElement('p',{className:'mb-3 text-gray-500 text-sm'},'Your survey is live. Share this link with respondents:'),
        React.createElement('div',{className:'bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-xs break-all select-all mb-3'},publishModal.shareUrl),
        React.createElement('div',{className:'mt-3 text-xs text-gray-400'},`Version ${publishModal.version} • Token: ${publishModal.token}`)
      )
    )
  );
}

// ── QUESTION SETTINGS PANEL ──────────────────────────────────────────────────
function QSettingsPanel({q,allQ,onUpdate}){
  const[showLogic,setShowLogic]=useState(false);
  return React.createElement('div',{className:'px-5 py-5'},
    React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-4 font-display'},'Question Settings'),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'Required',checked:q.required,onChange:v=>onUpdate({required:v})})),
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'Randomize options',checked:!!q.randomize_options,onChange:v=>onUpdate({randomize_options:v})})),
      (q.type==='multiple_select')&&React.createElement('div',{className:'mb-4',style:{marginTop:8}},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Max selections'),
        React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.max_selections||'',placeholder:'Unlimited',onChange:e=>onUpdate({max_selections:e.target.value?Number(e.target.value):null})})
      )
    ),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Helper text'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.helper_text||'',placeholder:'Guidance shown below question...',onChange:e=>onUpdate({helper_text:e.target.value})})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Placeholder'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.placeholder||'',placeholder:'Input placeholder...',onChange:e=>onUpdate({placeholder:e.target.value})})
      )
    ),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Image Stimulus'),
      React.createElement('div',{className:'mb-2'},
        React.createElement('input',{type:'file',accept:'image/*',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',onChange:e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=e=>{const d=e.target?.result;if(typeof d==='string'){const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=Math.min(800,img.width);c.height=c.width*(img.height/img.width);const ctx=c.getContext('2d');ctx?.drawImage(img,0,0,c.width,c.height);const compressed=c.toDataURL('image/jpeg',0.7);onUpdate({image_url:compressed});}; img.src=d;}};r.readAsDataURL(f);}}})
      ),
      q.image_url&&React.createElement('div',{style:{marginBottom:8}},
        React.createElement('img',{src:q.image_url,style:{width:80,height:60,objectFit:'cover',borderRadius:6,border:'1px solid var(--gray-200)'}}),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',style:{marginLeft:8,marginTop:4},onClick:()=>onUpdate({image_url:''})},'Remove image')
      ),
      !q.image_url&&React.createElement('p',{className:'text-xs text-gray-500'},'or paste a URL')
    ),
    q.type==='rating'&&React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5'},'Scale Range'),
      React.createElement('div',{style:{display:'flex',gap:8,marginBottom:14}},
        React.createElement('div',{style:{flex:1}},
          React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},'Min value'),
          React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.min??0,min:0,max:q.max??10,onChange:e=>onUpdate({min:Number(e.target.value)})})
        ),
        React.createElement('div',{style:{flex:1}},
          React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},'Max value'),
          React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.max??10,min:q.min??0,max:20,onChange:e=>onUpdate({max:Number(e.target.value)})})
        )
      ),
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5'},'Endpoint Labels'),
      React.createElement('div',{className:'mb-3'},
        React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},`Left label (${q.min??0})`),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.labels?.min||'',placeholder:'e.g. Not at all likely',onChange:e=>onUpdate({labels:{...(q.labels||{}),min:e.target.value}})})
      ),
      React.createElement('div',{className:'mb-3'},
        React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},`Right label (${q.max??10})`),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.labels?.max||'',placeholder:'e.g. Extremely likely',onChange:e=>onUpdate({labels:{...(q.labels||{}),max:e.target.value}})})
      )
    ),
    ['card_sort_open','card_sort_closed'].includes(q.type)&&React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5'},q.type==='card_sort_closed'?'Cards & Categories':'Cards'),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Cards'),
        q.cards?.map((c,i)=>React.createElement('div',{key:c.id,style:{display:'flex',gap:8,marginBottom:8}},
          React.createElement('input',{type:'text',className:'flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:c.text,placeholder:`Card ${i+1}`,onChange:e=>onUpdate({cards:q.cards.map((x,j)=>j===i?{...x,text:e.target.value}:x)})}),
          React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',onClick:()=>onUpdate({cards:q.cards.filter((_,j)=>j!==i)})},mIcon('close',{size:16}))
        )),
        React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',onClick:()=>onUpdate({cards:[...q.cards,{id:'c_'+uid(),text:'',image_url:''}]})},'＋ Add card')
      ),
      q.type==='card_sort_closed'&&React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Categories'),
        q.categories?.map((cat,i)=>React.createElement('div',{key:cat.id,style:{display:'flex',gap:8,marginBottom:8}},
          React.createElement('input',{type:'text',className:'flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:cat.name,placeholder:`Category ${i+1}`,onChange:e=>onUpdate({categories:q.categories.map((x,j)=>j===i?{...x,name:e.target.value}:x)})}),
          React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',onClick:()=>onUpdate({categories:q.categories.filter((_,j)=>j!==i)})},mIcon('close',{size:16}))
        )),
        React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',onClick:()=>onUpdate({categories:[...q.categories,{id:'cat_'+uid(),name:''}]})},mIcon('add',{size:16}),' Add category')
      )
    ),
    q.type==='context_screen'&&React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Body Text'),
        React.createElement('textarea',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y min-h-20',value:q.body||'',rows:4,placeholder:'Enter body text...',onChange:e=>onUpdate({body:e.target.value})})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Button Text'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.button_text||'Continue',placeholder:'Continue',onChange:e=>onUpdate({button_text:e.target.value})})
      )
    ),
    // Prototype Test settings
    q.type==='prototype_test'&&React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5'},'Prototype Configuration'),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Figma Share URL'),
        React.createElement('input',{type:'url',className:`w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white ${q.figma_share_url&&!q.figma_share_url.includes('figma.com')?'border-red-300':'border-gray-300'}`,value:q.figma_share_url||'',placeholder:'https://www.figma.com/proto/...',onChange:e=>onUpdate({figma_share_url:e.target.value})}),
        q.figma_share_url&&!q.figma_share_url.includes('figma.com')&&React.createElement('p',{className:'mt-1 text-xs text-red-500'},'URL must be from figma.com'),
        React.createElement('p',{className:'mt-1 text-xs text-gray-400'},'Paste a Figma share or prototype link. Make sure sharing is set to "Anyone with the link can view".')
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Task Prompt'),
        React.createElement('textarea',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y',value:q.task_prompt||'',rows:2,placeholder:'e.g. "Try to schedule an appointment for your dog"',onChange:e=>onUpdate({task_prompt:e.target.value})}),
        React.createElement('p',{className:'mt-1 text-xs text-gray-400'},'Describe what the respondent should try to accomplish in the prototype.')
      ),
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5 mt-5'},'Timing'),
      React.createElement('div',{style:{display:'flex',gap:8,marginBottom:14}},
        React.createElement('div',{style:{flex:1}},
          React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},'Min view time (sec)'),
          React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.min_view_time_seconds??0,min:0,onChange:e=>onUpdate({min_view_time_seconds:Number(e.target.value)||0})})
        ),
        React.createElement('div',{style:{flex:1}},
          React.createElement('label',{className:'block text-xs font-medium text-gray-500 mb-1'},'Time limit (sec)'),
          React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:q.time_limit_seconds||'',placeholder:'No limit',min:0,onChange:e=>onUpdate({time_limit_seconds:e.target.value?Number(e.target.value):null})})
        )
      ),
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5 mt-5'},'Follow-up Questions'),
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'Did you complete the task? (Yes/No)',checked:q.success_question_enabled!==false,onChange:v=>onUpdate({success_question_enabled:v})})),
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'How difficult was it? (1-5 scale)',checked:q.difficulty_scale_enabled!==false,onChange:v=>onUpdate({difficulty_scale_enabled:v})})),
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'Open-ended feedback text box',checked:q.open_ended_feedback_enabled!==false,onChange:v=>onUpdate({open_ended_feedback_enabled:v})}))
    ),
    // AI Interview settings
    q.type==='ai_interview'&&React.createElement('div',{className:'mb-5 pb-5 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-4'},'AI Interview Configuration'),
      !OPENAI_KEY&&React.createElement('div',{style:{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:8,padding:'12px 16px',marginBottom:18,fontSize:12,color:'#92400e'}},
        mIcon('warning',{size:14,style:{verticalAlign:'middle',marginRight:6}}),'No OpenAI API key configured. Set VITE_OPENAI_API_KEY in your .env file to enable AI interviews.'
      ),
      React.createElement('div',{className:'mb-5'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-2'},'Interview Objective'),
        React.createElement('textarea',{className:'w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y',value:q.ai_objective||'',rows:3,placeholder:'e.g. "Understand how pet owners discover and evaluate DNA testing services for their dogs"',onChange:e=>onUpdate({ai_objective:e.target.value})}),
        React.createElement('p',{className:'mt-1.5 text-xs text-gray-400'},'The AI interviewer will use this objective to guide the conversation and generate relevant follow-up questions.')
      ),
      React.createElement('div',{className:'mb-5'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-2'},'Interview Duration'),
        React.createElement('div',{style:{display:'flex',gap:10}},
          ['1-3','3-5','7-9'].map(d=>React.createElement('button',{key:d,onClick:()=>onUpdate({ai_duration:d}),
            style:{flex:1,padding:'10px 12px',borderRadius:8,border:'2px solid '+(q.ai_duration===d?'#9333ea':'#e5e7eb'),background:q.ai_duration===d?'#faf5ff':'white',color:q.ai_duration===d?'#9333ea':'#374151',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all .15s',textAlign:'center'}
          },d+' min'))
        ),
        React.createElement('p',{className:'mt-2 text-xs text-gray-400'},'The AI will manage its pace to cover all starter questions within this time window.')
      ),
      React.createElement('div',{className:'mb-5'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-2'},'Starter Questions (1-3)'),
        React.createElement('p',{className:'text-xs text-gray-400 mb-3'},'The AI will ask these in order, then probe deeper based on responses.'),
        (q.ai_starter_questions||['']).map((sq,i)=>React.createElement('div',{key:i,style:{display:'flex',gap:10,marginBottom:12,alignItems:'flex-start'}},
          React.createElement('span',{style:{fontSize:12,fontWeight:600,color:'#9333ea',minWidth:24,paddingTop:10}},`Q${i+1}`),
          React.createElement('textarea',{className:'flex-1 px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y bg-white',value:sq,rows:2,placeholder:`e.g. "${i===0?'Tell me about your experience with Embark\'s products.':i===1?'What frustrations have you encountered?':'If you could change one thing, what would it be?'}"`,onChange:e=>{const qs=[...(q.ai_starter_questions||[''])];qs[i]=e.target.value;onUpdate({ai_starter_questions:qs});}}),
          (q.ai_starter_questions||['']).length>1&&React.createElement('button',{className:'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-none text-sm font-medium transition-all cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100',style:{marginTop:6},onClick:()=>{const qs=[...(q.ai_starter_questions||[''])].filter((_,j)=>j!==i);onUpdate({ai_starter_questions:qs});}},mIcon('close',{size:16}))
        )),
        (q.ai_starter_questions||['']).length<3&&React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-1 py-1 cursor-pointer hover:underline',style:{marginTop:4},onClick:()=>onUpdate({ai_starter_questions:[...(q.ai_starter_questions||['']),'']})},mIcon('add',{size:16}),' Add question')
      ),
      React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-3 mt-6'},'Output Settings'),
      React.createElement('div',{className:'mb-3'},React.createElement(Toggle,{label:'AI speaks questions aloud (Text-to-Speech)',checked:q.ai_tts_enabled!==false,onChange:v=>onUpdate({ai_tts_enabled:v})}))
    ),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',onClick:()=>setShowLogic(!showLogic)},showLogic?'▲ Hide Logic':'⚡ Display Logic'),
      showLogic&&React.createElement(LogicEditor,{q,allQ,onUpdate})
    )
  );
}

function LogicEditor({q,allQ,onUpdate}){
  const prior=allQ.filter(x=>x.id!==q.id);
  const logic=q.logic||[];
  const addRule=()=>onUpdate({logic:[...logic,{id:uid(),source_question:'',condition:'equals',value:'',action:'show'}]});
  const updRule=(id,c)=>onUpdate({logic:logic.map(r=>r.id===id?{...r,...c}:r)});
  const delRule=(id)=>onUpdate({logic:logic.filter(r=>r.id!==id)});
  return React.createElement('div',{style:{marginTop:8}},
    React.createElement('div',{className:'text-xs text-gray-500 mb-2'},'Show/hide this question based on earlier answers:'),
    logic.map(rule=>React.createElement('div',{key:rule.id,style:{background:'var(--gray-50)',border:'1px solid var(--gray-200)',borderRadius:6,padding:8,marginBottom:7}},
      React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',style:{marginBottom:6},value:rule.source_question,onChange:e=>updRule(rule.id,{source_question:e.target.value})},
        React.createElement('option',{value:''},'Select question...'),
        prior.map(x=>React.createElement('option',{key:x.id,value:x.id},x.text||`Q${allQ.indexOf(x)+1}`))
      ),
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:6}},
        React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',value:rule.condition,onChange:e=>updRule(rule.id,{condition:e.target.value})},
          ['equals','not_equals','contains','answered','not_answered','greater_than','less_than'].map(c=>React.createElement('option',{key:c,value:c},c.replace('_',' ')))
        ),
        !['answered','not_answered'].includes(rule.condition)&&React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:rule.value,placeholder:'Value...',onChange:e=>updRule(rule.id,{value:e.target.value})})
      ),
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},
        React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',style:{width:'auto'},value:rule.action,onChange:e=>updRule(rule.id,{action:e.target.value})},
          React.createElement('option',{value:'show'},'Show this question'),
          React.createElement('option',{value:'hide'},'Hide this question'),
          React.createElement('option',{value:'screen_out'},'Screen out respondent')
        ),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',style:{color:'var(--danger)'},onClick:()=>delRule(rule.id)},'✕')
      )
    )),
    React.createElement('button',{className:'flex items-center gap-1 text-sm text-embark-teal bg-transparent border-none px-0.5 py-0.5 cursor-pointer hover:underline',onClick:addRule},'＋ Add rule')
  );
}

function SurveySettingsPanel({survey,onUpdate}){
  return React.createElement('div',{className:'px-3.5 py-3.5'},
    React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5 font-display'},'Survey Settings'),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Estimated minutes'),
        React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:survey.est_minutes||'',onChange:e=>onUpdate({est_minutes:Number(e.target.value)||null})})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Response cap'),
        React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:survey.response_cap||'',placeholder:'Unlimited',onChange:e=>onUpdate({response_cap:Number(e.target.value)||null})})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Close date'),
        React.createElement('input',{type:'date',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:survey.close_date?.substring(0,10)||'',onChange:e=>onUpdate({close_date:e.target.value||null})})
      )
    ),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      ['show_progress','allow_back','collect_email','allow_anonymous'].map(k=>
        React.createElement('div',{key:k,className:'mb-3'},
          React.createElement(Toggle,{label:k.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()),checked:!!survey[k],onChange:v=>onUpdate({[k]:v})})
        )
      )
    ),
    React.createElement('div',{className:'mb-4 pb-4 border-b border-gray-100 last:border-b-0'},
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Thank you message'),
        React.createElement('textarea',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal resize-y min-h-20',value:survey.thank_you_msg||'',rows:2,placeholder:'Thank you for your feedback!',onChange:e=>onUpdate({thank_you_msg:e.target.value})})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Primary color'),
        React.createElement('input',{type:'color',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',style:{height:38,padding:'2px 6px'},value:survey.branding?.primary_color||'#4f46e5',onChange:e=>onUpdate({branding:{...(survey.branding||{}),primary_color:e.target.value}})})
      )
    )
  );
}

function LogicOverviewPanel({survey}){
  const qs=(survey.schema?.questions||[]).filter(q=>q.logic?.length>0);
  return React.createElement('div',{className:'px-3.5 py-3.5'},
    React.createElement('div',{className:'text-sm font-semibold text-gray-700 mb-2.5 font-display'},'Active Logic Rules'),
    qs.length===0?React.createElement('div',{className:'text-sm text-gray-500'},'No logic rules set yet. Select a question and click ⚡ Display Logic.'):
    qs.map(q=>React.createElement('div',{key:q.id,style:{marginBottom:10,padding:10,background:'var(--gray-50)',borderRadius:6,fontSize:13}},
      React.createElement('div',{style:{fontWeight:600,marginBottom:4}},q.text||(q.id.slice(-6))),
      q.logic.map((r,i)=>React.createElement('div',{key:i,style:{color:'var(--gray-500)'}},`${r.action} if Q${(survey.schema.questions.findIndex(x=>x.id===r.source_question)+1)||'?'} ${r.condition} "${r.value}"`))
    ))
  );
}

// ── RESPONDENT VIEW ───────────────────────────────────────────────────────────
function RespondentView({token}){
  const[state,setState]=useState('loading');
  const[survey,setSurvey]=useState(null);
  const[sessionId,setSessionId]=useState(null);
  const[answers,setAnswers]=useState({});
  const[qIdx,setQIdx]=useState(-1);
  const[startTime,setStartTime]=useState(null);
  const[email,setEmail]=useState('');
  const[micConsent,setMicConsent]=useState(false);
  const toast=useToast();

  // Positly params from URL (Positly auto-appends assignmentID & participantID)
  const urlParams=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const positlyParticipantId=urlParams.get('participantID')||null;
  const positlyAssignmentId=urlParams.get('assignmentID')||null;
  const ppCampaignId=urlParams.get('pp_cid')||null;
  const isPositly=!!ppCampaignId;
  const isPreviewMode=urlParams.get('_preview')==='1';

  // Look up campaign to get completion link
  const campaign=useMemo(()=>{
    if(!ppCampaignId)return null;
    return LS.find('panel_campaigns',ppCampaignId);
  },[ppCampaignId]);

  useEffect(()=>{
    // Always re-read from LS on mount so preview always gets the freshest saved state.
    // In preview mode accept any status; in live mode require published.
    const s=isPreviewMode
      ?LS.where('surveys',x=>x.token===token)[0]
      :LS.where('surveys',x=>x.token===token&&x.status==='published')[0];
    if(!s){setState('error');return;}
    setSurvey(s);
    // Check if this respondent already completed this survey (not in preview mode)
    if(!isPreviewMode){
      try{
        const takenKey='sl_taken_'+s.id;
        if(localStorage.getItem(takenKey)){setState('already_taken');return;}
      }catch{}
    }
    setState('welcome');
  },[]);// eslint-disable-line react-hooks/exhaustive-deps

  const visibleQ=useMemo(()=>{
    if(!survey)return[];
    const qs=survey.schema?.questions||[];
    return qs.filter(q=>{
      if(!q.logic?.length)return true;
      for(const r of q.logic){
        const src=answers[r.source_question];
        let met=false;
        if(r.condition==='answered')met=src!==undefined&&src!==''&&src!==null;
        else if(r.condition==='not_answered')met=src===undefined||src===''||src===null;
        else if(r.condition==='equals')met=String(src)===String(r.value);
        else if(r.condition==='not_equals')met=String(src)!==String(r.value);
        else if(r.condition==='contains')met=Array.isArray(src)?src.includes(r.value):String(src||'').includes(r.value);
        else if(r.condition==='greater_than')met=Number(src)>Number(r.value);
        else if(r.condition==='less_than')met=Number(src)<Number(r.value);
        if(met&&r.action==='screen_out'){if(sessionId)LS.update('sessions',sessionId,{status:'screened',submitted_at:now()});setState('screened');return false;}
        if(met&&r.action==='hide')return false;
        if(met&&r.action==='show')return true;
      }
      return true;
    });
  },[survey,answers]);

  const startSurvey=()=>{
    if(isPreviewMode){
      // Preview mode: don't log to localStorage at all
      setStartTime(Date.now());
      setQIdx(0);
      setState('taking');
      return;
    }
    const sid=uid();
    const dev=/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop';
    const sessionData={id:sid,survey_id:survey.id,survey_version:survey.version,status:'in_progress',device_type:dev,browser:navigator.userAgent.includes('Safari')&&!navigator.userAgent.includes('Chrome')?'Safari':'Chrome',started_at:now(),last_question_idx:0};
    // Attach Positly metadata if present
    if(isPositly){
      sessionData.positly_participant_id=positlyParticipantId;
      sessionData.positly_assignment_id=positlyAssignmentId;
      sessionData.pp_campaign_id=ppCampaignId;
      sessionData.source='positly';
    }
    LS.insert('sessions',sessionData);
    setSessionId(sid);
    setStartTime(Date.now());
    setQIdx(0);
    setState('taking');
  };

  const handleAnswer=(q,value)=>{
    if(q.type==='context_screen')return;
    setAnswers(prev=>({...prev,[q.id]:value}));
    if(isPreviewMode)return; // preview: update UI state but don't write to LS
    if(sessionId){
      const isText=['short_text','paragraph'].includes(q.type);
      const isNum=q.type==='rating'||['card_sort_open','card_sort_closed','rank','prototype_test','ai_interview'].includes(q.type);
      const existing=LS.where('answers',a=>a.session_id===sessionId&&a.question_id===q.id)[0];
      const aData={session_id:sessionId,survey_id:survey.id,question_id:q.id,question_type:q.type,raw_value:value,text_value:isText?value:Array.isArray(value)?value.join(', '):JSON.stringify(value),numeric_value:isNum?null:null,answered_at:now()};
      if(existing)LS.update('answers',existing.id,aData);
      else LS.insert('answers',{id:uid(),...aData});
      LS.update('sessions',sessionId,{last_question_idx:qIdx});
    }
  };

  const goNext=()=>{if(qIdx<visibleQ.length-1)setQIdx(qIdx+1);else setQIdx(visibleQ.length);};
  const goBack=()=>{if(qIdx>0)setQIdx(qIdx-1);else setQIdx(-1);};

  const submit=()=>{
    if(isPreviewMode){setState('done');return;}
    const ms=Date.now()-startTime;
    LS.update('sessions',sessionId,{status:'completed',respondent_email:email||null,completion_ms:ms,submitted_at:now()});
    // Mark survey as taken so this respondent cannot retake it
    try{localStorage.setItem('sl_taken_'+survey.id,now());}catch{}
    setState('done');
  };

  if(state==='loading')return React.createElement('div',{style:{padding:60,textAlign:'center',color:'var(--gray-400)'}},'Loading...');
  if(state==='already_taken')return React.createElement('div',{style:{padding:60,textAlign:'center',maxWidth:480,margin:'0 auto'}},
    React.createElement('div',{style:{width:72,height:72,borderRadius:'50%',background:'#f0fdf4',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:20}},mIcon('check_circle',{size:40,style:{color:'#16a34a'}})),
    React.createElement('h2',{className:'font-display',style:{fontSize:22,fontWeight:700,color:'#111827',marginBottom:8}},'You\'ve already completed this survey'),
    React.createElement('p',{className:'text-gray-500',style:{marginTop:8,fontSize:15,lineHeight:1.6}},'Thank you for your participation! Your response has been recorded. Each person may only submit one response.'),
    React.createElement('p',{className:'text-gray-400',style:{marginTop:16,fontSize:12}},'If you believe this is an error, please contact the survey creator.')
  );
  if(state==='error')return React.createElement('div',{style:{padding:60,textAlign:'center'}},
    React.createElement('h2',null,'Survey not found'),
    React.createElement('p',{className:'text-gray-500',style:{marginTop:8}},'This link is invalid or the survey has closed.')
  );

  const brand=survey?.branding?.primary_color||'#4f46e5';
  const settings=survey||{};
  const progress=qIdx<0?0:Math.round(((qIdx+1)/(visibleQ.length+1))*100);

  return React.createElement('div',{className:'min-h-screen bg-gray-50 flex flex-col'},
    isPreviewMode&&React.createElement('div',{style:{background:'#7c3aed',color:'white',padding:'7px 16px',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,justifyContent:'center'}},
      mIcon('visibility',{size:16}),' PREVIEW MODE — responses are not recorded'
    ),
    React.createElement('div',{className:'px-6 py-3.5 bg-black text-white',style:{background:brand}},
      React.createElement('div',{style:{color:'white',fontWeight:700,fontSize:17}},survey.title),
      settings.show_progress&&state==='taking'&&React.createElement('div',{className:'h-1 bg-white/30 rounded-sm mt-2.5 overflow-hidden'},
        React.createElement('div',{className:'h-full bg-embark-gold rounded-sm transition-all duration-400 ease-out',style:{width:`${progress}%`}})
      )
    ),
    React.createElement('div',{className:'flex-1 px-5 py-7 max-w-2xl mx-auto w-full'},
      state==='welcome'&&(()=>{
        const hasAiQ=(survey.schema?.questions||[]).some(q=>q.type==='ai_interview');
        return React.createElement('div',{className:'text-center px-5 py-10'},
          React.createElement('div',{style:{fontSize:52,marginBottom:14}},mIcon('waving_hand',{size:52})),
          React.createElement('h1',{className:'text-3xl font-bold text-gray-900 mb-2.5 font-display'},survey.title),
          survey.description&&React.createElement('p',{className:'text-base text-gray-600 mb-7 leading-relaxed'},survey.description),
          settings.est_minutes&&React.createElement('p',{className:'text-sm text-gray-400 mb-6'},[mIcon('schedule',{size:16}),' About ',settings.est_minutes,' minutes']),
          hasAiQ&&React.createElement('div',{style:{maxWidth:420,margin:'0 auto 20px',padding:'14px 18px',background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:10,textAlign:'left'}},
            React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
              mIcon('mic',{size:20,style:{color:'#9333ea'}}),
              React.createElement('span',{style:{fontWeight:600,fontSize:14,color:'#581c87'}},'Microphone Required')
            ),
            React.createElement('p',{style:{fontSize:13,color:'#374151',lineHeight:1.5,marginBottom:12}},'This survey includes an AI-moderated interview that requires microphone access. Your voice will be transcribed to text — no audio recordings are stored.'),
            React.createElement('label',{style:{display:'flex',alignItems:'flex-start',gap:8,cursor:'pointer',fontSize:13,color:'#374151'}},
              React.createElement('input',{type:'checkbox',checked:micConsent,onChange:e=>setMicConsent(e.target.checked),style:{marginTop:2,accentColor:'#9333ea'}}),
              React.createElement('span',null,'I consent to using my microphone for the AI-moderated interview portion of this survey.')
            )
          ),
          React.createElement('button',{
            className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-5.5 py-2.5 text-base',
            onClick:startSurvey,
            style:{background:hasAiQ&&!micConsent?'#9ca3af':brand,cursor:hasAiQ&&!micConsent?'not-allowed':'pointer'},
            disabled:hasAiQ&&!micConsent
          },'Start Survey →')
        );
      })(),
      state==='taking'&&qIdx<visibleQ.length&&React.createElement('div',{key:'q_'+qIdx},
        React.createElement(QCard,{key:visibleQ[qIdx]?.id||qIdx,question:visibleQ[qIdx],value:answers[visibleQ[qIdx]?.id],onChange:handleAnswer,brand}),
        React.createElement('div',{className:'flex justify-between items-center pt-4'},
          settings.allow_back&&qIdx>0?React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:goBack},'← Back'):React.createElement('div',null),
          (()=>{
            const cq=visibleQ[qIdx];
            const isCS=['card_sort_open','card_sort_closed'].includes(cq?.type);
            const csVal=isCS?answers[cq?.id]:null;
            const csIncomplete=isCS&&(!csVal||!csVal.uncategorized||(csVal.uncategorized&&csVal.uncategorized.length>0));
            const isPT=cq?.type==='prototype_test';
            const ptVal=isPT?answers[cq?.id]:null;
            const ptIncomplete=isPT&&(!ptVal||!ptVal.task_completed_at);
            const isAI=cq?.type==='ai_interview';
            const aiVal=isAI?answers[cq?.id]:null;
            const aiIncomplete=isAI&&(!aiVal||!aiVal.completed_at);
            const reqIncomplete=cq?.type!=='context_screen'&&cq?.type!=='prototype_test'&&cq?.type!=='ai_interview'&&cq?.required&&(answers[cq?.id]===undefined||answers[cq?.id]==='');
            const isDisabled=csIncomplete||ptIncomplete||aiIncomplete||reqIncomplete;
            return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}},
              isCS&&csIncomplete&&React.createElement('div',{style:{fontSize:12,color:'#ef4444',fontWeight:500}},'Please sort all cards into categories before continuing'),
              isPT&&ptIncomplete&&React.createElement('div',{style:{fontSize:12,color:'#ef4444',fontWeight:500}},'Please complete the prototype test before continuing'),
              isAI&&aiIncomplete&&React.createElement('div',{style:{fontSize:12,color:'#ef4444',fontWeight:500}},'Please complete the AI interview before continuing'),
              React.createElement('button',{
                className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',style:{background:isDisabled?'#9ca3af':brand,cursor:isDisabled?'not-allowed':'pointer'},onClick:isDisabled?undefined:goNext,
                disabled:isDisabled
              },qIdx<visibleQ.length-1?'Next →':'Continue →')
            );
          })()
        )
      ),
      state==='taking'&&qIdx>=visibleQ.length&&visibleQ.length>0&&React.createElement('div',null,
        React.createElement('div',{className:'bg-white border border-gray-200 rounded-2xl px-6 py-8 mb-4 shadow-sm text-center'},
          React.createElement('div',{style:{width:64,height:64,borderRadius:'50%',background:'#f0fdf4',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:16}},mIcon('task_alt',{size:36,style:{color:'#16a34a'}})),
          React.createElement('h2',{className:'text-xl font-bold text-gray-900 mb-2 font-display'},"You're all done!"),
          React.createElement('p',{className:'text-sm text-gray-500 mb-1'},'You have completed all questions in this survey.'),
          visibleQ.length>0&&React.createElement('p',{className:'text-xs text-gray-400'},`${visibleQ.length} question${visibleQ.length!==1?'s':''} answered`)
        ),
        settings.collect_email&&React.createElement('div',{className:'bg-white border border-gray-200 rounded-2xl px-6 py-6 mb-4 shadow-sm'},
          React.createElement('div',{className:'text-lg font-semibold text-gray-900 leading-relaxed mb-1.5'},'Want to share your email?'),
          React.createElement('p',{className:'text-sm text-gray-500 mb-3.5 leading-relaxed'},'Optional. We may follow up to learn more.'),
          React.createElement('input',{type:'email',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:email,onChange:e=>setEmail(e.target.value),placeholder:'your@email.com'})
        ),
        React.createElement('div',{className:'flex justify-between items-center pt-4'},
          settings.allow_back?React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:goBack},'← Back'):React.createElement('div'),
          React.createElement('button',{className:'inline-flex items-center gap-1.5 px-6 py-3 rounded-xl border-none text-base font-semibold transition-all whitespace-nowrap cursor-pointer text-white shadow-lg',style:{background:'#16a34a'},onClick:submit},[mIcon('check_circle',{size:20}),' Submit Survey'])
        )
      ),
      state==='taking'&&qIdx>=visibleQ.length&&visibleQ.length===0&&React.createElement('div',{className:'text-center px-5 py-10'},
        React.createElement('div',{style:{fontSize:48,marginBottom:14}},mIcon('error_outline',{size:48,style:{color:'#ef4444'}})),
        React.createElement('h2',{className:'text-xl font-bold text-gray-900 mb-2'},'No questions found'),
        React.createElement('p',{className:'text-sm text-gray-500'},'This survey has no questions. Please contact the survey creator.')
      ),
      state==='done'&&React.createElement('div',{className:'text-center px-5 py-10'},
        React.createElement('div',{style:{width:80,height:80,borderRadius:'50%',background:'#d1fae5',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:20}},mIcon('check_circle',{size:48,style:{color:'#059669'}})),
        React.createElement('h1',{className:'text-3xl font-bold text-gray-900 mb-3 font-display'},settings.thank_you_msg||'Thank you for your feedback!'),
        React.createElement('p',{className:'text-base text-gray-500 mb-6 leading-relaxed'},settings.thank_you_next||'Your response has been recorded. You can close this page now.'),
        React.createElement('div',{style:{width:60,height:4,background:'#00ACBD',borderRadius:2,margin:'0 auto 20px'}}),
        // Positly completion redirect
        isPositly&&campaign&&campaign.completion_link&&React.createElement('div',{style:{marginTop:24,padding:20,background:'var(--gray-50)',borderRadius:10,border:'1px solid var(--gray-200)',maxWidth:420,margin:'24px auto 0'}},
          React.createElement('p',{style:{fontSize:14,color:'var(--gray-600)',marginBottom:10}},'Your response has been recorded.'),
          React.createElement('a',{
            href:campaign.completion_link,
            target:'_self',
            className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-5.5 py-2.5 text-base',
            style:{background:'#00ACBD',width:'100%',justifyContent:'center',textDecoration:'none',display:'flex'}
          },'Complete on Positly →'),
          React.createElement('p',{style:{fontSize:11,color:'var(--gray-400)',marginTop:8,textAlign:'center'}},'Click the button above to confirm your completion with Positly.')
        )
      ),
      state==='screened'&&React.createElement('div',{className:'text-center px-5 py-10'},
        React.createElement('div',{style:{fontSize:48,marginBottom:14}},mIcon('person',{size:48})),
        React.createElement('h2',{className:'text-3xl font-bold text-gray-900 mb-2.5 font-display'},'Thank you for your time'),
        React.createElement('p',{className:'text-base text-gray-600 mb-7 leading-relaxed'},"Based on your answers, you don't qualify for this study."),
        // Positly return for screened-out participants
        isPositly&&campaign&&campaign.completion_link&&React.createElement('div',{style:{marginTop:20}},
          React.createElement('a',{
            href:campaign.completion_link,
            target:'_self',
            className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
            style:{textDecoration:'none'}
          },'Return to Positly')
        )
      )
    )
  );
}

function RatingWidget({q,value,onChange,brand}){
  const mn=q.min??0,mx=q.max??10;
  const total=mx-mn+1;
  const[hov,setHov]=useState(null);
  return React.createElement('div',{style:{marginTop:16}},
    React.createElement('div',{style:{display:'flex',gap:4,flexWrap:'wrap'}},
      Array.from({length:total},(_,i)=>{
        const n=mn+i;
        const sel=value===n;
        const hovering=hov===n;
        return React.createElement('button',{
          key:n,
          onMouseEnter:()=>setHov(n),
          onMouseLeave:()=>setHov(null),
          onClick:()=>onChange(q,n),
          style:{
            width:42,height:42,border:'2px solid '+(sel?brand:hovering?brand:'#e5e7eb'),
            borderRadius:8,background:sel?brand:hovering?brand+'18':'white',
            color:sel?'white':hovering?brand:'#374151',
            fontWeight:700,fontSize:14,cursor:'pointer',
            transition:'all .12s',flexShrink:0
          }
        },n);
      })
    ),
    React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:12,color:'#9ca3af',marginTop:8}},
      React.createElement('span',null,q.labels?.min||String(mn)),
      React.createElement('span',null,q.labels?.max||String(mx))
    )
  );
}

function QCard({question:q,value,onChange,brand}){
  const[draggedCard,setDraggedCard]=useState(null);
  const[dropZone,setDropZone]=useState(null);
  if(!q)return null;
  if(q.type==='context_screen'){
    return React.createElement('div',{className:'bg-white border border-gray-200 rounded-2xl px-6 py-6 mb-4 shadow-sm'},
      q.image_url&&React.createElement('img',{src:q.image_url,style:{width:'100%',maxHeight:300,objectFit:'cover',borderRadius:8,marginBottom:16}}),
      React.createElement('h2',{className:'text-2xl font-bold text-gray-900 mb-4 font-display'},q.text),
      React.createElement('p',{style:{whiteSpace:'pre-wrap',fontSize:16,color:'var(--gray-600)',lineHeight:1.6,marginBottom:20}},q.body),
      React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',style:{background:brand},onClick:()=>onChange(q,'_context_seen')},q.button_text||'Continue')
    );
  }
  const options=q.randomize_options?[...q.options].sort(()=>Math.random()-.5):(q.options||[]);
  const isSel=opt=>q.type==='single_choice'?value===opt.text:(Array.isArray(value)&&value.includes(opt.text));
  const pick=opt=>{
    if(q.type==='single_choice')onChange(q,opt.text);
    else{
      const cur=Array.isArray(value)?value:[];
      const next=cur.includes(opt.text)?cur.filter(v=>v!==opt.text):[...cur,opt.text];
      if(q.max_selections&&next.length>q.max_selections)return;
      onChange(q,next);
    }
  };
  return React.createElement('div',{className:'bg-white border border-gray-200 rounded-2xl px-6 py-6 mb-4 shadow-sm'},
    q.image_url&&React.createElement('img',{src:q.image_url,style:{width:'100%',maxHeight:300,objectFit:'cover',borderRadius:8,marginBottom:16}}),
    React.createElement('div',{className:'text-lg font-semibold text-gray-900 leading-relaxed mb-1.5'},q.text||'Question'),
    q.required&&React.createElement('span',{style:{color:'var(--danger)',fontSize:12}},'* Required'),
    q.helper_text&&React.createElement('p',{className:'text-sm text-gray-500 mb-3.5 leading-relaxed'},q.helper_text),
    ['single_choice','multiple_select'].includes(q.type)&&React.createElement('div',{style:{marginTop:12}},
      options.map(opt=>React.createElement('div',{key:opt.id,className:`choice-opt ${isSel(opt)?'sel':''}`,onClick:()=>pick(opt),style:isSel(opt)?{borderColor:brand,background:brand+'18'}:{}},
        React.createElement('input',{type:q.type==='single_choice'?'radio':'checkbox',checked:isSel(opt),readOnly:true,style:{accentColor:brand}}),
        React.createElement('span',{className:'text-sm text-gray-800 flex-1'},opt.text)
      )),
      q.has_other&&React.createElement('div',{className:`choice-opt ${value==='__other__'?'sel':''}`,onClick:()=>onChange(q,'__other__'),style:value==='__other__'?{borderColor:brand,background:brand+'18'}:{}},
        React.createElement('input',{type:q.type==='single_choice'?'radio':'checkbox',checked:value==='__other__',readOnly:true}),
        React.createElement('span',{className:'text-sm text-gray-800 flex-1'},'Other'),
        value==='__other__'&&React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',style:{marginLeft:8,flex:1},placeholder:'Please specify...',onClick:e=>e.stopPropagation()})
      )
    ),
    ['short_text','paragraph'].includes(q.type)&&React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',style:{marginTop:12},value:value||'',placeholder:q.placeholder||'',onChange:e=>onChange(q,e.target.value)}),
    q.type==='rank'&&React.createElement(RankWidget,{q,value,onChange,brand}),
    q.type==='rating'&&React.createElement(RatingWidget,{q,value,onChange,brand}),
    ['card_sort_open','card_sort_closed'].includes(q.type)&&React.createElement(CardSortWidget,{q,value,onChange,brand}),
    q.type==='prototype_test'&&React.createElement(PrototypeTestWidget,{q,value,onChange,brand}),
    q.type==='ai_interview'&&React.createElement(AIInterviewWidget,{q,value,onChange,brand})
  );
}

// ── PROTOTYPE TEST WIDGET (Respondent) ───────────────────────────────────────
function PrototypeTestWidget({q,value,onChange,brand}){
  const val=value&&typeof value==='object'?value:{};
  const[phase,setPhase]=useState(val.task_completed_at?'followup':'idle'); // idle → testing → followup
  const[elapsed,setElapsed]=useState(0);
  const[iframeLoaded,setIframeLoaded]=useState(false);
  const[isFullscreen,setIsFullscreen]=useState(false);
  const timerRef=useRef(null);
  const startRef=useRef(null);
  const minTime=q.min_view_time_seconds||0;
  const timeLimit=q.time_limit_seconds||0;

  // Build embed URL from Figma share URL
  // Figma's official embed format: https://www.figma.com/embed?embed_host=share&url=<encoded_url>
  // This works for ALL Figma URL types: /proto/, /design/, /file/, /board/
  const figmaEmbedUrl=useMemo(()=>{
    const url=(q.figma_share_url||'').trim();
    if(!url.includes('figma.com'))return null;
    return 'https://www.figma.com/embed?embed_host=share&url='+encodeURIComponent(url);
  },[q.figma_share_url]);

  const update=(patch)=>{
    const next={...val,...patch};
    onChange(q,next);
  };

  const startTask=()=>{
    const now=Date.now();
    startRef.current=now;
    setPhase('testing');
    setElapsed(0);
    update({
      task_started_at:new Date(now).toISOString(),
      prototype_loaded_at:iframeLoaded?new Date().toISOString():null,
      device_type:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop',
      viewport_size:`${window.innerWidth}x${window.innerHeight}`
    });
    timerRef.current=setInterval(()=>{
      const el=Math.floor((Date.now()-now)/1000);
      setElapsed(el);
      if(timeLimit>0&&el>=timeLimit){
        clearInterval(timerRef.current);
        finishTask(now);
      }
    },1000);
  };

  const finishTask=(startOverride)=>{
    clearInterval(timerRef.current);
    const start=startOverride||startRef.current||Date.now();
    const nowMs=Date.now();
    setPhase('followup');
    update({
      task_completed_at:new Date(nowMs).toISOString(),
      time_on_task_ms:nowMs-start,
      time_in_block_ms:nowMs-start
    });
  };

  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  const formatTime=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const canContinue=elapsed>=minTime;

  if(!figmaEmbedUrl){
    return React.createElement('div',{style:{padding:20,textAlign:'center',color:'#ef4444'}},
      mIcon('error_outline',{size:32,style:{display:'block',margin:'0 auto 8px'}}),
      React.createElement('p',{style:{fontWeight:600,marginBottom:4}},'No valid Figma URL'),
      React.createElement('p',{style:{fontSize:13,color:'#6b7280'}},'The survey creator has not provided a valid Figma prototype link.')
    );
  }

  // Phase: idle — show task prompt and Start button
  if(phase==='idle'){
    return React.createElement('div',null,
      q.task_prompt&&React.createElement('div',{style:{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'14px 18px',marginBottom:16}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
          mIcon('assignment',{size:18,style:{color:'#0284c7'}}),
          React.createElement('span',{style:{fontWeight:600,fontSize:14,color:'#0c4a6e'}},'Your Task')
        ),
        React.createElement('p',{style:{fontSize:14,color:'#334155',lineHeight:1.5}},q.task_prompt)
      ),
      React.createElement('div',{style:{border:'2px dashed #d1d5db',borderRadius:12,padding:'32px 20px',textAlign:'center',background:'#fafafa',marginBottom:12}},
        mIcon('play_circle',{size:48,style:{color:brand||'#0284c7',display:'block',margin:'0 auto 12px'}}),
        React.createElement('p',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:6}},'Ready to start?'),
        React.createElement('p',{style:{fontSize:13,color:'#6b7280',marginBottom:16}},'A Figma prototype will load below. Take your time exploring it.'),
        React.createElement('button',{
          onClick:startTask,
          style:{background:brand||'#0284c7',color:'white',border:'none',padding:'10px 28px',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',transition:'all .15s'}
        },'Start Task')
      ),
      React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:16,fontSize:12,color:'#9ca3af',marginTop:4}},
        minTime>0&&React.createElement('span',null,`Min. ${minTime}s viewing time`),
        timeLimit>0&&React.createElement('span',null,`Time limit: ${formatTime(timeLimit)}`)
      )
    );
  }

  // Phase: testing — show iframe + timer + Done button
  if(phase==='testing'){
    const iframeContainer=React.createElement('div',{style:{position:'relative',borderRadius:isFullscreen?0:12,overflow:'hidden',border:isFullscreen?'none':'1px solid #e5e7eb',background:'#f3f4f6',
      ...(isFullscreen?{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:9999,borderRadius:0}:{})
    }},
      // Timer bar
      React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:'#111827',color:'white',fontSize:13}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
          mIcon('timer',{size:16,style:{color:canContinue?'#4ade80':'#fbbf24'}}),
          React.createElement('span',{style:{fontWeight:600,fontVariantNumeric:'tabular-nums'}},formatTime(elapsed)),
          timeLimit>0&&React.createElement('span',{style:{color:'#9ca3af',fontSize:11}},` / ${formatTime(timeLimit)}`)
        ),
        React.createElement('div',{style:{display:'flex',gap:8}},
          React.createElement('button',{onClick:()=>setIsFullscreen(!isFullscreen),style:{background:'transparent',border:'1px solid #4b5563',color:'white',padding:'4px 10px',borderRadius:6,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',gap:4}},
            mIcon(isFullscreen?'fullscreen_exit':'fullscreen',{size:14}),isFullscreen?'Exit':'Fullscreen'
          ),
          React.createElement('a',{href:q.figma_share_url,target:'_blank',rel:'noopener noreferrer',style:{background:'transparent',border:'1px solid #4b5563',color:'white',padding:'4px 10px',borderRadius:6,fontSize:11,textDecoration:'none',display:'flex',alignItems:'center',gap:4}},
            mIcon('open_in_new',{size:14}),'Open in tab'
          )
        )
      ),
      // Iframe
      React.createElement('iframe',{
        src:figmaEmbedUrl,
        onLoad:()=>setIframeLoaded(true),
        style:{width:'100%',height:isFullscreen?'calc(100vh - 44px)':560,border:'none',display:'block'},
        allowFullScreen:true,
        allow:'fullscreen',
        loading:'lazy'
      }),
      // Progress bar for min time
      minTime>0&&!canContinue&&React.createElement('div',{style:{height:3,background:'#e5e7eb'}},
        React.createElement('div',{style:{height:'100%',background:'#fbbf24',width:`${Math.min(100,(elapsed/minTime)*100)}%`,transition:'width 1s linear'}})
      )
    );

    return React.createElement('div',null,
      q.task_prompt&&React.createElement('div',{style:{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#0c4a6e'}},
        React.createElement('strong',null,'Task: '),q.task_prompt
      ),
      iframeContainer,
      React.createElement('div',{style:{display:'flex',justifyContent:'center',marginTop:16}},
        React.createElement('button',{
          onClick:()=>finishTask(),
          disabled:!canContinue,
          style:{background:canContinue?(brand||'#0284c7'):'#9ca3af',color:'white',border:'none',padding:'10px 28px',borderRadius:10,fontSize:15,fontWeight:600,cursor:canContinue?'pointer':'not-allowed',transition:'all .15s',opacity:canContinue?1:0.7}
        },canContinue?'I\'m Done — Continue':'Wait '+formatTime(minTime-elapsed)+'...')
      )
    );
  }

  // Phase: followup — success, difficulty, feedback
  return React.createElement('div',null,
    React.createElement('div',{style:{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:10}},
      mIcon('check_circle',{size:20,style:{color:'#16a34a'}}),
      React.createElement('div',null,
        React.createElement('div',{style:{fontWeight:600,fontSize:14,color:'#166534'}},'Prototype interaction complete'),
        val.time_on_task_ms&&React.createElement('div',{style:{fontSize:12,color:'#4ade80'}},`Time spent: ${Math.round(val.time_on_task_ms/1000)}s`)
      )
    ),
    q.success_question_enabled!==false&&React.createElement('div',{style:{marginBottom:20}},
      React.createElement('div',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:10}},'Did you complete the task?'),
      React.createElement('div',{style:{display:'flex',gap:10}},
        ['Yes','No'].map(opt=>React.createElement('button',{key:opt,onClick:()=>update({completion_self_report:opt.toLowerCase()}),
          style:{flex:1,padding:'12px 16px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',transition:'all .15s',
            border:val.completion_self_report===opt.toLowerCase()?`2px solid ${brand||'#0284c7'}`:'2px solid #e5e7eb',
            background:val.completion_self_report===opt.toLowerCase()?(brand||'#0284c7')+'15':'white',
            color:val.completion_self_report===opt.toLowerCase()?(brand||'#0284c7'):'#374151'
          }
        },opt))
      )
    ),
    q.difficulty_scale_enabled!==false&&React.createElement('div',{style:{marginBottom:20}},
      React.createElement('div',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:10}},'How difficult was it?'),
      React.createElement('div',{style:{display:'flex',gap:8}},
        [1,2,3,4,5].map(n=>React.createElement('button',{key:n,onClick:()=>update({difficulty_rating:n}),
          style:{width:52,height:52,borderRadius:12,fontSize:18,fontWeight:700,cursor:'pointer',transition:'all .15s',
            border:val.difficulty_rating===n?`2px solid ${brand||'#0284c7'}`:'2px solid #e5e7eb',
            background:val.difficulty_rating===n?(brand||'#0284c7'):'white',
            color:val.difficulty_rating===n?'white':'#374151'
          }
        },n))
      ),
      React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:12,color:'#9ca3af',marginTop:6}},
        React.createElement('span',null,'Very easy'),
        React.createElement('span',null,'Very hard')
      )
    ),
    q.open_ended_feedback_enabled!==false&&React.createElement('div',{style:{marginBottom:12}},
      React.createElement('div',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:10}},'What was confusing or could be improved?'),
      React.createElement('textarea',{
        className:'w-full px-3 py-3 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',
        rows:3,value:val.open_text_feedback||'',placeholder:'Share your thoughts...',
        onChange:e=>update({open_text_feedback:e.target.value})
      })
    )
  );
}

// ── OPENAI HELPERS ─────────────────────────────────────────────────────────
const OPENAI_KEY=(typeof import.meta!=='undefined'&&import.meta.env?.VITE_OPENAI_API_KEY)||'';
async function openaiChat(messages,{maxTokens=500,temperature=0.7}={}){
  if(!OPENAI_KEY)throw new Error('No OpenAI API key configured');
  const res=await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+OPENAI_KEY},
    body:JSON.stringify({model:'gpt-4o-mini',messages,max_tokens:maxTokens,temperature})
  });
  if(!res.ok)throw new Error('OpenAI API error: '+res.status);
  const data=await res.json();
  return data.choices?.[0]?.message?.content||'';
}
async function openaiWhisper(audioBlob){
  if(!OPENAI_KEY)throw new Error('No OpenAI API key configured');
  const form=new FormData();
  form.append('file',audioBlob,'audio.webm');
  form.append('model','whisper-1');
  form.append('response_format','text');
  const res=await fetch('https://api.openai.com/v1/audio/transcriptions',{
    method:'POST',headers:{'Authorization':'Bearer '+OPENAI_KEY},body:form
  });
  if(!res.ok)throw new Error('Whisper API error: '+res.status);
  return (await res.text()).trim();
}

// ── AI INTERVIEW WIDGET (Respondent) ──────────────────────────────────────
function AIInterviewWidget({q,value,onChange,brand}){
  const val=value&&typeof value==='object'?value:{};
  // Phases: consent → idle → interviewing → done
  const[phase,setPhase]=useState(val.completed_at?'done':'idle');
  const[transcript,setTranscript]=useState(val.transcript||[]); // [{role:'ai'|'user',text,ts}]
  const[isRecording,setIsRecording]=useState(false);
  const[isProcessing,setIsProcessing]=useState(false);
  const[isSpeaking,setIsSpeaking]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[currentQIdx,setCurrentQIdx]=useState(0); // index into starter questions
  const[error,setError]=useState(null);

  const mediaRecRef=useRef(null);
  const chunksRef=useRef([]);
  const timerRef=useRef(null);
  const startRef=useRef(null);
  const synthRef=useRef(null);
  const starterQs=(q.ai_starter_questions||[]).filter(s=>s.trim());
  const objective=q.ai_objective||'';
  const ttsEnabled=q.ai_tts_enabled!==false;

  // Duration mapping in seconds
  const durationMap={'1-3':{min:60,max:180},'3-5':{min:180,max:300},'7-9':{min:420,max:540}};
  const dur=durationMap[q.ai_duration]||durationMap['3-5'];
  const maxSec=dur.max;

  const update=(patch)=>{const next={...val,...patch};onChange(q,next);};

  // Timer
  useEffect(()=>{
    if(phase==='interviewing'){
      startRef.current=Date.now();
      timerRef.current=setInterval(()=>{
        const el=Math.floor((Date.now()-startRef.current)/1000);
        setElapsed(el);
        if(el>=maxSec){clearInterval(timerRef.current);wrapUp();}
      },1000);
    }
    return()=>clearInterval(timerRef.current);
  },[phase]);

  const formatTime=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  // TTS: speak text using browser SpeechSynthesis
  const speak=(text)=>{
    if(!ttsEnabled||!window.speechSynthesis)return Promise.resolve();
    return new Promise(resolve=>{
      window.speechSynthesis.cancel();
      const utter=new SpeechSynthesisUtterance(text);
      utter.rate=1.0;utter.pitch=1.0;
      // Try to pick a natural-sounding voice
      const voices=window.speechSynthesis.getVoices();
      const preferred=voices.find(v=>v.name.includes('Samantha'))||voices.find(v=>v.lang.startsWith('en')&&!v.localService)||voices[0];
      if(preferred)utter.voice=preferred;
      utter.onend=()=>{setIsSpeaking(false);resolve();};
      utter.onerror=()=>{setIsSpeaking(false);resolve();};
      setIsSpeaking(true);
      synthRef.current=utter;
      window.speechSynthesis.speak(utter);
    });
  };

  // Ask the first starter question and begin interview
  const startInterview=async()=>{
    setPhase('interviewing');
    update({started_at:new Date().toISOString(),device_type:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop'});
    // Ask first question
    if(starterQs.length>0){
      const firstQ=starterQs[0];
      const entry={role:'ai',text:firstQ,ts:new Date().toISOString()};
      setTranscript([entry]);
      update({transcript:[entry]});
      setCurrentQIdx(1);
      await speak(firstQ);
    }
  };

  // Record audio from mic
  const startRecording=async()=>{
    try{
      setError(null);
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':'audio/webm'});
      chunksRef.current=[];
      mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
      mr.start(250);
      mediaRecRef.current=mr;
      setIsRecording(true);
    }catch(err){
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording=()=>{
    return new Promise(resolve=>{
      const mr=mediaRecRef.current;
      if(!mr||mr.state==='inactive'){resolve(null);return;}
      mr.onstop=()=>{
        const blob=new Blob(chunksRef.current,{type:mr.mimeType||'audio/webm'});
        // Stop all tracks
        mr.stream.getTracks().forEach(t=>t.stop());
        mediaRecRef.current=null;
        setIsRecording(false);
        resolve(blob);
      };
      mr.stop();
    });
  };

  // Process user's spoken answer: transcribe → generate follow-up
  const handleUserResponse=async()=>{
    setIsProcessing(true);
    try{
      const blob=await stopRecording();
      if(!blob||blob.size<1000){setIsProcessing(false);setError('No audio detected. Please try speaking again.');return;}

      // Transcribe with Whisper
      const text=await openaiWhisper(blob);
      if(!text){setIsProcessing(false);setError('Could not transcribe audio. Please try again.');return;}

      // Add user response to transcript
      const userEntry={role:'user',text,ts:new Date().toISOString()};
      const newTranscript=[...transcript,userEntry];
      setTranscript(newTranscript);

      // Calculate remaining time
      const elapsedSec=Math.floor((Date.now()-startRef.current)/1000);
      const remainingSec=maxSec-elapsedSec;

      // Determine if we should move to next starter question or generate a follow-up
      const answeredStarterCount=newTranscript.filter(t=>t.role==='ai').length;
      const hasMoreStarters=currentQIdx<starterQs.length;
      // Time management: calculate how much time per remaining question
      const remainingStarters=starterQs.length-currentQIdx;
      const timePerQuestion=remainingStarters>0?Math.floor(remainingSec/(remainingStarters+1)):remainingSec;
      const shouldProbe=timePerQuestion>30&&remainingSec>60; // enough time to probe deeper

      let aiResponse;
      if(remainingSec<30){
        // Wrapping up
        aiResponse='Thank you so much for sharing your thoughts! That\'s all the time we have. Your insights are incredibly valuable.';
      } else if(shouldProbe&&!hasMoreStarters){
        // Generate follow-up based on conversation
        aiResponse=await generateFollowUp(newTranscript,objective,remainingSec);
      } else if(shouldProbe&&hasMoreStarters&&timePerQuestion>45){
        // Probe on current answer before moving to next starter
        aiResponse=await generateFollowUp(newTranscript,objective,Math.min(timePerQuestion,60));
      } else if(hasMoreStarters){
        // Move to next starter question
        const nextQ=starterQs[currentQIdx];
        aiResponse='Thank you for that. '+nextQ;
        setCurrentQIdx(prev=>prev+1);
      } else {
        // Wrap up
        aiResponse=await generateFollowUp(newTranscript,objective,remainingSec);
      }

      const aiEntry={role:'ai',text:aiResponse,ts:new Date().toISOString()};
      const finalTranscript=[...newTranscript,aiEntry];
      setTranscript(finalTranscript);
      update({transcript:finalTranscript});
      setIsProcessing(false);

      // Check if AI signaled end
      if(remainingSec<30){
        setTimeout(()=>wrapUp(),2000);
      } else {
        await speak(aiResponse);
      }
    }catch(err){
      setIsProcessing(false);
      setError('Error processing response: '+(err.message||'Unknown error'));
    }
  };

  // Generate dynamic follow-up via OpenAI
  const generateFollowUp=async(trans,obj,remainSec)=>{
    const conversationText=trans.map(t=>`${t.role==='ai'?'Interviewer':'Participant'}: ${t.text}`).join('\n');
    const systemPrompt=`You are a skilled UX research interviewer conducting a user interview. Your research objective is: "${obj}"

You are having a voice conversation. Keep your responses conversational, warm, and concise (1-3 sentences).

Guidelines:
- Ask ONE clear follow-up question at a time
- Probe deeper into interesting points the participant raised
- Use active listening — reference specifics from their answers
- If they mention something relevant to the objective, explore it further
- You have approximately ${remainSec} seconds remaining in this interview
${remainSec<90?'- Start wrapping up gracefully, perhaps with one final question':'- Continue probing for insights'}
- Never repeat a question already asked
- Be empathetic and encouraging`;

    const messages=[
      {role:'system',content:systemPrompt},
      {role:'user',content:`Here is the conversation so far:\n\n${conversationText}\n\nGenerate your next interviewer response (1-3 sentences, ending with a follow-up question):`}
    ];
    return openaiChat(messages,{maxTokens:200,temperature:0.7});
  };

  // End the interview
  const wrapUp=()=>{
    clearInterval(timerRef.current);
    if(mediaRecRef.current&&mediaRecRef.current.state!=='inactive'){
      mediaRecRef.current.stream.getTracks().forEach(t=>t.stop());
      mediaRecRef.current=null;
    }
    setIsRecording(false);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setPhase('done');
    const finalTranscript=[...transcript];
    update({
      transcript:finalTranscript,
      completed_at:new Date().toISOString(),
      duration_ms:startRef.current?Date.now()-startRef.current:0,
      total_exchanges:finalTranscript.length,
      device_type:/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop'
    });
  };

  // No API key configured
  if(!OPENAI_KEY){
    return React.createElement('div',{style:{padding:20,textAlign:'center',color:'#ef4444'}},
      mIcon('error_outline',{size:32,style:{display:'block',margin:'0 auto 8px'}}),
      React.createElement('p',{style:{fontWeight:600,marginBottom:4}},'AI Interview Unavailable'),
      React.createElement('p',{style:{fontSize:13,color:'#6b7280'}},'No OpenAI API key configured. The survey administrator needs to set the VITE_OPENAI_API_KEY environment variable.')
    );
  }

  // Phase: idle — show objective, duration, and Start button
  if(phase==='idle'){
    return React.createElement('div',null,
      objective&&React.createElement('div',{style:{background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:10,padding:'14px 18px',marginBottom:16}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
          mIcon('psychology',{size:18,style:{color:'#9333ea'}}),
          React.createElement('span',{style:{fontWeight:600,fontSize:14,color:'#581c87'}},'Interview Topic')
        ),
        React.createElement('p',{style:{fontSize:14,color:'#334155',lineHeight:1.5}},objective)
      ),
      React.createElement('div',{style:{border:'2px dashed #d1d5db',borderRadius:12,padding:'32px 20px',textAlign:'center',background:'#fafafa',marginBottom:12}},
        mIcon('mic',{size:48,style:{color:brand||'#9333ea',display:'block',margin:'0 auto 12px'}}),
        React.createElement('p',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:6}},'AI-Moderated Voice Interview'),
        React.createElement('p',{style:{fontSize:13,color:'#6b7280',marginBottom:4}},'You\'ll have a conversation with an AI interviewer who will ask questions and follow up based on your answers.'),
        React.createElement('p',{style:{fontSize:12,color:'#9ca3af',marginBottom:16}},`Duration: ${q.ai_duration||'3-5'} minutes`+(ttsEnabled?' · The AI will speak its questions aloud':'')),
        React.createElement('div',{style:{background:'#fef3c7',border:'1px solid #fbbf24',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#92400e',display:'inline-block',textAlign:'left'}},
          mIcon('info',{size:14,style:{verticalAlign:'middle',marginRight:4}}),'Your microphone will be used to capture your responses. Audio is transcribed to text only — no recordings are stored.'
        ),
        React.createElement('div',null,
          React.createElement('button',{
            onClick:startInterview,
            style:{background:brand||'#9333ea',color:'white',border:'none',padding:'10px 28px',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer',transition:'all .15s'}
          },'Begin Interview')
        )
      )
    );
  }

  // Phase: interviewing — conversation flow
  if(phase==='interviewing'){
    return React.createElement('div',null,
      // Timer bar
      React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',background:'#111827',color:'white',fontSize:13,borderRadius:'10px 10px 0 0',marginBottom:0}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
          mIcon('timer',{size:16,style:{color:elapsed<maxSec*0.8?'#4ade80':'#fbbf24'}}),
          React.createElement('span',{style:{fontWeight:600,fontVariantNumeric:'tabular-nums'}},formatTime(elapsed)),
          React.createElement('span',{style:{color:'#9ca3af',fontSize:11}},` / ${formatTime(maxSec)}`)
        ),
        React.createElement('div',{style:{display:'flex',gap:8,alignItems:'center'}},
          isRecording&&React.createElement('span',{style:{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#ef4444'}},
            React.createElement('span',{style:{width:8,height:8,borderRadius:'50%',background:'#ef4444',animation:'pulse 1.5s infinite'}}),
            'Recording'
          ),
          isSpeaking&&React.createElement('span',{style:{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#4ade80'}},
            mIcon('volume_up',{size:14}),'Speaking'
          ),
          React.createElement('button',{onClick:wrapUp,style:{background:'transparent',border:'1px solid #4b5563',color:'white',padding:'4px 10px',borderRadius:6,fontSize:11,cursor:'pointer'}},'End Interview')
        )
      ),
      // Progress bar
      React.createElement('div',{style:{height:3,background:'#374151'}},
        React.createElement('div',{style:{height:'100%',background:elapsed<maxSec*0.8?'#4ade80':'#fbbf24',width:`${Math.min(100,(elapsed/maxSec)*100)}%`,transition:'width 1s linear'}})
      ),
      // Transcript display
      React.createElement('div',{style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'0 0 10px 10px',padding:'16px',maxHeight:350,overflowY:'auto',marginBottom:16}},
        transcript.length===0&&React.createElement('div',{style:{textAlign:'center',color:'#9ca3af',padding:20}},'Interview starting...'),
        transcript.map((entry,i)=>React.createElement('div',{key:i,style:{display:'flex',gap:10,marginBottom:12,flexDirection:entry.role==='ai'?'row':'row-reverse'}},
          React.createElement('div',{style:{width:32,height:32,borderRadius:'50%',background:entry.role==='ai'?'#9333ea':'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},
            mIcon(entry.role==='ai'?'smart_toy':'person',{size:18,style:{color:'white'}})
          ),
          React.createElement('div',{style:{maxWidth:'75%',padding:'10px 14px',borderRadius:12,background:entry.role==='ai'?'white':'#eff6ff',border:'1px solid '+(entry.role==='ai'?'#e5e7eb':'#bfdbfe'),fontSize:14,lineHeight:1.5,color:'#111827'}},
            entry.text
          )
        )),
        isProcessing&&React.createElement('div',{style:{display:'flex',gap:10,marginBottom:12}},
          React.createElement('div',{style:{width:32,height:32,borderRadius:'50%',background:'#9333ea',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}},
            mIcon('smart_toy',{size:18,style:{color:'white'}})
          ),
          React.createElement('div',{style:{padding:'10px 14px',borderRadius:12,background:'white',border:'1px solid #e5e7eb',fontSize:13,color:'#9ca3af'}},
            'Thinking...'
          )
        )
      ),
      // Action buttons
      React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:12}},
        !isRecording&&!isProcessing&&!isSpeaking&&React.createElement('button',{
          onClick:startRecording,
          style:{background:'#ef4444',color:'white',border:'none',padding:'12px 28px',borderRadius:50,fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'all .15s',boxShadow:'0 4px 14px rgba(239,68,68,0.4)'}
        },mIcon('mic',{size:20,style:{color:'white'}}),'Hold to Speak'),
        isRecording&&React.createElement('button',{
          onClick:handleUserResponse,
          style:{background:'#111827',color:'white',border:'none',padding:'12px 28px',borderRadius:50,fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'all .15s',animation:'pulse 1.5s infinite'}
        },mIcon('stop',{size:20,style:{color:'white'}}),'Done Speaking'),
        isProcessing&&React.createElement('div',{style:{padding:'12px 28px',fontSize:14,color:'#6b7280'}},
          'Processing your response...'
        ),
        isSpeaking&&React.createElement('div',{style:{padding:'12px 28px',fontSize:14,color:'#9333ea',display:'flex',alignItems:'center',gap:8}},
          mIcon('volume_up',{size:18,style:{color:'#9333ea'}}),'AI is speaking...'
        )
      ),
      error&&React.createElement('div',{style:{marginTop:12,padding:'8px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,fontSize:13,color:'#dc2626',textAlign:'center'}},error)
    );
  }

  // Phase: done
  return React.createElement('div',null,
    React.createElement('div',{style:{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'16px',marginBottom:16,textAlign:'center'}},
      mIcon('check_circle',{size:36,style:{color:'#16a34a',display:'block',margin:'0 auto 8px'}}),
      React.createElement('p',{style:{fontSize:15,fontWeight:600,color:'#111827',marginBottom:4}},'Interview Complete!'),
      React.createElement('p',{style:{fontSize:13,color:'#6b7280'}},`${transcript.length} exchanges · ${val.duration_ms?formatTime(Math.floor(val.duration_ms/1000)):'-'} duration`)
    ),
    // Show transcript summary
    React.createElement('div',{style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:10,padding:'14px',maxHeight:250,overflowY:'auto'}},
      React.createElement('div',{style:{fontSize:12,fontWeight:600,color:'#6b7280',marginBottom:8}},'Conversation Summary'),
      transcript.map((entry,i)=>React.createElement('div',{key:i,style:{marginBottom:8,fontSize:13,lineHeight:1.4}},
        React.createElement('span',{style:{fontWeight:600,color:entry.role==='ai'?'#9333ea':'#3b82f6'}},entry.role==='ai'?'AI: ':'You: '),
        React.createElement('span',{style:{color:'#374151'}},entry.text)
      ))
    )
  );
}

function RankWidget({q,value,onChange,brand}){
  // value is an array of option IDs in ranked order
  const initOrder=()=>{
    if(Array.isArray(value)&&value.length>0)return value;
    return (q.options||[]).map(o=>o.id);
  };
  const[order,setOrder]=useState(initOrder);
  const[dragging,setDragging]=useState(null);
  const[overIdx,setOverIdx]=useState(null);

  // Keep order in sync if options change from outside
  const allIds=(q.options||[]).map(o=>o.id);
  const synced=order.filter(id=>allIds.includes(id));
  allIds.forEach(id=>{if(!synced.includes(id))synced.push(id);});

  const getLabel=id=>(q.options||[]).find(o=>o.id===id)?.text||id;

  const commit=(newOrder)=>{
    setOrder(newOrder);
    onChange(q,newOrder);
  };

  const onDragStart=(e,id)=>{
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',id);
    setDragging(id);
  };
  const onDragOver=(e,idx)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect='move';
    setOverIdx(idx);
  };
  const onDrop=(e,targetIdx)=>{
    e.preventDefault();
    const dragId=e.dataTransfer.getData('text/plain');
    if(!dragId||dragId===synced[targetIdx]){setDragging(null);setOverIdx(null);return;}
    const fromIdx=synced.indexOf(dragId);
    if(fromIdx===-1){setDragging(null);setOverIdx(null);return;}
    const next=[...synced];
    next.splice(fromIdx,1);
    next.splice(targetIdx,0,dragId);
    commit(next);
    setDragging(null);
    setOverIdx(null);
  };
  const onDragEnd=()=>{setDragging(null);setOverIdx(null);};

  return React.createElement('div',{style:{marginTop:12}},
    React.createElement('p',{style:{fontSize:12,color:'#6b7280',marginBottom:8}},'Drag to reorder — #1 is your top choice'),
    synced.map((id,idx)=>React.createElement('div',{
      key:id,
      draggable:true,
      onDragStart:e=>onDragStart(e,id),
      onDragOver:e=>onDragOver(e,idx),
      onDrop:e=>onDrop(e,idx),
      onDragEnd,
      style:{
        display:'flex',alignItems:'center',gap:10,
        padding:'10px 12px',marginBottom:6,
        background:dragging===id?'#f3f4f6':'white',
        border:'1.5px solid '+(overIdx===idx&&dragging!==id?brand||'#00ACBD':'#e5e7eb'),
        borderRadius:10,cursor:'grab',
        opacity:dragging===id?0.5:1,
        boxShadow:dragging===id?'none':'0 1px 2px rgba(0,0,0,0.04)',
        transition:'border-color .1s,opacity .1s',
        userSelect:'none'
      }
    },
      mIcon('drag_indicator',{size:20,style:{color:'#9ca3af',flexShrink:0}}),
      React.createElement('span',{style:{
        fontWeight:700,fontSize:12,color:brand||'#00ACBD',
        minWidth:20,textAlign:'center',flexShrink:0
      }},idx+1),
      React.createElement('span',{style:{flex:1,fontSize:14,color:'#111827'}},getLabel(id))
    ))
  );
}

function CardSortWidget({q,value,onChange,brand}){
  // ── state lives here; value prop is initial seed only ──
  const cards=q.cards||[];
  const predefinedCats=q.categories||[];

  // Derive initial state from saved value or defaults
  const mkInit=()=>{
    if(value&&(Object.keys(value.categories||{}).length>0||value.catNames)){
      return {
        placements:{...value.categories},          // {catId:[cardId,...]}
        catNames:{...value.catNames},              // {catId:name} for open sort
        uncategorized:[...(value.uncategorized||cards.map(c=>c.id))]
      };
    }
    // Fresh start
    const placements={};
    if(q.type==='card_sort_closed'){predefinedCats.forEach(cat=>{placements[cat.id]=[];});}
    return {placements, catNames:{}, uncategorized:cards.map(c=>c.id)};
  };

  const[state,setState]=useState(mkInit);
  const[dragging,setDragging]=useState(null);   // cardId being dragged
  const[overZone,setOverZone]=useState(null);    // 'deck' | catId
  const[newCatName,setNewCatName]=useState('');  // open-sort input

  // Persist to parent whenever state changes
  const commit=(next)=>{
    setState(next);
    onChange(q,{categories:next.placements,catNames:next.catNames,uncategorized:next.uncategorized});
  };

  // ── drag handlers ──
  const onDragStart=(e,cardId)=>{
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain',cardId);
    setDragging(cardId);
  };
  const onDragEnd=()=>{setDragging(null);setOverZone(null);};
  const onDragOver=(e,zone)=>{e.preventDefault();e.dataTransfer.dropEffect='move';setOverZone(zone);};
  const onDragLeave=()=>setOverZone(null);

  const moveCard=(cardId,targetCatId)=>{
    setState(prev=>{
      const p={};
      Object.keys(prev.placements).forEach(k=>{p[k]=[...prev.placements[k].filter(id=>id!==cardId)];});
      const unc=prev.uncategorized.filter(id=>id!==cardId);
      if(targetCatId==='deck'){unc.push(cardId);}
      else{if(!p[targetCatId])p[targetCatId]=[];p[targetCatId].push(cardId);}
      const next={...prev,placements:p,uncategorized:unc};
      onChange(q,{categories:next.placements,catNames:next.catNames,uncategorized:next.uncategorized});
      return next;
    });
  };

  const onDrop=(e,zone)=>{
    e.preventDefault();
    const cardId=e.dataTransfer.getData('text/plain')||dragging;
    if(!cardId)return;
    setDragging(null);setOverZone(null);
    moveCard(cardId,zone);
  };

  // Open sort: add a new category bucket
  const addCategory=()=>{
    const name=newCatName.trim()||'New Category';
    const catId='cat_'+uid();
    setState(prev=>{
      const next={...prev,placements:{...prev.placements,[catId]:[]},catNames:{...prev.catNames,[catId]:name}};
      onChange(q,{categories:next.placements,catNames:next.catNames,uncategorized:next.uncategorized});
      return next;
    });
    setNewCatName('');
  };

  const renameCategory=(catId,name)=>{
    setState(prev=>{
      const next={...prev,catNames:{...prev.catNames,[catId]:name}};
      onChange(q,{categories:next.placements,catNames:next.catNames,uncategorized:next.uncategorized});
      return next;
    });
  };

  const deleteCategory=(catId)=>{
    setState(prev=>{
      const returnedCards=prev.placements[catId]||[];
      const p={...prev.placements};delete p[catId];
      const cn={...prev.catNames};delete cn[catId];
      const next={...prev,placements:p,catNames:cn,uncategorized:[...prev.uncategorized,...returnedCards]};
      onChange(q,{categories:next.placements,catNames:next.catNames,uncategorized:next.uncategorized});
      return next;
    });
  };

  // Helper: render a single draggable card chip
  const renderCard=(cardId)=>{
    const card=cards.find(c=>c.id===cardId);
    if(!card)return null;
    return React.createElement('div',{
      key:cardId,
      draggable:true,
      onDragStart:e=>onDragStart(e,cardId),
      onDragEnd,
      className:'card-item'+(dragging===cardId?' dragging':''),
      title:'Drag to a category'
    },
      card.image_url&&React.createElement('img',{src:card.image_url,style:{width:'100%',borderRadius:4,marginBottom:4,objectFit:'cover',maxHeight:60}}),
      React.createElement('span',{style:{fontSize:13,fontWeight:500}},card.text)
    );
  };

  // ── category bucket ──
  const renderBucket=(catId,label,cardIds,isHighlighted)=>{
    const empty=!cardIds||cardIds.length===0;
    return React.createElement('div',{
      key:catId,
      onDragOver:e=>onDragOver(e,catId),
      onDragLeave,
      onDrop:e=>onDrop(e,catId),
      className:'card-sort-category'+(isHighlighted?' drag-over':''),
      style:{minHeight:100}
    },
      // Category header
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6,marginBottom:8}},
        mIcon('folder_open',{size:16,style:{color:'#6b7280'}}),
        q.type==='card_sort_open'
          ?React.createElement('input',{
              type:'text',
              value:state.catNames[catId]||label,
              onChange:e=>renameCategory(catId,e.target.value),
              style:{flex:1,border:'none',background:'transparent',fontSize:13,fontWeight:600,color:'#374151',outline:'none',cursor:'text'},
              placeholder:'Category name...',
              onClick:e=>e.stopPropagation()
            })
          :React.createElement('span',{style:{fontSize:13,fontWeight:600,color:'#374151',flex:1}},label),
        React.createElement('span',{style:{fontSize:11,color:'#9ca3af',marginRight:4}},`${cardIds?.length||0} card${cardIds?.length!==1?'s':''}`),
        q.type==='card_sort_open'&&React.createElement('button',{
          onClick:()=>deleteCategory(catId),
          style:{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:'0 2px',display:'flex',alignItems:'center'}
        },mIcon('delete',{size:14}))
      ),
      // Drop zone for cards
      React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:6,minHeight:50,padding:empty?8:0,borderRadius:6,background:empty?'rgba(0,0,0,.02)':undefined,border:empty?'1px dashed #d1d5db':undefined}},
        empty
          ?React.createElement('div',{style:{fontSize:12,color:'#9ca3af',margin:'auto'}},isHighlighted?'Drop here':'Drop cards here')
          :(cardIds||[]).map(id=>renderCard(id))
      )
    );
  };

  const allCatIds=q.type==='card_sort_closed'
    ?predefinedCats.map(c=>c.id)
    :Object.keys(state.placements);

  const deckHighlight=overZone==='deck';

  return React.createElement('div',{style:{marginTop:16}},
    // ── DECK (unplaced cards) ──
    React.createElement('div',{style:{marginBottom:16}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
        mIcon('style',{size:16,style:{color:'#6b7280'}}),
        React.createElement('span',{style:{fontSize:13,fontWeight:600,color:'#374151'}},'Cards to sort'),
        React.createElement('span',{style:{fontSize:11,color:'#9ca3af'}},`(${state.uncategorized.length} remaining)`)
      ),
      React.createElement('div',{
        onDragOver:e=>onDragOver(e,'deck'),
        onDragLeave,
        onDrop:e=>onDrop(e,'deck'),
        style:{
          display:'flex',flexWrap:'wrap',gap:8,padding:12,minHeight:72,
          border:'2px dashed '+(deckHighlight?'#00ACBD':'#d1d5db'),
          borderRadius:10,background:deckHighlight?'#e0f7fa':'white',
          transition:'all .15s'
        }
      },
        state.uncategorized.length===0
          ?React.createElement('div',{style:{fontSize:12,color:'#9ca3af',margin:'auto'}},'All cards have been sorted! 🎉')
          :state.uncategorized.map(id=>renderCard(id))
      )
    ),

    // ── CATEGORY BUCKETS ──
    React.createElement('div',null,
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:8}},
        mIcon('category',{size:16,style:{color:'#6b7280'}}),
        React.createElement('span',{style:{fontSize:13,fontWeight:600,color:'#374151'}},'Categories')
      ),
      allCatIds.length===0&&q.type==='card_sort_open'&&React.createElement('div',{style:{fontSize:12,color:'#9ca3af',padding:'12px',border:'1px dashed #d1d5db',borderRadius:8,textAlign:'center',marginBottom:8}},
        'No categories yet — add one below.'
      ),
      allCatIds.map(catId=>{
        const label=q.type==='card_sort_closed'
          ?(predefinedCats.find(c=>c.id===catId)?.name||'Category')
          :(state.catNames[catId]||'Category');
        return renderBucket(catId,label,state.placements[catId],overZone===catId);
      })
    ),

    // ── OPEN SORT: add category ──
    q.type==='card_sort_open'&&React.createElement('div',{style:{display:'flex',gap:8,marginTop:8}},
      React.createElement('input',{
        type:'text',
        value:newCatName,
        onChange:e=>setNewCatName(e.target.value),
        onKeyDown:e=>e.key==='Enter'&&addCategory(),
        placeholder:'New category name...',
        style:{flex:1,padding:'8px 12px',fontSize:13,border:'1.5px solid #e5e7eb',borderRadius:8,outline:'none'}
      }),
      React.createElement('button',{
        onClick:addCategory,
        style:{display:'flex',alignItems:'center',gap:4,padding:'8px 14px',background:'#000',color:'#FFCE34',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}
      },mIcon('add',{size:16}),' Add Category')
    )
  );
}

// ── ANALYTICS PORTAL ─────────────────────────────────────────────────────────
function AnalyticsPortal({initialSurveyId}){
  const[surveys,setSurveys]=useState([]);
  const[sel,setSel]=useState(null);
  const[view,setView]=useState('results');

  useEffect(()=>{
    const list=LS.all('surveys').filter(s=>s.status!=='archived').sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
    setSurveys(list);
    if(initialSurveyId){
      const found=list.find(s=>s.id===initialSurveyId);
      if(found){setSel(found);setView('results');}
    } else if(list.length>0 && !sel){
      setSel(list[0]);
    }
  },[initialSurveyId]);

  const exportCSV=(s)=>{
    const qs=s.schema?.questions||[];
    const sessions=LS.where('sessions',x=>x.survey_id===s.id&&x.status==='completed');
    const headers=['session_id','submitted_at','version','device','browser','ms','email',...qs.flatMap(q=>[`q_${q.id}`])];
    const rows=sessions.map(sess=>{
      const ansMap={};
      LS.where('answers',a=>a.session_id===sess.id).forEach(a=>{ansMap[a.question_id]=a;});
      const base=[sess.id,sess.submitted_at,sess.survey_version,sess.device_type,sess.browser,sess.completion_ms,sess.respondent_email||''];
      qs.forEach(q=>{const a=ansMap[q.id];base.push(a?Array.isArray(a.raw_value)?a.raw_value.join(';'):(a.raw_value??''):'');});
      return base;
    });
    const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`survey_responses_${s.id.slice(-6)}.csv`;
    a.click();
  };

  return React.createElement('div',{className:'h-[calc(100vh-56px)] overflow-hidden flex flex-col'},
    !sel?React.createElement('div',{className:'text-center px-5 py-16 text-gray-400',style:{paddingTop:80}},
      React.createElement('div',{className:'text-6xl mb-3'},mIcon('bar_chart',{size:64})),
      React.createElement('h3',null,'No survey selected'),
      React.createElement('p',null,'Go to the Surveys tab and click Results on any survey')
    ):React.createElement('div',{style:{display:'flex',flexDirection:'column',height:'100%'}},
      React.createElement('div',{style:{background:'white',borderBottom:'1px solid var(--gray-200)',padding:'0 20px',display:'flex',gap:2,position:'sticky',top:0,zIndex:10,alignItems:'center'}},
        React.createElement('div',{style:{display:'flex',flexDirection:'column',justifyContent:'center',marginRight:12,paddingTop:10,paddingBottom:10}},
          React.createElement('span',{style:{fontSize:15,fontWeight:700,color:'#111827',lineHeight:1.2}},sel.title),
          React.createElement('span',{className:`badge badge-${sel.status}`,style:{marginTop:3,alignSelf:'flex-start',fontSize:10}},sel.status)
        ),
        React.createElement('div',{style:{width:1,height:28,background:'var(--gray-200)',margin:'0 6px'}}),
        [['results','bar_chart','Results'],['responses','group','Responses'],['opentext','chat','Open Text']].map(([v,icon,label])=>
          React.createElement('button',{key:v,className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md',style:{borderRadius:0,borderBottom:view===v?'2px solid var(--primary)':'2px solid transparent',marginBottom:-1,padding:'14px 12px',fontSize:13},onClick:()=>setView(v)},[mIcon(icon,{size:16}),' ',label])
        ),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',style:{marginLeft:'auto'},onClick:()=>exportCSV(sel)},[mIcon('download',{size:16}),' CSV'])
      ),
      React.createElement('div',{style:{flex:1,overflowY:'auto'}},
        view==='results'&&React.createElement('div',null,React.createElement(AnalyticsOverview,{survey:sel}),React.createElement(QuestionCharts,{survey:sel})),
        view==='responses'&&React.createElement(ResponseDirectory,{survey:sel}),
        view==='opentext'&&React.createElement(OpenTextAnalysis,{survey:sel})
      )
    )
  );
}


function SimpleBarChart({data,labelKey,valueKey,color,height=160}){
  if(!data||!data.length)return null;
  const maxVal=Math.max(...data.map(d=>d[valueKey]),1);
  const w=data.length;
  const barW=Math.max(12,Math.min(40,Math.floor(500/w)));
  const gap=Math.max(4,Math.floor(barW*0.3));
  const totalW=data.length*(barW+gap);
  const chartH=height-30;
  const[hover,setHover]=useState(null);
  return React.createElement('div',{style:{width:'100%',overflowX:totalW>600?'auto':'hidden',position:'relative'}},
    React.createElement('svg',{width:Math.max(totalW,100),height:height,style:{display:'block'}},
      data.map((d,i)=>{
        const val=d[valueKey]||0;
        const bh=Math.max(2,(val/maxVal)*chartH);
        const x=i*(barW+gap)+gap;
        const y=chartH-bh;
        return React.createElement('g',{key:i,onMouseEnter:()=>setHover(i),onMouseLeave:()=>setHover(null)},
          React.createElement('rect',{x,y,width:barW,height:bh,rx:3,fill:hover===i?color+'cc':color,style:{transition:'all .15s'}}),
          React.createElement('text',{x:x+barW/2,y:chartH+14,textAnchor:'middle',fontSize:10,fill:'#6b7280'},d[labelKey]),
          hover===i&&React.createElement('text',{x:x+barW/2,y:y-5,textAnchor:'middle',fontSize:11,fontWeight:600,fill:'#374151'},val)
        );
      })
    )
  );
}

function AnalyticsOverview({survey}){
  const sessions=LS.where('sessions',s=>s.survey_id===survey.id);
  const completed=sessions.filter(s=>s.status==='completed');
  const partial=sessions.filter(s=>s.status==='in_progress');
  const times=completed.map(s=>s.completion_ms).filter(Boolean).sort((a,b)=>a-b);
  const mid=Math.floor(times.length/2);
  const median=times.length?(times.length%2===0?(times[mid-1]+times[mid])/2:times[mid]):null;
  // Volume by day
  const dayMap={};
  sessions.forEach(s=>{const d=(s.submitted_at||s.started_at)?.slice(0,10);if(d)dayMap[d]=(dayMap[d]||0)+1;});
  const volData=Object.entries(dayMap).sort().slice(-14).map(([day,count])=>({day:day.slice(5),count}));
  // Drop off
  const dropMap={};
  sessions.filter(s=>s.status!=='completed').forEach(s=>{const i=s.last_question_idx||0;dropMap[i]=(dropMap[i]||0)+1;});
  const dropData=Object.entries(dropMap).sort((a,b)=>Number(a[0])-Number(b[0])).map(([q,count])=>({q:'Q'+(Number(q)+1),count}));

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    React.createElement('div',{className:'mb-4'},
      React.createElement('h2',{style:{fontSize:19,fontWeight:700}},survey.title),
      React.createElement('div',{className:'text-sm text-gray-500'},`v${survey.version} • ${survey.status}`)
    ),
    React.createElement('div',{className:'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5 mb-5'},
      [{v:sessions.length,l:'Total Responses'},{v:completed.length,l:'Completed',sub:`${sessions.length?((completed.length/sessions.length)*100).toFixed(0):0}% rate`},{v:partial.length,l:'In Progress'},{v:median?`${Math.round(median/1000)}s`:'—',l:'Median Time'}]
        .map(({v,l,sub})=>React.createElement('div',{key:l,className:'bg-white border border-gray-200 rounded-lg px-4.5 py-4.5 text-center'},
          React.createElement('div',{className:'text-3xl font-bold text-gray-900 font-display'},v),
          React.createElement('div',{className:'text-sm text-gray-500 mt-0.5'},l),
          sub&&React.createElement('div',{className:'text-xs text-gray-400 mt-0.5'},sub)
        ))
    ),
    React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}},
      React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm'},
        React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},'Response Volume (14 days)')),
        React.createElement('div',{className:'px-5 py-4'},
          volData.length>0?React.createElement(SimpleBarChart,{data:volData,labelKey:'day',valueKey:'count',color:HALO.blue,height:160}):React.createElement('div',{className:'text-gray-500 text-sm'},'No data yet.')
        )
      ),
      React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm'},
        React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},'Drop-off by Question')),
        React.createElement('div',{className:'px-5 py-4'},
          dropData.length>0?React.createElement(SimpleBarChart,{data:dropData,labelKey:'q',valueKey:'count',color:'#FFCE34',height:160}):React.createElement('div',{className:'text-gray-500 text-sm'},'No drop-off data.')
        )
      )
    )
  );
}

function ResponseDirectory({survey}){
  const[all,setAll]=useState([]);
  const[selSess,setSelSess]=useState(null);
  const[filterStatus,setFilterStatus]=useState('');

  useEffect(()=>{
    setAll(LS.where('sessions',s=>s.survey_id===survey.id).sort((a,b)=>b.started_at.localeCompare(a.started_at)));
  },[survey.id]);

  const rows=filterStatus?all.filter(s=>s.status===filterStatus):all;
  const statusColors={completed:'badge-published',in_progress:'badge-draft',partial:'badge-paused'};

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    React.createElement('div',{className:'flex gap-2 mb-4'},
      React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',style:{width:'auto'},value:filterStatus,onChange:e=>setFilterStatus(e.target.value)},
        React.createElement('option',{value:''},'All statuses'),
        ['completed','in_progress'].map(s=>React.createElement('option',{key:s,value:s},s))
      )
    ),
    React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm'},
      React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},`${rows.length} respondents`)),
      React.createElement('div',{className:'overflow-x-auto rounded-lg border border-gray-200'},
        React.createElement('table',null,
          React.createElement('thead',null,React.createElement('tr',null,
            ['Submitted','Status','Version','Device','Time (s)','Email'].map(h=>React.createElement('th',{key:h},h))
          )),
          React.createElement('tbody',null,
            rows.map(r=>React.createElement('tr',{key:r.id,className:'cursor-pointer',onClick:()=>setSelSess(r.id)},
              React.createElement('td',null,r.submitted_at?new Date(r.submitted_at).toLocaleString():React.createElement('span',{className:'text-gray-500'},'In progress')),
              React.createElement('td',null,React.createElement('span',{className:`badge ${statusColors[r.status]||'badge-draft'}`},r.status)),
              React.createElement('td',null,`v${r.survey_version}`),
              React.createElement('td',null,r.device_type||'—'),
              React.createElement('td',null,r.completion_ms?Math.round(r.completion_ms/1000):'—'),
              React.createElement('td',null,r.respondent_email||React.createElement('span',{className:'text-gray-500'},'anon'))
            ))
          )
        )
      )
    ),
    selSess&&React.createElement(ResponseDetailModal,{sessionId:selSess,schema:survey.schema,onClose:()=>setSelSess(null)})
  );
}

function ResponseDetailModal({sessionId,schema,onClose}){
  const session=LS.find('sessions',sessionId);
  const answers=LS.where('answers',a=>a.session_id===sessionId).sort((a,b)=>a.answered_at.localeCompare(b.answered_at));
  const qMap={};
  (schema?.questions||[]).forEach(q=>{qMap[q.id]=q;});

  return React.createElement(Modal,{title:`Response (${sessionId.slice(-8)})`,onClose},
    React.createElement('div',null,
      session&&React.createElement('div',{style:{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap'}},
        React.createElement('span',{className:'text-sm text-gray-500'},`Submitted: ${session.submitted_at?new Date(session.submitted_at).toLocaleString():'—'}`),
        React.createElement('span',{className:'text-sm text-gray-500'},`Device: ${session.device_type||'?'}`),
        session.completion_ms&&React.createElement('span',{className:'text-sm text-gray-500'},`Time: ${Math.round(session.completion_ms/1000)}s`),
        session.respondent_email&&React.createElement('span',{className:'text-sm'},`📧 ${session.respondent_email}`)
      ),
      answers.map((a,i)=>{
        const q=qMap[a.question_id];
        const disp=Array.isArray(a.raw_value)?a.raw_value.join(', '):(a.text_value||a.raw_value||'—');
        return React.createElement('div',{key:i,style:{marginBottom:14,paddingBottom:14,borderBottom:'1px solid var(--gray-100)'}},
          React.createElement('div',{className:'text-xs text-gray-500 mb-2'},q?.text||a.question_id),
          React.createElement('div',{style:{fontWeight:500,color:'var(--gray-800)',lineHeight:1.5}},String(disp))
        );
      }),
      answers.length===0&&React.createElement('div',{className:'text-gray-500 text-sm'},'No answers recorded.')
    )
  );
}

function QuestionCharts({survey}){
  const qs=(survey.schema?.questions||[]).filter(q=>!['short_text','paragraph','context_screen'].includes(q.type));

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    React.createElement('h2',{style:{fontSize:17,fontWeight:700,marginBottom:18}},'Question Results'),
    qs.map((q,idx)=>{
      const completedSessIds=new Set(LS.where('sessions',s=>s.survey_id===survey.id&&s.status==='completed').map(s=>s.id));
      const answers=LS.where('answers',a=>a.survey_id===survey.id&&a.question_id===q.id&&completedSessIds.has(a.session_id));
      if(!answers.length)return React.createElement('div',{key:q.id,className:'bg-white rounded-lg border border-gray-200 shadow-sm mb-4'},
        React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},q.text||`Q${idx+1}`)),
        React.createElement('div',{className:'px-5 py-4'},React.createElement('div',{className:'text-gray-500 text-sm'},'No responses yet.'))
      );
      let content;
      if(q.type==='single_choice'||q.type==='rating'){
        const dist={};
        answers.forEach(a=>{const v=Array.isArray(a.raw_value)?a.raw_value.join(','):String(a.raw_value??'');dist[v]=(dist[v]||0)+1;});
        const items=Object.entries(dist).sort((a,b)=>b[1]-a[1]);
        content=items.map(([val,cnt])=>React.createElement('div',{key:val,className:'mb-2.25'},
          React.createElement('div',{className:'flex justify-between mb-0.75 text-sm'},React.createElement('span',null,val),React.createElement('span',null,`${cnt} (${(cnt/answers.length*100).toFixed(0)}%)`)),
          React.createElement('div',{className:'h-5 bg-gray-100 rounded overflow-hidden'},React.createElement('div',{className:'h-full rounded transition-all duration-500 ease-out flex items-center pl-1.25',style:{width:`${cnt/answers.length*100}%`,background:HALO.blue}}))
        ));
      } else if(q.type==='multiple_select'){
        const dist={};
        answers.forEach(a=>{(Array.isArray(a.raw_value)?a.raw_value:[]).forEach(v=>{dist[v]=(dist[v]||0)+1;});});
        const items=Object.entries(dist).sort((a,b)=>b[1]-a[1]);
        content=items.map(([val,cnt])=>React.createElement('div',{key:val,className:'mb-2.25'},
          React.createElement('div',{className:'flex justify-between mb-0.75 text-sm'},React.createElement('span',null,val),React.createElement('span',null,`${cnt} (${(cnt/answers.length*100).toFixed(0)}%)`)),
          React.createElement('div',{className:'h-5 bg-gray-100 rounded overflow-hidden'},React.createElement('div',{className:'h-full rounded transition-all duration-500 ease-out flex items-center pl-1.25',style:{width:`${cnt/answers.length*100}%`,background:HALO.blue}}))
        ));
      } else if(['card_sort_open','card_sort_closed'].includes(q.type)){
        // Card Sort Analytics
        const cards=q.cards||[];
        const predefinedCats=q.categories||[];
        // Parse all responses into a uniform structure: [{categories:{catId:[cardId,...]}, catNames:{catId:name}}]
        const parsed=answers.map(a=>{
          const rv=a.raw_value;
          if(!rv||typeof rv!=='object')return null;
          return{categories:rv.categories||{},catNames:rv.catNames||{}};
        }).filter(Boolean);
        const n=parsed.length;

        if(q.type==='card_sort_closed'){
          // Closed sort: show a card×category placement matrix (heatmap)
          const catIds=predefinedCats.map(c=>c.id);
          const catNames={};predefinedCats.forEach(c=>{catNames[c.id]=c.name;});
          // Count: how many times card X was placed in category Y
          const matrix={};// {cardId:{catId:count}}
          cards.forEach(card=>{matrix[card.id]={};catIds.forEach(cid=>{matrix[card.id][cid]=0;});});
          parsed.forEach(r=>{
            Object.entries(r.categories).forEach(([catId,cardIds])=>{
              (cardIds||[]).forEach(cardId=>{if(matrix[cardId]&&matrix[cardId][catId]!==undefined)matrix[cardId][catId]++;});
            });
          });
          // Render as table with color-coded cells
          content=React.createElement('div',null,
            React.createElement('p',{style:{fontSize:12,color:'#6b7280',marginBottom:12}},'Card placement matrix — shows what % of respondents placed each card in each category. Darker = stronger agreement.'),
            React.createElement('div',{style:{overflowX:'auto'}},
              React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:13}},
                React.createElement('thead',null,
                  React.createElement('tr',null,
                    React.createElement('th',{style:{textAlign:'left',padding:'8px 12px',borderBottom:'2px solid #e5e7eb',fontWeight:600,color:'#374151',minWidth:120}},'Card'),
                    catIds.map(cid=>React.createElement('th',{key:cid,style:{textAlign:'center',padding:'8px 10px',borderBottom:'2px solid #e5e7eb',fontWeight:600,color:'#374151',minWidth:80}},catNames[cid]||'Category'))
                  )
                ),
                React.createElement('tbody',null,
                  cards.map(card=>{
                    const row=matrix[card.id]||{};
                    const maxCount=Math.max(...Object.values(row),1);
                    return React.createElement('tr',{key:card.id},
                      React.createElement('td',{style:{padding:'8px 12px',fontWeight:500,color:'#374151',borderBottom:'1px solid #f3f4f6'}},card.text),
                      catIds.map(cid=>{
                        const cnt=row[cid]||0;
                        const pct=n>0?Math.round((cnt/n)*100):0;
                        const intensity=n>0?cnt/n:0;
                        const bg=HALO.rgba(HALO.indigo,Math.max(0.05,intensity));
                        const textColor=intensity>0.6?'white':'#374151';
                        return React.createElement('td',{key:cid,style:{textAlign:'center',padding:'6px 8px',background:bg,color:textColor,fontWeight:intensity>0.4?600:400,borderBottom:'1px solid #f3f4f6',borderLeft:'1px solid #f3f4f6',transition:'all .2s'}},
                          cnt>0?`${pct}%`:'-'
                        );
                      })
                    );
                  })
                )
              )
            ),
            React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8,marginTop:12,fontSize:11,color:'#9ca3af'}},
              React.createElement('span',null,'Agreement: '),
              [0.1,0.3,0.5,0.7,0.9].map(v=>React.createElement('div',{key:v,style:{width:24,height:14,borderRadius:3,background:HALO.rgba(HALO.indigo,v)}})),
              React.createElement('span',null,'Low → High')
            )
          );
        } else {
          // Open sort: show co-occurrence matrix (how often cards were grouped together) + popular category names
          // Co-occurrence: count how many respondents placed card A and card B in the same category
          const coMatrix={};
          cards.forEach(c1=>{coMatrix[c1.id]={};cards.forEach(c2=>{coMatrix[c1.id][c2.id]=0;});});
          parsed.forEach(r=>{
            Object.values(r.categories).forEach(cardIds=>{
              (cardIds||[]).forEach(a=>{
                (cardIds||[]).forEach(b=>{if(a!==b&&coMatrix[a])coMatrix[a][b]++;});
              });
            });
          });
          // Popular category names
          const catNameFreq={};
          parsed.forEach(r=>{
            Object.values(r.catNames||{}).forEach(name=>{
              const norm=name.toLowerCase().trim();
              if(norm)catNameFreq[norm]=(catNameFreq[norm]||0)+1;
            });
          });
          const topCats=Object.entries(catNameFreq).sort((a,b)=>b[1]-a[1]).slice(0,12);

          content=React.createElement('div',null,
            React.createElement('p',{style:{fontSize:12,color:'#6b7280',marginBottom:12}},'Co-occurrence matrix — shows how often respondents grouped cards together. Darker = more frequently paired.'),
            // Co-occurrence table
            React.createElement('div',{style:{overflowX:'auto',marginBottom:20}},
              React.createElement('table',{style:{borderCollapse:'collapse',fontSize:11}},
                React.createElement('thead',null,
                  React.createElement('tr',null,
                    React.createElement('th',{style:{padding:'6px 8px'}}),
                    cards.map(c=>React.createElement('th',{key:c.id,style:{padding:'4px 6px',fontWeight:600,color:'#374151',maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',writingMode:'vertical-rl',textOrientation:'mixed',height:80,verticalAlign:'bottom'}},c.text))
                  )
                ),
                React.createElement('tbody',null,
                  cards.map(c1=>React.createElement('tr',{key:c1.id},
                    React.createElement('td',{style:{padding:'4px 8px',fontWeight:500,color:'#374151',whiteSpace:'nowrap'}},c1.text),
                    cards.map(c2=>{
                      if(c1.id===c2.id)return React.createElement('td',{key:c2.id,style:{background:'#f3f4f6',width:28,height:28}});
                      const cnt=coMatrix[c1.id]?.[c2.id]||0;
                      const pct=n>0?cnt/n:0;
                      return React.createElement('td',{key:c2.id,style:{width:28,height:28,textAlign:'center',fontSize:10,background:HALO.rgba(HALO.purple,Math.max(0.03,pct)),color:pct>0.5?'white':'#374151',fontWeight:pct>0.4?600:400,border:'1px solid #f9fafb'}},
                        cnt>0?cnt:''
                      );
                    })
                  ))
                )
              )
            ),
            // Popular categories
            topCats.length>0&&React.createElement('div',null,
              React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:8}},'Most common category names created by respondents'),
              React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:6}},
                topCats.map(([name,cnt])=>React.createElement('div',{key:name,style:{padding:'6px 12px',background:HALO.rgba(HALO.green,0.12),border:'1px solid '+HALO.rgba(HALO.green,0.3),borderRadius:20,fontSize:12,fontWeight:500,color:'#166534'}},
                  `"${name}" (${cnt})`
                ))
              )
            )
          );
        }
      } else if(q.type==='rank'){
        // Compute average rank position for each option (lower = ranked higher)
        const optIds=(q.options||[]).map(o=>o.id);
        const scoreMap={};optIds.forEach(id=>{scoreMap[id]={total:0,count:0};});
        answers.forEach(a=>{
          const ranked=Array.isArray(a.raw_value)?a.raw_value:[];
          ranked.forEach((id,pos)=>{if(scoreMap[id]){scoreMap[id].total+=pos+1;scoreMap[id].count++;}});
        });
        const items=optIds.map(id=>{
          const opt=(q.options||[]).find(o=>o.id===id);
          const sc=scoreMap[id];
          const avg=sc.count>0?(sc.total/sc.count):null;
          return{id,label:opt?.text||id,avg};
        }).filter(x=>x.avg!=null).sort((a,b)=>a.avg-b.avg);
        const worst=items.length?items[items.length-1].avg:1;
        content=React.createElement('div',null,
          React.createElement('p',{style:{fontSize:12,color:'#6b7280',marginBottom:10}},'Average rank position (lower = ranked higher by respondents)'),
          items.map((item,ri)=>React.createElement('div',{key:item.id,className:'mb-2.25'},
            React.createElement('div',{className:'flex justify-between mb-0.75 text-sm'},
              React.createElement('span',null,React.createElement('strong',{style:{color:HALO.orange,marginRight:6}},'#'+(ri+1)),item.label),
              React.createElement('span',{style:{color:'#6b7280'}},`avg rank ${item.avg.toFixed(1)}`)
            ),
            React.createElement('div',{className:'h-5 bg-gray-100 rounded overflow-hidden'},
              React.createElement('div',{className:'h-full rounded transition-all duration-500 ease-out',style:{width:`${(1-(item.avg-1)/(worst))*100}%`,background:HALO.orange}})
            )
          ))
        );
      } else if(q.type==='prototype_test'){
        // Prototype Test Analytics
        const parsed=answers.map(a=>{const rv=a.raw_value;return rv&&typeof rv==='object'?rv:null;}).filter(Boolean);
        const n=parsed.length;
        // Success rate
        const yesCount=parsed.filter(r=>r.completion_self_report==='yes').length;
        const noCount=parsed.filter(r=>r.completion_self_report==='no').length;
        const successRate=n>0?Math.round((yesCount/n)*100):0;
        // Average time on task
        const times=parsed.filter(r=>r.time_on_task_ms>0).map(r=>r.time_on_task_ms);
        const avgTime=times.length>0?Math.round(times.reduce((a,b)=>a+b,0)/times.length/1000):0;
        const medianTime=times.length>0?Math.round(times.sort((a,b)=>a-b)[Math.floor(times.length/2)]/1000):0;
        // Difficulty distribution
        const diffDist={1:0,2:0,3:0,4:0,5:0};
        parsed.forEach(r=>{if(r.difficulty_rating>=1&&r.difficulty_rating<=5)diffDist[r.difficulty_rating]++;});
        const diffRatings=parsed.filter(r=>r.difficulty_rating>=1&&r.difficulty_rating<=5);
        const avgDiff=diffRatings.length>0?(diffRatings.reduce((a,r)=>a+r.difficulty_rating,0)/diffRatings.length).toFixed(1):'-';
        // Feedback texts
        const feedbackTexts=parsed.filter(r=>r.open_text_feedback&&r.open_text_feedback.trim()).map(r=>r.open_text_feedback.trim());
        const diffLabels={1:'Very Easy',2:'Easy',3:'Moderate',4:'Hard',5:'Very Hard'};
        const diffColors={1:HALO.green,2:HALO.blue,3:HALO.gold,4:HALO.orange,5:HALO.coral};

        content=React.createElement('div',null,
          // Summary metrics row
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}},
            React.createElement('div',{style:{background:HALO.rgba(HALO.green,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.green}},`${successRate}%`),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Success Rate'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},`${yesCount}/${n} completed`)
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.blue,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.blue}},`${avgTime}s`),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Avg Time on Task'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},`Median: ${medianTime}s`)
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.purple,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.purple}},avgDiff),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Avg Difficulty'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},`1=Easy, 5=Hard`)
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.orange,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.orange}},feedbackTexts.length),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Feedback Comments'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},`of ${n} respondents`)
            )
          ),
          // Difficulty distribution bars
          diffRatings.length>0&&React.createElement('div',{style:{marginBottom:20}},
            React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:10}},'Difficulty Distribution'),
            [1,2,3,4,5].map(d=>React.createElement('div',{key:d,className:'mb-2'},
              React.createElement('div',{className:'flex justify-between mb-0.75 text-sm'},
                React.createElement('span',{style:{color:diffColors[d],fontWeight:500}},`${d} — ${diffLabels[d]}`),
                React.createElement('span',{style:{color:'#6b7280'}},`${diffDist[d]} (${n>0?Math.round(diffDist[d]/n*100):0}%)`)
              ),
              React.createElement('div',{className:'h-4 bg-gray-100 rounded overflow-hidden'},
                React.createElement('div',{style:{height:'100%',borderRadius:4,background:diffColors[d],width:`${n>0?diffDist[d]/n*100:0}%`,transition:'width .3s'}})
              )
            ))
          ),
          // Time distribution (histogram-like)
          times.length>0&&React.createElement('div',{style:{marginBottom:20}},
            React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:10}},'Time on Task Distribution'),
            React.createElement('div',{style:{display:'flex',gap:4,alignItems:'flex-end',height:80}},
              (()=>{
                const sorted=[...times].sort((a,b)=>a-b);
                const bucketSize=Math.max(5000,Math.ceil((sorted[sorted.length-1]-sorted[0])/10/1000)*1000);
                const minT=sorted[0];
                const buckets={};
                sorted.forEach(t=>{const b=Math.floor((t-minT)/bucketSize);buckets[b]=(buckets[b]||0)+1;});
                const maxB=Math.max(...Object.values(buckets),1);
                const numBuckets=Math.max(...Object.keys(buckets).map(Number))+1;
                return Array.from({length:numBuckets},(_,i)=>{
                  const cnt=buckets[i]||0;
                  const label=Math.round((minT+i*bucketSize)/1000)+'s';
                  return React.createElement('div',{key:i,style:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}},
                    React.createElement('div',{style:{width:'100%',height:`${(cnt/maxB)*60}px`,background:HALO.indigo,borderRadius:'3px 3px 0 0',minHeight:cnt>0?4:0,transition:'height .3s'}}),
                    React.createElement('span',{style:{fontSize:9,color:'#9ca3af'}},label)
                  );
                });
              })()
            )
          ),
          // Feedback comments
          feedbackTexts.length>0&&React.createElement('div',null,
            React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:10}},`Feedback Comments (${feedbackTexts.length})`),
            feedbackTexts.slice(0,10).map((txt,i)=>React.createElement('div',{key:i,style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,padding:'10px 14px',marginBottom:6,fontSize:13,color:'#374151',lineHeight:1.5}},
              React.createElement('span',{style:{color:'#9ca3af',fontWeight:600,marginRight:6}},`R${i+1}`),txt
            )),
            feedbackTexts.length>10&&React.createElement('div',{style:{fontSize:12,color:'#9ca3af',textAlign:'center',marginTop:8}},`+${feedbackTexts.length-10} more comments`)
          )
        );
      } else if(q.type==='ai_interview'){
        // AI Interview Analytics
        const parsed=answers.map(a=>{const rv=a.raw_value;return rv&&typeof rv==='object'?rv:null;}).filter(Boolean);
        const n=parsed.length;
        // Duration stats
        const durations=parsed.filter(r=>r.duration_ms>0).map(r=>r.duration_ms);
        const avgDur=durations.length>0?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length/1000):0;
        // Exchange stats
        const exchanges=parsed.filter(r=>r.total_exchanges>0).map(r=>r.total_exchanges);
        const avgExchanges=exchanges.length>0?Math.round(exchanges.reduce((a,b)=>a+b,0)/exchanges.length):0;
        // Collect all transcripts
        const allTranscripts=parsed.filter(r=>Array.isArray(r.transcript)&&r.transcript.length>0).map(r=>r.transcript);
        const allUserResponses=allTranscripts.flatMap(t=>t.filter(e=>e.role==='user').map(e=>e.text));
        // Word frequency from user responses
        const stopWords=new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','that','this','it','its','i','me','my','we','you','they','not','so','if','as','just','can','very','also','like','some','there','more','how','what','who']);
        const wordFreq={};
        allUserResponses.forEach(text=>{
          const words=text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>3&&!stopWords.has(w));
          words.forEach(w=>{wordFreq[w]=(wordFreq[w]||0)+1;});
        });
        const topWords=Object.entries(wordFreq).sort((a,b)=>b[1]-a[1]).slice(0,15);
        const maxWF=topWords.length>0?topWords[0][1]:1;

        content=React.createElement('div',null,
          // Summary metrics
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}},
            React.createElement('div',{style:{background:HALO.rgba(HALO.purple,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.purple}},n),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Interviews'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},'completed')
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.blue,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.blue}},`${avgDur}s`),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Avg Duration'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},`${Math.round(avgDur/60)} min avg`)
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.green,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.green}},avgExchanges),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Avg Exchanges'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},'per interview')
            ),
            React.createElement('div',{style:{background:HALO.rgba(HALO.orange,0.12),borderRadius:10,padding:'14px 16px',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:28,fontWeight:800,color:HALO.orange}},allUserResponses.length),
              React.createElement('div',{style:{fontSize:11,color:'#374151',fontWeight:600,marginTop:2}},'Total Responses'),
              React.createElement('div',{style:{fontSize:10,color:'#6b7280'}},'from all participants')
            )
          ),
          // Top keywords from user responses
          topWords.length>0&&React.createElement('div',{style:{marginBottom:20}},
            React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:10}},'Top Keywords from Responses'),
            topWords.map(([word,cnt])=>React.createElement('div',{key:word,className:'mb-1.5'},
              React.createElement('div',{className:'flex justify-between mb-0.5 text-sm'},
                React.createElement('span',{style:{fontWeight:500}},word),
                React.createElement('span',{style:{color:'#6b7280'}},`${cnt}x`)
              ),
              React.createElement('div',{className:'h-3 bg-gray-100 rounded overflow-hidden'},
                React.createElement('div',{style:{height:'100%',borderRadius:4,background:HALO.purple,width:`${(cnt/maxWF)*100}%`,transition:'width .3s'}})
              )
            ))
          ),
          // Individual transcripts
          allTranscripts.length>0&&React.createElement('div',null,
            React.createElement('div',{style:{fontSize:13,fontWeight:600,color:'#374151',marginBottom:10}},`Interview Transcripts (${allTranscripts.length})`),
            allTranscripts.slice(0,8).map((trans,i)=>React.createElement('details',{key:i,style:{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,marginBottom:8,overflow:'hidden'}},
              React.createElement('summary',{style:{padding:'10px 14px',cursor:'pointer',fontSize:13,fontWeight:500,color:'#374151',display:'flex',justifyContent:'space-between',alignItems:'center'}},
                React.createElement('span',null,`Respondent ${i+1}`),
                React.createElement('span',{style:{fontSize:11,color:'#9ca3af'}},`${trans.length} exchanges`)
              ),
              React.createElement('div',{style:{padding:'8px 14px',borderTop:'1px solid #e5e7eb',maxHeight:250,overflowY:'auto'}},
                trans.map((entry,j)=>React.createElement('div',{key:j,style:{marginBottom:6,fontSize:12,lineHeight:1.4}},
                  React.createElement('span',{style:{fontWeight:600,color:entry.role==='ai'?'#9333ea':'#3b82f6',marginRight:6}},entry.role==='ai'?'AI:':'User:'),
                  React.createElement('span',{style:{color:'#374151'}},entry.text)
                ))
              )
            )),
            allTranscripts.length>8&&React.createElement('div',{style:{fontSize:12,color:'#9ca3af',textAlign:'center',marginTop:8}},`+${allTranscripts.length-8} more transcripts`)
          )
        );
      }
      return React.createElement('div',{key:q.id,className:'bg-white rounded-lg border border-gray-200 shadow-sm mb-4'},
        React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},
          React.createElement('div',null,
            React.createElement('div',{className:'text-xs text-gray-500 mb-1'},`Q${idx+1} • ${QTYPES.find(t=>t.type===q.type)?.label}`),
            React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},q.text)
          ),
          React.createElement('span',{className:'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-embark-teal-light text-embark-teal-dark'},`${answers.length} responses`)
        ),
        React.createElement('div',{className:'px-5 py-4'},content)
      );
    })
  );
}

function OpenTextAnalysis({survey}){
  const textQs=(survey.schema?.questions||[]).filter(q=>['short_text','paragraph'].includes(q.type));
  const[selQ,setSelQ]=useState(textQs[0]?.id||null);
  const[search,setSearch]=useState('');
  const[subView,setSubView]=useState('responses');
  const[themes,setThemes]=useState(()=>LS.where('themes',t=>t.survey_id===survey.id));
  const[newTheme,setNewTheme]=useState('');
  const toast=useToast();

  const texts=useMemo(()=>{
    if(!selQ)return[];
    const completedIds=new Set(LS.where('sessions',s=>s.survey_id===survey.id&&s.status==='completed').map(s=>s.id));
    return LS.where('answers',a=>a.survey_id===survey.id&&a.question_id===selQ&&a.text_value&&completedIds.has(a.session_id));
  },[selQ,survey.id]);

  const phraseData=useMemo(()=>{
    const stopWords=new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','that','this','it','its','i','me','my','we','you','they','not','so','if','as','just','can','very','also','like','some','there','more','how','what','who']);
    const wordFreq={},phraseFreq={};
    texts.filter(t=>t.text_value?.length>10).forEach(({text_value})=>{
      const words=text_value.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stopWords.has(w));
      words.forEach(w=>{wordFreq[w]=(wordFreq[w]||0)+1;});
      for(let i=0;i<words.length-1;i++){const p=words[i]+' '+words[i+1];phraseFreq[p]=(phraseFreq[p]||0)+1;}
    });
    return{
      words:Object.entries(wordFreq).sort((a,b)=>b[1]-a[1]).slice(0,25).map(([word,count])=>({word,count})),
      phrases:Object.entries(phraseFreq).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([phrase,count])=>({phrase,count}))
    };
  },[texts]);

  const addTheme=()=>{
    if(!newTheme.trim()||!selQ)return;
    const colors=HALO.cycle;
    const t={id:uid(),survey_id:survey.id,question_id:selQ,name:newTheme,color:colors[themes.filter(x=>x.question_id===selQ).length%colors.length],answer_ids:[]};
    LS.insert('themes',t);
    setThemes(LS.where('themes',x=>x.survey_id===survey.id));
    setNewTheme('');
    toast('Theme created','success');
  };

  const tagToTheme=(themeId,answerId)=>{
    const t=LS.find('themes',themeId);
    if(!t)return;
    const ids=[...(t.answer_ids||[])];
    if(!ids.includes(answerId))ids.push(answerId);
    LS.update('themes',themeId,{answer_ids:ids});
    setThemes(LS.where('themes',x=>x.survey_id===survey.id));
    toast('Tagged','success');
  };

  const qThemes=themes.filter(t=>t.question_id===selQ);
  const filtered=search?texts.filter(t=>t.text_value?.toLowerCase().includes(search.toLowerCase())):texts;

  if(textQs.length===0)return React.createElement('div',{className:'text-center px-5 py-16 text-gray-400',style:{paddingTop:80}},
    React.createElement('div',{className:'text-6xl mb-3'},'💬'),
    React.createElement('h3',null,'No open text questions'),
    React.createElement('p',null,'Add short text, paragraph, or long form questions to see analysis here.')
  );

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    React.createElement('div',{className:'flex gap-2 mb-4',style:{flexWrap:'wrap'}},
      textQs.map(q=>React.createElement('button',{key:q.id,className:`btn btn-sm ${selQ===q.id?'btn-primary':'btn-secondary'}`,onClick:()=>setSelQ(q.id)},
        (q.text||q.id).substring(0,45)+((q.text||'').length>45?'...':'')
      ))
    ),
    selQ&&React.createElement('div',null,
      React.createElement('div',{className:'flex gap-2 mb-4'},
        [['responses','💬 Responses'],['phrases','📊 Word Frequency'],['themes','🎯 Themes']].map(([v,l])=>
          React.createElement('button',{key:v,className:`btn btn-sm ${subView===v?'btn-primary':'btn-secondary'}`,onClick:()=>setSubView(v)},l)
        )
      ),
      subView==='responses'&&React.createElement('div',null,
        React.createElement('div',{className:'flex gap-2 mb-3'},
          React.createElement('input',{type:'search',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',style:{maxWidth:320},placeholder:'🔍 Search responses...',value:search,onChange:e=>setSearch(e.target.value)})
        ),
        React.createElement('div',{className:'text-xs text-gray-500 mb-3'},`${filtered.length} responses`),
        filtered.map((item,i)=>React.createElement('div',{key:item.id,style:{marginBottom:10}},
          React.createElement('div',{className:'px-3 py-2.75 bg-gray-50 border-l-3 border-l-embark-gold rounded-r mb-1.75 text-sm text-gray-700 leading-relaxed'},item.text_value),
          React.createElement('div',{style:{display:'flex',gap:6,marginTop:4,alignItems:'center',flexWrap:'wrap'}},
            React.createElement('span',{className:'text-xs text-gray-500'},new Date(item.answered_at).toLocaleDateString()),
            qThemes.length>0&&React.createElement('select',{
              className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',style:{fontSize:12,padding:'2px 7px',height:'auto',width:'auto'},
              defaultValue:'',onChange:e=>{if(e.target.value)tagToTheme(e.target.value,item.id);e.target.value='';}
            },
              React.createElement('option',{value:''},'+ Add to theme'),
              qThemes.map(t=>React.createElement('option',{key:t.id,value:t.id},t.name))
            )
          )
        )),
        filtered.length===0&&React.createElement('div',{className:'text-gray-500 text-sm'},'No responses found.')
      ),
      subView==='phrases'&&React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}},
        React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm'},
          React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},'Top Words')),
          React.createElement('div',{className:'px-5 py-4'},
            phraseData.words.length>0?
            React.createElement('div',{className:'flex flex-wrap gap-1.75 py-3'},
              phraseData.words.map((w,i)=>React.createElement('div',{key:i,className:'px-2.75 py-1 bg-embark-gold-light text-black rounded-full text-sm font-medium',style:{fontSize:Math.max(11,Math.min(18,10+w.count))}},`${w.word} (${w.count})`))
            ):React.createElement('div',{className:'text-gray-500 text-sm'},'Not enough responses yet.')
          )
        ),
        React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm'},
          React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},'Top 2-Word Phrases')),
          React.createElement('div',{className:'px-5 py-4'},
            phraseData.phrases.length>0?
            phraseData.phrases.map((p,i)=>React.createElement('div',{key:i,className:'mb-2.25'},
              React.createElement('div',{className:'flex justify-between mb-0.75 text-sm'},React.createElement('span',null,p.phrase),React.createElement('span',null,p.count)),
              React.createElement('div',{className:'h-5 bg-gray-100 rounded overflow-hidden'},React.createElement('div',{className:'h-full rounded transition-all duration-500 ease-out flex items-center pl-1.25',style:{width:`${(p.count/(phraseData.phrases[0]?.count||1))*100}%`,background:HALO.indigo}}))
            )):React.createElement('div',{className:'text-gray-500 text-sm'},'Not enough responses yet.')
          )
        )
      ),
      subView==='themes'&&React.createElement('div',null,
        React.createElement('div',{className:'flex gap-2 mb-4'},
          React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',style:{maxWidth:220},placeholder:'New theme name...',value:newTheme,onChange:e=>setNewTheme(e.target.value),onKeyDown:e=>e.key==='Enter'&&addTheme()}),
          React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',onClick:addTheme},'＋ Create Theme')
        ),
        qThemes.length===0?React.createElement('div',{className:'text-gray-500 text-sm'},'Create themes to cluster responses. Then tag responses from the Responses tab.'):
        qThemes.map(theme=>{
          const tagged=texts.filter(t=>(theme.answer_ids||[]).includes(t.id));
          return React.createElement('div',{key:theme.id,className:'bg-white rounded-lg border border-gray-200 shadow-sm mb-4'},
            React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},
              React.createElement('div',{style:{display:'flex',alignItems:'center',gap:8}},
                React.createElement('div',{style:{width:11,height:11,borderRadius:'50%',background:theme.color}}),
                React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},theme.name)
              ),
              React.createElement('span',{className:'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-embark-teal-light text-embark-teal-dark'},`${tagged.length} responses`)
            ),
            tagged.length>0&&React.createElement('div',{className:'px-5 py-4'},
              tagged.slice(0,3).map((t,i)=>React.createElement('div',{key:i,className:'px-3 py-2.75 bg-gray-50 border-l-3 border-l-embark-gold rounded-r mb-1.75 text-sm text-gray-700 leading-relaxed',style:{borderLeftColor:theme.color}},t.text_value))
            )
          );
        })
      )
    )
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({onEdit,onAnalytics}){
  const[surveys,setSurveys]=useState([]);
  const[filter,setFilter]=useState('all');
  const[viewMode,setViewMode]=useState('cards');
  const[showNew,setShowNew]=useState(false);
  const[newTitle,setNewTitle]=useState('');
  const[deleteConfirm,setDeleteConfirm]=useState(null);
  const toast=useToast();

  const load=()=>setSurveys(LS.all('surveys').sort((a,b)=>b.updated_at.localeCompare(a.updated_at)));
  useEffect(load,[]);

  const create=()=>{
    if(!newTitle.trim())return;
    const id=uid();
    LS.insert('surveys',{id,title:newTitle,description:'',status:'draft',version:1,schema:{questions:[],logic:[]},branding:{primary_color:'#FFCE34'},thank_you_msg:'',est_minutes:null,collect_email:0,show_progress:1,allow_back:1,allow_anonymous:1,token:null,created_at:now(),updated_at:now()});
    setShowNew(false);setNewTitle('');
    toast('Survey created!','success');
    onEdit(id);
  };

  const seed=()=>{
    seedDemo();load();
    toast('Demo data loaded!','success');
  };

  const confirmDelete=(id,title)=>setDeleteConfirm({id,title});
  const doDelete=()=>{
    if(!deleteConfirm)return;
    const{id}=deleteConfirm;
    const sessIds=LS.where('sessions',s=>s.survey_id===id).map(s=>s.id);
    sessIds.forEach(sid=>LS.remove('sessions',sid));
    LS.where('answers',a=>a.survey_id===id).forEach(a=>LS.remove('answers',a.id));
    LS.remove('surveys',id);
    setDeleteConfirm(null);
    load();
    toast('Survey deleted','info');
  };

  const filtered=surveys.filter(s=>filter==='all'||s.status===filter);

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    React.createElement('div',{className:'flex justify-between items-center mb-4'},
      React.createElement('div',null,
        React.createElement('h1',{style:{fontSize:21,fontWeight:700}},'Surveys'),
        React.createElement('p',{className:'text-sm text-gray-500'},'Create, manage, and analyze your research surveys')
      ),
      React.createElement('div',{className:'flex gap-2 items-center'},
        React.createElement('div',{style:{display:'flex',background:'var(--gray-100)',borderRadius:6,padding:2}},
          React.createElement('button',{title:'Card view',className:`btn btn-sm ${viewMode==='cards'?'btn-primary':'btn-ghost'}`,onClick:()=>setViewMode('cards'),style:{padding:'4px 8px'}},mIcon('grid_view',{size:16})),
          React.createElement('button',{title:'Table view',className:`btn btn-sm ${viewMode==='table'?'btn-primary':'btn-ghost'}`,onClick:()=>setViewMode('table'),style:{padding:'4px 8px'}},mIcon('table_rows',{size:16}))
        ),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:seed},'⚡ Load Demo Data'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',onClick:()=>setShowNew(true)},'＋ New Survey')
      )
    ),
    React.createElement('div',{className:'flex gap-2 mb-4'},
      ['all','draft','published','paused','archived'].map(s=>React.createElement('button',{key:s,className:`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`,onClick:()=>setFilter(s),style:{textTransform:'capitalize'}},s))
    ),
    filtered.length===0?React.createElement('div',{className:'text-center px-5 py-16 text-gray-400'},
      React.createElement('div',{className:'text-6xl mb-3'},'📋'),
      React.createElement('h3',null,filter==='all'?'No surveys yet':'No surveys with this status'),
      React.createElement('p',null,filter==='all'?'Create your first survey or click "Load Demo Data" to explore':'Try a different filter'),
      filter==='all'&&React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',style:{marginTop:16},onClick:()=>setShowNew(true)},'＋ Create Survey')
    ):viewMode==='cards'?
    React.createElement('div',{className:'grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4'},
      filtered.map(s=>{
        const sessCount=LS.where('sessions',x=>x.survey_id===s.id&&x.status==='completed').length;
        return React.createElement('div',{key:s.id,className:'bg-white border border-gray-200 rounded-lg shadow-sm p-5 transition-shadow hover:shadow-md hover:border-gray-300'},
          React.createElement('div',{className:'flex justify-between items-start mb-2'},
            React.createElement('span',{className:`badge badge-${s.status}`},s.status),
            React.createElement('span',{className:'text-xs text-gray-500'},`v${s.version}`)
          ),
          React.createElement('div',{className:'text-base font-semibold text-gray-900 mb-1.5 font-display'},s.title),
          React.createElement('div',{className:'text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed'},s.description||'No description'),
          React.createElement('div',{className:'flex items-center gap-2.5 text-xs text-gray-500 flex-wrap'},
            React.createElement('span',null,`${(s.schema?.questions||[]).length} questions`),
            s.est_minutes&&React.createElement('span',null,`⏱ ${s.est_minutes} min`),
            React.createElement('span',null,`${sessCount} responses`),
            React.createElement('span',null,new Date(s.updated_at).toLocaleDateString())
          ),
          React.createElement('div',{className:'flex gap-2',style:{marginTop:12}},
            React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',onClick:()=>onEdit(s.id)},[mIcon('edit',{size:16}),' Edit']),
            React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-2.5 py-1.5 text-xs',onClick:()=>onAnalytics(s.id)},[mIcon('bar_chart',{size:16}),' Results']),
            s.status==='published'&&s.token&&React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',title:'Copy survey link',onClick:()=>{
              const url=window.location.href.split('?')[0]+'?respond='+s.token;
              navigator.clipboard?.writeText(url);
              toast('Link copied!','success');
            }},mIcon('link',{size:16})),
            React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-red-400 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 text-xs',title:'Delete survey',onClick:()=>confirmDelete(s.id,s.title)},mIcon('delete',{size:16}))
          )
        );
      })
    ):
    React.createElement('div',{className:'bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden'},
      React.createElement('table',{style:{width:'100%',borderCollapse:'collapse'}},
        React.createElement('thead',null,
          React.createElement('tr',{style:{background:'var(--gray-50)',borderBottom:'1px solid var(--gray-200)'}},
            ['Title','Status','Questions','Responses','Updated',''].map(h=>React.createElement('th',{key:h,style:{padding:'10px 16px',textAlign:'left',fontSize:12,fontWeight:600,color:'#6b7280',whiteSpace:'nowrap'}},h))
          )
        ),
        React.createElement('tbody',null,
          filtered.map((s,idx)=>{
            const sessCount=LS.where('sessions',x=>x.survey_id===s.id&&x.status==='completed').length;
            return React.createElement('tr',{key:s.id,style:{borderBottom:idx<filtered.length-1?'1px solid var(--gray-100)':undefined,transition:'background .1s'},onMouseEnter:e=>e.currentTarget.style.background='#f9fafb',onMouseLeave:e=>e.currentTarget.style.background=''},
              React.createElement('td',{style:{padding:'12px 16px'}},
                React.createElement('div',{style:{fontWeight:600,fontSize:14,color:'#111827'}},s.title),
                s.description&&React.createElement('div',{style:{fontSize:12,color:'#6b7280',marginTop:2,maxWidth:340,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},s.description)
              ),
              React.createElement('td',{style:{padding:'12px 16px'}},React.createElement('span',{className:`badge badge-${s.status}`},s.status)),
              React.createElement('td',{style:{padding:'12px 16px',fontSize:13,color:'#374151'}},(s.schema?.questions||[]).length),
              React.createElement('td',{style:{padding:'12px 16px',fontSize:13,color:'#374151'}},sessCount),
              React.createElement('td',{style:{padding:'12px 16px',fontSize:12,color:'#6b7280',whiteSpace:'nowrap'}},new Date(s.updated_at).toLocaleDateString()),
              React.createElement('td',{style:{padding:'12px 16px'}},
                React.createElement('div',{style:{display:'flex',gap:6}},
                  React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 px-2.5 py-1.5 text-xs',onClick:()=>onEdit(s.id)},[mIcon('edit',{size:14}),' Edit']),
                  React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800 px-2.5 py-1.5 text-xs',onClick:()=>onAnalytics(s.id)},[mIcon('bar_chart',{size:14}),' Results']),
                  s.status==='published'&&s.token&&React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',title:'Copy link',onClick:()=>{navigator.clipboard?.writeText(window.location.href.split('?')[0]+'?respond='+s.token);toast('Link copied!','success');}},mIcon('link',{size:14})),
                  React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-red-400 hover:bg-red-50 hover:text-red-600 px-2.5 py-1.5 text-xs',title:'Delete survey',onClick:()=>confirmDelete(s.id,s.title)},mIcon('delete',{size:14}))
                )
              )
            );
          })
        )
      )
    ),
    showNew&&React.createElement(Modal,{
      title:'New Survey',
      onClose:()=>setShowNew(false),
      footer:React.createElement('div',{className:'flex gap-2'},
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:()=>setShowNew(false)},'Cancel'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',onClick:create,disabled:!newTitle.trim()},'Create')
      )
    },
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Survey title'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:newTitle,onChange:e=>setNewTitle(e.target.value),placeholder:'e.g. Customer Satisfaction Survey',autoFocus:true,onKeyDown:e=>e.key==='Enter'&&create()})
      )
    ),
    deleteConfirm&&React.createElement(Modal,{
      title:'Delete Survey',
      onClose:()=>setDeleteConfirm(null),
      footer:React.createElement('div',{className:'flex gap-2'},
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:()=>setDeleteConfirm(null)},'Cancel'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-red-600 text-white hover:bg-red-700',onClick:doDelete},[mIcon('delete',{size:16}),' Delete permanently'])
      )
    },
      React.createElement('div',{style:{padding:'4px 0'}},
        React.createElement('p',{className:'text-sm text-gray-700 mb-3'},
          'Are you sure you want to permanently delete ',
          React.createElement('strong',null,'"'+deleteConfirm.title+'"'),
          '?'
        ),
        React.createElement('p',{className:'text-sm text-red-600'},
          mIcon('warning',{size:14,style:{verticalAlign:'middle',marginRight:4}}),
          'This will also delete all responses and sessions. This cannot be undone.'
        )
      )
    )
  );
}

// ── PANEL LAUNCH (Positly Integration) ───────────────────────────────────────
function PanelLaunch(){
  const[surveys,setSurveys]=useState([]);
  const[campaigns,setCampaigns]=useState([]);
  const[showCreate,setShowCreate]=useState(false);
  const[selSurveyId,setSelSurveyId]=useState('');
  const[sampleSize,setSampleSize]=useState(200);
  const[completionLink,setCompletionLink]=useState('');
  const[campaignName,setCampaignName]=useState('');
  const[targetDesc,setTargetDesc]=useState('US pet owners, age 25-54');
  const toast=useToast();

  const load=()=>{
    setSurveys(LS.all('surveys').filter(s=>s.status==='published'&&s.token));
    setCampaigns(LS.all('panel_campaigns').sort((a,b)=>b.created_at.localeCompare(a.created_at)));
  };
  useEffect(load,[]);

  const baseUrl=window.location.href.split('?')[0];

  // Build the activity URL Positly will send participants to.
  // Positly auto-appends ?assignmentID=xxx&participantID=yyy plus demographics.
  const buildActivityUrl=(token,cid)=>{
    return `${baseUrl}?respond=${token}&pp_cid=${cid}`;
  };

  const createCampaign=()=>{
    if(!selSurveyId||!campaignName.trim())return;
    const survey=surveys.find(s=>s.id===selSurveyId);
    if(!survey)return;
    const cid=uid();
    const camp={
      id:cid,
      name:campaignName,
      survey_id:selSurveyId,
      survey_title:survey.title,
      survey_token:survey.token,
      sample_size:parseInt(sampleSize)||200,
      completion_link:completionLink.trim(),
      target_desc:targetDesc,
      status:'active',
      created_at:now(),
      last_activity:null,
    };
    LS.insert('panel_campaigns',camp);
    setShowCreate(false);
    setCampaignName('');setSelSurveyId('');setSampleSize(200);setCompletionLink('');setTargetDesc('US pet owners, age 25-54');
    toast('Positly campaign created!','success');
    load();
  };

  const copyUrl=(url)=>{
    navigator.clipboard?.writeText(url);
    toast('Copied to clipboard!','success');
  };

  const updateCompletionLink=(id,link)=>{
    LS.update('panel_campaigns',id,{completion_link:link});
    load();
    toast('Completion link saved!','success');
  };

  const delCampaign=(id)=>{
    LS.remove('panel_campaigns',id);
    load();
    toast('Campaign removed','default');
  };

  return React.createElement('div',{className:'px-7 py-7 max-w-screen-xl mx-auto'},
    // Hero
    React.createElement('div',{className:'bg-gradient-to-br from-black to-gray-900 rounded-2xl px-8 py-8 text-white mb-6 relative overflow-hidden'},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:10}},
        React.createElement('h2',{style:{margin:0}},'Positly Panel Recruitment'),
        React.createElement('span',{className:'inline-flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-0.75 rounded-full text-xs font-semibold'},'● Positly')
      ),
      React.createElement('p',null,'Recruit real B2C respondents for your PawPrint surveys through Positly. Self-serve signup, pay-per-response ($0.25–$1.50), demographic targeting, and your own external survey URL. No sales call required.')
    ),

    // How it works
    React.createElement('div',{className:'bg-white rounded-lg border border-gray-200 shadow-sm',style:{marginBottom:24}},
      React.createElement('div',{className:'px-5 py-3.5 border-b border-gray-100 flex items-center justify-between'},
        React.createElement('div',{className:'text-base font-semibold text-gray-800 font-display'},'How It Works')
      ),
      React.createElement('div',{className:'px-5 py-4'},
        React.createElement('div',{className:'flex gap-4 items-start px-4.5 py-4.5 bg-white border border-gray-200 rounded-lg mb-2.5'},
          React.createElement('div',{className:'w-8 h-8 rounded-full bg-embark-gold text-black font-bold text-sm flex items-center justify-center flex-shrink-0'},'1'),
          React.createElement('div',{className:'panel-step-body'},
            React.createElement('h4',null,'Create a Campaign below'),
            React.createElement('p',null,'Select a published PawPrint survey and set your target sample size. PawPrint generates an Activity URL for you.')
          )
        ),
        React.createElement('div',{className:'flex gap-4 items-start px-4.5 py-4.5 bg-white border border-gray-200 rounded-lg mb-2.5'},
          React.createElement('div',{className:'w-8 h-8 rounded-full bg-embark-gold text-black font-bold text-sm flex items-center justify-center flex-shrink-0'},'2'),
          React.createElement('div',{className:'panel-step-body'},
            React.createElement('h4',null,'Create a Run on Positly'),
            React.createElement('p',null,'Sign up at ',React.createElement('a',{href:'https://app.positly.com/',target:'_blank',rel:'noopener',style:{color:'var(--accent)'}},'app.positly.com'),' (free, self-serve). Create a new Run → paste the ',React.createElement('strong',null,'Activity URL'),' from below as your external survey link. Positly will auto-append participant IDs to it.')
          )
        ),
        React.createElement('div',{className:'flex gap-4 items-start px-4.5 py-4.5 bg-white border border-gray-200 rounded-lg mb-2.5'},
          React.createElement('div',{className:'w-8 h-8 rounded-full bg-embark-gold text-black font-bold text-sm flex items-center justify-center flex-shrink-0'},'3'),
          React.createElement('div',{className:'panel-step-body'},
            React.createElement('h4',null,'Copy Positly\'s Completion Link back here'),
            React.createElement('p',null,'Positly gives you a ',React.createElement('strong',null,'Completion Link'),' (looks like ',React.createElement('code',{style:{background:'var(--gray-100)',padding:'1px 4px',borderRadius:3,fontSize:12}},'https://app.positly.com/#/f?task_id=...'),'). Paste it back into the campaign below. PawPrint will redirect participants there after they finish the survey.')
          )
        ),
        React.createElement('div',{className:'flex gap-4 items-start px-4.5 py-4.5 bg-white border border-gray-200 rounded-lg mb-2.5'},
          React.createElement('div',{className:'w-8 h-8 rounded-full bg-embark-gold text-black font-bold text-sm flex items-center justify-center flex-shrink-0'},'4'),
          React.createElement('div',{className:'panel-step-body'},
            React.createElement('h4',null,'Set Targeting & Launch'),
            React.createElement('p',null,'Configure demographics and prescreening on Positly (age, country, pet ownership, etc.), set your sample size, pay with a credit card, and launch. Track completions here in PawPrint in real time.')
          )
        )
      )
    ),

    // Campaigns list header
    React.createElement('div',{className:'flex justify-between items-center mb-4'},
      React.createElement('h2',{style:{fontSize:17,fontWeight:700}},'Positly Campaigns'),
      React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',onClick:()=>setShowCreate(true),disabled:surveys.length===0},
        surveys.length===0?'Publish a survey first':'＋ New Campaign'
      )
    ),

    surveys.length===0&&React.createElement('div',{className:'bg-embark-teal-light border-l-3 border-l-embark-teal rounded-r px-3.5 py-3 text-sm text-embark-teal-dark mb-3.5 leading-relaxed'},
      '⚠️ You need at least one published survey to run a Positly campaign. Go to Surveys → Edit → Publish to get started.'
    ),

    // Campaigns
    campaigns.length===0&&surveys.length>0?React.createElement('div',{className:'text-center px-5 py-16 text-gray-400'},
      React.createElement('div',{className:'text-6xl mb-3'},mIcon('track_changes',{size:64})),
      React.createElement('h3',null,'No campaigns yet'),
      React.createElement('p',null,'Create your first campaign to start recruiting respondents through Positly')
    ):null,
    campaigns.map(camp=>{
      const activityUrl=buildActivityUrl(camp.survey_token,camp.id);
      const sessionsForCamp=LS.where('sessions',s=>s.pp_campaign_id===camp.id);
      const liveCompletes=sessionsForCamp.filter(s=>s.status==='completed').length;
      const liveInProg=sessionsForCamp.filter(s=>s.status==='in_progress').length;
      const liveScreened=sessionsForCamp.filter(s=>s.status==='screened').length;
      const livePct=camp.sample_size>0?Math.round((liveCompletes/camp.sample_size)*100):0;

      return React.createElement('div',{key:camp.id,className:'bg-white border border-gray-200 rounded-lg px-4.5 py-4.5 mb-2.5'},
        React.createElement('div',{className:'flex justify-between items-start mb-2.5'},
          React.createElement('div',null,
            React.createElement('div',{className:'text-sm font-semibold text-gray-900'},camp.name),
            React.createElement('div',{className:'text-xs text-gray-500 mt-0.5'},
              `Survey: ${camp.survey_title} · Target: ${camp.sample_size} completes · Audience: ${camp.target_desc}`
            )
          ),
          React.createElement('div',{className:'flex gap-2'},
            React.createElement('span',{className:`badge badge-${camp.status==='active'?'published':'archived'}`},camp.status),
            React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',title:'Delete campaign',onClick:()=>delCampaign(camp.id)},'🗑')
          )
        ),

        // Progress bar
        React.createElement('div',{style:{marginBottom:12}},
          React.createElement('div',{style:{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--gray-500)',marginBottom:4}},
            React.createElement('span',null,`${liveCompletes} of ${camp.sample_size} completes (${livePct}%)`),
            React.createElement('span',null,camp.last_activity?`Last: ${new Date(camp.last_activity).toLocaleString()}`:'No activity yet')
          ),
          React.createElement('div',{style:{height:8,background:'var(--gray-100)',borderRadius:4,overflow:'hidden'}},
            React.createElement('div',{style:{height:'100%',width:`${Math.min(livePct,100)}%`,background:livePct>=100?'var(--success)':'var(--accent)',borderRadius:4,transition:'width .4s'}})
          )
        ),

        // Stats
        React.createElement('div',{className:'grid grid-cols-4 gap-2.5 mt-3'},
          React.createElement('div',{className:'text-center px-2.5 py-2.5 bg-gray-50 rounded'},
            React.createElement('div',{className:'text-xl font-bold text-gray-900',style:{color:'var(--success)'}},liveCompletes),
            React.createElement('div',{className:'text-xs text-gray-500 mt-0.25'},'Completes')
          ),
          React.createElement('div',{className:'text-center px-2.5 py-2.5 bg-gray-50 rounded'},
            React.createElement('div',{className:'text-xl font-bold text-gray-900',style:{color:'var(--accent)'}},liveInProg),
            React.createElement('div',{className:'text-xs text-gray-500 mt-0.25'},'In Progress')
          ),
          React.createElement('div',{className:'text-center px-2.5 py-2.5 bg-gray-50 rounded'},
            React.createElement('div',{className:'text-xl font-bold text-gray-900',style:{color:'var(--warning)'}},liveScreened),
            React.createElement('div',{className:'text-xs text-gray-500 mt-0.25'},'Screened Out')
          ),
          React.createElement('div',{className:'text-center px-2.5 py-2.5 bg-gray-50 rounded'},
            React.createElement('div',{className:'text-xl font-bold text-gray-900'},camp.sample_size),
            React.createElement('div',{className:'text-xs text-gray-500 mt-0.25'},'Target')
          )
        ),

        // URLs section
        React.createElement('div',{style:{marginTop:14}},
          // Activity URL (copy to Positly)
          React.createElement('div',{style:{marginBottom:12}},
            React.createElement('div',{className:'flex items-center gap-1.5 mb-1'},
              React.createElement('div',{className:'w-2 h-2 rounded-full flex-shrink-0',style:{background:'var(--accent)'}}),
              React.createElement('div',{className:'text-xs font-semibold text-gray-600'},'ACTIVITY URL — paste this into Positly as your external survey link')
            ),
            React.createElement('div',{style:{display:'flex',gap:6,alignItems:'flex-start'}},
              React.createElement('div',{className:'bg-slate-950 text-green-400 px-3 py-2.5 rounded-lg font-mono text-xs break-all leading-relaxed my-2.5',style:{flex:1,margin:0}},activityUrl),
              React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-embark-teal text-white hover:bg-embark-teal-dark px-2.5 py-1.5 text-xs',style:{flexShrink:0,marginTop:4},onClick:()=>copyUrl(activityUrl)},'📋 Copy')
            )
          ),

          // Completion Link (paste from Positly)
          React.createElement('div',{style:{marginBottom:12}},
            React.createElement('div',{className:'flex items-center gap-1.5 mb-1'},
              React.createElement('div',{className:'w-2 h-2 rounded-full flex-shrink-0',style:{background:'var(--success)'}}),
              React.createElement('div',{className:'text-xs font-semibold text-gray-600'},'COMPLETION LINK — paste the link Positly gives you so PawPrint can redirect participants back')
            ),
            camp.completion_link?
              React.createElement('div',{style:{display:'flex',gap:6,alignItems:'center'}},
                React.createElement('div',{className:'bg-slate-950 text-green-400 px-3 py-2.5 rounded-lg font-mono text-xs break-all leading-relaxed my-2.5',style:{flex:1,margin:0,color:'#86efac'}},camp.completion_link),
                React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 px-2.5 py-1.5 rounded-md px-2.5 py-1.5 text-xs',onClick:()=>{
                  const newLink=prompt('Update Positly Completion Link:',camp.completion_link);
                  if(newLink!==null)updateCompletionLink(camp.id,newLink);
                }},'✏️ Edit')
              ):
              React.createElement('div',{style:{display:'flex',gap:8,alignItems:'center'}},
                React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',placeholder:'Paste Positly Completion Link here (e.g. https://app.positly.com/#/f?task_id=...)',style:{flex:1,fontFamily:'monospace',fontSize:12},id:'cl_'+camp.id}),
                React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-embark-teal text-white hover:bg-embark-teal-dark px-2.5 py-1.5 text-xs',onClick:()=>{
                  const el=document.getElementById('cl_'+camp.id);
                  if(el&&el.value.trim())updateCompletionLink(camp.id,el.value.trim());
                }},'Save')
              )
          )
        ),

        !camp.completion_link&&React.createElement('div',{className:'bg-embark-teal-light border-l-3 border-l-embark-teal rounded-r px-3.5 py-3 text-sm text-embark-teal-dark mb-3.5 leading-relaxed',style:{marginTop:10}},
          '⚠️ Don\'t forget to paste your Positly Completion Link above! Without it, participants won\'t be redirected back to Positly after finishing the survey and won\'t be marked as complete.'
        ),

        // Participant log
        sessionsForCamp.length>0&&React.createElement('div',{style:{marginTop:14}},
          React.createElement('div',{style:{fontSize:12,fontWeight:600,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}},'Recent Participants'),
          React.createElement('div',{className:'overflow-x-auto rounded-lg border border-gray-200'},
            React.createElement('table',null,
              React.createElement('thead',null,React.createElement('tr',null,
                React.createElement('th',null,'Participant ID'),
                React.createElement('th',null,'Assignment ID'),
                React.createElement('th',null,'Status'),
                React.createElement('th',null,'Started'),
                React.createElement('th',null,'Completed')
              )),
              React.createElement('tbody',null,
                sessionsForCamp.slice(0,20).map(s=>React.createElement('tr',{key:s.id},
                  React.createElement('td',{style:{fontFamily:'monospace',fontSize:12}},s.positly_participant_id||'—'),
                  React.createElement('td',{style:{fontFamily:'monospace',fontSize:12}},s.positly_assignment_id||'—'),
                  React.createElement('td',null,React.createElement('span',{className:`badge badge-${s.status==='completed'?'published':s.status==='screened'?'paused':'draft'}`},s.status)),
                  React.createElement('td',{className:'text-sm text-gray-500'},s.started_at?new Date(s.started_at).toLocaleString():'—'),
                  React.createElement('td',{className:'text-sm text-gray-500'},s.submitted_at?new Date(s.submitted_at).toLocaleString():'—')
                ))
              )
            )
          )
        )
      );
    }),

    // Create Campaign Modal
    showCreate&&React.createElement(Modal,{
      title:'New Positly Campaign',
      onClose:()=>setShowCreate(false),
      footer:React.createElement('div',{className:'flex gap-2'},
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',onClick:()=>setShowCreate(false)},'Cancel'),
        React.createElement('button',{className:'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-none text-sm font-medium transition-all whitespace-nowrap cursor-pointer bg-black text-white hover:bg-gray-800',onClick:createCampaign,disabled:!selSurveyId||!campaignName.trim()},'Create Campaign')
      )
    },
      React.createElement('div',{className:'bg-embark-teal-light border-l-3 border-l-embark-teal rounded-r px-3.5 py-3 text-sm text-embark-teal-dark mb-3.5 leading-relaxed'},
        '💡 After creating the campaign: 1) Copy the Activity URL into Positly, 2) Positly will give you a Completion Link — paste it back here. You can add the Completion Link later.'
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Campaign name'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',placeholder:'e.g. Dog Owner Brand Perception Q1 2026',value:campaignName,onChange:e=>setCampaignName(e.target.value),autoFocus:true})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Survey to link'),
        React.createElement('select',{className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal',value:selSurveyId,onChange:e=>setSelSurveyId(e.target.value)},
          React.createElement('option',{value:''},'— Select a published survey —'),
          surveys.map(s=>React.createElement('option',{key:s.id,value:s.id},s.title))
        )
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Target sample size'),
        React.createElement('input',{type:'number',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',value:sampleSize,onChange:e=>setSampleSize(e.target.value),min:10,max:5000,step:10})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Audience description (for your reference — set actual targeting in Positly)'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',placeholder:'e.g. US pet owners, age 25-54',value:targetDesc,onChange:e=>setTargetDesc(e.target.value)})
      ),
      React.createElement('div',{className:'mb-4'},
        React.createElement('label',{className:'block text-sm font-medium text-gray-700 mb-1.5'},'Positly Completion Link (optional — you can add this after creating the campaign)'),
        React.createElement('input',{type:'text',className:'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-embark-teal/30 focus:border-embark-teal bg-white',placeholder:'Paste from Positly after creating your Run',value:completionLink,onChange:e=>setCompletionLink(e.target.value),style:{fontFamily:'monospace',fontSize:12}})
      )
    )
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
function App(){
  const params=new URLSearchParams(window.location.search);
  const respondToken=params.get('respond');
  const[page,setPage]=useState(respondToken?'respond':'dashboard');
  const[editingId,setEditingId]=useState(null);

  const nav=(p,id=null)=>{
    setPage(p);setEditingId(id);
    if(p!=='respond'){
      const url=new URL(window.location.href);
      url.searchParams.delete('respond');
      window.history.replaceState({},'',url.toString());
    }
  };

  if(page==='respond'&&respondToken){
    return React.createElement(ToastProvider,null,React.createElement(RespondentView,{token:respondToken}));
  }

  return React.createElement(ToastProvider,null,
    React.createElement('div',{className:'flex flex-col h-full'},
      React.createElement('nav',{className:'bg-black border-b-2 border-embark-gold px-5 flex items-center gap-4 h-14 shrink-0 sticky top-0 z-50'},
        React.createElement('div',{className:'font-bold text-lg text-embark-gold flex items-center gap-2 font-display'},
          '🐾 PawPrint'
        ),
        React.createElement('div',{className:'flex gap-1 ml-4'},
          React.createElement('button',{className:(page==='dashboard'||page==='builder')?'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold bg-embark-gold/20 text-embark-gold font-semibold':'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold',onClick:()=>nav('dashboard')},[mIcon('description',{size:16}),' Surveys']),
          React.createElement('button',{className:page==='analytics'?'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold bg-embark-gold/20 text-embark-gold font-semibold':'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold',onClick:()=>nav('analytics')},[mIcon('analytics',{size:16}),' Analytics']),
          React.createElement('button',{className:page==='panel'?'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold bg-embark-gold/20 text-embark-gold font-semibold':'px-3.5 py-1.5 rounded-md text-sm text-gray-400 transition-all hover:bg-embark-gold/15 hover:text-embark-gold',onClick:()=>nav('panel')},[mIcon('track_changes',{size:16}),' Panel'])
        ),
        React.createElement('div',{className:'ml-auto flex items-center gap-2.5'},
          React.createElement('span',{style:{fontSize:12,color:'#888'}},'All data stored locally in your browser'),
          React.createElement('span',{style:{background:'var(--gold)',color:'#000',padding:'2px 8px',borderRadius:20,fontSize:12,fontWeight:600}},'Demo User')
        )
      ),
      React.createElement('main',{className:'flex-1 overflow-auto'},
        page==='dashboard'&&React.createElement(Dashboard,{onEdit:id=>nav('builder',id),onAnalytics:id=>nav('analytics',id)}),
        page==='builder'&&editingId&&React.createElement(SurveyBuilder,{surveyId:editingId,onBack:()=>nav('dashboard'),onPublished:(sid)=>nav('analytics',sid)}),
        page==='analytics'&&React.createElement(AnalyticsPortal,{initialSurveyId:editingId}),
        page==='panel'&&React.createElement(PanelLaunch,null)
      )
    )
  );
}

export default App;
