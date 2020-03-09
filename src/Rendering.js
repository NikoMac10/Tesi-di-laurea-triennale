function renderizza() {
	
	Scene.remove(Scene.getObjectByName("atomi1"));
	Scene.remove(Scene.getObjectByName("atomi2"));
	Scene.remove(Scene.getObjectByName("collegamenti")); 
	Scene.remove(Scene.getObjectByName("scenaSecondary")); 
	
	renderAllAtoms();
	renderizzaCollegamenti();
	renderizzaSecondary();

	if (CheckboxAtomi.checked == true) Scene.add(ScenaAtomi1);
	if (CheckboxCollegamenti.checked == true){ Scene.add(ScenaAtomBonds); Scene.add(ScenaAtomi2);}
	if (CheckboxSecondary.checked == true) Scene.add(ScenaSecondary);

	//fog calculation
	c = maxY - minY;
	var cos = 2-((Math.cos(FOV * Math.PI/180))*2);
	distance = Math.sqrt((((c)/cos)*((c)/cos))- (c*c)) * 1.05;
	
	if (CheckboxFog.checked == true) Scene.fog = new THREE.FogExp2("#262626", 0.02);
	else Scene.fog = undefined;
	
	//orbit control and camera position
	var appo = 	mediana.clone();
	controls.target.set(mediana.x, mediana.y, mediana.z);
	var dist = distance / appo.length();
	var appo2 = appo.clone().multiplyScalar((dist*1.80));
	camera.lookAt(appo);
	camera.position.set(appo2.x, appo2.y, appo2.z);
	controls.update();
	renderer.render(Scene, camera);
}

function renderAllAtoms(){ 

	ScenaAtomi1 = new THREE.Scene(); 		ScenaAtomi1.name = "atomi1";
	ScenaAtomi2 = new THREE.Scene(); 		ScenaAtomi2.name = "atomi2";
	var SingleGeometry = [],	SingleGeometry2 = [],	valScale = MOLTATOMI/ MOLTCPK;

	Atomi.forEach( (Atom) => {
		
		if(Atom == "TER") return;
	
		//////////////////////////////////////////////////////////////
		//CPK ATOMS
		//////////////////////////////////////////////////////////////
		if(AtomPool1[Atom.elem] == undefined)
			AtomPool1[Atom.elem] = new THREE.SphereBufferGeometry((radius[Atom.elem]  || 1.50) * MOLTCPK,
			GRAFICA,  GRAFICA );
		
		let positionHelper = new THREE.Object3D();
		positionHelper.position.set(Atom.pos.x, Atom.pos.y, Atom.pos.z);
		positionHelper.updateWorldMatrix(true, false);
		
		let geometry = AtomPool1[Atom.elem].clone();
		geometry.applyMatrix(positionHelper.matrixWorld);
		
		if(SingleGeometry[Atom.elem] == undefined) 
			SingleGeometry[Atom.elem] = [];
	
		SingleGeometry[Atom.elem].push(geometry);


		//////////////////////////////////////////////////////////////
		//BALL AND STICKS ATOMS
		//////////////////////////////////////////////////////////////
		if(AtomPool2[Atom.elem] == undefined)
			AtomPool2[Atom.elem] = AtomPool1[Atom.elem].clone().scale(valScale,valScale,valScale);
		
		geometry = AtomPool2[Atom.elem].clone();
		geometry.applyMatrix(positionHelper.matrixWorld);
		
		if(SingleGeometry2[Atom.elem] == undefined) 
			SingleGeometry2[Atom.elem] = [];
	
		SingleGeometry2[Atom.elem].push(geometry);
	});
	
	for(par in SingleGeometry){
		
		let material = new THREE.MeshPhongMaterial({ color: (color[par] || "#FF1493"  ), specular: "#191818", fog : true});
		
		let MergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries( SingleGeometry[par], false);
		ScenaAtomi1.add(new THREE.Mesh(MergedGeometry, material));
	}

	for(par in SingleGeometry2){
		
		let material = new THREE.MeshPhongMaterial({ color: (color[par] || "#FF1493"  ), specular: "#191818", fog : true});
		
		let MergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries( SingleGeometry2[par], false);
		ScenaAtomi2.add(new THREE.Mesh(MergedGeometry, material));
	}

	console.log("Drawn atoms: " + Atomi.length );
}


