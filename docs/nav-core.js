(function(){
  "use strict";
  const CORE_VIEWS=new Set(["dashboard","picks","engines","bankers","results","methodology","responsible"]);
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function closeMenu(){
    const sidebar=$("#sidebar"),backdrop=$("#sidebar-backdrop"),menu=$("#menu-btn");
    if(sidebar)sidebar.classList.remove("open");
    if(backdrop)backdrop.classList.remove("open");
    if(menu)menu.setAttribute("aria-expanded","false");
    document.documentElement.classList.remove("menu-open");
  }

  function openMenu(){
    const sidebar=$("#sidebar"),backdrop=$("#sidebar-backdrop"),menu=$("#menu-btn");
    if(sidebar)sidebar.classList.add("open");
    if(backdrop)backdrop.classList.add("open");
    if(menu)menu.setAttribute("aria-expanded","true");
    document.documentElement.classList.add("menu-open");
  }

  function showEarly(view){
    const name=CORE_VIEWS.has(view)?view:"dashboard";
    $$('[data-view-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.viewPanel===name));
    $$('[data-view]').forEach(control=>control.classList.toggle('active',control.dataset.view===name));
    try{if(location.hash!==`#${name}`)window.history.pushState(null,"",`#${name}`)}catch(_){location.hash=name}
    closeMenu();
    window.scrollTo(0,0);
  }

  document.addEventListener("click",event=>{
    if(window.BETYNZ_APP_READY)return;
    const menu=event.target.closest("#menu-btn");
    if(menu){
      event.preventDefault();
      const sidebar=$("#sidebar");
      sidebar&&sidebar.classList.contains("open")?closeMenu():openMenu();
      return;
    }
    if(event.target.closest("#sidebar-backdrop")){event.preventDefault();closeMenu();return}
    const control=event.target.closest("[data-view]");
    if(!control)return;
    event.preventDefault();
    showEarly(control.dataset.view);
  },true);

  window.addEventListener("popstate",()=>{
    if(window.BETYNZ_APP_READY)return;
    showEarly((location.hash||"#dashboard").slice(1));
  });

  window.BETYNZ_NAV_CORE=true;
}());
