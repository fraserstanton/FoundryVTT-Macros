/*This version of the 2-action heal macro automatically expends spells from your spell list*/

if (token === undefined) {
	return ui.notifications.warn('No token is selected.');
} 

async function CheckFeat(slug) {
	if (token.actor.items.find((i) => i.slug === slug && i.type === 'feat')) {
		return true;
	}
	return false;
}

async function CheckAction(name) {
	if (token.actor.items.find((i) => i.name === name && i.type === 'action')) {
	    	return true;
	}
	return false;
}

async function CheckSpell(slug) {
	if (token.actor.items.find((i) => i.slug === slug && i.type === 'spell')) {
	    	return true;
	}
	return false;
}

async function CheckStaff(slug) {
	if (token.actor.items.find((i) => i.slug === slug && i.type === 'weapon' && i.isEquipped === true)) {
	    	return true;
	}
	return false;
}

async function CheckEffect(slug) {
	if (token.actor.items.find((i) => i.slug === slug && i.type === 'effect')) {
	    	return true;
	}
	return false;
}
    
async function CheckEquip(slug) {
        if (token.actor.items.find((i) => i.slug === slug && i.type === 'equipment' && i.isEquipped === true)) {
            	return true;
        }
        return false;
}

for (const token of canvas.tokens.controlled) {

	const hE = token.actor.itemTypes.spellcastingEntry.filter(m => m.spells.some(x => x.slug === 'heal') === true);

	const hIds = [];
	token.actor.itemTypes.spell.forEach(id => {
	if(id.slug === 'heal') { hIds.push(id.id); }
	});

	const h = [];

	hE.forEach(e => {
		if (e.isPrepared && !e.isFlexible) {
			Object.entries(e.data.data.slots).forEach(sl => {
				let lv = parseInt(sl[0].substr(4));
				Object.entries(sl[1].prepared).forEach(p => {
					if(hIds.includes(p[1].id) && !p[1].expended) {
						h.push({name: `Heal lv${lv} (${e.name})`, level: lv, prepared: true, slot: sl[0], prepkey: p[0], entryId: e.id })
					}
				})
			});
		}
		else {
			const spellData = e.getSpellData();
			spellData.levels.forEach(sp => {
				if(sp.isCantrip || sp.uses.value === 0 || sp.uses.max === 0 ) { return; }
				sp.active.forEach(spa => {
					if(spa.chatData.slug === 'heal'){ h.push({name: `Heal lv${sp.level} (${e.name})`, level: sp.level, prepared: false, entryId: e.id })}
				})
			});
		}
	});


	const hdd = [{label: 'Which spell?', type: 'select', options: h.map(n => n.name)}];
	
	let ahi,hhi;
	if (await CheckSpell('angelic-halo')) { 
		hdd.push({label: 'Angelic Halo', type: 'checkbox'});
		ahi = hdd.findIndex(e => e.label === 'Angelic Halo');
	}
	if (await CheckFeat('healers-halo')) { 
		hdd.push({label: `Healer's Halo`, type: 'checkbox'}) ;
		hhi = hdd.findIndex(e => e.label === `Healer's Halo`);
	}

	const hdiag = await quickDialog({data : hdd, title : `2-Action Heal`});


	const hch = h.find(n => n.name === hdiag[0]);

	const heals = await CheckSpell('heal');
	/*Informs the player that they do not possess the heal spell in their character sheet*/
    	if (heals === false && token.actor.data.type != 'npc') {  return ui.notifications.warn('Actor does not possess the heal spell'); }
    	if (game.user.targets.size < 1) { return ui.notifications.warn('Please target a token'); }
    	if (game.user.targets.size > 1) { return ui.notifications.warn('2-Action Heal can only affect 1 target per cast'); }

    	const target = game.user.targets.ids[0];
    	const metok = token.id;
    	const tname = canvas.tokens.placeables.find((t) => t.id === target).name;
    	if(canvas.tokens.placeables.find((t) => t.id === target).actor.data.data.traits.traits.value.find((t) => t === 'undead' || t=== 'construct')) {
    		 var tt = true; }
    	else { var tt = false; }
    	
	/*Staff of Healing*/
    	const staff = await CheckStaff('staff-of-healing');
    	const gstaff = await CheckStaff('staff-of-healing-greater');
    	const mstaff = await CheckStaff('staff-of-healing-major');
    	const tstaff = await CheckStaff('staff-of-healing-true');
    
    	/*Oracle Effects must be placed on character to function properly*/
    	const minc = await CheckEffect('effect-minor-life-curse');
    	const modc = await CheckEffect('effect-moderate-life-curse');
    	const majc = await CheckEffect('effect-major-life-curse');
    
    	/*Overflowing Life Relic ability. Must have an action named Overflowing Life in character sheet to be selectable.
    	This will be fixed to work with Relic abilities when integrated into system*/
    	const o_life = await CheckAction('Overflowing Life');
    
    	/*Angelic Halo Focus Spell*/
    	const a_halo = hdiag[ahi];
    
    	/*Healer's Halo Ancestry Feat*/
    	const h_halo = hdiag[hhi];
    
    	/*Holy Prayer Beads*/
    	const hpbeads = await CheckEquip('holy-prayer-beads');
    	const ghpbeads = await CheckEquip('holy-prayer-beads-greater');
    	if (hpbeads === true) { var bbeads = '1'}
    	if (ghpbeads === true) { var bbeads = '1d4'}
    	const plevel = token.actor.level;
    	const healingHands = await CheckFeat('healing-hands');
    	var hdice = healingHands ? 'd10' : 'd8';
    	if (tt === false )  {
    	var hdice = modc ? 'd12' : hdice;
    	var hdice = majc ? 'd12' : hdice;
    	}
    	const hlvl = hch.level;
    	let heal1 = hlvl + hdice;
    	let heal2 = hlvl * 8;
    	var healt;
    
    	/*Staves of Life */
    	if (tstaff === true) { var staffb = 4; var healt = heal1 + "+" + heal2 + "+" + staffb; }
    	else if (mstaff === true) { var staffb = 3; var healt = heal1 + "+" + heal2 + "+" + staffb; }
    	else if (gstaff === true) { var staffb = 2; var healt = heal1 + "+" + heal2 + "+" + staffb; }
    	else if (staff === true) { var staffb = 1; var healt = heal1 + "+" + heal2 + "+" + staffb; }

	else { var healt = heal1 + "+" + heal2; }
    
 	/*Overflowing Life relic ability*/
    	if ( o_life === true && target === metok ) {
     	if ( Math.floor(plevel / 2) === 0 ) { var odice = 1; }
     	else { var odice = Math.floor(plevel / 2); }
     		var healt = healt + "+" + odice;
    	}	
    	var healt = a_halo ? healt + "+" + hlvl * 2 : healt;
	
    	if(h_halo === true) { 
    		let h_heal = '1d6';
    		let h_roll = new Roll(`{${h_heal}}[positive]`);
    		h_roll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor:`<strong> Extra healing from Healer's Halo </strong>` });
    	}

    	if ( await CheckFeat('life-mystery') === true) {
     		if ((minc === true || modc === true || majc === true) && target === metok) { 
      		if (Math.floor(plevel / 2) === 0) { var hpenal = 1; }
      		else { var hpenal = Math.floor(plevel / 2); }
     		var healt = healt + "-" + hpenal;
     		}
    	}
    	if (target === metok && (hpbeads === true || ghpbeads === true)) { var healt = healt + "+" + bbeads;}
    	else if (hpbeads === true || ghpbeads === true) { let beadroll = new Roll(bbeads); beadroll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor: `<strong> Prayer Beads recovery that either you or targeted player get`});}
    	const roll = new Roll(`{${healt}}[positive]`);
    	let healf = `2-Action Lv ${hlvl} Heal spell targeting ${tname}`;
    	roll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor: `<strong> ${healf} </strong>`});
    
    	if (modc === true) {  
    		let broll = new Roll(`{${hlvl}}[positive]`);
      		broll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor: `<strong> Hit Points equal to the spell level to your choice of either one target of the spell or the creature nearest to you. You can't heal yourself in this way.</strong> This healing has the healing, necromancy, and positive traits, as well as the tradition trait of the spell.`});}
    	else if (majc === true && hlvl > 4) {
      		let nlvl = hlvl - 4;
      		var healmt = nlvl + hdice + "+" + nlvl;
      		if (staffb > 0) { var healmt = healmt + "+" + staffb; }
      		var healmt = a_halo ? healmt + "+" + nlvl * 2 : healmt;
      		let croll = new Roll(`{${healmt}}[positive]`)
      		croll.toMessage({ speaker: ChatMessage.getSpeaker(), flavor: `<strong> You disperse positive energy in a 30-foot burst with the effects of a 3-action heal spell with a level 4 lower than that of the spell you cast. This healing occurs immediately after you finish Casting the Spell. You don't benefit from this healing. Instead, you lose double the number of Hit Points rolled for the heal spell. </strong>`});
    
    	}
	
	const s_entry = hE.find(e => e.id === hch.entryId);

	/* Expend slots */
	/* Spontaneous, Innate, and Flexible */
	if (!hch.prepared) {
		let data = duplicate(s_entry.data);
        	Object.entries(data.data.slots).forEach(slot => {
            		if (parseInt(slot[0].substr(4)) === hch.level && slot[1].value > 0) { 
              			slot[1].value-=1;
              			s_entry.update(data);
            		}
        	})
	}
      
	/* Prepared */
	if (hch.prepared) { 
		let data = duplicate(s_entry.data);
        	Object.entries(data.data.slots).forEach(slot => {
            		if (slot[0] === hch.slot) {
              			slot[1].prepared[hch.prepkey].expended = true;
              			s_entry.update(data);
            		}
        	})

	}
}	