function renderizzaCollegamenti(){
	
	ScenaAtomBonds = new THREE.Scene(); 		ScenaAtomBonds.name = "collegamenti";
	
	var materiale_cilindro = new THREE.MeshPhongMaterial({ color: "#FF1493" ,  specular: "#191818", fog : true});
	var HALF_PI = Math.PI * .5;
	
	var SingleGeometry = [];
	
	AtomBonds.forEach( (Coll) => {
		
		if(Coll.start == undefined || Coll.end == undefined){
		    console.log("Presenza di un collegamento errato.");
			return ;
		} //caso in cui il collegamento sia errato
 		
		let distanza = Coll.start.distanceTo(Coll.end);
		let divideScalar2 = Coll.end.clone().add(Coll.start).divideScalar(2);
		
		let cylinder = new THREE.CylinderBufferGeometry( MOLTCOLLEGAMENTI, MOLTCOLLEGAMENTI, distanza, GRAFICA );
		
		let orientation = new THREE.Matrix4();//a new orientation matrix to offset pivot
		let offsetRotation = new THREE.Matrix4();//a matrix to fix pivot rotation
		
		orientation.lookAt(Coll.start, Coll.end, new THREE.Vector3(0,1,0));//look at destination
		offsetRotation.makeRotationX(HALF_PI);//rotate 90 degs on X
		orientation.multiply(offsetRotation);//combine orientation with rotation transformations
	
		orientation.setPosition(divideScalar2.x, divideScalar2.y, divideScalar2.z);
		
		cylinder.applyMatrix(orientation);
		SingleGeometry.push(cylinder);
	});
	
	if(SingleGeometry.length){
		var MergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries( SingleGeometry, false);
		ScenaAtomBonds.add(new THREE.Mesh(MergedGeometry, materiale_cilindro));
	}	
	
	console.log("Drawn atom bonds: " + AtomBonds.length );
	
}

