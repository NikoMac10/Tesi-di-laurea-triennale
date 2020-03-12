////////////////////////////////////////////////////////////////////////
//VARIABILI GLOBALI
////////////////////////////////////////////////////////////////////////

var Atomi = [], AtomBonds = [], Oxigen=[],
	Helix = [], Sheet = [], Backbone=[];           	//strutture dati
var AlsoConnect = [];						//CONNECT
var AtomPool1 = [];							//pool
var AtomPool2 = [];

var mediana, cpk_ballstick = true;
var mouse = new THREE.Vector2();
var mouse2 = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

var GRAFICA = 16;																//costanti
var TOLLERANZA = 0.45;
var MOLTATOMI = 0.22, MOLTCPK = 1.0 ,MOLTCOLLEGAMENTI = 0.150;
var FOV = 45;
var NATOMS = 10000;

var ScenaAtomi1 = new THREE.Scene();											//Scene
var ScenaAtomi2 = new THREE.Scene();
var ScenaAtomBonds = new THREE.Scene();
var ScenaSecondary = new THREE.Scene();
var Scene = new THREE.Scene();


var renderer = new THREE.WebGLRenderer({antialias : true});
var camera = new THREE.PerspectiveCamera(FOV, window.innerWidth/window.innerHeight, 0.1, 500);
var controls, distance , c,  minY , maxY, minX , maxX, minZ , maxZ; 

var CheckboxAtomi, CheckboxCollegamenti, CheckboxSecondary,
	 CheckboxFog, toast;											//checkbox and button

	 
