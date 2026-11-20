/*! Skydio Product Kit · catalog.js
   Component specimens for the Library tab: [group, name, args, note, principles, stage, custom render].
   Same catalog the Skydio UI Kit page uses; every specimen is drawn by calling SkydioUI. */
(function (G) {
"use strict";
const K = G.SkydioUI;
const air = { id:"X10-A", dock:"North Dock", pilot:"SSG Dana Ruiz", state:"flying", battery:82, alt:180, speed:12, heading:45, sensor:"thermal" };
const ready = { ...air, id:"X10-D", dock:"Reserve Dock", state:"ready", battery:100, alt:0, speed:0 };
const mission = { id:"M-P1", name:"Motor Pool patrol", state:"active", sector:"Motor Pool", next:"WP 3", cadence:"Every 30 mins" };

/* catalog: [group, name, args, note, principles, stage] — stage: "" | "terrain" | "video" | "box:WxH" | "solo" */
const C = [
  ["Atoms","badge",["flying"],"State badge. Every state in the ontology has a fixed treatment.",["P05","P12"],"",()=>K.ONTO.air.concat(["new","claimed","responding","resolved","active","upcoming","scheduled","paused","done"]).map(s=>K.badge(s)).join("")],
  ["Atoms","Button",[{label:"Dispatch",variant:"blue",act:"dispatch",id:"INC-4471"}],"Neutral, blue (go) and red (stop only) variants. Red is reserved by P02.",["P02","P12"],"",()=>[K.Button({label:"Claim"}),K.Button({label:"Dispatch",variant:"blue"}),K.Button({label:"Pause",icon:"pause",variant:"red",fleetstop:true}),K.Button({label:"End",disabled:true})].join("")],
  ["Atoms","LiveTag",[],"Marks a streaming feed.",["P02"]],
  ["Atoms","Segmented",[[{label:"Track",on:true,act:"mode",id:"SUB-1|track"},{label:"Follow",act:"mode",id:"SUB-1|follow"}]],"Switches a flight behavior the aircraft will act on.",["P12"]],
  ["Atoms","AffiliationPicker",["hostile",{act:"aff",id:"SUB-1"}],"MIL-STD-2525 affiliation choice for a subject. Shapes and fills are never restyled.",["P07"]],
  ["Shell","TopBar",[{site:"Fort Calder",module:"Flight Deck",clock:"02:14:41 AM"}],"Breadcrumb and live clock.",["P04"],"box:100%x44"],
  ["Shell","NavRail",[{badge:2}],"Compact side nav with an unclaimed-incident count.",["P04"],"box:52x260"],
  ["Cards","IncidentCard",[{id:"INC-4471",title:"Intrusion alarm · Motor Pool",state:"new",source:"IDS",sensor:"South gate sensor",age:"30 sec",owner:null,actions:[{label:"Claim",act:"claim",id:"INC-4471"},{label:"Dispatch",variant:"blue",act:"dispatch",id:"INC-4471"},{label:"End",f:"close",disabled:true}]}],"Source, clock, owner and a close action are required.",["P05","P10","P11"]],
  ["Cards","IncidentCard",[{id:"INC-4471",title:"Intrusion alarm · Motor Pool",state:"responding",source:"IDS",sensor:"South gate sensor",age:"2 min",owner:"SSG Dana Ruiz (you)",actions:[{label:"End response",icon:"check",act:"end",id:"INC-4471",f:"close"}]}],"Responding: owned, with one way to close it.",["P10","P11"]],
  ["Cards","LaunchCard",[{aircraft:{...air,state:"launching"},focus:true,note:"Response · Motor Pool"}],"Shown while a dock launches.",["P03","P05"]],
  ["Cards","PatrolCard",[{mission,aircraft:air,dets:[{cls:"person",count:1},{cls:"vehicle",count:2}]}],"Identity and state, where and next, who and health.",["P05","P11"]],
  ["Cards","PatrolCard",[{mission:{...mission,attention:true,reason:"Low battery"},aircraft:{...air,battery:22},actions:[{label:"Relief",icon:"swap",act:"relief",id:"X10-A"}]}],"Needs-attention variant: red stripe and the reason.",["P02","P05"]],
  ["Cards","MissionItem",[{mission:{id:"M-S1",name:"Vehicle lot patrol",state:"scheduled",sector:"Sector B",start:"03:30",workOrder:"WO 04B-11A"},aircraftLabel:"X10-B · South Dock",actions:[{label:"Launch",variant:"blue",act:"launch-mission",id:"M-S1"}]}],"Scheduled work with a route thumbnail.",["P05","P11"]],
  ["Cards","AssetItem",[{aircraft:ready,actions:[{label:"Launch",variant:"blue",act:"launch",id:"X10-D"}]}],"A dock and its aircraft.",["P05","P11"]],
  ["Map","DroneMarker",[{id:"X10-A",x:30,y:45,heading:45,state:"flying",alt:180,battery:82}],"Heading disc with a white ring. Amber when focused.",["P03","P09"],"terrain box:100%x150",()=>K.DroneMarker({id:"X10-A",x:30,y:45,heading:45,state:"flying",alt:180,battery:82})+K.DroneMarker({id:"X10-C",x:72,y:45,heading:300,state:"flying",alt:150,battery:64,focus:true})],
  ["Map","Waypoint",[{n:3,x:50,y:50,done:true,entity:"M-P1-wp3"}],"Blue when reached, white when ahead.",["P09"],"terrain box:100%x110",()=>[1,2,3,4,5].map(n=>K.Waypoint({n,x:12+n*15,y:50,done:n<4,entity:"wp"+n})).join("")],
  ["Map","EventMarker",[{id:"INC-4471",kind:"alert",x:50,y:50}],"Diamond event: alert, person, vehicle, animal, POI.",["P02","P09"],"terrain box:100%x110",()=>["alert","person","vehicle","animal","poi"].map((k,i)=>K.EventMarker({id:"E"+i,kind:k,x:14+i*18,y:50})).join("")],
  ["Map","CoTMarker",[{id:"CoT-1",aff:"hostile",x:50,y:50}],"Shared over TAK in standard 2525 colors.",["P07","P09"],"terrain box:100%x110",()=>K.ONTO.aff.map((a,i)=>K.CoTMarker({id:"C"+i,aff:a,x:18+i*21,y:50})).join("")],
  ["Map","FleetActions",[{paused:false}],"Fleet-wide commands, docked under the map.",["P02","P04"],"terrain solo"],
  ["Map","BasemapSwitcher",["satellite"],"Satellite, topo, dark vector and street basemaps.",["P09"],"solo"],
  ["Map","AlertToast",[{line1:"Intrusion alarm",line2:"Motor Pool · IDS · unclaimed",urgency:"action"}],"Red bar needs action, amber is information. tak:true switches to the TAK voice.",["P07"],"terrain",()=>K.AlertToast({line1:"Intrusion alarm",line2:"Motor Pool · IDS · unclaimed",urgency:"action"})+K.AlertToast({line1:"Subject published to TAK",line2:"PERSON · HOSTILE · MOTOR POOL",tak:true})],
  ["Map","MapPane",[{basemap:"topo",seed:"Fort Calder",overlays:"…markers…",fleet:{}}],"The full map pane: basemap, overlays, search, tools, switcher and fleet bar.",["P04","P09"],"box:100%x380",()=>K.MapPane({basemap:"topo",seed:"Fort Calder",overlays:K.DroneMarker({id:"X10-A",x:40,y:40,heading:80,state:"flying",alt:180,battery:82,focus:true})+K.EventMarker({id:"INC",kind:"alert",x:60,y:60})+K.CoTMarker({id:"C",aff:"hostile",x:30,y:66}),fleet:{}}).replace('class="d-map"','class="d-map" style="position:absolute;inset:0"')],
  ["Video","FeedTile",[{aircraft:air,focus:true,rthAct:"rth",holdAct:"hold",det:{cls:"person",x:34,y:60},sub:{id:"SUB-1",cls:"vehicle",x:64,y:52,aff:"hostile"},footer:"…subject controls…"}],"One aircraft's cockpit. Always carries a red return control when airborne.",["P02","P03","P06"],"box:100%x330",()=>`<div style="display:flex;height:100%;padding:8px">${K.FeedTile({aircraft:air,focus:true,rthAct:"rth",holdAct:"hold",det:{cls:"person",x:34,y:60},sub:{id:"SUB-1",cls:"vehicle",x:64,y:52,aff:"hostile"},footer:`<span class="lbl">SUB-1</span>${K.Segmented([{label:"Track",on:true},{label:"Follow"}])}${K.AffiliationPicker("hostile",{})}${K.Button({label:"Publish",variant:"blue"})}`})}</div>`],
  ["Video","FeedTile",[{aircraft:ready}],"On the dock: no stop control, charging state.",["P02"],"box:100%x200",()=>`<div style="display:flex;height:100%;padding:8px">${K.FeedTile({aircraft:ready,footer:K.Button({label:"Launch patrol",variant:"blue"})})}</div>`],
  ["Video","Reticle",[{cls:"person",x:50,y:55}],"Mint corner brackets: AI lock. Animals tagged amber.",["P09"],"video box:100%x130",()=>K.Reticle({cls:"person",x:30,y:55})+K.Reticle({cls:"animal",x:70,y:55})],
  ["Video","BoundingBox",[{id:"SUB-1",cls:"vehicle",x:50,y:52,aff:"hostile"}],"Tracked subject, with its TAK marker pinned on top once published.",["P07"],"video box:100%x140"],
  ["Controller","FlightStrip",[air,"14R MS 85231 81518"],"Battery ring, nav sources, HAL, speed, heading, frequency.",["P06","P08"],"video solo"],
  ["Controller","ToolRail",["scan"],"Left-edge tools; active tool in blue with a mint bar.",["P04","P08"],"solo"],
  ["Controller","CaptureRail",[{hold:{act:"hold",id:"X10-A",icon:"pause",label:"Hold"},stop:{act:"rth",id:"X10-A"}}],"Zoom, hold, return-to-home and shutter.",["P02","P08"],"solo"],
  ["Controller","ShadowFlyout",[{subject:{id:"SUB-1",mode:"track",aff:"hostile",published:false},modeAct:"mode",affAct:"aff",publishAct:"publish",reliefAct:"relief",aircraftId:"X10-A"}],"Subject tracking, mode, TAK marker type, publish and relief.",["P07","P08"],"solo"],
  ["Controller","IncidentToast",[{id:"INC-4471",title:"Intrusion alarm · Motor Pool",state:"new",source:"IDS",age:"30 sec",owner:null,actions:[{label:"Claim",act:"claim",id:"INC-4471"},{label:"Dispatch",variant:"blue",act:"dispatch",id:"INC-4471"},{label:"End",f:"close",disabled:true}]}],"The incident card, collapsed for the handheld.",["P08","P10"],"video solo"],
  ["Controller","IsrToast",[{line1:"X10-D is en route",line2:"Arriving in ~2 min",urgency:"info"}],"TAK-voiced status message.",["P07"],"video solo"],
  ["Controller","TargetReadout",[{key:"X10-A",range:"193 ft",mgrs:"14R MS 85298 81518"}],"Slant range and grid of what's under the crosshair.",["P06"],"video solo"],
  ["Controller","GridReadout",[{mgrs:"11S MT 85676 81518"}],"MGRS in the TAK dialect.",["P07"],"video solo"],
  ["Controller","ReliefBar",[{reliever:{...ready,id:"X10-D",state:"launching",alt:60}}],"The incoming aircraft during a handoff.",["P05"],"video solo"],
  ["Controller","Minimap",[{basemap:"street",seed:"Fort Calder",markers:"…"}],"Inset map with live aircraft and TAK markers.",["P03","P09"],"solo",()=>K.Minimap({basemap:"street",seed:"Fort Calder",markers:K.DroneMarker({id:"X10-A",x:40,y:45,heading:30,small:true,focus:true})+K.CoTMarker({id:"C",aff:"hostile",x:66,y:36})})]
];
G.SKY.CATALOG = C;
})(window);