function renderizzaSecondary(){
	ScenaSecondary = new THREE.Scene(); 		ScenaSecondary.name = "scenaSecondary";

	var materiale_loop =  new MeshLineMaterial({ color : "#991A00",  lineWidth : 0.1});
	var materiale_helix = new THREE.MeshPhongMaterial( { color : "#0066ff",
		fog : true, side: THREE.DoubleSide});
	var materiale_sheet = new THREE.MeshPhongMaterial( { color : "#00ff99",
	 	fog : true, side: THREE.DoubleSide});

	var  j=0, k=0, GroupVector = new THREE.Group();
	var SingleGeometry = [];


	///////////////////////////////////////////////////////////////////////////
	//OBTAINING HELIX, SHEET, AND LOOP CORDINATE 
	///////////////////////////////////////////////////////////////////////////
	//fare meccaniscmo anti loop semplice

	for(var i=0; i< Backbone.length; ){

		if(Backbone[i]=="TER") {i++; continue;}

		let first = i;
		let seq = Backbone[i].resSeq; 
		let chainId = Backbone[i].chainId
		let Vector = [], where;

		if(Helix[j] && seq == Helix[j].start && chainId == Helix[j].startChainId){
			for(; Backbone[i].resSeq <= Helix[j].end; i++)
				Vector.push(Backbone[i].pos.clone());

			j++; 	i--; 	where="helix";
		}
		else if(Sheet[k] && seq == Sheet[k].start && chainId == Sheet[k].startChainId){
			for(; Backbone[i].resSeq <= Sheet[k].end; i++)
				Vector.push(Backbone[i].pos.clone());

			k++; 	i--; 	where="sheet";
		}
		else{
			for(;	(Sheet[k]==undefined || !(Backbone[i].resSeq == (Sheet[k].start+1)  &&
					Backbone[i].chainId == Sheet[k].startChainId)) 						&& 
					(Helix[j]==undefined || !(Backbone[i].resSeq == (Helix[j].start+1)	&&
					Backbone[i].chainId == Helix[j].startChainId)); 					i++){

						if(Backbone[i] != "TER")
							Vector.push(Backbone[i].pos.clone());

						else {i=i+2;	break;}
					}
			
			i--;			where="loop";
		}


		//cercare di distinguere un po di casi 
		if(Vector.length<2){	continue;	} 

		
		///////////////////////////////////////////////////////////////////////////
		//DRAW HELIX, SHEET AND LOOP
		///////////////////////////////////////////////////////////////////////////
		let curve = new THREE.CatmullRomCurve3(Vector, false, "chordal", 0.1);
		var pointsCount = Vector.length*7;
		var pointsCount1 = pointsCount+1;
		let startHead =  Math.floor(pointsCount/Vector.length);
		let endHead = pointsCount-startHead;
		
		switch(where) {
			case "loop":
			  	drawLoop();
			  	break;
			case "sheet":
				drawSheet();
			  	break;
			case "helix":
				drawHelix();
			  	break;
		}
		
		function drawLoop(){

			let loopGeom = new THREE.Geometry().setFromPoints(curve.getPoints(pointsCount));
			var line = new MeshLine();
			line.setGeometry( loopGeom );
			var mesh = new THREE.Mesh( line.geometry, materiale_loop ); 
			
			GroupVector.add(mesh);	
		}

		function drawSheet(){
			pointsCount = Vector.length*17;
			pointsCount1 = pointsCount+1;

			startHead /= 1.0;
			endHead = pointsCount-startHead;
			let endHeadPlus =  endHead + startHead/2;

			let SeconVector=[];
			Vector.forEach(	(p)	=>	SeconVector.push(p.clone()));

			let firstRight = first, reverse = 0.60;
			Vector.forEach(planeSheet);

			firstRight = first, reverse = -reverse;
			SeconVector.forEach(planeSheet);
	
			function planeSheet(p, index) {
				let oxyRight = 	Backbone[firstRight].chainId.toString() +
								Backbone[firstRight++].resSeq.toString() ;

				let appo = Oxigen[oxyRight].clone().add(p.clone().multiplyScalar(-1));

				if(index%2==0)
					p.add(appo.multiplyScalar(reverse));
				else
					p.add(appo.multiplyScalar(-reverse));
			}; 

			curve = new THREE.CatmullRomCurve3(Vector, false, "chordal");
			let curve2 = new THREE.CatmullRomCurve3(SeconVector, false, "chordal");

			let pts = curve.getPoints(pointsCount);
			let pts2 = curve2.getPoints(pointsCount);


			//////////////////////////////////////////////////////////////////////////////
			//DRAW ARROW OF THE SHEET
			///////////////////////////////////////////////////////////////////////////////
			for(l = Math.floor(endHead)+1 ; l< pts.length; l++)
				if(l> endHead && l < endHeadPlus){
					let vect = pts2[l].clone().add(pts[l].clone().multiplyScalar(-1));
					vect.multiplyScalar(-0.45);
					pts[l].add(vect.clone().multiplyScalar((endHeadPlus-l)/(startHead/2)));
					vect.multiplyScalar(-1);
					pts2[l].add(vect.clone().multiplyScalar((endHeadPlus-l)/(startHead/2)));
				}
				else if(l > endHeadPlus){
					let vect = pts2[l].clone().add(pts[l].clone().multiplyScalar(-1));
					vect.multiplyScalar(0.5);
					pts[l].add(vect.clone().multiplyScalar((l-endHeadPlus)/(startHead/2)));
					vect.multiplyScalar(-1);
					pts2[l].add(vect.clone().multiplyScalar((l-endHeadPlus)/(startHead/2)));
				}

			pts = pts.concat(pts2);
			
			let sheetGeom = new THREE.BufferGeometry().setFromPoints(pts);
			
			let indices = [];

			 // the idea taken from PlaneBufferGeometry
			for (ix = 0; ix < pointsCount; ix++) {
				var a = ix;
				var b = ix + pointsCount1;
				var c = (ix + 1) + pointsCount1;
				var d = (ix + 1);
				// faces
				indices.push(a, b, d);
				indices.push(b, c, d);
			}
		
			sheetGeom.setIndex(indices);
			sheetGeom.computeVertexNormals();

			if(SingleGeometry[where] == undefined) 
				SingleGeometry[where] = [];

			SingleGeometry[where].push(sheetGeom);	
		}
		
		function drawHelix(){

			var direction = Vector[Vector.length-1].clone().add(Vector[0].clone().multiplyScalar(-1));
			direction.divideScalar(Vector.length*1.25);

			let pts = curve.getPoints(pointsCount);
			let pts2 = curve.getPoints(pointsCount);

			pts2.forEach(planeHelix);
			direction.multiplyScalar(-1);
			pts.forEach(planeHelix);

			function planeHelix(p, index, arr) {
				if(index<startHead-1)
					p.add(direction.clone().multiplyScalar((index+1)/startHead));
				else if (index>endHead)
					p.add(direction.clone().multiplyScalar((arr.length-index)/ startHead));
				else
					p.add(direction)	
			}; 

			pts = pts.concat(pts2);
			
			let ribbonGeom = new THREE.BufferGeometry().setFromPoints(pts);
			
			let indices = [];

			 // the idea taken from PlaneBufferGeometry
			for (ix = 0; ix < pointsCount; ix++) {
				var a = ix;
				var b = ix + pointsCount1;
				var c = (ix + 1) + pointsCount1;
				var d = (ix + 1);
				// faces
				indices.push(a, b, d);
				indices.push(b, c, d);
			}
		
			ribbonGeom.setIndex(indices);
			ribbonGeom.computeVertexNormals();

			if(SingleGeometry[where] == undefined) 
				SingleGeometry[where] = [];

			SingleGeometry[where].push(ribbonGeom);	
		}
	}
	
	for(par in SingleGeometry){
		
		let material = (par == 'helix') ? materiale_helix :  materiale_sheet;
		
		let MergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries( SingleGeometry[par], false);
		ScenaSecondary.add(new THREE.Mesh(MergedGeometry, material));
	}


	ScenaSecondary.add(GroupVector);
	
	console.log("Drawn secondary structure");
	console.log("Drawn helix: " + j + "/" + Helix.length);	
	console.log("Drawn sheets: " + k + "/" + Sheet.length);	
}