////////////////////////////////////////////////////////////////////////
//Document Ready
////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

	mouse2.x=9999;
	ScenaSecondary.name = "scenaSecondary";
	ScenaAtomBonds.name = "collegamenti";
	ScenaAtomi2.name = "atomi2";
	ScenaAtomi1.name = "atomi1";
		
	toast = document.getElementById("snackbar");
	CheckboxAtomi = document.getElementById("Check_atoms");  //checkbox
	CheckboxCollegamenti = document.getElementById("Check_sticks");
	CheckboxSecondary = document.getElementById("Check_Secondary");
	CheckboxFog = document.getElementById("Check_fog"); 

	CheckboxAtomi.oninput = function(){
        if(this.checked==true)
            Scene.add(ScenaAtomi1);
        else
            Scene.remove(Scene.getObjectByName("atomi1")); 
    };

    CheckboxCollegamenti.oninput = function(){
        if(this.checked==true){
            Scene.add(ScenaAtomBonds);
            Scene.add(ScenaAtomi2);
        }	
        else{
            Scene.remove(Scene.getObjectByName("collegamenti"));
            Scene.remove(Scene.getObjectByName("atomi2"));
        } 
    };

    CheckboxSecondary.oninput = function(){
        if(this.checked==true)
            Scene.add(ScenaSecondary);
        else
            Scene.remove(Scene.getObjectByName("scenaSecondary")); 
    };
        
    CheckboxFog.oninput = function(){
        if(this.checked==true)
            Scene.fog = new THREE.FogExp2("#262626", 0.02);
        else
            Scene.fog = undefined;
    };
	
	renderer.domElement.addEventListener("mousemove", function() { toast.className = "hide"; });

    renderer.domElement.addEventListener('mousedown', function(event){
        mouse.x = (event.offsetX / renderer.domElement.width) * 2 - 1;
        mouse.y = -(event.offsetY / renderer.domElement.height) * 2 + 1;
    });

    renderer.domElement.addEventListener('mouseup', function(event){
        if (mouse.x == ((event.offsetX / renderer.domElement.width) * 2 - 1) &&
            mouse.y == (-(event.offsetY / renderer.domElement.height) * 2 + 1)) {
            mouse2.x = mouse.x;
            mouse2.y = mouse.y;
        }
        else
            mouse2.x = 9999;
    });
	
	 
	//lettura file pdb
	document.forms['myform'].elements['file'].onchange = function(evt) {
		if(!window.FileReader) return; // Browser is not compatible
		
		var reader = new FileReader();
		
		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				alert('Error while reading file');
				return;
			}
			
			var pdb = evt.target.result;  	//inseriamo contenuto file pdb dentro stringa
			
			Atomi = []; 			Backbone = [];				//reset strutture dati atomi e collegamenti
			AtomBonds = []; 		AlsoConnect = [];		
			Helix = [];            	Sheet = [];
			mediana = new THREE.Vector3();

			//////////////////////////////////////////////////////////////////////
			//RAGGIUNGIMENTO HELIX SHEET
			////////////////////////////////////////////////////////////////////////
			var appo = pdb.indexOf("REMARK 900");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("SEQRES");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("HETNAM");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("FORMUL");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);

			//////////////////////////////////////////////////////////////////////
			//PARSING HELIX, SHEET
			//////////////////////////////////////////////////////////////////////
			var occur = pdb.indexOf("HELIX");
			while (occur!=-1){ 
				pdb = pdb.slice(occur+4, pdb.length);
				let startChainId = pdb.slice(15, 16);				
				let start = parseInt(pdb.slice(17, 21));
				let endChainId = pdb.slice(27, 28);	
				let end = parseInt(pdb.slice(29, 33));

				Helix.push({ startChainId : startChainId , start : start
							, endChainId : endChainId , end : end});

				occur = pdb.indexOf("HELIX");				
			}
			Helix.sort(compareSheetHelix);

			occur = pdb.indexOf("SHEET");
			while (occur!=-1){ 
				pdb = pdb.slice(occur+4, pdb.length);
				let startChainId = pdb.slice(17, 18);					
				let start = parseInt(pdb.slice(18, 22));
				let endChainId = pdb.slice(28, 29);  			
				let end = parseInt(pdb.slice(29, 33));

				Sheet.push({ startChainId : startChainId , start : start
							, endChainId : endChainId , end : end});

				occur = pdb.indexOf("SHEET");				
			}

			Sheet.sort(compareSheetHelix);								//reorder
			Sheet = Sheet.filter(checkDuplicates);					//remove duplicates
			
			
			//////////////////////////////////////////////////////////////////////
			//RAGGIUNGIMENTO ATOMI
			////////////////////////////////////////////////////////////////////////
			var appo = pdb.indexOf("SITE");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("CRYST1");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("ORIGX1");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("SCALE1");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			appo = pdb.indexOf("MTRIX1");
			if(appo != -1) pdb = pdb.slice(appo, pdb.length);
			
			
			//////////////////////////////////////////////////////////////////////
			//PARSING ATOMI
			////////////////////////////////////////////////////////////////////////
			if(pdb.indexOf("MODEL") != -1){ 	//prendo in considerazione il primo modello
				pdb = pdb.slice(pdb.indexOf("MODEL"), pdb.indexOf("ENDMDL"));  
				console.log("Proteina multi modello");
			}
				
			minY = 1000; 	maxY = -1000;
			minX = 1000; 	maxX = -1000;
			minZ = 1000; 	maxZ = -1000;
			          					
			occur = pdb.indexOf("ATOM");  
			var occur2 =  Number.MAX_SAFE_INTEGER;
			var i=0, ter=1;
		
			while (occur!=-1){ 
				pdb = pdb.slice(occur+4, pdb.length);				
				
				let name = pdb.slice(8, 12).trim(); 
				let resName = pdb.slice(13, 16);
				let chainId = pdb.slice(17, 18);
				let resSeq = parseInt(pdb.slice(18,22));
				let pos = new THREE.Vector3(parseFloat(pdb.slice(26, 34)),  			//cordinate 
											parseFloat(pdb.slice(34, 42)),
											parseFloat(pdb.slice(42, 50)));						
				let elem = pdb.slice(72, 74).trim();
				

				//variabili per settare zoom e per calcolo collegamenti
				minY = (minY > pos.y)? pos.y : minY; 	maxY = (maxY < pos.y)? pos.y : maxY; 
				minX = (minX > pos.x)? pos.x : minX;  	maxX = (maxX < pos.x)? pos.x : maxX;
				minZ = (minZ > pos.z)? pos.z : minZ;  	maxZ = (maxZ < pos.z)? pos.z : maxZ;
				
				mediana.add(pos); 	//mediana
				
				let atomo = {pos : pos, elem : elem, name : name,		//atomo
					 resName : resName, chainId : chainId, resSeq : resSeq};		

				Atomi.push(atomo);

				if(name == "C")  Backbone.push(atomo);
				if(name == "O")  Oxigen[chainId.toString() + resSeq.toString() ] = pos;

				//TER
				{
				occur = pdb.indexOf("ATOM");
				if(occur > 100 || occur == -1) 					//ottimizzazione TER
					occur2 = pdb.indexOf('TER');
				
				if(occur==-1 && occur2!=-1){              			//caso atomi finiti e TER finale   
					Atomi.push("TER");		ter++;		Backbone.push("TER");						
				}

				if(occur2 < occur && occur2!=-1 && occur!=-1){		//caso fine catena                   
					Atomi.push("TER");		ter++;		Backbone.push("TER");						
				}
				}
			}
			
			console.log("Chain found : " + ter);
			mediana.divideScalar(Atomi.length);
			
			
			/////////////////////////////////////////////////////////////////////////////////
			//CALCOLO COLLEGAMENTI  ->    (raggio1 + raggio2 + TOLLERANZA)   BRUTEFORCE O(n!)
			/////////////////////////////////////////////////////////////////////////////////
			/*
			let cache = CovalentRadius;                 
			for(var i=0; i<Atomi.length; i++){			if(Atomi[i] == "TER") continue;
				let raggio1 = cache[Atomi[i].elem];		
				for(let j=i+1; j<Atomi.length; j++){	if(Atomi[j] == "TER") continue;
					
					let dist = calcola_Distanza(Atomi[i], Atomi[j]);

					if( 4 > dist && dist > 0.4){
						let raggio2 =  cache[Atomi[j].elem];
						if(raggio1+raggio2 + TOLLERANZA > dist)   
							AtomBonds.push({start : Atomi[i].pos, end : Atomi[j].pos });
					}	
				}
			}*/

			
			/////////////////////////////////////////////////////////////////////////////////
			//CALCOLO COLLEGAMENTI  ->   (raggio1 + raggio2 + TOLLERANZA)   Simil Radix sort
			/////////////////////////////////////////////////////////////////////////////////

			let nVectX = (maxX-minX)/2;   let nVectY = (maxY-minY)/2;   let nVectZ = (maxZ-minZ)/2;
			let cont = new Array;

			for(i=0; i<nVectX; i++){
				cont[i] = new Array();
				for(j=0; j<nVectY; j++)
					cont[i][j] = new Array();
			}		

			//INSERIMENTO ATOMI
			Atomi.forEach( function(x){
				if(x == "TER") return;

				let indeX = Math.floor(((x.pos.x) - minX)/2);
				let indeY = Math.floor(((x.pos.y) - minY)/2);
				let indeZ = Math.floor(((x.pos.z) - minZ)/2);
				if( cont[indeX][indeY][indeZ] == undefined)
					cont[indeX][indeY][indeZ] = new Array();

				cont[indeX][indeY][indeZ].push(x);	
			});

			//CALCOLO COLLEGAMENTI
			let cache = CovalentRadius; 
			for(i=0; i<nVectX; i++)
				for(j=0; j<nVectY; j++)
					for(k=0; k<nVectZ; k++){
						if(!cont[i][j][k]) continue;

						var original_length = cont[i][j][k].length;
						for(var l=0; l<original_length;	l++){

							var atom = cont[i][j][k].pop();

							var iXs = (i -1 < 0)? 0 : i -1;
							var iYs = (j -1 < 0)? 0 : j -1;
							var iZs = (k -1 < 0)? 0 : k -1;

							for(iXs2 = iXs; (iXs2 < i+2) && (iXs2 < nVectX);  iXs2++ )
								for(iYs2 = iYs ; (iYs2 < j+2) && (iYs2 < nVectY);  iYs2++ )
									for(iZs2 = iZs ; (iZs2 < k+2) && (iZs2 < nVectZ);  iZs2++ ){

										if(!cont[iXs2][iYs2][iZs2]) continue;

										cont[iXs2][iYs2][iZs2].forEach(function(other){
											var dist = calcola_Distanza(atom, other);	
											var raggio1 = cache[atom.elem];               //potrebbe non esserci il covalent radius del seguente atomo
											var raggio2 = cache[other.elem];
											
											if(raggio1+raggio2 + TOLLERANZA > dist)   
												AtomBonds.push({start : atom.pos, end : other.pos });
										});
									}
						}
					}
			
			cont.splice(0,cont.length);

			//////////////////////////////////////////////////////////////////////
			//PARSING COLLEGAMENTI FORZATI
			//////////////////////////////////////////////////////////////////////
			occur = pdb.indexOf("CONECT");
			
			while (occur!=-1){ 
				pdb = pdb.slice(occur+6, pdb.length);				
								
				let atom1 = pdb.slice( 0, 5).trim();               //cordinate 
				let atom2 = pdb.slice( 5, 10).trim();
				let atom3 = pdb.slice(10, 15).trim();
				let atom4 = pdb.slice(15, 20).trim();
				let atom5 = pdb.slice(20, 25).trim();
				AlsoConnect.push(atom1);
				
				try{
					if(collegamentoBuono(atom2))
						AtomBonds.push({start : Atomi[atom1 -1].pos, end : Atomi[atom2 -1].pos});
					if(collegamentoBuono(atom3))
						AtomBonds.push({start : Atomi[atom1 -1].pos, end : Atomi[atom3 -1].pos});
					if(collegamentoBuono(atom4))
						AtomBonds.push({start : Atomi[atom1 -1].pos, end : Atomi[atom4 -1].pos});
					if(collegamentoBuono(atom5))
						AtomBonds.push({start : Atomi[atom1 -1].pos, end : Atomi[atom5 -1].pos});
				}catch{ console.log("Connect records not formatted correctly!")}
				
				occur = pdb.indexOf("CONECT");
			}
			
			renderizza();
		};
		reader.readAsText(evt.target.files[0]);
	};
	

	//renderer
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	
	//control
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	//ILLUMINAZIONE 
	var light = new THREE.PointLight( 0xffffff, 1.2, 1000,0 );
	light.position.set( 0,5,0 );
	camera.add( light );
	light = new THREE.AmbientLight( 0x404040, 0.5 ); // soft white light
	Scene.add( light );
	Scene.add( camera );
	
	requestAnimationFrame( animate );
	
	function animate() {
		requestAnimationFrame( animate );
		// required if controls.enableDamping or controls.autoRotate are set to true
		
		// calculate objects intersecting the picking ray
		if(mouse2.x!=9999 && mouse2.x!=99999 ){
			raycaster.setFromCamera( mouse, camera );
			var atom, atom1, atom2;

			Scene.children.forEach(function(elem){
				if			(elem.name == "atomi1") atom1 = elem;
				else if		(elem.name == "atomi2") atom2 = elem;
			});

			var sceneObj = (atom1) ? atom1 : atom2;

			if(sceneObj){
				var intersects = raycaster.intersectObject(sceneObj , true);	//atomi ball & stick
				
				if(intersects[0]){
					var hexColor = intersects[0].object.material.color.getHexString();
					var atomName = getNameByColor(color, "#" + hexColor.toUpperCase());
					atom = findClosest(atomName, intersects[0].point);
				}
			}
			showToast(atom);

			mouse2.x=9999;
		}

		
		controls.update();
		renderer.render( Scene, camera );	
	}	
});


