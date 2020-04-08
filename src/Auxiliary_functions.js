
function calcola_Distanza(atom1, atom2) {
	var CordX = Math.pow((atom2.pos.x - atom1.pos.x), 2);
	var CordY = Math.pow((atom2.pos.y - atom1.pos.y), 2);
	var CordZ = Math.pow((atom2.pos.z - atom1.pos.z), 2);
	var dist = Math.pow((CordX + CordY + CordZ), 1 / 2);
	return dist;
}

function collegamentoBuono(atom) {
	if (atom == "" ||  isNaN(atom))
		return false;
	else if (AlsoConnect.includes(atom) || atom > Atomi.length)
		return false;
	else
		return true;
}

function findClosest(atomName, point) {
	var distance = Number.MAX_SAFE_INTEGER, min;
	Atomi.forEach((Atom) => {
		if (Atom.elem != atomName)
			return;
		var atomDistance = Atom.pos.distanceTo(point);
		if (distance > atomDistance) {
			min = Atom;
			distance = atomDistance;
		}
	});
	return min;
}

function showToast(x) {
	if (x){
		toast.className = "show";
		toast.innerHTML = 	"Atom name : " + x.name + "<br>Res name : " + x.resName + 
							"<br>Chain id : " + x.chainId + "<br>Res seq : " + x.resSeq;
	}	
}

function compareSheetHelix(a, b) {
	if (a.startChainId < b.startChainId)
		return -1;
	else if (a.startChainId > b.startChainId)
		return 1;
	else if (a.start < b.start)
		return -1;
	else if (a.start > b.start)
		return 1;
	else
		return 0;
}

function checkDuplicates(a, b, array) {
	var duplicate = true;
	for (var i = 0; i < b; i++) {
		if (array[i].startChainId == a.startChainId &&
			array[i].endChainId == a.endChainId &&
			array[i].start == a.start) {
			duplicate = false;
			break;
		}
	}
	return duplicate;
}
