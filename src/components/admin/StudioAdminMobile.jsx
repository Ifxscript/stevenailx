import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { uploadToImgBB } from '../../lib/imgbb';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Plus, Edit3, Trash2, AlertCircle, X,
  Image as ImgIcon, Sparkles, Scissors, LayoutGrid,
  Users, Tag, Save, DollarSign, Loader2
} from 'lucide-react';

/* ── Design tokens ─────────────────────────────────────── */
const T = {
  bg: '#f0ebe3',
  card: '#fff',
  bdr: '#e3dbd1',
  text: '#1a1714',
  sub: '#5c5852',
  mut: '#8a857d',
  mutBg: '#ede8e0',
  acc: '#c94b35',
  accBg: '#fdf3f1',
  dk: '#18130e',
  grn: '#1a9e5a',
  grnBg: '#f0faf5',
};

let _u = Date.now();
const uid = () => String(++_u);

/* ── Field data ────────────────────────────────────────── */
const TEAM_FIELDS = [{k:'name',l:'Name',ph:'Full name'},{k:'role',l:'Role',ph:'e.g. Nail Technician'},{k:'bio',l:'Bio',ph:'Short bio…',ml:true}];

/* ── Nav sections ──────────────────────────────────────── */
const NAVS = [
  {id:'nail-cards',     l:'Nail Cards'},
  {id:'nail-prices',    l:'Nail Prices'},
  {id:'other-cards',    l:'Other Cards'},
  {id:'other-prices',   l:'Other Prices'},
  {id:'portfolio',      l:'Portfolio'},
  {id:'team',           l:'Team'},
  {id:'studio-photos',  l:'Studio Photos'},
];

/* ══════════════════════════════════════════════════════════
   ATOMS
   ══════════════════════════════════════════════════════════ */

function Field({ label, value, onChange, placeholder, multi, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  const base = {
    width: '100%', fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 15, color: T.text, border: `1px solid ${focused ? T.acc : T.bdr}`,
    borderRadius: 10, padding: '12px 14px', background: '#fff', outline: 'none',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px rgba(201,75,53,.12)' : 'none',
    transition: 'border-color .15s, box-shadow .15s', resize: 'none', lineHeight: 1.55,
  };
  const handlers = {
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
    onChange: e => onChange(e.target.value),
    style: base, value, placeholder,
  };
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:T.mut,marginBottom:7,textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'Inter,system-ui,sans-serif'}}>
        {label}
      </label>
      {multi
        ? <textarea {...handlers} rows={3}/>
        : <input type={type} {...handlers}/>
      }
    </div>
  );
}

