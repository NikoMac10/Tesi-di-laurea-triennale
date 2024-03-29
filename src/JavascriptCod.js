////////////////////////////////////////////////////////////////////////
//VARIABILI GLOBALI
////////////////////////////////////////////////////////////////////////

var Atomi = [], AtomBonds = [], Oxigen=[],
	Helix = [], Sheet = [], Backbone=[];           	//strutture dati
var AlsoConnect = [];						//connect
var AtomPool1 = [];							//pool
var AtomPool2 = [];

var media;
var mouse = new THREE.Vector2();
var mouse2 = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

const GRAFICA = 16;																//costanti
const TOLLERANZA = 0.45;
const MOLTATOMI = 0.22, MOLTCPK = 1.0 ,MOLTCOLLEGAMENTI = 0.150;
const FOV = 45;

var ScenaAtomi1 = new THREE.Scene();											//Scene
var ScenaAtomi2 = new THREE.Scene();
var ScenaAtomBonds = new THREE.Scene();
var ScenaSecondary = new THREE.Scene();
var Scene = new THREE.Scene();


var renderer = new THREE.WebGLRenderer({antialias : true});
var camera = new THREE.PerspectiveCamera(FOV, window.innerWidth/window.innerHeight, 0.1, 500);
var controls, ter, disengaRibbon , minY , maxY, minX , maxX, minZ , maxZ; 

var CheckboxAtomi, CheckboxCollegamenti, CheckboxSecondary,
	 CheckboxFog, toast;											//checkbox and button

	 
