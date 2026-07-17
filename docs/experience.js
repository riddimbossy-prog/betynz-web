(function(){
  "use strict";

  const TOUR_KEY="betynz-first-run-tour-v6.1";
  const $=(selector,root=document)=>root.querySelector(selector);
  const prefersReduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stepIndex=0;
  let open=false;
  let scheduled=false;

  const steps=[
    {
      view:"dashboard",
      target:".hero-panel",
      eyebrow:"WELCOME TO BETYNZ",
      icon:"⚡",
      title:"Predict Smarter. Let the Gods Decide.",
      copy:"Betynz combines 16 Olympian engines, Spartacus, Leonidas and the final Zeus consensus gate. No match is forced onto the board."
    },
    {
      view:"dashboard",
      target:".board-panel",
      eyebrow:"THE DAILY BOARD",
      icon:"▦",
      title:"Start with qualified matches",
      copy:"Use the date, market and odds filters to narrow the board. A1 and A2 grades appear only after the required quality checks pass."
    },
    {
      view:"engines",
      target:"#engine-grid",
      eyebrow:"18 SPECIALISTS",
      icon:"♜",
      title:"Open any engine",
      copy:"Each engine has a different job. Tap an engine to see its own selections and the public explanation of how it reaches a decision."
    },
    {
      view:"dashboard",
      target:"#dashboard-list",
      eyebrow:"MATCH EXPLANATIONS",
      icon:"◎",
      title:"Tap a game for the evidence",
      copy:"A match opens a summary of the approved market, PPG direction, engine support, odds, warnings and any Rebel movement evidence."
    },
    {
      view:"results",
      target:"#results-list",
      eyebrow:"LIVE & SETTLED",
      icon:"✓",
      title:"Follow the full record",
      copy:"Live games show the current score. Finished selections settle as won, lost or void, and only locked picks count toward the verified record."
    }
  ];

  function navTo(view){
    const control=$(`.side-nav [data-view="${view}"]`)||$(`.mobile-nav [data-view="${view}"]`)||$(`[data-view="${view}"]`);
    if(control)control.click();
  }

  function build(){
    if($("#betynz-tour"))return;
    const root=document.createElement("div");
    root.id="betynz-tour";
    root.className="betynz-tour";
    root.hidden=true;
    root.innerHTML=`
      <div class="betynz-tour__shade" aria-hidden="true"></div>
      <div class="betynz-tour__spotlight" aria-hidden="true"></div>
      <section class="betynz-tour__card" role="dialog" aria-modal="true" aria-labelledby="betynz-tour-title">
        <div class="betynz-tour__brand"><img src="assets/betynz-mark.png" alt=""><span><b>BETYNZ<em>.com</em></b><small>LET THE GODS DECIDE.</small></span></div>
        <div class="betynz-tour__progress" aria-hidden="true"></div>
        <div class="betynz-tour__copy"><span class="betynz-tour__eyebrow"></span><i class="betynz-tour__icon"></i><h2 id="betynz-tour-title"></h2><p></p></div>
        <div class="betynz-tour__actions"><button type="button" class="tour-secondary" data-tour-skip>Skip</button><button type="button" class="tour-secondary" data-tour-back>Back</button><button type="button" class="tour-primary" data-tour-next>Continue</button></div>
      </section>`;
    document.body.appendChild(root);
    root.addEventListener("click",event=>{
      if(event.target.closest("[data-tour-skip]")){closeTour(true);return}
      if(event.target.closest("[data-tour-back]")){showStep(Math.max(0,stepIndex-1));return}
      if(event.target.closest("[data-tour-next]")){
        if(stepIndex>=steps.length-1){closeTour(true);navTo("dashboard");return}
        showStep(stepIndex+1);
      }
    });
    window.addEventListener("resize",()=>{if(open)positionStep()},{passive:true});
    window.addEventListener("orientationchange",()=>{if(open)setTimeout(positionStep,120)},{passive:true});
  }

  function positionStep(){
    const root=$("#betynz-tour");
    if(!root||!open)return;
    const step=steps[stepIndex];
    const target=$(step.target);
    const spot=$(".betynz-tour__spotlight",root);
    if(!spot)return;
    if(!target){spot.classList.add("is-hidden");return}
    const rect=target.getBoundingClientRect();
    const pad=8;
    const left=Math.max(8,rect.left-pad);
    const top=Math.max(8,rect.top-pad);
    const right=Math.min(window.innerWidth-8,rect.right+pad);
    const bottom=Math.min(window.innerHeight-8,rect.bottom+pad);
    if(right-left<30||bottom-top<30){spot.classList.add("is-hidden");return}
    spot.classList.remove("is-hidden");
    spot.style.left=`${left}px`;
    spot.style.top=`${top}px`;
    spot.style.width=`${right-left}px`;
    spot.style.height=`${bottom-top}px`;
  }

  function showStep(index){
    build();
    stepIndex=index;
    const root=$("#betynz-tour");
    const step=steps[index];
    navTo(step.view);
    const target=()=>$(step.target);
    setTimeout(()=>{
      const node=target();
      if(node)node.scrollIntoView({block:"center",behavior:prefersReduced?"auto":"smooth"});
      setTimeout(positionStep,prefersReduced?0:180);
    },70);
    $(".betynz-tour__eyebrow",root).textContent=step.eyebrow;
    $(".betynz-tour__icon",root).textContent=step.icon;
    $("#betynz-tour-title",root).textContent=step.title;
    $(".betynz-tour__copy p",root).textContent=step.copy;
    $(".betynz-tour__progress",root).innerHTML=steps.map((_,i)=>`<i class="${i<=index?"active":""}"></i>`).join("");
    $("[data-tour-back]",root).hidden=index===0;
    $("[data-tour-skip]",root).hidden=index>0;
    $("[data-tour-next]",root).textContent=index===steps.length-1?"Enter Betynz":"Continue";
  }

  function openTour(force=false){
    if(open)return;
    try{if(!force&&localStorage.getItem(TOUR_KEY))return}catch(_){ }
    build();
    const root=$("#betynz-tour");
    root.hidden=false;
    document.documentElement.classList.add("betynz-tour-open");
    open=true;
    showStep(0);
  }

  function closeTour(save){
    const root=$("#betynz-tour");
    if(!root)return;
    open=false;
    root.hidden=true;
    document.documentElement.classList.remove("betynz-tour-open");
    if(save){try{localStorage.setItem(TOUR_KEY,"done")}catch(_){ }}
  }

  function scheduleFirstRun(){
    if(scheduled)return;
    scheduled=true;
    const launch=()=>setTimeout(()=>openTour(false),1100);
    if("requestIdleCallback" in window)requestIdleCallback(launch,{timeout:2600});
    else launch();
  }

  document.addEventListener("click",event=>{
    const replay=event.target.closest("#replay-tour,[data-replay-tour]");
    if(!replay)return;
    event.preventDefault();
    openTour(true);
  });

  window.addEventListener("betynz:app-ready",scheduleFirstRun,{once:true});
  if(window.BETYNZ_APP_READY)scheduleFirstRun();
  window.BetynzTour=Object.freeze({open:()=>openTour(true),close:()=>closeTour(false)});
}());