function StatusPick({ value, onChange }) {
  const opts = [
    {k:true,  l:'LIVE',  cl:T.grn, bg:T.grnBg},
    {k:false, l:'DRAFT', cl:T.mut, bg:T.mutBg},
  ];
  return (
    <div style={{marginBottom:18}}>
      <label style={{display:'block',fontSize:11,fontWeight:700,color:T.mut,marginBottom:7,textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'Inter,system-ui,sans-serif'}}>
        Status
      </label>
      <div style={{display:'flex',gap:8}}>
        {opts.map(({k,l,cl,bg}) => {
          const sel = value === k;
          return (
            <button key={l} onClick={() => onChange(k)} style={{flex:1,height:44,borderRadius:999,cursor:'pointer',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:700,border:`1.5px solid ${sel?cl:T.bdr}`,background:sel?bg:'transparent',color:sel?cl:T.mut}}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadArea({ imgUrl, onUpload, uploading, height = 160 }) {
  const ref = useRef();
  return (
    <div style={{marginBottom:18}}>
      <input type="file" accept="image/*" ref={ref} style={{display:'none'}} onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
      <div
        onClick={() => !uploading && ref.current?.click()}
        style={{width:'100%',height,borderRadius:10,background:imgUrl?'#000':'repeating-linear-gradient(45deg,#ede8e0,#ede8e0 5px,#e3ddd6 5px,#e3ddd6 10px)',border:`1.5px dashed ${T.bdr}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,cursor:uploading?'default':'pointer',overflow:'hidden',position:'relative'}}
      >
        {imgUrl ? (
          <img src={imgUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
        ) : (
          <>
            <ImgIcon size={24} color={T.mut} />
            <span style={{fontSize:12,color:T.mut,fontWeight:500,fontFamily:'Inter,system-ui,sans-serif'}}>Tap to upload</span>
          </>
        )}
        {imgUrl && !uploading && (
          <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,.55)',borderRadius:6,padding:'3px 8px'}}>
            <span style={{fontSize:11,color:'#fff',fontWeight:600,fontFamily:'Inter,system-ui,sans-serif'}}>Change</span>
          </div>
        )}
        {uploading && (
          <div style={{position:'absolute',inset:0,background:'rgba(255,255,255,.75)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:13,color:T.sub,fontFamily:'Inter,system-ui,sans-serif'}}>Uploading…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FP({ title, onBack, children }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{minHeight:'100vh',background:T.bg}}>
      <div style={{position:'sticky',top:0,zIndex:10,background:T.bg,borderBottom:`1px solid ${T.bdr}`,display:'flex',alignItems:'center',height:52}}>
        <button onClick={onBack} style={{display:'flex',alignItems:'center',justifyContent:'center',width:52,height:52,background:'transparent',border:'none',cursor:'pointer',flexShrink:0}}>
          <ArrowLeft size={20} color={T.text} />
        </button>
        <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:16,fontWeight:700,color:T.text}}>{title}</span>
      </div>
      <div style={{padding:'24px 16px 48px'}}>{children}</div>
    </div>
  );
}

function SaveBtn({ label = 'Save', onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{width:'100%',height:52,borderRadius:999,background:disabled?'#ccc':T.dk,color:'#fff',border:'none',fontFamily:'Inter,system-ui,sans-serif',fontSize:16,fontWeight:700,cursor:disabled?'default':'pointer',marginTop:8}}>
      {label}
    </button>
  );
}

function AddB({ label, onClick }) {
  return (
    <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:5,height:36,padding:'0 14px',borderRadius:999,background:T.dk,color:'#fff',border:'none',fontFamily:'Inter,system-ui,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',flexShrink:0}}>
      <Plus size={13} color="#fff" />{label}
    </button>
  );
}

function Emp({ label }) {
  return (
    <div style={{border:`1.5px dashed ${T.bdr}`,borderRadius:14,padding:'28px 16px',textAlign:'center'}}>
      <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:13,color:T.mut}}>{label}</span>
    </div>
  );
}

function Confirm({ open, msg, onOk, onNo }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div onClick={onNo} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.45)'}} />
      <div style={{position:'relative',background:T.card,borderRadius:14,padding:24,width:'100%',maxWidth:320,boxShadow:'0 8px 40px rgba(0,0,0,.15)'}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:20}}>
          <AlertCircle size={18} color={T.acc} style={{flexShrink:0,marginTop:2}} />
          <p style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:14,color:T.text,lineHeight:1.5,margin:0}}>{msg}</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onNo} style={{flex:1,height:44,borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:500,color:T.sub,cursor:'pointer'}}>Cancel</button>
          <button onClick={onOk} style={{flex:1,height:44,borderRadius:999,border:'none',background:T.acc,fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:700,color:'#fff',cursor:'pointer'}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function Sect({ id, icon, title, badge, action, children }) {
  return (
    <section id={id} style={{marginBottom:36,scrollMarginTop:110}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {icon}
          <h2 style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:15,fontWeight:700,color:T.text,margin:0}}>{title}</h2>
        </div>
        {action}
      </div>
      {badge && (
        <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:999,background:'rgba(201,75,53,.10)',border:'1px solid rgba(201,75,53,.2)',marginBottom:14}}>
          <Sparkles size={11} color={T.acc} />
          <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:700,color:T.acc,letterSpacing:'.06em',textTransform:'uppercase'}}>Featured Service</span>
        </div>
      )}
      {children}
    </section>
  );
}

function Divider() {
  return <div style={{height:1,background:T.bdr,margin:'4px 0 32px'}} />;
}

function SectNav() {
  return (
    <div style={{overflowX:'auto',display:'flex',gap:7,padding:'10px 16px',background:T.bg,borderBottom:`1px solid ${T.bdr}`,WebkitOverflowScrolling:'touch',msOverflowStyle:'none',scrollbarWidth:'none'}}>
      {NAVS.map(n => (
        <a key={n.id} href={`#${n.id}`} style={{display:'inline-flex',alignItems:'center',height:30,padding:'0 11px',borderRadius:999,border:`1px solid ${T.bdr}`,background:T.card,fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:500,color:T.sub,textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>
          {n.l}
        </a>
      ))}
    </div>
  );
}

function SaveFt({ dirty, onSave, saving, onDiscard }) {
  return (
    <div style={{padding:'28px 16px 48px',borderTop:`1px solid ${T.bdr}`,marginTop:8}}>
      {dirty && (
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'10px 14px',borderRadius:10,background:'rgba(201,75,53,.08)',border:'1px solid rgba(201,75,53,.2)',marginBottom:16}}>
          <AlertCircle size={16} color={T.acc} />
          <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:13,color:T.acc,fontWeight:500}}>You have unsaved changes</span>
        </div>
      )}
      <button onClick={onSave} disabled={saving} style={{width:'100%',height:52,borderRadius:999,background:dirty&&!saving?T.dk:'#b0aa9e',color:'#fff',border:'none',fontFamily:'Inter,system-ui,sans-serif',fontSize:16,fontWeight:700,cursor:dirty&&!saving?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <Save size={18} color="#fff" />{saving?'Saving…':'Save all changes'}
      </button>
      {dirty && (
        <button onClick={onDiscard} style={{width:'100%',height:44,borderRadius:999,marginTop:10,background:'transparent',border:`1px solid ${T.bdr}`,fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:500,color:T.mut,cursor:'pointer'}}>
          Discard changes
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION COMPONENTS
   ══════════════════════════════════════════════════════════ */

/* ── Service Cards ─────────────────────────────────────── */
function CardsSect({ id, icon, title, badge, cards, onChange, nav, mark }) {
  const [cfm, setCfm] = useState(null);

  const openForm = (card) => {
    const Form = () => {
      // Normalise: old cards have a single `image` string, new ones have `images` array
      const initImages = card?.images?.length
        ? card.images
        : card?.image ? [card.image] : [];
      const [f,        setF]        = useState({ title: card?.title||'', description: card?.description||'', images: initImages });
      const [uploading, setUploading] = useState(false);
      const fileRef = useRef();

      const handleUpload = async (file) => {
        setUploading(true);
        try {
          const url = await uploadToImgBB(file);
          setF(x => ({...x, images: [...x.images, url]}));
        } catch { alert('Upload failed.'); }
        finally { setUploading(false); }
      };

      const removeImg = (idx) =>
        setF(x => ({...x, images: x.images.filter((_,i) => i !== idx)}));

      return (
        <FP title={card ? 'Edit Card' : 'New Card'} onBack={() => nav(null)}>
          {/* ── Photo strip ── */}
          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:T.mut,marginBottom:10,textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'Inter,system-ui,sans-serif'}}>
              Photos {f.images.length > 0 && <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>({f.images.length})</span>}
            </label>
            <input type="file" accept="image/*" ref={fileRef} style={{display:'none'}} onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8,WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
              {f.images.map((img, idx) => (
                <div key={idx} style={{position:'relative',flexShrink:0,width:100,height:100,borderRadius:10,overflow:'hidden',border:`1px solid ${T.bdr}`}}>
                  <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <button
                    onClick={() => removeImg(idx)}
                    style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,.55)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,lineHeight:1}}
                  >✕</button>
                </div>
              ))}
              {/* Add tile */}
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                style={{flexShrink:0,width:100,height:100,borderRadius:10,border:`1.5px dashed ${T.bdr}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5,cursor:uploading?'default':'pointer',background:'transparent'}}
              >
                {uploading
                  ? <span style={{fontSize:11,color:T.mut,fontFamily:'Inter,system-ui,sans-serif'}}>Uploading…</span>
                  : <><Plus size={18} color={T.mut}/><span style={{fontSize:11,color:T.mut,fontFamily:'Inter,system-ui,sans-serif'}}>Add photo</span></>
                }
              </div>
            </div>
          </div>

          <Field label="Title" value={f.title||''} onChange={v => setF(x=>({...x,title:v}))} placeholder="e.g. Classic Luxe" />
          <Field label="Short Description" value={f.description||''} onChange={v => setF(x=>({...x,description:v}))} placeholder="e.g. Signature gel nail art" multi />
          <SaveBtn
            label="Save Card"
            disabled={!f.title?.trim()}
            onClick={() => {
              // Also keep `image` for backward compat with anything reading the old field
              const data = {...f, image: f.images[0] || ''};
              if (card) onChange(p => p.map(i => i.id===card.id ? {...i,...data} : i));
              else onChange(p => [...p, {id:uid(), ...data}]);
              mark(); nav(null);
            }}
          />
        </FP>
      );
    };
    nav(<Form />);
  };

  const openAddMultiple = () => {
    const Form = () => {
      const [slots, setSlots] = useState([{ id: uid(), title: '', description: '', image: '', uploading: false }]);
      const addSlot = () => setSlots(p => [...p, { id: uid(), title: '', description: '', image: '', uploading: false }]);
      const removeSlot = (id) => setSlots(p => p.filter(s => s.id !== id));
      const updateSlot = (id, key, val) => setSlots(p => p.map(s => s.id === id ? {...s, [key]: val} : s));
      const handleUpload = async (id, file) => {
        updateSlot(id, 'uploading', true);
        try { const url = await uploadToImgBB(file); updateSlot(id, 'image', url); }
        catch { alert('Upload failed.'); }
        finally { updateSlot(id, 'uploading', false); }
      };
      const valid = slots.filter(s => s.title.trim());
      return (
        <FP title="Add Cards" onBack={() => nav(null)}>
          {slots.map((slot, i) => (
            <div key={slot.id} style={{marginBottom:16,padding:16,background:T.card,borderRadius:14,boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:700,color:T.mut,textTransform:'uppercase',letterSpacing:'.06em'}}>Card {i + 1}</span>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(slot.id)} style={{width:26,height:26,borderRadius:'50%',border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <X size={13} color={T.acc}/>
                  </button>
                )}
              </div>
              <UploadArea imgUrl={slot.image} onUpload={f => handleUpload(slot.id, f)} uploading={slot.uploading} height={140} />
              <Field label="Title" value={slot.title} onChange={v => updateSlot(slot.id, 'title', v)} placeholder="e.g. Classic Luxe" />
              <Field label="Short Description" value={slot.description} onChange={v => updateSlot(slot.id, 'description', v)} placeholder="e.g. Signature gel nail art" multi />
            </div>
          ))}
          <button
            onClick={addSlot}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',height:44,border:`1.5px dashed ${T.bdr}`,borderRadius:12,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,color:T.mut,cursor:'pointer',marginBottom:16}}
          >
            <Plus size={14} color={T.mut}/>Add another card
          </button>
          <SaveBtn
            label={`Save ${valid.length} card${valid.length !== 1 ? 's' : ''}`}
            disabled={valid.length === 0}
            onClick={() => {
              onChange(p => [...p, ...valid.map(s => ({ id: uid(), title: s.title, description: s.description, image: s.image }))]);
              mark(); nav(null);
            }}
          />
        </FP>
      );
    };
    nav(<Form />);
  };

  const del = () => { onChange(p => p.filter(i => i.id!==cfm.id)); setCfm(null); mark(); };

  return (
    <Sect id={id} icon={icon} title={title} badge={badge} action={<AddB label="Add Card" onClick={openAddMultiple} />}>
      {!cards.length && <Emp label="No cards yet — tap Add Card" />}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {cards.map(c => (
          <div key={c.id} style={{background:T.card,borderRadius:14,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
            <div style={{position:'relative'}}>
              {(c.images?.[0] || c.image)
                ? <img src={c.images?.[0] || c.image} alt={c.title} style={{width:'100%',height:110,objectFit:'cover'}} />
                : <div style={{width:'100%',height:110,background:'repeating-linear-gradient(45deg,#ede8e0,#ede8e0 5px,#e3ddd6 5px,#e3ddd6 10px)',display:'flex',alignItems:'center',justifyContent:'center'}}><ImgIcon size={22} color={T.mut}/></div>
              }
              {(c.images?.length > 1) && (
                <div style={{position:'absolute',bottom:6,right:6,background:'rgba(0,0,0,.5)',borderRadius:6,padding:'2px 7px'}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>{c.images.length} photos</span>
                </div>
              )}
            </div>
            <div style={{padding:'10px 10px 12px'}}>
              <div style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{c.title}</div>
              <div style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.sub,marginBottom:10,lineHeight:1.4}}>{c.description}</div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={() => openForm(c)} style={{flex:1,height:30,borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:500,color:T.sub,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                  <Edit3 size={11} color={T.sub}/>Edit
                </button>
                <button onClick={() => setCfm(c)} style={{width:30,height:30,borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={12} color={T.acc}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Confirm open={!!cfm} msg={`Delete "${cfm?.title}"? This cannot be undone.`} onOk={del} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ── Price List ────────────────────────────────────────── */
function PriceSect({ id, icon, title, cats, onChange, nav, mark }) {
  const [cfm, setCfm] = useState(null);

  const openCatForm = (cat) => {
    const Form = () => {
      const [name, setName] = useState(cat?.category || '');
      return (
        <FP title={cat ? 'Rename Category' : 'New Category'} onBack={() => nav(null)}>
          <Field label="Category Name" value={name} onChange={setName} placeholder="e.g. Lashes" />
          <SaveBtn label="Save" disabled={!name.trim()} onClick={() => {
            if (cat) onChange(p => p.map(c => c.id===cat.id ? {...c, category:name.trim()} : c));
            else onChange(p => [...p, {id:uid(), category:name.trim(), sections:[]}]);
            mark(); nav(null);
          }} />
        </FP>
      );
    };
    nav(<Form />);
  };

  const openSecForm = (catId, sec) => {
    const Form = () => {
      const [name, setName] = useState(sec?.title || '');
      return (
        <FP title={sec ? 'Rename Section' : 'New Section'} onBack={() => nav(null)}>
          <Field label="Section Name" value={name} onChange={setName} placeholder="e.g. Classic Lash" />
          <SaveBtn label="Save" disabled={!name.trim()} onClick={() => {
            if (sec) {
              onChange(p => p.map(c => c.id!==catId ? c : {
                ...c, sections: c.sections.map(s => s.id===sec.id ? {...s, title:name.trim()} : s)
              }));
            } else {
              onChange(p => p.map(c => c.id!==catId ? c : {
                ...c, sections: [...(c.sections||[]), {id:uid(), title:name.trim(), items:[]}]
              }));
            }
            mark(); nav(null);
          }} />
        </FP>
      );
    };
    nav(<Form />);
  };

  const openItemForm = (catId, secId, item) => {
    const Form = () => {
      const [f, setF] = useState({name:item?.name||'', price:item?.price||''});
      return (
        <FP title={item ? 'Edit Item' : 'New Item'} onBack={() => nav(null)}>
          <Field label="Item Name" value={f.name} onChange={v => setF(x=>({...x,name:v}))} placeholder="e.g. Classic Full Set" />
          <Field label="Price (₦)" value={String(f.price)} onChange={v => setF(x=>({...x,price:v}))} placeholder="0" type="number" />
          <SaveBtn label={item ? 'Save' : 'Add Item'} disabled={!f.name.trim()} onClick={() => {
            onChange(p => p.map(c => {
              if (c.id !== catId) return c;
              return {
                ...c,
                sections: (c.sections||[]).map(s => {
                  if (s.id !== secId) return s;
                  return {
                    ...s,
                    items: item
                      ? s.items.map(i => i.id===item.id ? {...i,...f} : i)
                      : [...(s.items||[]), {id:uid(),...f}]
                  };
                })
              };
            }));
            mark(); nav(null);
          }} />
        </FP>
      );
    };
    nav(<Form />);
  };

  const openAddItems = (catId, secId) => {
    const Form = () => {
      const [rows, setRows] = useState([{ id: uid(), name: '', price: '' }]);
      const addRow = () => setRows(p => [...p, { id: uid(), name: '', price: '' }]);
      const removeRow = (id) => setRows(p => p.filter(r => r.id !== id));
      const updateRow = (id, key, val) => setRows(p => p.map(r => r.id === id ? {...r, [key]: val} : r));
      const valid = rows.filter(r => r.name.trim());
      const inputStyle = { width: '100%', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 15, color: T.text, border: `1px solid ${T.bdr}`, borderRadius: 10, padding: '11px 12px', background: '#fff', outline: 'none', boxSizing: 'border-box' };
      return (
        <FP title="Add Items" onBack={() => nav(null)}>
          {/* Column headers */}
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <span style={{flex:2,fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:700,color:T.mut,textTransform:'uppercase',letterSpacing:'.08em'}}>Item Name</span>
            <span style={{flex:1,fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:700,color:T.mut,textTransform:'uppercase',letterSpacing:'.08em'}}>Price (₦)</span>
            <span style={{width:28}}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {rows.map(row => (
              <div key={row.id} style={{display:'flex',gap:8,alignItems:'center'}}>
                <input value={row.name} onChange={e => updateRow(row.id, 'name', e.target.value)} placeholder="e.g. Classic Full Set" style={{...inputStyle, flex:2}} />
                <input type="number" value={row.price} onChange={e => updateRow(row.id, 'price', e.target.value)} placeholder="0" style={{...inputStyle, flex:1}} />
                {rows.length > 1
                  ? <button onClick={() => removeRow(row.id)} style={{width:28,height:28,flexShrink:0,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={13} color={T.acc}/></button>
                  : <span style={{width:28}}/>
                }
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',height:44,border:`1.5px dashed ${T.bdr}`,borderRadius:12,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,color:T.mut,cursor:'pointer',marginBottom:16}}
          >
            <Plus size={14} color={T.mut}/>Add another item
          </button>
          <SaveBtn
            label={`Save ${valid.length} item${valid.length !== 1 ? 's' : ''}`}
            disabled={valid.length === 0}
            onClick={() => {
              onChange(p => p.map(c => {
                if (c.id !== catId) return c;
                return { ...c, sections: (c.sections||[]).map(s => s.id !== secId ? s : { ...s, items: [...(s.items||[]), ...valid.map(r => ({id:uid(), name:r.name, price:r.price}))] }) };
              }));
              mark(); nav(null);
            }}
          />
        </FP>
      );
    };
    nav(<Form />);
  };

  const del = () => {
    if (cfm.t === 'cat') {
      onChange(p => p.filter(c => c.id !== cfm.id));
    } else if (cfm.t === 'sec') {
      onChange(p => p.map(c => c.id!==cfm.catId ? c : {
        ...c, sections: c.sections.filter(s => s.id !== cfm.id)
      }));
    } else {
      onChange(p => p.map(c => {
        if (c.id !== cfm.catId) return c;
        return { ...c, sections: (c.sections||[]).map(s => s.id!==cfm.secId ? s : {...s, items:s.items.filter(i=>i.id!==cfm.id)}) };
      }));
    }
    setCfm(null); mark();
  };

  return (
    <Sect id={id} icon={icon} title={title} action={<AddB label="Add Category" onClick={() => openCatForm(null)} />}>
      {!cats.length && <Emp label="No categories yet" />}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {cats.map(cat => (
          <div key={cat.id} style={{background:T.card,borderRadius:14,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>

            {/* ── Category header ── */}
            <div style={{display:'flex',alignItems:'center',padding:'12px 14px',background:T.mutBg,gap:8,borderBottom:`1px solid ${T.bdr}`}}>
              <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:700,color:T.text,flex:1}}>{cat.category}</span>
              <button onClick={() => openCatForm(cat)} style={{display:'flex',alignItems:'center',gap:4,height:28,padding:'0 10px',borderRadius:999,border:`1px solid ${T.bdr}`,background:T.card,fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.sub,cursor:'pointer'}}>
                <Edit3 size={11} color={T.sub}/>Rename
              </button>
              <button onClick={() => setCfm({t:'cat',id:cat.id,name:cat.category})} style={{width:28,height:28,borderRadius:999,border:`1px solid ${T.bdr}`,background:T.card,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Trash2 size={12} color={T.acc}/>
              </button>
            </div>

            {/* ── Sections ── */}
            <div style={{padding:'10px 12px 12px',display:'flex',flexDirection:'column',gap:12}}>
              {(cat.sections||[]).map(sec => (
                <div key={sec.id}>
                  {/* Section header */}
                  {sec.title ? (
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:7,paddingBottom:6,borderBottom:`1px solid ${T.bdr}`}}>
                      <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:700,color:T.sub,flex:1,textTransform:'uppercase',letterSpacing:'.05em'}}>{sec.title}</span>
                      <button onClick={() => openSecForm(cat.id, sec)} style={{display:'flex',alignItems:'center',gap:3,height:24,padding:'0 8px',borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:11,color:T.sub,cursor:'pointer'}}>
                        <Edit3 size={10} color={T.sub}/>Rename
                      </button>
                      <button onClick={() => setCfm({t:'sec',id:sec.id,catId:cat.id,name:sec.title})} style={{width:24,height:24,borderRadius:999,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <Trash2 size={11} color={T.acc}/>
                      </button>
                    </div>
                  ) : null}

                  {/* Items */}
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {(sec.items||[]).map(it => (
                      <div key={it.id} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',border:`1px solid ${T.bdr}`,borderRadius:7}}>
                        <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:500,color:T.text,flex:1}}>{it.name}</span>
                        <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:600,color:T.sub,flexShrink:0}}>₦{Number(it.price||0).toLocaleString()}</span>
                        <button onClick={() => openItemForm(cat.id, sec.id, it)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Edit3 size={11} color={T.sub}/>
                        </button>
                        <button onClick={() => setCfm({t:'item',id:it.id,catId:cat.id,secId:sec.id,name:it.name})} style={{width:28,height:28,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <Trash2 size={12} color={T.acc}/>
                        </button>
                      </div>
                    ))}
                    {/* Add item to this section */}
                    <button
                      onClick={() => openAddItems(cat.id, sec.id)}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.color=T.acc;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bdr;e.currentTarget.style.color=T.mut;}}
                      style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,height:34,border:`1.5px dashed ${T.bdr}`,borderRadius:7,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.mut,cursor:'pointer'}}
                    >
                      <Plus size={12} color="inherit"/>Add items
                    </button>
                  </div>
                </div>
              ))}

              {/* Add section */}
              <button
                onClick={() => openSecForm(cat.id, null)}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.color=T.acc;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bdr;e.currentTarget.style.color=T.mut;}}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,height:34,border:`1.5px dashed ${T.bdr}`,borderRadius:7,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.mut,cursor:'pointer',marginTop:4}}
              >
                <Plus size={12} color="inherit"/>Add section
              </button>
            </div>
          </div>
        ))}
      </div>
      <Confirm open={!!cfm} msg={`Delete "${cfm?.name}"?`} onOk={del} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ── Portfolio ─────────────────────────────────────────── */
function PortfolioSect({ items, categories, onItemsChange, onCatsChange, nav, mark }) {
  const [cfm,   setCfm]   = useState(null);
  const [activeTag, setActiveTag] = useState('All');

  const tagColor = (t) => {
    const h = [...(t||'')].reduce((a,c) => a+c.charCodeAt(0), 0) % 360;
    return { bg:`oklch(.92 .05 ${h})`, cl:`oklch(.35 .08 ${h})` };
  };

  const filtered = activeTag === 'All' ? items : items.filter(x => (x.category||'').toLowerCase() === activeTag.toLowerCase());

  const openPhoto = (item) => {
    const Form = () => {
      const [f, setF] = useState(item || { category: categories[0]||'', image:'' });
      const [uploading, setUploading] = useState(false);
      const handleUpload = async (file) => {
        setUploading(true);
        try { const url = await uploadToImgBB(file); setF(x=>({...x,image:url})); }
        catch { alert('Upload failed.'); }
        finally { setUploading(false); }
      };
      return (
        <FP title={item ? 'Edit Photo' : 'Add Photo'} onBack={() => nav(null)}>
          <UploadArea imgUrl={f.image} onUpload={handleUpload} uploading={uploading} height={220} />
          <div style={{marginBottom:20}}>
            <label style={{display:'block',fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:700,color:T.mut,marginBottom:10,textTransform:'uppercase',letterSpacing:'.08em'}}>Category Tag</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {categories.map(t => {
                const {bg,cl} = tagColor(t);
                const sel = (f.category||'').toLowerCase() === t.toLowerCase();
                return (
                  <button key={t} onClick={() => setF(x=>({...x,category:t.toLowerCase()}))} style={{height:40,padding:'0 16px',borderRadius:999,cursor:'pointer',border:`1.5px solid ${sel?cl:T.bdr}`,background:sel?bg:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:sel?700:500,color:sel?cl:T.sub}}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <SaveBtn label="Save Photo" onClick={() => {
            if (item) onItemsChange(p => p.map(i => i.id===item.id ? {...i,...f} : i));
            else onItemsChange(p => [...p, {id:uid(),...f}]);
            mark(); nav(null);
          }} />
        </FP>
      );
    };
    nav(<Form />);
  };

  const openTags = () => {
    const Form = () => {
      const [list, setList] = useState([...categories]);
      const [v, setV]       = useState('');
      const add = () => {
        if (!v.trim() || list.map(l=>l.toLowerCase()).includes(v.trim().toLowerCase())) return;
        setList(l => [...l, v.trim()]); setV('');
      };
      return (
        <FP title="Manage Tags" onBack={() => { onCatsChange(list); mark(); nav(null); }}>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {list.map(t => (
              <div key={t} style={{display:'flex',alignItems:'center',padding:'13px 16px',background:T.card,borderRadius:10,boxShadow:'0 1px 4px rgba(0,0,0,.07)',gap:10}}>
                <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:15,fontWeight:500,color:T.text,flex:1}}>{t}</span>
                <button onClick={() => setList(l=>l.filter(x=>x!==t))} style={{width:30,height:30,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={13} color={T.acc}/>
                </button>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <input value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="New tag name…" style={{flex:1,height:48,padding:'0 16px',border:`1px solid ${T.bdr}`,borderRadius:999,fontFamily:'Inter,system-ui,sans-serif',fontSize:15,outline:'none',background:'#fff'}} />
            <button onClick={add} style={{height:48,padding:'0 18px',borderRadius:999,background:T.dk,color:'#fff',border:'none',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>Add</button>
          </div>
          <p style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.mut,marginTop:12}}>Tap the back arrow when done.</p>
        </FP>
      );
    };
    nav(<Form />);
  };

  const openAddPhotos = () => {
    const Form = () => {
      const [slots, setSlots] = useState([{ id: uid(), image: '', uploading: false }]);
      const [tag, setTag] = useState((categories[0]||'').toLowerCase());
      const addSlot = () => setSlots(p => [...p, { id: uid(), image: '', uploading: false }]);
      const removeSlot = (id) => setSlots(p => p.filter(s => s.id !== id));
      const updateSlot = (id, key, val) => setSlots(p => p.map(s => s.id === id ? {...s, [key]: val} : s));
      const handleUpload = async (id, file) => {
        updateSlot(id, 'uploading', true);
        try { const url = await uploadToImgBB(file); updateSlot(id, 'image', url); }
        catch { alert('Upload failed.'); }
        finally { updateSlot(id, 'uploading', false); }
      };
      const valid = slots.filter(s => s.image);
      return (
        <FP title="Add Photos" onBack={() => nav(null)}>
          {/* Tag selector — one tag for the whole batch */}
          <div style={{marginBottom:24}}>
            <label style={{display:'block',fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:700,color:T.mut,marginBottom:10,textTransform:'uppercase',letterSpacing:'.08em'}}>Category Tag (all photos)</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {categories.map(t => {
                const {bg,cl} = tagColor(t);
                const sel = tag.toLowerCase() === t.toLowerCase();
                return (
                  <button key={t} onClick={() => setTag(t.toLowerCase())} style={{height:36,padding:'0 14px',borderRadius:999,cursor:'pointer',border:`1.5px solid ${sel?cl:T.bdr}`,background:sel?bg:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:13,fontWeight:sel?700:500,color:sel?cl:T.sub}}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo slots */}
          {slots.map((slot, i) => (
            <div key={slot.id} style={{marginBottom:12,padding:12,background:T.card,borderRadius:12,boxShadow:'0 1px 4px rgba(0,0,0,.07)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:700,color:T.mut,textTransform:'uppercase',letterSpacing:'.06em'}}>Photo {i + 1}</span>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(slot.id)} style={{width:26,height:26,borderRadius:'50%',border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <X size={13} color={T.acc}/>
                  </button>
                )}
              </div>
              <UploadArea imgUrl={slot.image} onUpload={f => handleUpload(slot.id, f)} uploading={slot.uploading} height={130} />
            </div>
          ))}

          <button
            onClick={addSlot}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',height:44,border:`1.5px dashed ${T.bdr}`,borderRadius:12,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,color:T.mut,cursor:'pointer',marginBottom:16}}
          >
            <Plus size={14} color={T.mut}/>Add another photo
          </button>
          <SaveBtn
            label={`Save ${valid.length} photo${valid.length !== 1 ? 's' : ''}`}
            disabled={valid.length === 0}
            onClick={() => {
              onItemsChange(p => [...p, ...valid.map(s => ({ id: uid(), image: s.image, category: tag }))]);
              mark(); nav(null);
            }}
          />
        </FP>
      );
    };
    nav(<Form />);
  };

  const del = () => { onItemsChange(p => p.filter(i=>i.id!==cfm.id)); setCfm(null); mark(); };

  return (
    <Sect id="portfolio" icon={<LayoutGrid size={16} color={T.acc}/>} title="Portfolio" action={<AddB label="Add Photos" onClick={openAddPhotos} />}>
      {/* Tag filter strip */}
      <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:12,marginBottom:4,WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none'}}>
        {['All',...categories].map(t => (
          <button key={t} onClick={() => setActiveTag(t)} style={{flexShrink:0,height:30,padding:'0 12px',borderRadius:999,border:`1px solid ${activeTag===t?T.acc:T.bdr}`,background:activeTag===t?T.accBg:T.card,fontFamily:'Inter,system-ui,sans-serif',fontSize:12,fontWeight:activeTag===t?700:500,color:activeTag===t?T.acc:T.sub,cursor:'pointer'}}>
            {t}
          </button>
        ))}
        <button onClick={openTags} style={{flexShrink:0,height:30,padding:'0 12px',borderRadius:999,border:`1.5px dashed ${T.bdr}`,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.mut,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
          <Tag size={11} color={T.mut}/>Manage Tags
        </button>
      </div>

      {!filtered.length && <Emp label="No photos — tap Add Photo" />}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {filtered.map(it => {
          const label = categories.find(c=>c.toLowerCase()===(it.category||'').toLowerCase()) || it.category || '';
          const {bg,cl} = label ? tagColor(label) : {bg:T.mutBg,cl:T.mut};
          return (
            <div key={it.id} style={{background:T.card,borderRadius:14,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
              <div style={{position:'relative'}}>
                {it.image
                  ? <img src={it.image} alt="" style={{width:'100%',height:120,objectFit:'cover'}} />
                  : <div style={{width:'100%',height:120,background:'repeating-linear-gradient(45deg,#ede8e0,#ede8e0 5px,#e3ddd6 5px,#e3ddd6 10px)',display:'flex',alignItems:'center',justifyContent:'center'}}><ImgIcon size={20} color={T.mut}/></div>
                }
                <div style={{position:'absolute',bottom:7,left:7}}>
                  <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:bg,color:cl}}>{label||'No tag'}</span>
                </div>
              </div>
              <div style={{padding:'8px 10px 10px',display:'flex',gap:6}}>
                <button onClick={() => openPhoto(it)} style={{flex:1,height:28,borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',fontFamily:'Inter,system-ui,sans-serif',fontSize:11,fontWeight:500,color:T.sub,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:3}}>
                  <Edit3 size={10} color={T.sub}/>Edit tag
                </button>
                <button onClick={() => setCfm(it)} style={{width:28,height:28,borderRadius:999,border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={11} color={T.acc}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Confirm open={!!cfm} msg="Delete this photo?" onOk={del} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ── People (Team / Admins / Bloggers) ─────────────────── */
function PeopleSect({ id, icon, title, people, fields, onChange, nav, mark }) {
  const [cfm, setCfm] = useState(null);
  const blank = Object.fromEntries(fields.map(f => [f.k, '']));

  const openForm = (person) => {
    const Form = () => {
      const [f, setF]       = useState(person || blank);
      const [uploading, setUploading] = useState(false);
      const handleUpload = async (file) => {
        setUploading(true);
        try { const url = await uploadToImgBB(file); setF(x=>({...x,image:url})); }
        catch { alert('Upload failed.'); }
        finally { setUploading(false); }
      };
      return (
        <FP title={person ? `Edit ${title.replace(/s$/,'')}` : `New ${title.replace(/s$/,'')}`} onBack={() => nav(null)}>
          <UploadArea imgUrl={f.image} onUpload={handleUpload} uploading={uploading} height={100} />
          {fields.map(fd => (
            <Field key={fd.k} label={fd.l} value={f[fd.k]||''} onChange={v=>setF(x=>({...x,[fd.k]:v}))} placeholder={fd.ph} multi={fd.ml} />
          ))}
          <SaveBtn label="Save" disabled={!f[fields[0].k]?.trim()} onClick={() => {
            if (person) onChange(p => p.map(i => i.id===person.id ? {...i,...f} : i));
            else onChange(p => [...p, {id:uid(),...f}]);
            mark(); nav(null);
          }} />
        </FP>
      );
    };
    nav(<Form />);
  };

  const del = () => { onChange(p => p.filter(i=>i.id!==cfm.id)); setCfm(null); mark(); };

  const initials = (name='') => name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase();
  const avatarColors = (name='') => {
    const h = [...name].reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
    return { bg:`oklch(.85 .08 ${h})`, cl:`oklch(.35 .08 ${h})` };
  };

  const label = title.replace(/s$/, '');

  return (
    <Sect id={id} icon={icon} title={title} action={<AddB label={`Add ${label}`} onClick={() => openForm(null)} />}>
      {!people.length && <Emp label={`No ${title.toLowerCase()} yet`} />}
      <div style={{background:T.card,borderRadius:14,boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
        {people.map((p,i) => {
          const name = p[fields[0].k] || '';
          const {bg,cl} = avatarColors(name);
          return (
            <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderBottom:i<people.length-1?`1px solid ${T.bdr}`:'none'}}>
              {p.image
                ? <img src={p.image} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
                : <div style={{width:40,height:40,borderRadius:'50%',flexShrink:0,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,system-ui,sans-serif',fontSize:14,fontWeight:700,color:cl}}>{initials(name)||'?'}</div>
              }
              <div style={{flex:1,overflow:'hidden'}}>
                {fields.slice(0,3).map((fd,fi) => (
                  <div key={fd.k} style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:fi?12:14,fontWeight:fi?400:600,color:fi===0?T.text:fi===1?T.acc:T.mut,marginTop:fi?2:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {p[fd.k]}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={() => openForm(p)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${T.bdr}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Edit3 size={12} color={T.sub}/>
                </button>
                <button onClick={() => setCfm(p)} style={{width:30,height:30,borderRadius:7,border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Trash2 size={12} color={T.acc}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Confirm open={!!cfm} msg={`Remove ${cfm?.[fields[0].k]}?`} onOk={del} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ── Studio Photos ─────────────────────────────────────── */
const MAX_STUDIO_PHOTOS = 10;

function StudioPhotosSect({ photos, onChange, mark }) {
  const [cfm, setCfm] = useState(null);
  const fileRef = useRef();

  const handleUpload = (files) => {
    const remaining = MAX_STUDIO_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);

    // Add shimmer placeholders immediately — instant visual feedback
    const placeholders = toUpload.map(() => ({ id: uid(), image: null, uploading: true }));
    onChange(p => [...p, ...placeholders]);

    // Upload each file independently, replace its placeholder as it finishes
    toUpload.forEach(async (file, i) => {
      try {
        const url = await uploadToImgBB(file);
        onChange(p => p.map(item => item.id === placeholders[i].id ? { id: item.id, image: url, uploading: false } : item));
        mark();
      } catch {
        onChange(p => p.filter(item => item.id !== placeholders[i].id));
        alert('One photo failed to upload.');
      }
    });
  };

  const del = () => { onChange(p => p.filter(i => i.id !== cfm.id)); setCfm(null); mark(); };

  const atMax = photos.length >= MAX_STUDIO_PHOTOS;

  return (
    <Sect
      id="studio-photos"
      icon={<ImgIcon size={16} color={T.acc} />}
      title="Studio Photos"
      action={
        atMax
          ? <span style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:12,color:T.mut}}>Max 10 reached</span>
          : <AddB label="Add Photo" onClick={() => fileRef.current?.click()} />
      }
    >
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileRef}
        style={{display:'none'}}
        onChange={e => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value=''; }}
      />

      {!photos.length && <Emp label="No studio photos yet — tap Add Photo" />}

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
        {photos.map(p => (
          <div key={p.id} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',background:T.mutBg}}>
            {p.uploading
              ? <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:T.mutBg}}>
                  <Loader2 size={16} color={T.mut} className="animate-spin" />
                </div>
              : <img src={p.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            }
            {!p.uploading && (
              <button
                onClick={() => setCfm(p)}
                style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,.55)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
              >
                <Trash2 size={11} color="#fff" />
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={{fontFamily:'Inter,system-ui,sans-serif',fontSize:11,color:T.mut,marginTop:10}}>
        {photos.length}/{MAX_STUDIO_PHOTOS} photos
      </p>

      <Confirm open={!!cfm} msg="Delete this studio photo?" onOk={del} onNo={() => setCfm(null)} />
    </Sect>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function StudioAdminMobile() {
  const { currentUser } = useAuth();
  const [page,        setPage]        = useState(null);
  const [dirtyFields, setDirtyFields] = useState(new Set());
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const scrollPos = useRef(0);

  const dirty = dirtyFields.size > 0;

  const [nailCards,    setNailCards]    = useState([]);
  const [otherCards,   setOtherCards]   = useState([]);
  const [nailCats,     setNailCats]     = useState([]);
  const [otherCats,    setOtherCats]    = useState([]);
  const [galleryItems,   setGalleryItems]   = useState([]);
  const [galleryTags,    setGalleryTags]    = useState([]);
  const [team,           setTeam]           = useState([]);
  const [studioPhotos,   setStudioPhotos]   = useState([]);

  const nav = useCallback(p => {
    if (p) scrollPos.current = window.scrollY;
    setPage(p);
  }, []);

  const markField = useCallback((field) => {
    setDirtyFields(prev => { const n = new Set(prev); n.add(field); return n; });
  }, []);

  const marks = useMemo(() => ({
    nailCards:  () => markField('nailCards'),
    otherCards: () => markField('otherCards'),
    gallery:    () => markField('gallery'),
    team:       () => markField('team'),
    studio:     () => markField('studio'),
    nails:      () => markField('nails'),
    salon:      () => markField('salon'),
  }), [markField]);

  useEffect(() => {
    if (!page) window.scrollTo(0, scrollPos.current);
  }, [page]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      // Fix #4: fetch landing_page and services in parallel
      const [lp, servSnap] = await Promise.all([
        getDoc(doc(db, 'site_content', 'landing_page')),
        getDocs(collection(db, 'services')),
      ]);

      // ── landing_page ──────────────────────────────────
      if (lp.exists()) {
        const d = lp.data();
        setNailCards((d.services?.items||[]).map((c,i)=>({id:c.id||String(i),...c})));
        setOtherCards((d.services?.otherItems||[]).map((c,i)=>({id:c.id||String(i),...c})));
        const rawTags = d.gallery?.categories || [];
        setGalleryTags(rawTags.map(c => typeof c==='string' ? c : (c.label||String(c))));
        setGalleryItems((d.gallery?.items||[]).map((it,i)=>({id:it.id||String(i),...it})));
        setTeam((d.team?.members||[]).map((m,i)=>({id:m.id||String(i),...m})));
        setStudioPhotos((d.studio?.photos||[]).map((p,i)=>({id:p.id||String(i),...p})));
      }

      // ── services collection ───────────────────────────
      servSnap.forEach(d => {
        const svcs = (d.data().services||[]).map((s,si) => ({
          id: s.id||`cat-${si}`,
          category: s.category,
          sections: (s.sections||[{id:`sec-${si}-0`,title:'',items:[]}]).map((sec,seci) => ({
            id: sec.id||`sec-${si}-${seci}`,
            title: sec.title||'',
            items: (sec.items||[]).map((it,ii) => ({id:it.id||`it-${si}-${seci}-${ii}`,...it}))
          }))
        }));
        if (d.id === 'nails') setNailCats(svcs);
        else if (d.id === 'salon') setOtherCats(svcs);
      });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const landingUpdates = {};
      if (dirtyFields.has('nailCards'))  landingUpdates['services.items']      = nailCards;
      if (dirtyFields.has('otherCards')) landingUpdates['services.otherItems'] = otherCards;
      if (dirtyFields.has('gallery'))  { landingUpdates['gallery.items']       = galleryItems; landingUpdates['gallery.categories'] = galleryTags; }
      if (dirtyFields.has('team'))       landingUpdates['team.members']        = team;
      if (dirtyFields.has('studio'))     landingUpdates['studio.photos']       = studioPhotos;

      const promises = [];
      if (Object.keys(landingUpdates).length > 0)
        promises.push(updateDoc(doc(db, 'site_content', 'landing_page'), landingUpdates));
      if (dirtyFields.has('nails'))
        promises.push(setDoc(doc(db, 'services', 'nails'), { services: nailCats }, { merge: true }));
      if (dirtyFields.has('salon'))
        promises.push(setDoc(doc(db, 'services', 'salon'), { services: otherCats }, { merge: true }));

      await Promise.all(promises);
      setDirtyFields(new Set());
      alert('✅ Changes saved!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    await fetchAll();
    setDirtyFields(new Set());
  };

  // Full-page form overlay
  if (page) {
    return (
      <div style={{position:'fixed',inset:0,zIndex:1100,overflowY:'auto',background:T.bg}}>
        {page}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{background:T.bg,minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,system-ui,sans-serif'}}>
        <p style={{color:T.mut}}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{background:T.bg,fontFamily:'Inter,system-ui,sans-serif'}}>
      <SectNav />
      <div style={{padding:'24px 16px 0'}}>
        <p style={{fontSize:10,fontWeight:700,color:T.acc,letterSpacing:'.1em',textTransform:'uppercase',margin:'0 0 6px'}}>Studio Management</p>
        <h1 style={{fontSize:22,fontWeight:800,color:T.text,margin:'0 0 6px',letterSpacing:'-.3px',lineHeight:1.2}}>Manage your studio's<br/>presence and services.</h1>
        <p style={{fontSize:13,color:T.sub,margin:'0 0 28px',lineHeight:1.65}}>Tap Edit or + Add to make changes. Save when you're done.</p>

        <CardsSect
          id="nail-cards"
          icon={<Sparkles size={16} color={T.acc}/>}
          title="Nail Services — Cards"
          badge
          cards={nailCards}
          onChange={setNailCards}
          nav={nav} mark={marks.nailCards}
        />
        <Divider />

        <PriceSect
          id="nail-prices"
          icon={<DollarSign size={16} color={T.acc}/>}
          title="Nail Services — Prices"
          cats={nailCats}
          onChange={setNailCats}
          nav={nav} mark={marks.nails}
        />
        <Divider />

        <CardsSect
          id="other-cards"
          icon={<Scissors size={16} color={T.acc}/>}
          title="Other Services — Cards"
          cards={otherCards}
          onChange={setOtherCards}
          nav={nav} mark={marks.otherCards}
        />
        <Divider />

        <PriceSect
          id="other-prices"
          icon={<DollarSign size={16} color={T.acc}/>}
          title="Other Services — Prices"
          cats={otherCats}
          onChange={setOtherCats}
          nav={nav} mark={marks.salon}
        />
        <Divider />

        <PortfolioSect
          items={galleryItems}
          categories={galleryTags}
          onItemsChange={setGalleryItems}
          onCatsChange={setGalleryTags}
          nav={nav} mark={marks.gallery}
        />
        <Divider />

        <PeopleSect
          id="team"
          icon={<Users size={16} color={T.acc}/>}
          title="Team"
          people={team}
          fields={TEAM_FIELDS}
          onChange={setTeam}
          nav={nav} mark={marks.team}
        />
        <Divider />

        <StudioPhotosSect
          photos={studioPhotos}
          onChange={setStudioPhotos}
          mark={marks.studio}
        />
        <Divider />

      </div>

      <SaveFt dirty={dirty} onSave={handleSave} saving={saving} onDiscard={handleDiscard} />
    </div>
  );
}