////////////////////////////////////////////////////////////////////////
//Document Ready
////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

	//SETTING VARIABILI A DOCUMENTO PRONTO
	mouse2.x=9999;
	ScenaSecondary.name = "scenaSecondary";
	ScenaAtomBonds.name = "collegamenti";
	ScenaAtomi2.name = "atomi2";
	ScenaAtomi1.name = "atomi1";
		
	//TOAST POPUP
	toast = document.getElementById("snackbar");
	//CHECKBOX
	CheckboxAtomi = $("#Check_atoms");  
	CheckboxCollegamenti = $("#Check_sticks");
	CheckboxSecondary = $("#Check_Secondary");
	CheckboxFog = $("#Check_fog"); 


	////////////////////////////////////////////////////////
	//CALLBACK CHECKBOX
	////////////////////////////////////////////////////////

	CheckboxAtomi.on('click', () =>{
        if(CheckboxAtomi[0].checked==true)
            Scene.add(ScenaAtomi1);
        else
            Scene.remove(Scene.getObjectByName("atomi1")); 
	});
	
	CheckboxCollegamenti.on('click', () =>{
        if(CheckboxCollegamenti[0].checked==true){
            Scene.add(ScenaAtomBonds);
            Scene.add(ScenaAtomi2);
        }
        else{
            Scene.remove(Scene.getObjectByName("collegamenti"));
            Scene.remove(Scene.getObjectByName("atomi2"));
        } 
    });

	CheckboxSecondary.on('click', () =>{
        if(CheckboxSecondary[0].checked==true)
            Scene.add(ScenaSecondary);
        else
            Scene.remove(Scene.getObjectByName("scenaSecondary")); 
    });
        
    CheckboxFog.on('click', () =>{
        if(CheckboxFog[0].checked==true)
            Scene.fog = new THREE.FogExp2("#262626", 0.02);
        else
            Scene.fog = undefined;
	});
	

	/////////////////////////////////////////////////////////
	//CALLBACK MOUSE, servono per toast popup
	////////////////////////////////////////////////////////
	
	renderer.domElement.addEventListener("mousemove", () =>  toast.className = "hide"  );

    renderer.domElement.addEventListener('mousedown', (event) => {
        mouse.x = (event.offsetX / renderer.domElement.width) * 2 - 1;
        mouse.y = -(event.offsetY / renderer.domElement.height) * 2 + 1;
    });

    renderer.domElement.addEventListener('mouseup', (event) => {
        if (mouse.x == ((event.offsetX / renderer.domElement.width) * 2 - 1) &&
            mouse.y == (-(event.offsetY / renderer.domElement.height) * 2 + 1)) {
            mouse2.x = mouse.x;
            mouse2.y = mouse.y;
        }
        else
            mouse2.x = 9999;
    });
	

	/////////////////////////////////////////////////////////
	//LETTURA FILE PDB
	/////////////////////////////////////////////////////////
	document.forms['myform'].elements['file'].onchange = function(evt) {
		if(!window.FileReader) return; // Browser is not compatible
		
		const name = evt.target.files[0].name;
  		const lastDot = name.lastIndexOf('.');
		const ext = name.substring(lastDot + 1);

		if(ext != "pdb"){  //file non ha estensione pdb
			 alert("Il file inserito non ha estensione .pdb ! \n Inserire un file con estensione .pdb");
			 return;
		}

		var reader = new FileReader();

		reader.onload = function(evt) {
			if(evt.target.readyState != 2) return;
			if(evt.target.error) {
				alert('Errore nella lettura del file');
				return;
			}

			var pdb = evt.target.result;  	//inseriamo contenuto file pdb dentro stringa


			//reset strutture dati atomi e collegamenti
			Atomi = []; 			Backbone = [];				
			AtomBonds = []; 		AlsoConnect = [];		
			Helix = [];            	Sheet = [];
			media = new THREE.Vector3();	ter=0,	disengaRibbon=true;

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
			//la fase di parsing è interamente copera da un blocco try catch in caso
			//sorgano errori 

			try{

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

				Sheet.sort(compareSheetHelix);							//riordino
				Sheet = Sheet.filter(checkDuplicates);					//rimuovo duplicati

				
				//////////////////////////////////////////////////////////////////////
				//RAGGIUNGIMENTO ATOMI
				////////////////////////////////////////////////////////////////////////
				appo = pdb.indexOf("SITE");
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
				var occur2 =  Number.MAX_SAFE_INTEGER, chainIdPrec;
			
				while (occur!=-1){ 
					pdb = pdb.slice(occur+4, pdb.length);				
					
					//parsing caratteristiche atomo
					let name = pdb.slice(8, 12).trim(); 
					let resName = pdb.slice(13, 16);
					let chainId = pdb.slice(17, 18);
					let resSeq = parseInt(pdb.slice(18,22));
					let pos = new THREE.Vector3(parseFloat(pdb.slice(26, 34)),  			//cordinate 
												parseFloat(pdb.slice(34, 42)),
												parseFloat(pdb.slice(42, 50)));						
					let elem = pdb.slice(72, 74).trim();
					
					//controllo che gli atomi sia ordinati in modo lessicografico in base al campo chainID
					if(chainIdPrec>chainId && disengaRibbon){
						let string = 'Atomi non ordinati in modo lessicografico' + 
						' in base alcampo \"chainID\"! \n La struttura '  + 
						'secondaria della proteina non verra\' disegnata';
						
						alert(string);
						console.log(string);
						disengaRibbon=false;
					}
					chainIdPrec=chainId;


					//variabili per settare zoom e per calcolo collegamenti
					minY = (minY > pos.y)? pos.y : minY; 	maxY = (maxY < pos.y)? pos.y : maxY; 
					minX = (minX > pos.x)? pos.x : minX;  	maxX = (maxX < pos.x)? pos.x : maxX;
					minZ = (minZ > pos.z)? pos.z : minZ;  	maxZ = (maxZ < pos.z)? pos.z : maxZ;
					
					media.add(pos); 	//media
					
					let atomo = {pos : pos, elem : elem, name : name,		//atomo
						resName : resName, chainId : chainId, resSeq : resSeq};		

					Atomi.push(atomo);

					//vengono memorizzati tutti gli atomi con nome 'C'
					//che compongono la backbone della proteina
					if(name == "C")  Backbone.push(atomo);
					//vengono memorizzati tutti gli atomi con nome 'O' 
					// questo è necessario per disegnare le beta sheet.
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

				console.log("Catene polipeptidiche trovate : " + ter);
				media.divideScalar(Atomi.length);

			}catch(all){  
				console.log("Errore fase parsing: " + all.message );
				alert("Errore fase parsing: " + all.message );
				return;
			}
			

			/////////////////////////////////////////////////////////////////////////////////
			//CALCOLO COLLEGAMENTI  ->   (raggio1 + raggio2 + TOLLERANZA)   Θ(n)
			/////////////////////////////////////////////////////////////////////////////////

			let nVectX = (maxX-minX)/2;   let nVectY = (maxY-minY)/2;   let nVectZ = (maxZ-minZ)/2;
			let cont = new Array;

			for(i=0; i<nVectX; i++){
				cont[i] = new Array();
				for(j=0; j<nVectY; j++)
					cont[i][j] = new Array();
			}		

			//INSERIMENTO ATOMI NELLA MATRICE POSIZIONALE
			Atomi.forEach( (x) => {
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

						let original_length = cont[i][j][k].length;
						for(l=0; l<original_length;	l++){

							let atom = cont[i][j][k].pop();

							let iXs = (i -1 < 0)? 0 : i -1;
							let iYs = (j -1 < 0)? 0 : j -1;
							let iZs = (k -1 < 0)? 0 : k -1;

							for(iXs2 = iXs; (iXs2 < i+2) && (iXs2 < nVectX);  iXs2++ )
								for(iYs2 = iYs ; (iYs2 < j+2) && (iYs2 < nVectY);  iYs2++ )
									for(iZs2 = iZs ; (iZs2 < k+2) && (iZs2 < nVectZ);  iZs2++ ){

										if(!cont[iXs2][iYs2][iZs2]) continue;

										cont[iXs2][iYs2][iZs2].forEach((other) =>{
											let dist = calcola_Distanza(atom, other);	
											let raggio1 = (cache[atom.elem])? cache[atom.elem] : 1.04 ;         
											let raggio2 = (cache[other.elem])? cache[atom.elem] : 1.04 ;
											
											if(raggio1+raggio2 + TOLLERANZA > dist)   
												AtomBonds.push({start : atom.pos, end : other.pos });
										});
									}
						}
					}
			
			cont.splice(0,cont.length); //viene svuotato il vettore posizionale

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
				}catch(all){ console.log("Record CONNECT non formattati correttamente.")}
				
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

	//illuminazione 
	var light = new THREE.PointLight( 0xffffff, 1.2, 1000,0 );
	light.position.set( 0,5,0 );
	camera.add( light );
	light = new THREE.AmbientLight( 0x404040, 0.5 ); // soft white light
	Scene.add( light );
	Scene.add( camera );

	requestAnimationFrame( animate );
	
	function animate() {
		requestAnimationFrame( animate );
		
		// algoritmo raycaster serve per conoscere atomo cliccato con mouse 
		if(mouse2.x!=9999 && mouse2.x!=99999 ){
			raycaster.setFromCamera( mouse, camera );
			var atom, atom1, atom2;

			Scene.children.forEach((elem) =>{
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
