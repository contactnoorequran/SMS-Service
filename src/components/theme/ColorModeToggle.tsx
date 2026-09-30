import React,{useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export function ColorModeToggle(){
 const [mode,setMode]=useState<'light'|'dark'>(()=>{try{return localStorage.getItem('wss-color-mode')==='dark'?'dark':'light';}catch{return 'light';}});
 useEffect(()=>{document.documentElement.dataset.colorMode=mode;document.documentElement.style.colorScheme=mode;try{localStorage.setItem('wss-color-mode',mode);}catch{}},[mode]);
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key==='wss-color-mode')setMode(e.newValue==='dark'?'dark':'light');};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 return <button type="button" onClick={()=>setMode(mode==='light'?'dark':'light')} aria-label={`Switch to ${mode==='light'?'dark':'light'} mode`} title={`Switch to ${mode==='light'?'dark':'light'} mode`} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]">{mode==='light'?<Moon size={17}/>:<Sun size={17}/>}</button>;
}