/* Dialog box */
async function quickDialog({data, title = `Quick Dialog`} = {}) {
	data = data instanceof Array ? data : [data];

	return await new Promise(async (resolve) => {
	        let content = `
        	<table style="width:100%">
          	${data.map(({type, label, options}, i)=> {
          		if(type.toLowerCase() === `select`)
          	{
          		return `<tr><th style="width:50%"><label>${label}</label></th><td style="width:50%"><select id="${i}qd">${options.map((e,i)=> `<option value="${e}">${e}</option>`).join(``)}</td></tr>`;
          	}else if(type.toLowerCase() === `checkbox`){
            		return `<tr><th style="width:50%"><label>${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" ${options || ``}/></td></tr>`;
          	}else{
            		return `<tr><th style="width:50%"><label>${label}</label></th><td style="width:50%"><input type="${type}" id="${i}qd" value="${options instanceof Array ? options[0] : options}"/></td></tr>`;
          	}
          	}).join(``)}
        	</table>`;

        await new Dialog({
         title, content,
         buttons : {
           Ok : { label : `Ok`, callback : (html) => {
             resolve(Array(data.length).fill().map((e,i)=>{
               let {type} = data[i];
               if(type.toLowerCase() === `select`)
               {
                 return html.find(`select#${i}qd`).val();
               }else{
                 switch(type.toLowerCase())
                 {
                   case `text` :
                   case `password` :
                   case `radio` :
                   return html.find(`input#${i}qd`)[0].value;
                  case `checkbox` :
                  return html.find(`input#${i}qd`)[0].checked;
                  case `number` :
                  return html.find(`input#${i}qd`)[0].valueAsNumber;
                }
              }
            }));
          }}
        },
        default : 'Ok'
        })._render(true);
        document.getElementById("0qd").focus();
      });
    }