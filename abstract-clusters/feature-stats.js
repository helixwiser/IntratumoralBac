window.FeatureStats={
 summarize(rows,indices,actions){return actions.map(a=>{let hit=0,tentative=0;for(const i of indices){const h=rows[i].actions[a.id];if(h.some(s=>!s.tentative))hit++;else if(h.length)tentative++;}return {id:a.id,hit,tentative,unknown:indices.length-hit-tentative,total:indices.length,matched:hit+tentative};});}
};
