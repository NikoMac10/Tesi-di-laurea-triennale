var color = {
	H  : '#FFFFFF',
	C  : '#909090',
	N  : '#3050F8',
	O  : '#FF0D0D',
	F  : '#90E050',
	Cl : '#1FF01F', 
	Br : '#A62929',
	I  : '#940094',
	He : '#D9FFFF',  
	Ne : '#B3E3F5',
 	Ar : '#80D1E3',
	Xe : '#429EB0',
	Kr : '#5CB8D1',
	P  : '#FF8000',
	S  : '#FFFF30',
	B  : '#FFB5B5',
	Li : '#CC80FF', 
	Na : '#AB5CF2',
	K  : '#8F40D4',  
	Rb : '#702EB0',
	Cs : '#57178F', 
	Fr : '#420066',
	Be : '#C2FF00',
	Mg : '#8AFF00', 
	Ca : '#3DFF00', 
	Sr : '#00FF00', 
	Ba : '#00C900',
	Ra : '#007D00',
	Ti : '#BFC2C7',
	Fe : '#E06633',
};

function getNameByColor(object, value) {
	return Object.keys(object).find(function(key) { 
		return object[key] === value;
	});
}

var radius = {
	H  : 1.1,
	C  : 1.7,
	N  : 1.6,
	O  : 1.55,
	F  : 1.5,
	P  : 1.95,
	S  : 1.8,
	Cl : 1.8,
	Cu : 2.0,
	Zn : 2.1,
	He : 1.40,
	Be : 1.9,
	Ne : 1.54,
	Hg : 2.05,
	Cd : 2.2,
	Ni : 2.0,
	Pd : 2.05,
	Au : 2.1,
	Ag : 2.1,
	Mg : 2.2,
	Pt : 2.05,
	Li : 2.2,
	Al : 2.1,
	As : 2.05,
};

var CovalentRadius = {
	H  : 0.31,
	C  : 0.73,
	N  : 0.71,
	O  : 0.66,
	F  : 0.57,
	P  : 1.07,
	S  : 1.05,
	Cl : 1.02,
	Cu : 1.32,
	Zn : 1.22,
	He : 0.28,
	Be : 0.96,
	Ne : 0.58,
	Hg : 1.32,
	Cd : 1.44,
	Ni : 1.24,
	Pd : 1.39,
	Au : 1.36,
	Ag : 1.45,
	Mg : 1.41,
	Pt : 1.36,
	Li : 1.28,
	Al : 1.21,
	As : 1.19,
};


