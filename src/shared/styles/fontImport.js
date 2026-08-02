export const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2E2F3E; border-radius: 2px; }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0);  } }
  @keyframes slideIn { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }
  @keyframes pulse   { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
  @keyframes shimmer { 0%{opacity:0.4;} 50%{opacity:1;} 100%{opacity:0.4;} }
  @keyframes spin    { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
  @keyframes blink   { 0%,100%{opacity:1;} 50%{opacity:0;} }
  @keyframes demoMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .demo-marquee-track { animation: demoMarquee 42s linear infinite; will-change: transform; }
  .demo-marquee-track:hover { animation-play-state: paused; }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0.85; } to { transform: translateY(0); opacity: 1; } }

  .ast-root { height: 100vh; height: 100dvh; overflow: hidden; }
  .ast-main-stack { min-width: 0; }
  .ast-mobile-top { display: none; }
  .ast-bottom-nav { display: none; }
  .ast-backdrop { display: none; }
  .ast-mobile-menu-btn { display: none; }

  @media (max-width: 767px) {
    .ast-shell { position: relative; min-height: 0; }
    .ast-sidebar {
      position: fixed !important;
      top: 24px;
      left: 0;
      bottom: 0;
      z-index: 300;
      transform: translateX(-105%);
      width: min(280px, 88vw) !important;
      min-width: 0 !important;
      transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), width 0.22s !important;
      box-shadow: 8px 0 32px rgba(0,0,0,0.45);
    }
    .ast-sidebar.ast-open { transform: translateX(0); }
    .ast-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      top: 24px;
      background: rgba(0,0,0,0.55);
      z-index: 290;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }
    .ast-backdrop.ast-visible { opacity: 1; pointer-events: auto; }
    .ast-mobile-top {
      display: flex !important;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid #22232F;
      background: #0F1016;
      flex-shrink: 0;
    }
    .ast-mobile-menu-btn {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid #22232F;
      border-radius: 6px;
      background: transparent;
      color: #8B8BA8;
      cursor: pointer;
      flex-shrink: 0;
    }
    .ast-bottom-nav {
      display: flex !important;
      align-items: stretch;
      justify-content: space-around;
      flex-shrink: 0;
      border-top: 1px solid #22232F;
      background: #0F1016;
      padding: 4px 2px calc(4px + env(safe-area-inset-bottom, 0px));
      z-index: 260;
    }
    .ast-bottom-nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 6px 2px;
      border: none;
      background: transparent;
      color: #8B8BA8;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      font-size: 9px;
      letter-spacing: 0.04em;
      min-height: 44px;
      border-radius: 6px;
    }
    .ast-bottom-nav-item.ast-active { color: #D4233A; background: rgba(212,35,58,0.07); }
    .ast-view-header {
      flex-wrap: wrap !important;
      height: auto !important;
      min-height: 48px !important;
      padding: 8px 12px !important;
      row-gap: 8px !important;
    }
    .ast-view-header-title { flex: 1 1 auto !important; min-width: 0 !important; overflow: hidden; }
    .ast-view-header-actions {
      flex: 1 1 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      justify-content: flex-end !important;
    }
    .ast-hide-mobile { display: none !important; }
    .ast-content-pad { padding: 14px 12px !important; }
    .ast-content-pad-lg { padding: 18px 14px !important; }
    .ast-input-bar { padding: 10px 12px !important; }
    .ast-input-row { flex-wrap: wrap !important; gap: 8px !important; }
    .ast-input-row > button { flex: 1 1 100%; justify-content: center; }
    .ast-input-tags { display: none !important; }
    .ast-user-bubble { max-width: 90% !important; }
    .ast-answer-col { max-width: none !important; }
    .ast-panel-r {
      position: fixed !important;
      inset: 0 !important;
      top: auto !important;
      height: min(88vh, 720px) !important;
      width: 100% !important;
      max-width: 100% !important;
      border-left: none !important;
      border-top: 1px solid #22232F !important;
      border-radius: 12px 12px 0 0 !important;
      z-index: 280 !important;
      box-shadow: 0 -12px 40px rgba(0,0,0,0.55) !important;
      animation: slideUp 0.25s ease !important;
    }
    .ast-panel-overlay-backdrop {
      position: fixed;
      inset: 0;
      top: 24px;
      background: rgba(0,0,0,0.45);
      z-index: 275;
    }
    .ast-split-row { flex-direction: column !important; }
    .ast-split-list {
      width: 100% !important;
      border-right: none !important;
      max-height: 46vh !important;
      flex-shrink: 0 !important;
    }
    .ast-split-detail { flex: 1 !important; min-height: 0 !important; width: 100% !important; }
    .ast-three-col { flex-direction: column !important; overflow-y: auto !important; }
    .ast-panel-l {
      width: 100% !important;
      max-width: 100% !important;
      border-right: none !important;
      border-bottom: 1px solid #22232F !important;
      max-height: 42vh !important;
      flex-shrink: 0 !important;
    }
    .ast-panel-r-inline {
      width: 100% !important;
      max-height: 38vh !important;
      border-left: none !important;
      border-top: 1px solid #22232F !important;
    }
    .ast-filter-row {
      overflow-x: auto !important;
      flex-wrap: nowrap !important;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px !important;
      max-width: 100%;
    }
    .ast-filter-row > * { flex-shrink: 0 !important; }
    .ast-doc-grid { grid-template-columns: 1fr !important; }
    .ast-export-modal { width: calc(100vw - 32px) !important; max-width: 420px !important; padding: 20px 18px !important; margin: 16px !important; }
    .ast-marquee-bar { height: 24px !important; }
    .ast-demo-marquee-track { font-size: 9px !important; }
    .ast-editor-side { width: 100% !important; max-height: 36vh !important; border-left: none !important; border-top: 1px solid #22232F !important; }
    .ast-intake-actions { flex-wrap: wrap !important; gap: 6px !important; }
    .ast-intake-actions > * { flex: 1 1 auto; }
  }

  @media (max-width: 767px) and (orientation: landscape) {
    .ast-panel-r { height: min(94vh, 100%) !important; border-radius: 0 !important; top: 24px !important; }
    .ast-split-list, .ast-panel-l, .ast-panel-r-inline { max-height: 34vh !important; }
    .ast-bottom-nav { padding-top: 2px; padding-bottom: calc(2px + env(safe-area-inset-bottom, 0px)); }
    .ast-bottom-nav-item { min-height: 38px; padding: 4px 2px; }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .ast-sidebar-expanded { width: 188px !important; min-width: 188px !important; }
    .ast-panel-r-narrow { width: 210px !important; }
    .ast-panel-l-narrow { width: 240px !important; }
    .ast-content-pad-tablet { padding: 18px 16px !important; }
    .ast-view-header { padding: 0 16px !important; }
    .ast-hide-tablet { display: none !important; }
    .ast-filter-row { flex-wrap: wrap !important; }
  }
`;
