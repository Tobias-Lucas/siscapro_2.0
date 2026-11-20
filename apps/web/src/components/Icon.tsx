import React from 'react';
const paths:Record<string,React.ReactNode>={
 dashboard:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
 check:<><path d="m5 12 4 4L19 6"/></>,
 refresh:<><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 11.8-2L20 12M4 12l2.7 5a7 7 0 0 0 11.8-2"/></>,
 book:<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 5.5v12A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h8"/></>,
 list:<><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
 history:<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
 alert:<><path d="M12 3 2.8 20h18.4L12 3z"/><path d="M12 9v4M12 17h.01"/></>,
 people:<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
 company:<><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M9 21V3h6v18M7 13h.01M17 13h.01M7 17h.01M17 17h.01"/></>,
 academic:<><path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="m7 12.5v4c3 2 7 2 10 0v-4M21 10v6"/></>,
 contract:<><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></>,
 briefcase:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
 finance:<><circle cx="12" cy="12" r="9"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12"/></>,
 service:<><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></>,
 docs:<><path d="M4 4h10l6 6v10H4z"/><path d="M14 4v6h6M8 14h8M8 17h5"/></>,
 sync:<><path d="M20 7h-6V1M4 17h6v6"/><path d="M20 7a9 9 0 0 0-15-3M4 17a9 9 0 0 0 15 3"/></>,
 users:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/></>,
 report:<><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></>,
 search:<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
 plus:<><path d="M12 5v14M5 12h14"/></>,
 logout:<><path d="M10 17l5-5-5-5M15 12H3M21 3v18h-7"/></>,
 close:<><path d="M6 6l12 12M18 6 6 18"/></>,
 arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>
};
export function Icon({name,size=20}: {name:string;size?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]||paths.dashboard}</svg>}
